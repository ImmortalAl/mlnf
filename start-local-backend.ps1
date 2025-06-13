#!/usr/bin/env pwsh
# MLNF Local Backend Starter
# ==========================
# This script helps you run the backend locally for development

Write-Host "🚀 MLNF Local Backend Starter" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".\back\package.json")) {
    Write-Host "❌ Error: Please run this script from the MLNF root directory!" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Navigate to backend directory
Set-Location .\back

Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path ".\node_modules")) {
    Write-Host "📥 Installing dependencies (this may take a minute)..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔧 Starting local backend server..." -ForegroundColor Green
Write-Host "   URL: http://localhost:3001" -ForegroundColor Cyan
Write-Host "   API: http://localhost:3001/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 To use local backend in the browser:" -ForegroundColor Yellow
Write-Host "   1. Open your MLNF page (e.g., news.html)" -ForegroundColor White
Write-Host "   2. Press Ctrl+Shift+D to toggle dev mode" -ForegroundColor White
Write-Host "   3. Or click the 🛠️ button in the bottom-right corner" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
npm run dev

# Return to root directory when done
Set-Location .. 