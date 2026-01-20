@echo off
title EnWise Quiz System - Startup
color 0A

echo.
echo ============================================================
echo     EnWise AI Quiz System - Complete Testing Suite
echo ============================================================
echo.
echo Starting backend server...
echo.

cd /d "%~dp0backend"

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH!
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
pip install -q flask flask-cors requests 2>nul

echo.
echo ============================================================
echo Backend server starting on http://localhost:5000
echo ============================================================
echo.
echo IMPORTANT: Keep this window open!
echo.
echo To test the quiz:
echo 1. Open: frontend/test-flow.html
echo 2. OR: frontend/debug-storage.html
echo 3. OR: frontend/subject.html?subject=Calculus
echo.
echo Press Ctrl+C to stop the server
echo ============================================================
echo.

python test_backend.py

pause
