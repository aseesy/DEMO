#!/bin/bash

echo "🚀 Starting Chat Application"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -d "chat-server" ] || [ ! -d "chat-client" ]; then
    echo "❌ Please run this from the chat directory"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "chat-server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd chat-server && npm install && cd ..
fi

if [ ! -d "chat-client/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd chat-client && npm install && cd ..
fi

echo "✅ Starting servers..."
echo ""
echo "📍 Backend will run on: http://localhost:3001"
echo "📍 Frontend will run on: http://localhost:3000"
echo ""
echo "🌐 Open your browser to: http://localhost:3000"
echo ""
echo "⚠️  Press Ctrl+C to stop both servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Start backend
cd chat-server
node server.js &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend
cd chat-client
npx http-server -p 3000 > /dev/null 2>&1 &
FRONTEND_PID=$!
cd ..

echo "✅ Backend started (PID: $BACKEND_PID)"
echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo ""
echo "🎉 Chat is running! Open http://localhost:3000 in your browser"
echo ""
echo "Waiting for Ctrl+C to stop..."
echo ""

# Wait for processes
wait

