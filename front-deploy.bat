@echo off
echo === Starting Frontend Deployment ===
cd /d "C:\Users\coold\Documents\Sites\MLNF\front"
if errorlevel 1 (
    echo Error: Failed to navigate to front directory
    pause
    exit /b 1
)

echo Current directory: %CD%
git status
git add --all
git commit -m "Frontend deploy: %date% %time%"
if errorlevel 1 (
    echo Warning: Commit failed - possibly no changes detected
    echo Continuing with push attempt...
)

git push origin main
if errorlevel 1 (
    echo Error: Push failed
    pause
    exit /b 1
)

echo === Deployment Successful ===
timeout 5 