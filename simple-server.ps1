# Simple Frontend Server for MLNF
Write-Host "🌐 Starting MLNF Frontend Server..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".\front\pages\news.html")) {
    Write-Host "❌ Error: Run this from the MLNF root directory!" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Serving from: front/" -ForegroundColor Yellow
Write-Host "🌐 URL: http://localhost:8080" -ForegroundColor Green
Write-Host "📄 Test page: http://localhost:8080/pages/news.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

Set-Location .\front

if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "🐍 Using Python..." -ForegroundColor Green
    python -m http.server 8080
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    Write-Host "🐍 Using Python3..." -ForegroundColor Green
    python3 -m http.server 8080
} else {
    Write-Host "❌ Python not found!" -ForegroundColor Red
    Write-Host "Install Python from python.org" -ForegroundColor Yellow
}

Set-Location .. 