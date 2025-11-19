#!/bin/bash
# Start both frontend (Vite) and backend servers for development
# Vite has Hot Module Replacement (HMR) - changes are picked up automatically!

set -e

echo "🚀 Starting Development Servers"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend is already running
if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend server already running on port 3001${NC}"
    echo "   Skipping backend start..."
else
    echo -e "${BLUE}🚀 Starting backend server...${NC}"
    cd "$(dirname "$0")/chat-server"
    
    # Check for syntax errors
    if ! node -c server.js 2>/dev/null; then
        echo -e "${RED}❌ Syntax error in server.js${NC}"
        exit 1
    fi
    
    node server.js > /tmp/chat-server.log 2>&1 &
    BACKEND_PID=$!
    sleep 2
    
    if lsof -ti:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend server started on port 3001 (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${RED}❌ Backend server failed to start${NC}"
        echo "   Check /tmp/chat-server.log for details"
        exit 1
    fi
fi

echo ""

# Check if Vite dev server is already running
if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Vite dev server already running on port 5173${NC}"
    echo "   Frontend changes will be picked up automatically via HMR!"
    echo ""
    echo -e "${GREEN}✅ Development servers are ready!${NC}"
    echo ""
    echo "📍 Backend:  http://localhost:3001"
    echo "📍 Frontend: http://localhost:5173"
    echo ""
    echo "💡 Vite HMR is active - your UI changes will appear instantly!"
    exit 0
fi

echo -e "${BLUE}🚀 Starting Vite dev server...${NC}"
cd "$(dirname "$0")/chat-client-vite"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    npm install
fi

# Start Vite dev server
npm run dev > /tmp/vite-dev.log 2>&1 &
VITE_PID=$!

# Wait for Vite to start
echo "   Waiting for Vite to start..."
sleep 4

if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Vite dev server started on port 5173 (PID: $VITE_PID)${NC}"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ Development servers are ready!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "📍 Backend:  http://localhost:3001"
    echo "📍 Frontend: http://localhost:5173"
    echo ""
    echo -e "${GREEN}💡 Hot Module Replacement (HMR) is active!${NC}"
    echo "   Your UI changes will appear instantly without restarting!"
    echo ""
    echo "📋 Logs:"
    echo "   Backend:  tail -f /tmp/chat-server.log"
    echo "   Frontend: tail -f /tmp/vite-dev.log"
    echo ""
    echo "🛑 To stop servers:"
    echo "   ./stop-dev.sh"
    echo "   or: kill $BACKEND_PID $VITE_PID"
else
    echo -e "${YELLOW}⚠️  Vite dev server may still be starting...${NC}"
    echo "   Check /tmp/vite-dev.log for details"
    echo "   Frontend will be available at http://localhost:5173 once ready"
    echo ""
    echo "💡 Once started, HMR will automatically pick up your changes!"
fi

