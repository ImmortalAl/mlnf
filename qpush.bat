@echo off
echo 🚀 MLNF Quick Push
echo =================

cd front

echo 📊 Checking for changes...
git status --short

echo.
echo ➕ Adding changes...
git add .

echo.
if "%~1"=="" (
    echo 💾 Committing with default message...
    git commit -m "Quick update"
) else (
    echo 💾 Committing with message: %~1
    git commit -m "%~1"
)

echo.
echo 🌐 Pushing to GitHub...
git push origin main

echo.
echo ✅ Done! Changes pushed to GitHub
pause 