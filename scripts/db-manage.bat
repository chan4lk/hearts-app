@echo off
setlocal enabledelayedexpansion

REM Function to display help
:show_help
echo Database Management Script
echo Usage: db-manage.bat [command]
echo.
echo Commands:
echo   start       - Start the database and pgAdmin
echo   stop        - Stop the database and pgAdmin
echo   restart     - Restart the database and pgAdmin
echo   status      - Show the status of containers
echo   logs        - Show logs from containers
echo   reset       - Reset the database (delete all data)
echo   migrate     - Run Prisma migrations
echo   seed        - Seed the database with initial data
echo   help        - Show this help message
goto :eof

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Error: Docker is not installed. Please install Docker first.
  exit /b 1
)

REM Check if Docker Compose is installed
where docker-compose >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Error: Docker Compose is not installed. Please install Docker Compose first.
  exit /b 1
)

REM Process commands
if "%1"=="" goto show_help
if "%1"=="help" goto show_help

if "%1"=="start" (
  echo Starting database and pgAdmin...
  docker-compose up -d
  echo Database is running at localhost:5432
  echo pgAdmin is available at http://localhost:5050
  echo Login with admin@example.com / admin
  goto :eof
)

if "%1"=="stop" (
  echo Stopping database and pgAdmin...
  docker-compose down
  goto :eof
)

if "%1"=="restart" (
  echo Restarting database and pgAdmin...
  docker-compose restart
  goto :eof
)

if "%1"=="status" (
  echo Container status:
  docker-compose ps
  goto :eof
)

if "%1"=="logs" (
  echo Container logs:
  docker-compose logs
  goto :eof
)

if "%1"=="reset" (
  echo Resetting database (this will delete all data)...
  docker-compose down -v
  docker-compose up -d
  echo Database reset complete. Running migrations...
  npx prisma migrate reset --force
  goto :eof
)

if "%1"=="migrate" (
  echo Running Prisma migrations...
  npx prisma migrate dev
  goto :eof
)

if "%1"=="seed" (
  echo Seeding database with initial data...
  npx prisma db seed
  goto :eof
)

goto show_help 