# PowerShell Script for building Desktop App for Windows

Write-Host ""
Write-Host "🚀 Starting Build for Windows..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js $(node --version)" -ForegroundColor Green
Write-Host ""

# Get script directory and navigate to desktop-app
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DesktopAppDir = Join-Path $ScriptDir "desktop-app"
Set-Location $DesktopAppDir

# Install dependencies if not installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
    npm install
}

# Install renderer dependencies if not installed
if (-not (Test-Path "renderer\node_modules")) {
    Write-Host "📦 Installing UI dependencies..." -ForegroundColor Blue
    Set-Location renderer
    npm install
    Set-Location ..
}

# Build React app
Write-Host ""
Write-Host "🔨 Building UI..." -ForegroundColor Blue
Set-Location renderer
npm run build
Set-Location ..

# Build Electron app for Windows
Write-Host ""
Write-Host "🔨 Building Desktop App for Windows..." -ForegroundColor Blue
npm run build:win

Write-Host ""
if (Test-Path "dist") {
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Installation files:" -ForegroundColor Cyan
    Get-ChildItem -Path "dist" -Filter "*.exe" | ForEach-Object { Write-Host "   - $($_.Name)" }
    Write-Host ""
    Write-Host "📁 Location: $(Get-Location)\dist" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎉 You can now install the .exe file!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
