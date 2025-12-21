@echo off
echo.
echo 🚀 Multi-User Chat Room - Quick Start
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%
echo.

REM Setup Backend Server
echo 📦 Setting up backend server...
cd chat-server
if not exist "node_modules\" (
    echo Installing server dependencies...
    call npm install
) else (
    echo Dependencies already installed
)
cd ..
echo.

REM Setup Frontend Client
echo 📦 Setting up frontend client...
cd chat-client
if not exist "node_modules\" (
    echo Installing client dependencies...
    call npm install
) else (
    echo Dependencies already installed
)
cd ..
echo.

echo ✅ Setup complete!
echo.
echo 🎯 To start the application:
echo.
echo 1. Open a Command Prompt and run:
echo    cd chat-server ^&^& npm start
echo.
echo 2. Open another Command Prompt and run:
echo    cd chat-client ^&^& npm start
echo.
echo 3. Open your browser to: http://localhost:3000
echo.
echo 💡 Tip: Open multiple browser tabs to test multi-user chat!
echo.
pause
