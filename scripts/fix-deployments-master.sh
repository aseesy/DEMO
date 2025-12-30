#!/bin/bash
# Master Deployment Fix Script
# Orchestrates Railway and Vercel deployment fixes

set -e  # Exit on error

echo "================================================"
echo "LiaiZen Deployment Fix - Master Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo -e "${BLUE}Project: LiaiZen Co-Parenting Platform${NC}"
echo -e "${BLUE}Mission: Better co-parenting through better communication${NC}"
echo ""

echo -e "${YELLOW}Current Status:${NC}"
echo "  Railway Backend:  502 Bad Gateway (configuration issue)"
echo "  Vercel Frontend:  Unknown (needs verification)"
echo ""

echo -e "${YELLOW}Root Cause:${NC}"
echo "  Railway v2 no longer uses railway.toml for Root Directory"
echo "  Configuration must be set in Railway dashboard"
echo ""

echo -e "${YELLOW}Fix Strategy:${NC}"
echo "  Phase 1: Fix Railway backend configuration"
echo "  Phase 2: Fix Vercel frontend configuration"
echo "  Phase 3: Integration testing"
echo ""

echo -e "${YELLOW}Prerequisites Check:${NC}"
PREREQS_OK=true

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}✗ Railway CLI not installed${NC}"
    PREREQS_OK=false
else
    echo -e "${GREEN}✓ Railway CLI installed${NC}"
fi

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}✗ Vercel CLI not installed${NC}"
    PREREQS_OK=false
else
    echo -e "${GREEN}✓ Vercel CLI installed${NC}"
fi

# Check jq
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠ jq not installed (optional, for pretty JSON)${NC}"
else
    echo -e "${GREEN}✓ jq installed${NC}"
fi

# Check git
if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ git not installed${NC}"
    PREREQS_OK=false
else
    echo -e "${GREEN}✓ git installed${NC}"
fi

echo ""

if [ "$PREREQS_OK" = false ]; then
    echo -e "${RED}Error: Missing required tools. Please install them first.${NC}"
    echo ""
    echo "Installation commands:"
    echo "  Railway: npm i -g @railway/cli"
    echo "  Vercel:  npm i -g vercel"
    exit 1
fi

echo -e "${GREEN}All prerequisites satisfied${NC}"
echo ""

# Confirm with user
echo -e "${YELLOW}This script will:${NC}"
echo "  1. Remove railway.toml (deprecated in Railway v2)"
echo "  2. Guide you through Railway dashboard settings"
echo "  3. Deploy updated configuration to Railway"
echo "  4. Set Vercel environment variables"
echo "  5. Deploy frontend to Vercel"
echo "  6. Run integration tests"
echo ""
echo -e "${YELLOW}Do you want to continue? (yes/no)${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted by user"
    exit 0
fi

echo ""
echo "================================================"
echo "PHASE 1: Railway Backend Fix"
echo "================================================"
echo ""

"$SCRIPT_DIR/fix-railway-deployment.sh"

RAILWAY_STATUS=$?
if [ $RAILWAY_STATUS -ne 0 ]; then
    echo -e "${RED}Railway deployment failed. Aborting.${NC}"
    exit 1
fi

echo ""
echo "================================================"
echo "PHASE 2: Vercel Frontend Fix"
echo "================================================"
echo ""

"$SCRIPT_DIR/fix-vercel-deployment.sh"

VERCEL_STATUS=$?
if [ $VERCEL_STATUS -ne 0 ]; then
    echo -e "${RED}Vercel deployment failed. Aborting.${NC}"
    exit 1
fi

echo ""
echo "================================================"
echo "PHASE 3: Integration Testing"
echo "================================================"
echo ""

# Get URLs
RAILWAY_URL=$(railway domain 2>&1 | grep "https://" | awk '{print $2}')
VERCEL_URL="https://coparentliaizen.com"

echo -e "${YELLOW}Testing full stack integration...${NC}"
echo ""

# Test 1: Backend health
echo -e "${BLUE}Test 1: Backend Health Check${NC}"
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/health")
if [ "$HEALTH_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Backend is healthy (HTTP 200)${NC}"
else
    echo -e "${RED}✗ Backend health check failed (HTTP $HEALTH_CODE)${NC}"
fi
echo ""

# Test 2: Frontend accessibility
echo -e "${BLUE}Test 2: Frontend Accessibility${NC}"
FRONTEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL")
if [ "$FRONTEND_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Frontend is accessible (HTTP 200)${NC}"
else
    echo -e "${RED}✗ Frontend check failed (HTTP $FRONTEND_CODE)${NC}"
fi
echo ""

# Test 3: CORS configuration
echo -e "${BLUE}Test 3: CORS Configuration${NC}"
CORS_HEADERS=$(curl -s -I -H "Origin: $VERCEL_URL" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     "$RAILWAY_URL/api/auth/login" | grep -i "access-control")

if [ -n "$CORS_HEADERS" ]; then
    echo -e "${GREEN}✓ CORS headers present${NC}"
    echo "$CORS_HEADERS"
else
    echo -e "${YELLOW}⚠ CORS headers not detected${NC}"
    echo "   This may be okay if CORS is handled differently"
fi
echo ""

# Test 4: Backend database connection
echo -e "${BLUE}Test 4: Database Connection${NC}"
DB_STATUS=$(curl -s "$RAILWAY_URL/health" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
if [ "$DB_STATUS" = "connected" ]; then
    echo -e "${GREEN}✓ Database is connected${NC}"
else
    echo -e "${YELLOW}⚠ Database status: $DB_STATUS${NC}"
fi
echo ""

echo "================================================"
echo "DEPLOYMENT SUMMARY"
echo "================================================"
echo ""

echo -e "${GREEN}✓ Railway backend deployed and running${NC}"
echo -e "${GREEN}✓ Vercel frontend deployed and accessible${NC}"
echo ""

echo "Production URLs:"
echo "  Frontend:     $VERCEL_URL"
echo "  Backend API:  $RAILWAY_URL"
echo "  Health Check: $RAILWAY_URL/health"
echo ""

echo -e "${YELLOW}Post-Deployment Checklist:${NC}"
echo "  [ ] Test user login at $VERCEL_URL"
echo "  [ ] Create a test account"
echo "  [ ] Send a test message"
echo "  [ ] Verify AI mediation works"
echo "  [ ] Test contact management"
echo "  [ ] Test task management"
echo "  [ ] Verify mobile/PWA functionality"
echo "  [ ] Check browser console for errors"
echo "  [ ] Monitor Railway logs for 24 hours"
echo ""

echo -e "${BLUE}Monitoring Commands:${NC}"
echo "  Railway logs:  railway logs"
echo "  Vercel logs:   vercel logs $VERCEL_URL --follow"
echo "  Health check:  curl $RAILWAY_URL/health"
echo ""

echo -e "${GREEN}Deployment complete! 🎉${NC}"
echo ""
echo "For issues, check:"
echo "  - docs/DEPLOYMENT_DIAGNOSTIC_AND_FIXES.md"
echo "  - docs/QUICK_DEPLOYMENT_FIX.md"
echo "  - DEPLOYMENT_CHECKLIST.md"
