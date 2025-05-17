param(
    [Parameter(Mandatory=$false)]
    [string]$commitMessage = "Your commit message",

    [Parameter(Mandatory=$false)]
    [Alias("m")]
    [string]$message
)

# Use $message if provided, otherwise use $commitMessage
if (-not [string]::IsNullOrEmpty($message)) {
    $commitMessage = $message
}

# Navigate to your repository directory if needed
# cd "path\to\your\repository"

# Add, commit, and push changes
git add .
git commit -m $commitMessage
git push origin main

Write-Output "Changes have been committed and pushed to GitHub."
