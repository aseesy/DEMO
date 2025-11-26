#!/bin/bash
# Restart Development Servers
# Kills and restarts both backend (port 3001) and frontend (port 5173) servers
# Usage: ./restart-servers.sh [backend|frontend|all]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Determine what to restart
RESTART_TARGET="${1:-all}"

echo -e "${BLUE}🔄 Restarting Development Servers${NC}"
echo "=================================="
echo ""

# Function to kill process on a port
kill_port() {
    local port=$1
    local name=$2
    
    if lsof -ti:$port > /dev/null 2>&1; then
        echo -e "${YELLOW}🛑 Stopping $name (port $port)...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
        
        # Verify it's stopped
        if lsof -ti:$port > /dev/null 2>&1; then
            echo -e "${RED}⚠️  $name still running, force killing...${NC}"
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
            sleep 1
        fi
        
        echo -e "${GREEN}✅ $name stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  $name not running on port $port${NC}"
    fi
}

# Function to start backend
start_backend() {
    echo ""
    echo -e "${BLUE}🚀 Starting backend server...${NC}"
    cd "$SCRIPT_DIR/chat-server"
    
    # Check for .env file
    if [ ! -f ".env" ]; then
        echo -e "${RED}❌ .env file not found in chat-server directory${NC}"
        return 1
    fi
    
    # Check for syntax errors
    if ! node -c server.js 2>/dev/null; then
        echo -e "${RED}❌ Syntax error in server.js${NC}"
        return 1
    fi
    
    # Start server in background
    node server.js > /tmp/chat-server.log 2>&1 &
    BACKEND_PID=$!
    
    # Wait for server to start
    echo "   Waiting for server to start..."
    sleep 3
    
    # Check if server started
    if lsof -ti:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend server started on port 3001 (PID: $BACKEND_PID)${NC}"
        echo "   Logs: tail -f /tmp/chat-server.log"
        return 0
    else
        echo -e "${RED}❌ Backend server failed to start${NC}"
        echo "   Check logs: tail -f /tmp/chat-server.log"
        return 1
    fi
}

