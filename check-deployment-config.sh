#!/bin/bash

# Deployment Configuration Diagnostic Script
# Checks Railway and Vercel configuration

set -e

echo "🔍 Deployment Configuration Diagnostic"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RAILWAY_URL="https://demo-production-6dcd.up.railway.app"
VERCEL_URL="https://www.coparentliaizen.com"
EXPECTED_FRONTEND_URL="https://www.coparentliaizen.com,https://coparentliaizen.com,https://*.vercel.app"

# Track issues
ISSUES=0
WARNINGS=0

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅${NC} $1 is installed: $($1 --version 2>/dev/null | head -n1)"
        return 0
    else
        echo -e "${YELLOW}⚠️${NC} $1 is not installed (optional)"
        return 1
    fi
}

check_railway_cli() {
    echo ""
    echo -e "${BLUE}📋 Checking Railway CLI...${NC}"
    if check_command railway; then
        echo ""
        echo -e "${BLUE}📊 Railway Variables:${NC}"
        if railway variables 2>/dev/null | grep -q "DATABASE_URL\|FRONTEND_URL\|JWT_SECRET\|NODE_ENV"; then
            railway variables 2>/dev/null | grep -E "DATABASE_URL|FRONTEND_URL|JWT_SECRET|NODE_ENV|PORT" || true
        else
            echo -e "${YELLOW}⚠️${NC} Could not fetch Railway variables. Make sure you're logged in: railway login"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${YELLOW}💡${NC} Install Railway CLI: npm install -g @railway/cli"
    fi
}

check_vercel_cli() {
    echo ""
    echo -e "${BLUE}📋 Checking Vercel CLI...${NC}"
    if check_command vercel; then
        echo ""
        echo -e "${BLUE}📊 Vercel Environment Variables:${NC}"
        if vercel env ls 2>/dev/null | grep -q "VITE_API_URL"; then
            vercel env ls 2>/dev/null | grep "VITE_API_URL" || true
        else
            echo -e "${YELLOW}⚠️${NC} Could not fetch Vercel env vars. Make sure you're in the project directory and logged in"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${YELLOW}💡${NC} Install Vercel CLI: npm install -g vercel"
    fi
}

test_backend_health() {
    echo ""
    echo -e "${BLUE}🏥 Testing Railway Backend Health...${NC}"
    if curl -s -f --max-time 5 "${RAILWAY_URL}/health" > /dev/null 2>&1; then
        RESPONSE=$(curl -s "${RAILWAY_URL}/health")
        echo -e "${GREEN}✅${NC} Backend is responding"
        echo "   Response: $RESPONSE"
    else
        echo -e "${RED}❌${NC} Backend is not responding at ${RAILWAY_URL}/health"
        echo -e "${YELLOW}💡${NC} Check Railway logs: railway logs"
        ISSUES=$((ISSUES + 1))
    fi
}

test_backend_cors() {
    echo ""
    echo -e "${BLUE}🔒 Testing CORS Configuration...${NC}"
    CORS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Origin: ${VERCEL_URL}" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        "${RAILWAY_URL}/api/stats/user-count" 2>/dev/null || echo "000")
    
    if [ "$CORS_RESPONSE" = "200" ] || [ "$CORS_RESPONSE" = "204" ]; then
        echo -e "${GREEN}✅${NC} CORS is configured correctly"
    else
        echo -e "${RED}❌${NC} CORS test failed (HTTP $CORS_RESPONSE)"
        echo -e "${YELLOW}💡${NC} Check FRONTEND_URL in Railway variables"
        ISSUES=$((ISSUES + 1))
    fi
}

test_frontend() {
    echo ""
    echo -e "${BLUE}🌐 Testing Vercel Frontend...${NC}"
    if curl -s -f --max-time 5 "${VERCEL_URL}" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} Frontend is accessible at ${VERCEL_URL}"
    else
        echo -e "${RED}❌${NC} Frontend is not accessible at ${VERCEL_URL}"
        ISSUES=$((ISSUES + 1))
    fi
}

check_local_env() {
    echo ""
    echo -e "${BLUE}📁 Checking Local Environment Files...${NC}"
    
    if [ -f "chat-client-vite/.env" ]; then
        echo -e "${GREEN}✅${NC} Found chat-client-vite/.env"
        if grep -q "VITE_API_URL" chat-client-vite/.env; then
            VITE_API_URL=$(grep "VITE_API_URL" chat-client-vite/.env | cut -d '=' -f2)
            echo "   VITE_API_URL=$VITE_API_URL"
            if [[ "$VITE_API_URL" == *"localhost"* ]]; then
                echo -e "${GREEN}✅${NC} Correct for local development"
            else
                echo -e "${YELLOW}⚠️${NC} Using production URL in local .env (might want localhost for dev)"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️${NC} chat-client-vite/.env not found (optional for local dev)"
    fi
    
    if [ -f "chat-server/.env" ]; then
        echo -e "${GREEN}✅${NC} Found chat-server/.env"
        if grep -q "DATABASE_URL" chat-server/.env; then
            echo -e "${YELLOW}⚠️${NC} DATABASE_URL is set in local .env"
        fi
    else
        echo -e "${YELLOW}⚠️${NC} chat-server/.env not found (optional, uses Railway env vars in production)"
    fi
}

validate_config() {
    echo ""
    echo -e "${BLUE}✅ Configuration Validation${NC}"
    echo ""
    echo "Expected Configuration:"
    echo "----------------------"
    echo "Railway Backend URL: ${RAILWAY_URL}"
    echo "Vercel Frontend URL: ${VERCEL_URL}"
    echo ""
    echo "Required Railway Variables:"
    echo "  - NODE_ENV=production"
    echo "  - FRONTEND_URL=${EXPECTED_FRONTEND_URL}"
    echo "  - JWT_SECRET=<32+ character secret>"
    echo "  - DATABASE_URL=<optional, only if using PostgreSQL>"
    echo ""
    echo "Required Vercel Variables:"
    echo "  - VITE_API_URL=${RAILWAY_URL}"
    echo ""
}

print_recommendations() {
    echo ""
    echo -e "${BLUE}💡 Recommendations${NC}"
    echo "-------------------"
    
    if [ $ISSUES -gt 0 ]; then
        echo -e "${RED}❌ Found $ISSUES critical issue(s)${NC}"
        echo ""
        echo "1. Check Railway logs: railway logs"
        echo "2. Verify Railway variables in dashboard"
        echo "3. Verify Vercel environment variables"
        echo "4. Test backend: curl ${RAILWAY_URL}/health"
    else
        echo -e "${GREEN}✅ No critical issues found${NC}"
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️ Found $WARNINGS warning(s)${NC}"
    fi
    
    echo ""
    echo "Next Steps:"
    echo "1. Railway Dashboard: https://railway.app/dashboard"
    echo "2. Vercel Dashboard: https://vercel.com/dashboard"
    echo "3. Check Railway logs: railway logs"
    echo "4. Check Vercel deployments: vercel ls"
}

# Run checks
validate_config
check_railway_cli
check_vercel_cli
check_local_env
test_backend_health
test_backend_cors
test_frontend
print_recommendations

echo ""
if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    exit 0
elif [ $ISSUES -eq 0 ]; then
    echo -e "${YELLOW}⚠️ Some warnings, but no critical issues${NC}"
    exit 0
else
    echo -e "${RED}❌ Found critical issues that need attention${NC}"
    exit 1
fi











