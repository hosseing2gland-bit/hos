# PowerShell Script for running Desktop App on Windows

Write-Host ""
Write-Host "🚀 Starting Anti-Detect Browser..." -ForegroundColor Green
Write-Host ""

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DesktopAppDir = Join-Path $ScriptDir "desktop-app"

# Change to desktop-app directory
Set-Location $DesktopAppDir

Write-Host "📦 Starting React dev server and Electron..." -ForegroundColor Blue
npm run dev
