#!/bin/bash

echo "🚀 Multi-User Chat Room - Quick Start"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Setup Backend Server
echo "📦 Setting up backend server..."
cd chat-server
if [ ! -d "node_modules" ]; then
    echo "Installing server dependencies..."
    npm install
else
    echo "Dependencies already installed"
fi
cd ..
echo ""

# Setup Frontend Client
echo "📦 Setting up frontend client..."
cd chat-client
if [ ! -d "node_modules" ]; then
    echo "Installing client dependencies..."
    npm install
else
    echo "Dependencies already installed"
fi
cd ..
echo ""

echo "✅ Setup complete!"
echo ""
echo "🎯 To start the application:"
echo ""
echo "1. Open a terminal and run:"
echo "   cd chat-server && npm start"
echo ""
echo "2. Open another terminal and run:"
echo "   cd chat-client && npm start"
echo ""
echo "3. Open your browser to: http://localhost:3000"
echo ""
echo "💡 Tip: Open multiple browser tabs to test multi-user chat!"
echo ""
