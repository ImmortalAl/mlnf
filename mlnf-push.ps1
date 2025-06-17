# MLNF Dual Repository Push Script
# Usage: .\mlnf-push.ps1 "Your commit message" [-frontend] [-backend] [-both]
# Example: .\mlnf-push.ps1 "Fixed console errors" -both

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$CommitMessage,
    
    [switch]$Frontend,
    [switch]$Backend, 
    [switch]$Both,
    [switch]$Force
)

# Default to both if no specific repo is specified
if (-not $Frontend -and -not $Backend -and -not $Both) {
    $Both = $true
}

Write-Host "MLNF Dual Repository Push" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host "Commit Message: '$CommitMessage'" -ForegroundColor White
Write-Host ""

$startTime = Get-Date
$successCount = 0
$totalRepos = 0

function Push-Repository {
    param(
        [string]$RepoPath,
        [string]$RepoName,
        [string]$Message
    )
    
    if (-not (Test-Path $RepoPath)) {
        Write-Host "[ERROR] $RepoName directory not found: $RepoPath" -ForegroundColor Red
        return $false
    }

    Write-Host "[INFO] Processing $RepoName..." -ForegroundColor Yellow
    
    # Change to repository directory
    Push-Location $RepoPath
    
    try {
        # Check if it's a git repository
        $gitDir = git rev-parse --git-dir 2>$null
        if (-not $gitDir) {
            Write-Host "[ERROR] $RepoName is not a git repository" -ForegroundColor Red
            return $false
        }

        # Check git status
        $status = git status --porcelain 2>$null
        if (-not $status) {
            Write-Host "[SUCCESS] $RepoName - No changes to commit" -ForegroundColor Green
            return $true
        }

        Write-Host "[INFO] $RepoName - Found changes:" -ForegroundColor Cyan
        git status --short

        # Add all changes
        Write-Host "[INFO] $RepoName - Staging changes..." -ForegroundColor Yellow
        git add . 2>$null

        # Commit changes
        Write-Host "[INFO] $RepoName - Committing..." -ForegroundColor Yellow
        $commitResult = git commit -m $Message 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] $RepoName - Commit failed" -ForegroundColor Red
            return $false
        }

        # Push to remote
        Write-Host "[INFO] $RepoName - Pushing to remote..." -ForegroundColor Yellow
        $pushResult = git push 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] $RepoName - Push failed" -ForegroundColor Red
            return $false
        }

        Write-Host "[SUCCESS] $RepoName - Successfully pushed!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "[ERROR] $RepoName - Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        # Return to original directory
        Pop-Location
    }
}

# Process repositories based on parameters
if ($Frontend -or $Both) {
    $totalRepos++
    if (Push-Repository -RepoPath ".\front" -RepoName "Frontend" -Message $CommitMessage) {
        $successCount++
    }
}

if ($Backend -or $Both) {
    $totalRepos++
    if (Push-Repository -RepoPath ".\back" -RepoName "Backend" -Message $CommitMessage) {
        $successCount++
    }
}

# Summary
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host ""
Write-Host "PUSH SUMMARY" -ForegroundColor Cyan
Write-Host "============" -ForegroundColor Cyan
Write-Host "Successfully pushed: $successCount/$totalRepos repositories" -ForegroundColor $(if ($successCount -eq $totalRepos) { "Green" } else { "Yellow" })
Write-Host "Total time: $([math]::Round($duration, 2)) seconds" -ForegroundColor White

if ($successCount -eq $totalRepos) {
    Write-Host ""
    Write-Host "[SUCCESS] All changes deployed successfully!" -ForegroundColor Green
    Write-Host "MLNF is updated and ready for eternal souls" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "[WARNING] Some repositories failed to push. Check the errors above." -ForegroundColor Yellow
}
