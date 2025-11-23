@echo off
REM Script for quickly running Desktop App on Windows

echo.
echo 🚀 Starting Anti-Detect Browser...
echo.

cd /d "%~dp0\desktop-app"

echo 📦 Starting React dev server and Electron...
call npm run dev