# Function to fix common import issues
fix_import_issues() {
    echo -e "${BLUE}🔍 Checking for common import issues...${NC}"
    cd "$SCRIPT_DIR/chat-client-vite/src"
    
    local fixed=0
    local issues_found=0
    
    # Check for files that are imported but don't exist
    echo "   Checking for missing imported files..."
    
    # Find all import statements
    local imports=$(grep -rh "from ['\"].*['\"]" --include="*.jsx" --include="*.js" . 2>/dev/null | \
        sed -n "s/.*from ['\"]\([^'\"]*\)['\"].*/\1/p" | \
        sort -u)
    
    while IFS= read -r import_path; do
        # Skip node_modules and external packages
        if [[ "$import_path" == @* ]] || [[ "$import_path" != .* ]]; then
            continue
        fi
        
        # Resolve relative import paths
        local resolved=""
        if [[ "$import_path" == ./ ]]; then
            continue
        elif [[ "$import_path" == ../* ]]; then
            # For ../ imports, we need to check from the file's directory
            # This is simplified - just check common patterns
            local base_path=$(echo "$import_path" | sed 's|^\.\./||')
            resolved="$base_path"
        else
            resolved="$import_path"
        fi
        
        # Check if file exists (with or without extension)
        local file_found=false
        if [ -f "$resolved" ]; then
            file_found=true
        elif [ -f "${resolved}.js" ]; then
            file_found=true
        elif [ -f "${resolved}.jsx" ]; then
            file_found=true
        elif [ -f "${resolved}/index.js" ] || [ -f "${resolved}/index.jsx" ]; then
            file_found=true
        fi
        
        if [ "$file_found" = false ] && [ -n "$resolved" ]; then
            issues_found=$((issues_found + 1))
            if [ $issues_found -le 5 ]; then
                echo -e "${YELLOW}      ⚠️  Missing: $import_path${NC}"
            fi
        fi
    done <<< "$imports"
    
    # Fix common issues: errorHandler.jsx should be imported as .jsx (not .js)
    # First fix any .jsxx that might have been created (double replacement)
    if grep -q "errorHandler\.jsxx['\"]" --include="*.jsx" --include="*.js" . 2>/dev/null; then
        echo "   Fixing: Correcting errorHandler.jsxx to errorHandler.jsx"
        find . -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|errorHandler\.jsxx\(['\''"]\)|errorHandler.jsx\1|g' {} \;
        fixed=$((fixed + 1))
    fi
    
    # Then fix .js imports (but not .jsx)
    if grep -q "errorHandler\.js['\"]" --include="*.jsx" --include="*.js" . 2>/dev/null; then
        echo "   Fixing: Updating errorHandler.js imports to errorHandler.jsx"
        # Match .js followed by quote, but not .jsx
        find . -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|errorHandler\.js\(['\''"]\)|errorHandler.jsx\1|g' {} \;
        fixed=$((fixed + 1))
    fi
    
    # Check for .jsx files that should be imported with .jsx extension
    for file in utils/*.jsx components/*.jsx; do
        if [ -f "$file" ]; then
            local basename=$(basename "$file" .jsx)
            local dirname=$(dirname "$file")
            # Check if file contains JSX
            if grep -q "<.*>" "$file" 2>/dev/null; then
                # File contains JSX, should be .jsx
                # Check if it's imported as .js
                if grep -rq "${basename}\.js['\"]" --include="*.jsx" --include="*.js" . 2>/dev/null; then
                    echo "   Fixing: Updating ${basename}.js imports to ${basename}.jsx"
                    find . -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' "s|${basename}\.js|${basename}.jsx|g" {} \;
                    fixed=$((fixed + 1))
                fi
            fi
        fi
    done
    
    if [ $fixed -gt 0 ]; then
        echo -e "${GREEN}   ✅ Fixed $fixed import issue(s)${NC}"
    fi
    
    if [ $issues_found -gt 5 ]; then
        echo -e "${YELLOW}   ⚠️  Found $issues_found potential import issues (showing first 5)${NC}"
    elif [ $issues_found -gt 0 ]; then
        echo -e "${YELLOW}   ⚠️  Found $issues_found potential import issue(s)${NC}"
    fi
    
    if [ $fixed -eq 0 ] && [ $issues_found -eq 0 ]; then
        echo -e "${GREEN}   ✅ No import issues found${NC}"
    fi
    
    cd "$SCRIPT_DIR"
}

# Function to start frontend
start_frontend() {
    echo ""
    echo -e "${BLUE}🚀 Starting frontend server...${NC}"
    cd "$SCRIPT_DIR/chat-client-vite"
    
    # Fix import issues before starting
    fix_import_issues
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        npm install
    fi
    
    # Start Vite dev server in background
    npm run dev > /tmp/vite-dev.log 2>&1 &
    VITE_PID=$!
    
    # Wait for Vite to start
    echo "   Waiting for Vite to start..."
    sleep 4
    
    # Check for build errors in logs
    sleep 2
    if grep -q "Failed to resolve\|Cannot find module\|Error:" /tmp/vite-dev.log 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Potential build errors detected. Checking logs...${NC}"
        echo "   Recent errors:"
        grep -i "error\|failed\|cannot find" /tmp/vite-dev.log 2>/dev/null | tail -3 | sed 's/^/      /'
    fi
    
    # Check if Vite started
    if lsof -ti:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend server started on port 5173 (PID: $VITE_PID)${NC}"
        echo "   Logs: tail -f /tmp/vite-dev.log"
        return 0
    else
        echo -e "${YELLOW}⚠️  Frontend may still be starting...${NC}"
        echo "   Check logs: tail -f /tmp/vite-dev.log"
        return 0  # Vite can take a moment, don't fail
    fi
}

# Main execution
case "$RESTART_TARGET" in
    backend)
        kill_port 3001 "Backend server"
        start_backend
        ;;
    frontend)
        kill_port 5173 "Frontend server"
        start_frontend
        ;;
    all|*)
        # Kill both servers
        kill_port 3001 "Backend server"
        kill_port 5173 "Frontend server"
        
        # Also kill any node processes running server.js (just to be sure)
        pkill -f "node.*server.js" 2>/dev/null || true
        sleep 1
        
        # Start both servers
        start_backend
        start_frontend
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Server restart complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📍 Backend:  http://localhost:3001"
echo "📍 Frontend: http://localhost:5173"
echo ""
echo "📋 View logs:"
echo "   Backend:  tail -f /tmp/chat-server.log"
echo "   Frontend: tail -f /tmp/vite-dev.log"
echo ""
echo "🛑 To stop servers:"
echo "   ./stop-dev.sh"
echo "   or: kill \$(lsof -ti:3001) \$(lsof -ti:5173)"

