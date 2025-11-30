@echo off
echo ========================================
echo Database Setup for Multi-Tenant Platform
echo ========================================
echo.

echo Step 1: Creating database...
echo.

REM Create database
echo CREATE DATABASE IF NOT EXISTS my_group CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; | "C:\xampp\mysql\bin\mysql.exe" -u root

if %ERRORLEVEL% EQU 0 (
    echo [OK] Database created successfully
) else (
    echo [ERROR] Failed to create database
    echo.
    echo Please:
    echo 1. Make sure XAMPP MySQL is running
    echo 2. Or use phpMyAdmin to import manually
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Importing schema files...
echo.

echo [1/8] Importing core tables...
"C:\xampp\mysql\bin\mysql.exe" -u root my_group < "database\schema\01_core_tables.sql"

echo [2/8] Importing group management...
"C:\xampp\mysql\bin\mysql.exe" -u root my_group < "database\schema\02_group_management.sql"

echo [3/8] Importing geographic reference...
"C:\xampp\mysql\bin\mysql.exe" -u root my_group < "database\schema\03_geographic_reference.sql"

echo [4/8] Importing needy services...
"C:\xampp\mysql\bin\mysql.exe" -u root my_group < "database\schema\04_needy_services.sql"

echo [5/8] Importing labor management...
"C:\xampp\mysql\bin\mysql.exe" -u root my_group < "database\schema\05_labor_management.sql"

echo [6/8] Importing shop ecommerce...
"C:\xampp\mysql\bin\mysql.exe" -u root my_group < "database\schema\06_shop_ecommerce.sql"

echo [7/8] Importing media gallery...
"C:\xampp\mysql\bin\mysql.exe" -u root my_group < "database\schema\07_media_gallery.sql"

echo [8/8] Importing unions chat...
"C:\xampp\mysql\bin\mysql.exe" -u root my_group < "database\schema\08_unions_chat.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [SUCCESS] Database setup complete!
    echo ========================================
    echo.
    echo Database: my_group
    echo Tables: 50+ tables created
    echo.
    echo You can now:
    echo 1. Start the backend: cd backend ^&^& npm run dev
    echo 2. Access frontend: http://localhost:3000
    echo.
) else (
    echo.
    echo [ERROR] Some imports failed
    echo Please check the error messages above
    echo.
)

pause

