# ============================================
# HEARTS APP - DATABASE RECOVERY SCRIPT
# ============================================
# This script fixes the failed migrations
# Usage: .\fix-db.ps1

param(
    [string]$DbHost = "localhost",
    [int]$DbPort = 5434,
    [string]$DbName = "performance_management",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "postgres"
)

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Hearts App - Database Recovery" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if PSQL is installed
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "ERROR: psql (PostgreSQL client) is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install PostgreSQL tools on Windows:" -ForegroundColor Yellow
    Write-Host "1. Download PostgreSQL installer from https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "2. Run the installer and select 'PostgreSQL Server' and 'Command Line Tools'" -ForegroundColor Yellow
    Write-Host "3. Add PostgreSQL bin directory to PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "PostgreSQL client found: $($psqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Connection string
$env:PGPASSWORD = $DbPassword
$connectionString = "-h $DbHost -p $DbPort -U $DbUser -d $DbName"

Write-Host "Connecting to database: $DbName on $DbHost`:$DbPort" -ForegroundColor Cyan
Write-Host ""

# Test connection
try {
    psql $connectionString -c "SELECT version();" | Out-Null
    Write-Host "✓ Database connection successful" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "✗ Failed to connect to database" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Get the script path
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptDir "fix-migrations.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "ERROR: fix-migrations.sql not found at $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Executing recovery script: $sqlFile" -ForegroundColor Cyan
Write-Host "This may take a moment..." -ForegroundColor Yellow
Write-Host ""

# Execute the SQL script
try {
    psql $connectionString -f $sqlFile
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "✓ Database recovery completed successfully!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run: npm run prisma:generate" -ForegroundColor Yellow
    Write-Host "2. Run: npm run prisma:seed (optional, to add sample data)" -ForegroundColor Yellow
    Write-Host "3. Run: npm run dev (to start the development server)" -ForegroundColor Yellow
}
catch {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "✗ Database recovery failed" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
