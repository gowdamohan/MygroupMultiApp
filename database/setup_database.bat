@echo off
REM Multi-Tenant Platform - Database Setup Script
REM This script creates the database and executes all schema files

echo ========================================
echo Multi-Tenant Platform - Database Setup
echo ========================================
echo.

REM Set MySQL path
set MYSQL_PATH=D:\xampp\mysql\bin\mysql.exe
set MYSQL_DUMP=D:\xampp\mysql\bin\mysqldump.exe

REM Database configuration
set DB_NAME=my_group
set DB_USER=root
set DB_PASS=

echo Step 1: Creating database '%DB_NAME%'...
echo.

REM Create database
%MYSQL_PATH% -u %DB_USER% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if %errorlevel% neq 0 (
    echo ERROR: Failed to create database!
    pause
    exit /b 1
)

echo SUCCESS: Database created!
echo.

echo Step 2: Executing schema files...
echo.

REM Execute schema files in order
for %%f in (schema\*.sql) do (
    echo Executing: %%f
    %MYSQL_PATH% -u %DB_USER% %DB_NAME% < %%f
    if %errorlevel% neq 0 (
        echo ERROR: Failed to execute %%f
        pause
        exit /b 1
    )
    echo SUCCESS: %%f executed
    echo.
)

echo Step 3: Verifying installation...
echo.

REM Count tables
%MYSQL_PATH% -u %DB_USER% %DB_NAME% -e "SELECT COUNT(*) as 'Total Tables' FROM information_schema.tables WHERE table_schema = '%DB_NAME%';"

echo.
echo ========================================
echo Database setup completed successfully!
echo ========================================
echo.
echo Database Name: %DB_NAME%
echo Total Tables: Check output above
echo.
echo You can now connect to the database using:
echo   Host: localhost
echo   Database: %DB_NAME%
echo   User: %DB_USER%
echo.

pause

