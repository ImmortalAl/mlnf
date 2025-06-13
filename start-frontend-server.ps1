#!/usr/bin/env pwsh
# MLNF Frontend Server for Local Testing
# =====================================

Write-Host "🌐 Starting MLNF Frontend Server..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".\front\pages\news.html")) {
    Write-Host "❌ Error: Please run this script from the MLNF root directory!" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Serving frontend files from: $(Get-Location)\front" -ForegroundColor Yellow
Write-Host "🌐 Starting server on: http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Quick Links:" -ForegroundColor Yellow
Write-Host "   News Page: http://localhost:8080/pages/news.html" -ForegroundColor Cyan
Write-Host "   Test Modal: http://localhost:8080/test-modal.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "🛠️ Dev Mode Features:" -ForegroundColor Yellow
Write-Host "   • Press Ctrl+Shift+D to toggle dev mode" -ForegroundColor White
Write-Host "   • Click 🛠️ button in bottom-right corner" -ForegroundColor White
Write-Host "   • Enable debug logging for detailed messages" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Navigate to front directory and start server
Set-Location .\front

# Try different methods to start HTTP server
try {
    if (Get-Command python -ErrorAction SilentlyContinue) {
        Write-Host "🐍 Using Python HTTP server..." -ForegroundColor Green
        python -m http.server 8080
    } elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
        Write-Host "🐍 Using Python3 HTTP server..." -ForegroundColor Green
        python3 -m http.server 8080
    } elseif (Get-Command node -ErrorAction SilentlyContinue) {
        Write-Host "📦 Trying to use Node.js HTTP server..." -ForegroundColor Green
        if (Get-Command npx -ErrorAction SilentlyContinue) {
            npx http-server -p 8080 -c-1
        } else {
            Write-Host "❌ Node.js found but npx not available" -ForegroundColor Red
            Write-Host "💡 Install a global HTTP server: npm install -g http-server" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Neither Python nor Node.js found!" -ForegroundColor Red
        Write-Host "💡 Please install Python or Node.js to run a local server" -ForegroundColor Yellow
        Write-Host "   Or manually open: file:///$(Get-Location)\pages\news.html" -ForegroundColor Cyan
    }
} finally {
    # Return to root directory when done
    Set-Location ..
} 