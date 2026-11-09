# ANVION IT SERVICES - Local Development & Full-Stack Server Launcher
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       ANVION IT SERVICES - Full-Stack Server Launcher" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting local server with full API & Authentication support..." -ForegroundColor Yellow

$port = 3000
$url = "http://localhost:$port/login"

# Check Node.js
$hasNode = Get-Command node -ErrorAction SilentlyContinue
if ($hasNode) {
    Write-Host "[OK] Node.js detected. Starting ANVION Server at $url ..." -ForegroundColor Green
    Start-Process $url
    node server.js
    exit
}

# Fallback: Python
$hasPython = Get-Command python -ErrorAction SilentlyContinue
if ($hasPython) {
    Write-Host "[WARN] Node.js not found. Starting Python server at $url.html ..." -ForegroundColor Yellow
    Start-Process "http://localhost:$port/login.html"
    python -m http.server $port
    exit
}

# Fallback: npx
$hasNpx = Get-Command npx -ErrorAction SilentlyContinue
if ($hasNpx) {
    Write-Host "[OK] npx detected. Starting server at $url.html ..." -ForegroundColor Green
    Start-Process "http://localhost:$port/login.html"
    npx -y serve -l $port .
    exit
}

Write-Host "[!] Neither Node.js nor Python found in PATH." -ForegroundColor Red
Write-Host "Please install Node.js (https://nodejs.org) to run the ANVION backend and authentication."
Pause
