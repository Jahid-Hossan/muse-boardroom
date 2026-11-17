@echo off
title Connect Live Chrome to Muse Command Center
echo ========================================================
echo   CONNECTING YOUR LOGGED-IN CHROME TO COMMAND CENTER
echo ========================================================
echo.
echo Restarting Chrome with live debugging bridge (port 9222)...
taskkill /F /IM chrome.exe >nul 2>&1
timeout /t 1 /nobreak >nul
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --restore-last-session "https://muse.ai"
echo.
echo Success! Chrome is now running with live debugging enabled.
echo Your existing logins and tabs have been restored.
echo You can now issue directives from http://localhost:3000!
timeout /t 4 >nul
