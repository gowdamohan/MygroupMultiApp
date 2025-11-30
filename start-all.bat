@echo off
echo ========================================
echo Multi-Tenant Platform - Quick Start
echo ========================================
echo.

echo Checking if XAMPP MySQL is running...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MySQL is running
) else (
    echo [ERROR] MySQL is not running!
    echo Please start MySQL from XAMPP Control Panel
    pause
    exit /b 1
)

echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo Servers are starting...
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to open the application in browser...
pause >nul

start http://localhost:3000

echo.
echo To stop the servers, close the terminal windows.
echo.

