# ANVION IT SERVICES - Local Development Server Launcher
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       ANVION IT SERVICES - Local Server Launcher" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting local HTTP server to prevent browser CORS blocks..." -ForegroundColor Yellow

$port = 8080
$url = "http://localhost:$port/index.html"

# Check Python
$hasPython = Get-Command python -ErrorAction SilentlyContinue
if ($hasPython) {
    Write-Host "[OK] Python detected. Starting server at $url ..." -ForegroundColor Green
    Start-Process $url
    python -m http.server $port
    exit
}

# Check Node/npx
$hasNpx = Get-Command npx -ErrorAction SilentlyContinue
if ($hasNpx) {
    Write-Host "[OK] Node.js/npx detected. Starting server at $url ..." -ForegroundColor Green
    Start-Process $url
    npx -y serve -l $port .
    exit
}

Write-Host "[!] Neither Python nor Node.js found in PATH." -ForegroundColor Red
Write-Host "Please install Python or Node.js to run a local server."
Pause
