@echo off
title Muse AI 4-Account Profiles Launcher
echo ========================================================
echo   MUSE AI 4-ACCOUNT LOGIN SETUP (NO API KEY NEEDED)
echo ========================================================
echo.
echo Choose which account profile to open for 1-time login:
echo [1] Account 1 (Muse-1 / Strategy)
echo [2] Account 2 (Muse-2 / Marketing)
echo [3] Account 3 (Muse-3 / Tech)
echo [4] Account 4 (Muse-4 / Operations)
echo [5] Open ALL 4 Profiles side-by-side
echo.
set /p choice="Enter choice (1-5): "

set "CHROME_BIN=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME_BIN%" set "CHROME_BIN=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

set "BASE_DIR=%~dp0profiles"
if not exist "%BASE_DIR%" mkdir "%BASE_DIR%"

if "%choice%"=="1" (
    start "" "%CHROME_BIN%" --user-data-dir="%BASE_DIR%\profile1" "https://muse.ai"
) else if "%choice%"=="2" (
    start "" "%CHROME_BIN%" --user-data-dir="%BASE_DIR%\profile2" "https://muse.ai"
) else if "%choice%"=="3" (
    start "" "%CHROME_BIN%" --user-data-dir="%BASE_DIR%\profile3" "https://muse.ai"
) else if "%choice%"=="4" (
    start "" "%CHROME_BIN%" --user-data-dir="%BASE_DIR%\profile4" "https://muse.ai"
) else if "%choice%"=="5" (
    start "" "%CHROME_BIN%" --user-data-dir="%BASE_DIR%\profile1" "https://muse.ai"
    start "" "%CHROME_BIN%" --user-data-dir="%BASE_DIR%\profile2" "https://muse.ai"
    start "" "%CHROME_BIN%" --user-data-dir="%BASE_DIR%\profile3" "https://muse.ai"
    start "" "%CHROME_BIN%" --user-data-dir="%BASE_DIR%\profile4" "https://muse.ai"
)
echo.
echo Done! Once logged in, your sessions are permanently saved in the profiles directory.
pause
