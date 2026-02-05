@echo off
REM ============================================
REM HEARTS APP - DATABASE RECOVERY SCRIPT
REM ============================================
REM This script fixes the failed migrations
REM Usage: fix-db.bat

setlocal enabledelayedexpansion

echo.
echo ================================================
echo Hearts App - Database Recovery
echo ================================================
echo.

REM Check if psql is in PATH
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: psql (PostgreSQL client) is not installed or not in PATH
    echo.
    echo To install PostgreSQL tools on Windows:
    echo 1. Download PostgreSQL installer from https://www.postgresql.org/download/windows/
    echo 2. Run the installer and select 'PostgreSQL Server' and 'Command Line Tools'
    echo 3. Add PostgreSQL bin directory to PATH
    echo.
    exit /b 1
)

echo PostgreSQL client found
echo.

REM Set connection parameters
set DBHOST=localhost
set DBPORT=5434
set DBNAME=performance_management
set DBUSER=postgres
set DBPASS=postgres

echo Connecting to database: %DBNAME% on %DBHOST%:%DBPORT%
echo.

REM Set password environment variable for psql
set PGPASSWORD=%DBPASS%

REM Get the script directory
set SCRIPTDIR=%~dp0
set SQLFILE=%SCRIPTDIR%fix-migrations.sql

if not exist "%SQLFILE%" (
    echo ERROR: fix-migrations.sql not found at %SQLFILE%
    exit /b 1
)

echo Executing recovery script: %SQLFILE%
echo This may take a moment...
echo.

REM Execute the SQL script
psql -h %DBHOST% -p %DBPORT% -U %DBUSER% -d %DBNAME% -f "%SQLFILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo Database recovery completed successfully!
    echo ================================================
    echo.
    echo Next steps:
    echo 1. Run: npm run prisma:generate
    echo 2. Run: npm run prisma:seed (optional, to add sample data)
    echo 3. Run: npm run dev (to start the development server)
    exit /b 0
) else (
    echo.
    echo ================================================
    echo Database recovery failed
    echo ================================================
    exit /b 1
)
