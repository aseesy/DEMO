#!/bin/bash

# Deployment Verification Script
# Checks Railway backend and Vercel frontend health

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs
RAILWAY_URL="https://demo-production-6dcd.up.railway.app"
VERCEL_URL="https://coparentliaizen.com"

echo "========================================="
echo "Deployment Verification Script"
echo "========================================="
echo ""

# Function to check URL
check_url() {
    local url=$1
    local name=$2
    local endpoint=$3

    echo -n "Checking $name... "

    if curl -f -s -o /dev/null -w "%{http_code}" "$url$endpoint" | grep -q "200"; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Function to check JSON response
check_json() {
    local url=$1
    local name=$2
    local endpoint=$3

    echo -n "Checking $name... "

    response=$(curl -f -s "$url$endpoint" 2>/dev/null)
    http_code=$?

    if [ $http_code -eq 0 ]; then
        echo -e "${GREEN}✓ OK${NC}"
        echo "   Response: $response" | head -c 100
        echo ""
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Function to check CORS
check_cors() {
    echo -n "Checking CORS from Vercel to Railway... "

    response=$(curl -s -H "Origin: $VERCEL_URL" \
                      -H "Access-Control-Request-Method: POST" \
                      -X OPTIONS \
                      -w "%{http_code}" \
                      "$RAILWAY_URL/api/auth/login" 2>/dev/null)

    if echo "$response" | grep -q "200\|204"; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ WARNING${NC}"
        echo "   CORS may not be configured correctly"
        return 1
    fi
}

# Track failures
failures=0

echo "1. Railway Backend Checks"
echo "-------------------------"

if ! check_json "$RAILWAY_URL" "Health endpoint" "/health"; then
    ((failures++))
fi

if ! check_url "$RAILWAY_URL" "Auth endpoint" "/api/auth/verify"; then
    echo -e "${YELLOW}   (401 expected for unauthenticated request)${NC}"
fi

echo ""
echo "2. Vercel Frontend Checks"
echo "-------------------------"

if ! check_url "$VERCEL_URL" "Homepage" "/"; then
    ((failures++))
fi

if ! check_url "$VERCEL_URL" "Login page" "/login"; then
    ((failures++))
fi

echo ""
echo "3. Integration Checks"
echo "---------------------"

if ! check_cors; then
    ((failures++))
fi

echo ""
echo "4. SSL/TLS Checks"
echo "-----------------"

echo -n "Checking Railway SSL... "
if curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/health" | grep -q "200"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    ((failures++))
fi

echo -n "Checking Vercel SSL... "
if curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL" | grep -q "200"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    ((failures++))
fi

echo ""
echo "========================================="

if [ $failures -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Deployments are healthy:"
    echo "  - Backend: $RAILWAY_URL"
    echo "  - Frontend: $VERCEL_URL"
    exit 0
else
    echo -e "${RED}✗ $failures check(s) failed${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "  1. Check Railway logs: railway logs --tail"
    echo "  2. Check Vercel logs: vercel logs $VERCEL_URL --follow"
    echo "  3. Verify environment variables are set"
    echo "  4. See docs/DEPLOYMENT_DIAGNOSTIC_AND_FIXES.md"
    exit 1
fi
