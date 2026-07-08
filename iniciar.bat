@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM  TestRunner - sobe backend + tunnel, atualiza .env e publica
REM  Duplo-clique neste arquivo para colocar o site no ar.
REM ============================================================

set "PROJECT=%~dp0"
if "%PROJECT:~-1%"=="\" set "PROJECT=%PROJECT:~0,-1%"
set "BACKEND=%PROJECT%\backend"
set "CLOUDFLARED=C:\Program Files (x86)\cloudflared\cloudflared.exe"
set "TUNNEL_LOG=%TEMP%\testrunner-tunnel.log"

echo(
echo ==== TestRunner: iniciando servidores ====
echo(

if not exist "%CLOUDFLARED%" (
    echo [ERRO] cloudflared nao encontrado em:
    echo        %CLOUDFLARED%
    echo        Instale com: winget install Cloudflare.cloudflared
    goto :fim
)

REM 1) Backend em janela propria
echo [1/5] Iniciando backend na porta 3001...
start "TestRunner Backend" /D "%BACKEND%" cmd /k "npm run start"

REM 2) Tunnel em janela propria (saida gravada em log)
echo [2/5] Iniciando tunnel cloudflared...
if exist "%TUNNEL_LOG%" del "%TUNNEL_LOG%" >nul 2>&1
start "TestRunner Tunnel" cmd /k ""%CLOUDFLARED%" tunnel --url http://localhost:3001 ^> "%TUNNEL_LOG%" 2^>^&1"

REM 3) Espera a URL publica aparecer no log (ate 40s)
echo [3/5] Aguardando URL publica do tunnel...
set "URL="
for /L %%i in (1,1,40) do (
    if not defined URL (
        for /f "usebackq delims=" %%U in (`powershell -NoProfile -Command "$m = Select-String -Path '%TUNNEL_LOG%' -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue ^| Select-Object -First 1; if ($m) { $m.Matches[0].Value }"`) do set "URL=%%U"
        if not defined URL timeout /t 1 /nobreak >nul
    )
)

if not defined URL (
    echo [ERRO] Nao consegui obter a URL do tunnel apos 40s.
    echo        Veja a janela "TestRunner Tunnel" e o log:
    echo        %TUNNEL_LOG%
    goto :fim
)

echo       URL do tunnel: !URL!

REM 4) Atualiza VITE_API_BASE_URL no .env
echo [4/5] Atualizando .env com a nova URL...
powershell -NoProfile -Command "(Get-Content -LiteralPath '%PROJECT%\.env') -replace '^VITE_API_BASE_URL=.*', 'VITE_API_BASE_URL=!URL!' | Set-Content -LiteralPath '%PROJECT%\.env' -Encoding ascii"

REM 5) Build + deploy para o GitHub Pages
echo [5/5] Publicando no GitHub Pages (npm run deploy)...
cd /d "%PROJECT%"
call npm run deploy

echo(
echo ==== Concluido! ====
echo  Backend:  http://localhost:3001   (janela "TestRunner Backend")
echo  Tunnel:   !URL!
echo  Site:     https://viniciusmafral.github.io/TestRunner/
echo(
echo  NAO feche as janelas do Backend e do Tunnel enquanto usar o site.
echo  Aguarde ~1 min e de Ctrl+Shift+R no navegador.

:fim
echo(
pause
endlocal
