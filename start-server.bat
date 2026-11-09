@echo off
title ANVION IT SERVICES - Production & Local Development Server
color 0B

echo ==========================================================
echo        ANVION IT SERVICES - Full-Stack Server Launcher
echo ==========================================================
echo.
echo Starting local server with full API and Authentication support...
echo.

:: Check if Node.js is installed (Preferred: runs full Express server & API endpoints)
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js detected. Starting ANVION Full-Stack Server at http://localhost:3000 ...
    echo Opening browser at http://localhost:3000/login ...
    start http://localhost:3000/login
    node server.js
    goto end
)

:: Fallback if Python is installed
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [WARN] Node.js not found. Falling back to Python static server at http://localhost:3000 ...
    echo Opening browser automatically...
    start http://localhost:3000/login.html
    python -m http.server 3000
    goto end
)

:: Fallback if npx is installed
where npx >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] npx detected. Starting server at http://localhost:3000 ...
    start http://localhost:3000/login.html
    npx -y serve -l 3000 .
    goto end
)

echo [!] Neither Node.js nor Python were found in your PATH.
echo Please install Node.js (https://nodejs.org) to run the ANVION backend and authentication.
pause

:end
