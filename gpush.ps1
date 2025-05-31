# Quick Git Push Script for MLNF
# Usage: .\gpush.ps1 "Your commit message"

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

Write-Host "🚀 MLNF Quick Deploy" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

# Stage all changes
Write-Host "📁 Staging all changes..." -ForegroundColor Yellow
git add .

# Check if there are any changes to commit
$status = git status --porcelain
if (-not $status) {
    Write-Host "✅ No changes to commit!" -ForegroundColor Green
    exit 0
}

# Commit with message
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m $CommitMessage

# Push to remote
Write-Host "☁️  Pushing to remote..." -ForegroundColor Yellow
git push

Write-Host "✨ Deploy complete! Soul Scrolls updated." -ForegroundColor Green 