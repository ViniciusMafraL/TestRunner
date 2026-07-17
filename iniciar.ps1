# ============================================================
#  TestRunner - sobe backend + tunnel, atualiza .env e publica
#  Chamado por iniciar.bat (duplo-clique). Nao rode com o backend
#  ja aberto por outra via: ele encerra instancias antigas antes.
# ============================================================
$ErrorActionPreference = 'Stop'

$root      = $PSScriptRoot
$backend   = Join-Path $root 'backend'
$envPath   = Join-Path $root '.env'
$log       = Join-Path $env:TEMP 'testrunner-tunnel.out.log'
$logErr    = Join-Path $env:TEMP 'testrunner-tunnel.err.log'
$siteBase  = 'https://viniciusmafral.github.io/TestRunner'

function Step($n, $msg) { Write-Host "[$n] $msg" -ForegroundColor Cyan }

Write-Host ''
Write-Host '==== TestRunner: iniciando servidores ====' -ForegroundColor Green
Write-Host ''

# Localiza o cloudflared (caminho padrao da instalacao ou PATH).
$cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
if (-not (Test-Path $cloudflared)) {
  $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($cmd) { $cloudflared = $cmd.Source }
}
if (-not (Test-Path $cloudflared)) {
  Write-Host "[ERRO] cloudflared nao encontrado. Instale com: winget install Cloudflare.cloudflared" -ForegroundColor Red
  return
}

# 0) Encerra instancias antigas (evita porta 3001 ocupada e tuneis orfaos).
Step '0/6' 'Encerrando instancias anteriores (se houver)...'
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
try {
  Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
} catch {}
# Espera a porta 3001 ser liberada de fato (evita EADDRINUSE no backend novo).
foreach ($i in 1..20) {
  $busy = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
  if (-not $busy) { break }
  Start-Sleep -Milliseconds 500
}

# 1) Backend em janela propria (via _start-backend.cmd, sem quoting inline; se o
#    npm cair, o "cmd /k" mantem a janela aberta com o erro visivel).
Step '1/6' 'Iniciando backend na porta 3001...'
Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', '_start-backend.cmd' -WorkingDirectory $backend | Out-Null

# 1b) Confirma que o backend subiu (401 = no ar, so pede login). Se nao subir,
#     avisa alto: sem backend o tunnel retorna 502 e o site da erro de CORS.
$backendUp = $false
foreach ($i in 1..20) {
  try {
    Invoke-WebRequest 'http://localhost:3001/operations' -UseBasicParsing -TimeoutSec 3 | Out-Null
    $backendUp = $true; break
  } catch {
    $code = $null
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    if ($code -ge 200) { $backendUp = $true; break }  # 401/403/etc = servidor respondeu
  }
  Start-Sleep -Seconds 1
}
if ($backendUp) {
  Write-Host '      Backend no ar (porta 3001).' -ForegroundColor Green
} else {
  Write-Host '[ERRO] O backend nao respondeu na porta 3001. Veja a janela "TestRunner' -ForegroundColor Red
  Write-Host '       Backend" para o erro. Sem backend o site dara erro de CORS/502.' -ForegroundColor Red
}

# 2) Tunnel: roda em segundo plano gravando a saida em log (para achar a URL).
Step '2/6' 'Iniciando tunnel cloudflared...'
Remove-Item $log, $logErr -ErrorAction SilentlyContinue
Start-Process -FilePath $cloudflared -ArgumentList 'tunnel', '--url', 'http://localhost:3001' `
  -RedirectStandardOutput $log -RedirectStandardError $logErr -WindowStyle Hidden | Out-Null

# 3) Espera a URL publica aparecer no log (ate 40s).
Step '3/6' 'Aguardando URL publica do tunnel...'
$url = $null
foreach ($i in 1..40) {
  foreach ($f in @($logErr, $log)) {
    if (Test-Path $f) {
      $m = Select-String -Path $f -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue |
        Select-Object -First 1
      if ($m) { $url = $m.Matches[0].Value; break }
    }
  }
  if ($url) { break }
  Start-Sleep -Seconds 1
}
if (-not $url) {
  Write-Host "[ERRO] Nao consegui obter a URL do tunnel apos 40s. Veja: $logErr" -ForegroundColor Red
  return
}
Write-Host "      URL do tunnel: $url" -ForegroundColor Yellow

# 4) Atualiza VITE_API_BASE_URL no .env.
Step '4/6' 'Atualizando .env com a nova URL...'
(Get-Content -LiteralPath $envPath) -replace '^VITE_API_BASE_URL=.*', "VITE_API_BASE_URL=$url" |
  Set-Content -LiteralPath $envPath -Encoding ascii

# 5) Build + deploy para o GitHub Pages.
Step '5/6' 'Publicando no GitHub Pages (npm run deploy)...'
Push-Location $root
try { & cmd.exe /c 'npm run deploy' } finally { Pop-Location }

# 6) Verifica se o Pages publicou; se travar, forca o rebuild (commit vazio).
Step '6/6' 'Verificando a publicacao...'
$bundle = $null
$distIndex = Join-Path $root 'dist\index.html'
if (Test-Path $distIndex) {
  $bundle = ([regex]'assets/index-[A-Za-z0-9_-]+\.js').Match((Get-Content $distIndex -Raw)).Value
}
if ($bundle) {
  $liveUrl = "$siteBase/$bundle"
  $ok = $false
  foreach ($i in 1..8) {
    Start-Sleep -Seconds 15
    try {
      $r = Invoke-WebRequest -Uri $liveUrl -Method Head -UseBasicParsing -ErrorAction Stop
      if ($r.StatusCode -eq 200) { $ok = $true; break }
    } catch {}
    Write-Host "      ...aguardando o Pages publicar ($($i*15)s)"
  }
  if (-not $ok) {
    Write-Host '      Pages nao propagou; forcando rebuild (commit vazio)...' -ForegroundColor Yellow
    $wt = Join-Path $env:TEMP 'tr-ghpages'
    try {
      git -C $root fetch origin gh-pages --quiet
      git -C $root worktree add -f $wt origin/gh-pages | Out-Null
      git -C $wt checkout -B gh-pages | Out-Null
      git -C $wt commit --allow-empty -m 'Force Pages rebuild' | Out-Null
      git -C $wt push origin gh-pages | Out-Null
    } catch {
      Write-Host "      [aviso] nao consegui forcar o rebuild: $_" -ForegroundColor Yellow
    } finally {
      git -C $root worktree remove $wt --force 2>$null
    }
  } else {
    Write-Host '      Pages publicado com sucesso.' -ForegroundColor Green
  }
}

Write-Host ''
Write-Host '==== Concluido! ====' -ForegroundColor Green
Write-Host "  Backend:  http://localhost:3001   (janela 'TestRunner Backend')"
Write-Host "  Tunnel:   $url"
Write-Host "  Site:     $siteBase/"
Write-Host ''
Write-Host '  O tunnel roda em segundo plano. Para parar tudo: feche a janela do'
Write-Host '  Backend e finalize o cloudflared (Gerenciador de Tarefas) ou rode parar.bat.'
Write-Host '  Aguarde ~1 min e de Ctrl+Shift+R no navegador.'
