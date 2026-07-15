@echo off
REM ============================================================
REM  TestRunner - encerra o backend (porta 3001) e o tunnel.
REM ============================================================
echo Encerrando cloudflared e o backend (porta 3001)...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue; try { Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } } catch {}; Write-Host 'Pronto.'"
echo.
pause
