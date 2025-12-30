#!/bin/bash
# Script to restart the backend server

echo "🛑 Stopping existing server processes on port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 1

echo "🔍 Checking for syntax errors..."
cd "$(dirname "$0")/chat-server"
if ! node -c server.js 2>/dev/null; then
  echo "❌ Syntax error in server.js"
  exit 1
fi

if ! node -c aiMediator.js 2>/dev/null; then
  echo "❌ Syntax error in aiMediator.js"
  exit 1
fi

echo "✅ No syntax errors found"
echo "🚀 Starting server..."
node server.js &
SERVER_PID=$!

sleep 3

if lsof -ti:3001 > /dev/null 2>&1; then
  echo "✅ Backend server restarted successfully on port 3001 (PID: $SERVER_PID)"
else
  echo "❌ Server failed to start"
  exit 1
fi

