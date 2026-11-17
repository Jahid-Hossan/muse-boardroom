@echo off
title Push to GitHub for Coolify
echo ========================================================
echo   PUSH MUSE CEO COMMAND CENTER TO GITHUB FOR COOLIFY
echo ========================================================
echo.
echo 1. Go to https://github.com/new and create a new repository
echo    (Name it: muse-ceo-command)
echo 2. Copy the repository URL (e.g., https://github.com/your-username/muse-ceo-command.git)
echo.
set /p REPO_URL="Enter your GitHub Repository URL: "

if "%REPO_URL%"=="" (
    echo No URL entered. Exiting.
    pause
    exit /b
)

git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

echo.
echo ========================================================
echo Done! Now go to https://coolify.appscloud.tech/
echo Add New Resource -^> Select your repository -^> Click Deploy!
echo ========================================================
pause
