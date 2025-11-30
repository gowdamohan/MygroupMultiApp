@echo off
echo Setting up Member Registration...
echo.

echo Step 1: Adding 'member' group to database...
D:\xampp\mysql\bin\mysql.exe -u root my_group < insert-member-group.sql
if %errorlevel% neq 0 (
    echo Error: Failed to add member group
    pause
    exit /b 1
)
echo Member group added successfully!
echo.

echo Step 2: Adding nationality and marital_status columns...
D:\xampp\mysql\bin\mysql.exe -u root my_group < add-registration-fields.sql
if %errorlevel% neq 0 (
    echo Error: Failed to add registration fields
    pause
    exit /b 1
)
echo Registration fields added successfully!
echo.

echo Setup completed successfully!
pause

