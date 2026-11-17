@echo off
title Push to GitHub for Coolify
cd /d "%~dp0"
echo ========================================================
echo   PUSH MUSE CEO COMMAND CENTER TO GITHUB FOR COOLIFY
echo ========================================================
echo.

:: Ensure git repo is initialized and committed
if not exist ".git" (
    echo Initializing Git repository...
    git init
    git config user.name "Jahid"
    git config user.email "user@appscloud.tech"
    git add .
    git commit -m "Muse AI CEO Command Center with Coolify support"
)

echo Repository is ready!
echo.
echo 1. Go to https://github.com/new and create a new repository
echo    (e.g., named: muse-ceo-command)
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
echo.
echo Pushing files to GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo SUCCESS! Repository pushed to GitHub!
    echo Next step: Go to https://coolify.appscloud.tech/
    echo Click + New Resource -^> Application -^> Select your repo -^> Deploy!
    echo ========================================================
) else (
    echo.
    echo [NOTE] If GitHub asks you to sign in, complete the login in the pop-up window.
)

pause
