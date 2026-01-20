@echo off
echo ========================================
echo   Starting EnWise Test Backend Server
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing required packages...
pip install flask flask-cors

echo.
echo Starting server...
echo.
python test_backend.py

pause
