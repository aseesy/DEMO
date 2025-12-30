#!/bin/bash
# Stop both frontend (Vite) and backend servers

echo "🛑 Stopping Development Servers"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Stop backend on port 3001
if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${BLUE}🛑 Stopping backend server (port 3001)...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}✅ Backend server stopped${NC}"
else
    echo -e "${YELLOW}⚠️  Backend server not running${NC}"
fi

# Stop Vite dev server on port 5173
if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${BLUE}🛑 Stopping Vite dev server (port 5173)...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}✅ Vite dev server stopped${NC}"
else
    echo -e "${YELLOW}⚠️  Vite dev server not running${NC}"
fi

# Also kill any node processes running server.js
pkill -f "node.*server.js" 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ All development servers stopped${NC}"

