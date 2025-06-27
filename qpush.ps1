# Quick Push Alias for MLNF
# Usage: .\qpush.ps1 "Your commit message"
# This is a shortcut to .\mlnf-push.ps1 with -both flag

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$CommitMessage
)

# Call the main script with -both flag
& ".\mlnf-push.ps1" $CommitMessage -both 