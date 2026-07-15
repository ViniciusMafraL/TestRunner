@echo off
REM ============================================================
REM  TestRunner - lancador. Chama iniciar.ps1 (a logica real esta
REM  no PowerShell, bem mais robusto que .bat puro). Duplo-clique.
REM ============================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciar.ps1"
echo.
pause
