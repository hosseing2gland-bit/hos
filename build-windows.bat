@echo off
REM Script for building Desktop App for Windows

echo.
echo 🚀 Starting Build for Windows...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo.

REM Navigate to desktop-app directory
cd /d "%~dp0\desktop-app"

REM Install dependencies if not installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
)

REM Install renderer dependencies if not installed
if not exist "renderer\node_modules" (
    echo 📦 Installing UI dependencies...
    cd renderer
    call npm install
    cd ..
)

REM Build React app
echo.
echo 🔨 Building UI...
cd renderer
call npm run build
cd ..

REM Build Electron app for Windows
echo.
echo 🔨 Building Desktop App for Windows...
call npm run build:win

echo.
if exist "dist" (
    echo ✅ Build completed successfully!
    echo.
    echo 📦 Installation files:
    dir /b dist\*.exe 2>nul
    echo.
    echo 📁 Location: %cd%\dist
    echo.
    echo 🎉 You can now install the .exe file!
) else (
    echo ❌ Build failed. Please check the errors above.
    pause
    exit /b 1
)

pause
