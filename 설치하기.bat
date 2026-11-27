@echo off
chcp 65001 > nul
echo Ulanzi Studio 국내/해외 주식·매크로 플러그인을 설치합니다...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [오류] 설치 중 문제가 발생했습니다.
    pause
    exit /b %ERRORLEVEL%
)
echo.
pause
