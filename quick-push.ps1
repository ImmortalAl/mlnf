param(
    [string]$Message = "Quick update"
)

Write-Host "MLNF Quick Push Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Change to front directory
Set-Location "front"
Write-Host "Changed to front directory" -ForegroundColor Green

# Check git status
Write-Host "Checking git status..." -ForegroundColor Yellow
$status = git status --porcelain
if (-not $status) {
    Write-Host "No changes to commit" -ForegroundColor Green
    exit 0
}

Write-Host "Found changes:" -ForegroundColor Yellow
git status --short

# Add all changes
Write-Host "Adding all changes..." -ForegroundColor Yellow
git add .

# Commit with message
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m $Message

# Push to main
Write-Host "Pushing to origin main..." -ForegroundColor Yellow
git push origin main

Write-Host "Push completed successfully!" -ForegroundColor Green
Write-Host "Changes are now live on GitHub" -ForegroundColor Cyan 