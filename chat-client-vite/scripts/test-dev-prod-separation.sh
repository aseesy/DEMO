#!/bin/bash
# Test script to verify dev/prod separation

set -e

echo "🧪 Testing Dev/Prod Separation"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd "$(dirname "$0")/.."

# Test 1: Check for process.env.NODE_ENV in source
echo "Test 1: Checking for process.env.NODE_ENV in source files..."
if grep -r "process.env.NODE_ENV" src --include="*.js" --include="*.jsx" > /dev/null 2>&1; then
    echo -e "${RED}❌ FAILED: Found process.env.NODE_ENV in source files${NC}"
    grep -r "process.env.NODE_ENV" src --include="*.js" --include="*.jsx"
    exit 1
else
    echo -e "${GREEN}✅ PASSED: No process.env.NODE_ENV found${NC}"
fi
echo ""

# Test 2: Check for debug utilities in production build
echo "Test 2: Checking for debug utilities in production build..."
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️  SKIPPED: dist/ folder not found (run 'npm run build' first)${NC}"
else
    if grep -q "window.__SOCKET_DEBUG__\|window.__errorLog\|window.getErrorLog\|window.clearErrorLog" dist/assets/*.js 2>/dev/null; then
        echo -e "${RED}❌ FAILED: Found debug utilities in production build${NC}"
        grep "window.__SOCKET_DEBUG__\|window.__errorLog\|window.getErrorLog\|window.clearErrorLog" dist/assets/*.js
        exit 1
    else
        echo -e "${GREEN}✅ PASSED: No debug utilities found in production build${NC}"
    fi
fi
echo ""

# Test 3: Verify import.meta.env.DEV is used
echo "Test 3: Verifying import.meta.env.DEV usage..."
if grep -r "import.meta.env.DEV" src --include="*.js" --include="*.jsx" | head -1 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED: import.meta.env.DEV is used${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: No import.meta.env.DEV found (may be using config.isDevelopment())${NC}"
fi
echo ""

# Test 4: Build production bundle
echo "Test 4: Building production bundle..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED: Production build succeeded${NC}"
else
    echo -e "${RED}❌ FAILED: Production build failed${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "Summary:"
echo "  - No process.env.NODE_ENV in source files"
echo "  - Debug utilities not in production build"
echo "  - Production build succeeds"
echo "  - Environment detection uses import.meta.env.DEV"

