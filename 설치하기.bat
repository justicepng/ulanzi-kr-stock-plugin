@echo off
echo Installing Ulanzi Studio KR/Global Stock Plugin...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Installation failed.
    pause
    exit /b %ERRORLEVEL%
)
echo.
pause
