# Add this function to your PowerShell profile for global access
# To find your profile location, run: $PROFILE
# Create the profile file if it doesn't exist, then add this function

function gpush {
    param(
        [Parameter(Mandatory=$true)]
        [string]$CommitMessage
    )
    
    Write-Host "🚀 MLNF Quick Deploy" -ForegroundColor Cyan
    Write-Host "===================" -ForegroundColor Cyan
    
    # Check if we're in a git repository
    if (-not (Test-Path .git)) {
        Write-Host "❌ Not in a git repository!" -ForegroundColor Red
        return
    }
    
    # Stage all changes
    Write-Host "📁 Staging all changes..." -ForegroundColor Yellow
    git add .
    
    # Check if there are any changes to commit
    $status = git status --porcelain
    if (-not $status) {
        Write-Host "✅ No changes to commit!" -ForegroundColor Green
        return
    }
    
    # Commit with message
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    git commit -m $CommitMessage
    
    # Push to remote
    Write-Host "☁️  Pushing to remote..." -ForegroundColor Yellow
    git push
    
    Write-Host "✨ Deploy complete! Soul Scrolls updated." -ForegroundColor Green
}

# Export the function (optional, for module-style loading)
Export-ModuleMember -Function gpush 