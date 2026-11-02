@echo off
title ANVION IT SERVICES - Local Development Server
color 0B

echo ==========================================================
echo        ANVION IT SERVICES - Local Server Launcher
echo ==========================================================
echo.
echo Starting local HTTP server to prevent browser CORS blocks...
echo.

:: Check if Python is installed
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Python detected. Starting server at http://localhost:8080 ...
    echo Opening browser automatically...
    start http://localhost:8080/index.html
    python -m http.server 8080
    goto end
)

:: Check if npx / node is installed
where npx >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js/npx detected. Starting server at http://localhost:8080 ...
    echo Opening browser automatically...
    start http://localhost:8080/index.html
    npx -y serve -l 8080 .
    goto end
)

echo [!] Neither Python nor Node.js were found in your PATH.
echo You can install Python (python.org) or Node.js (nodejs.org) to run a local server.
pause

:end
