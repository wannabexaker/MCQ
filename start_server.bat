@echo off
setlocal
cd /d "%~dp0"
set PORT=8000

echo Starting local server on http://localhost:%PORT%
echo Stop with Ctrl+C
echo.

py -3 -m http.server %PORT% >nul 2>&1
if %errorlevel%==0 (
  py -3 -m http.server %PORT%
  exit /b 0
)

python -m http.server %PORT% >nul 2>&1
if %errorlevel%==0 (
  python -m http.server %PORT%
  exit /b 0
)

echo Python was not found. Install Python 3 and run: python -m http.server 8000
pause
exit /b 1

