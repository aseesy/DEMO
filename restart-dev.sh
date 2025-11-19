#!/bin/bash
# Script to restart both frontend (Vite) and backend servers
# Vite has HMR, so frontend changes are usually picked up automatically
# This script restarts both servers if needed

set -e

echo "🔄 Restarting Development Servers"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Kill existing processes
echo -e "${BLUE}🛑 Stopping existing servers...${NC}"

# Backend on port 3001
if lsof -ti:3001 > /dev/null 2>&1; then
    echo "  Stopping backend server (port 3001)..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Frontend Vite dev server on port 5173
if lsof -ti:5173 > /dev/null 2>&1; then
    echo "  Stopping Vite dev server (port 5173)..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Also check for any node processes running server.js
pkill -f "node.*server.js" 2>/dev/null || true
sleep 1

echo -e "${GREEN}✅ Servers stopped${NC}"
echo ""

# Check for syntax errors in backend
echo -e "${BLUE}🔍 Checking backend for syntax errors...${NC}"
cd "$(dirname "$0")/chat-server"
if ! node -c server.js 2>/dev/null; then
    echo -e "${YELLOW}❌ Syntax error in server.js${NC}"
    exit 1
fi

if ! node -c aiMediator.js 2>/dev/null; then
    echo -e "${YELLOW}❌ Syntax error in aiMediator.js${NC}"
    exit 1
fi

echo -e "${GREEN}✅ No syntax errors found${NC}"
echo ""

# Start backend server
echo -e "${BLUE}🚀 Starting backend server...${NC}"
cd "$(dirname "$0")/chat-server"
node server.js > /tmp/chat-server.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server started on port 3001 (PID: $BACKEND_PID)${NC}"
else
    echo -e "${YELLOW}❌ Backend server failed to start. Check /tmp/chat-server.log${NC}"
    exit 1
fi

echo ""

# Start frontend Vite dev server
echo -e "${BLUE}🚀 Starting Vite dev server...${NC}"
cd "$(dirname "$0")/chat-client-vite"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    npm install
fi

npm run dev > /tmp/vite-dev.log 2>&1 &
VITE_PID=$!

# Wait for Vite to start
sleep 3

if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Vite dev server started on port 5173 (PID: $VITE_PID)${NC}"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ Development servers restarted!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "📍 Backend:  http://localhost:3001"
    echo "📍 Frontend: http://localhost:5173"
    echo ""
    echo "💡 Note: Vite has Hot Module Replacement (HMR)"
    echo "   Frontend changes will be picked up automatically!"
    echo ""
    echo "📋 Logs:"
    echo "   Backend:  tail -f /tmp/chat-server.log"
    echo "   Frontend: tail -f /tmp/vite-dev.log"
    echo ""
    echo "🛑 To stop servers:"
    echo "   kill $BACKEND_PID $VITE_PID"
    echo ""
else
    echo -e "${YELLOW}⚠️  Vite dev server may still be starting...${NC}"
    echo "   Check /tmp/vite-dev.log for details"
    echo "   Frontend will be available at http://localhost:5173 once ready"
fi

