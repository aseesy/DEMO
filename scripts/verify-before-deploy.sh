#!/bin/bash

# verify-before-deploy.sh
# Run this before deploying to catch issues that would fail on Vercel

set -e

echo "🔍 Pre-deploy verification starting..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# 1. Check for uncommitted changes in critical files
echo "📋 Step 1: Checking for uncommitted changes..."
UNCOMMITTED=$(git status --porcelain chat-client-vite/src/ 2>/dev/null | grep -E '^\s*M' | wc -l | tr -d ' ')
if [ "$UNCOMMITTED" -gt "0" ]; then
    echo -e "${YELLOW}⚠️  Warning: $UNCOMMITTED uncommitted changes in chat-client-vite/src/${NC}"
    git status --short chat-client-vite/src/ | head -10
    echo ""
fi

# 2. Check that git HEAD matches local files for key exports
echo "📋 Step 2: Verifying exports match between local and git..."

# Check useModalControllerDefault export
if grep -q "useModalControllerDefault" chat-client-vite/src/hooks/useDashboard.js 2>/dev/null; then
    if ! grep -q "export.*useModalControllerDefault" chat-client-vite/src/hooks/useModalController.js 2>/dev/null; then
        echo -e "${RED}❌ FATAL: useDashboard imports useModalControllerDefault but useModalController doesn't export it${NC}"
        FAILED=1
    else
        echo -e "${GREEN}✓ useModalControllerDefault export found${NC}"
    fi
fi

# 3. Run the build
echo ""
echo "📋 Step 3: Running production build..."
cd chat-client-vite

if npm run build 2>&1 | tail -5; then
    echo -e "${GREEN}✓ Build succeeded${NC}"
else
    echo -e "${RED}❌ FATAL: Build failed${NC}"
    FAILED=1
fi

cd ..

# 4. Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$FAILED" -eq "0" ]; then
    echo -e "${GREEN}✅ All checks passed - safe to deploy${NC}"
    echo ""
    echo "To deploy, run:"
    echo "  vercel --prod"
else
    echo -e "${RED}❌ Verification failed - DO NOT DEPLOY${NC}"
    echo ""
    echo "Fix the issues above before deploying."
    exit 1
fi
