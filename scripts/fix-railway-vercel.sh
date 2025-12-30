#!/bin/bash
# Fix Railway and Vercel Configuration Issues
# This script fixes the critical configuration problems identified

set -e

echo "🔧 Fixing Railway & Vercel Configuration Issues"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

RAILWAY_URL="https://demo-production-6dcd.up.railway.app"
CORRECT_FRONTEND_URL="https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app"

echo -e "${BLUE}📋 Step 1: Fix Railway FRONTEND_URL${NC}"
echo ""

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Install: npm install -g @railway/cli${NC}"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged into Railway. Run: railway login${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  Current FRONTEND_URL:${NC}"
railway variables --kv | grep FRONTEND_URL || echo "  (not set)"

echo ""
echo -e "${BLUE}🔧 Updating FRONTEND_URL to include Vercel domains...${NC}"
railway variables --set "FRONTEND_URL=${CORRECT_FRONTEND_URL}"

echo ""
echo -e "${GREEN}✅ Railway FRONTEND_URL updated!${NC}"
echo ""

echo -e "${BLUE}📋 Step 2: Set Vercel Environment Variables${NC}"
echo ""

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Install: npm install -g vercel${NC}"
    exit 1
fi

# Navigate to frontend directory
cd "$(dirname "$0")/../chat-client-vite" || exit 1

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged into Vercel. Run: vercel login${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  Current Vercel Environment Variables:${NC}"
vercel env ls 2>/dev/null | grep VITE_API_URL || echo "  (not set)"

echo ""
echo -e "${BLUE}🔧 Setting VITE_API_URL for all environments...${NC}"

# Set for production
echo -e "${BLUE}  Setting for production...${NC}"
echo "${RAILWAY_URL}" | vercel env add VITE_API_URL production 2>/dev/null || {
    echo -e "${YELLOW}  ⚠️  Variable may already exist. Updating...${NC}"
    vercel env rm VITE_API_URL production --yes 2>/dev/null || true
    echo "${RAILWAY_URL}" | vercel env add VITE_API_URL production
}

# Set for preview
echo -e "${BLUE}  Setting for preview...${NC}"
echo "${RAILWAY_URL}" | vercel env add VITE_API_URL preview 2>/dev/null || {
    echo -e "${YELLOW}  ⚠️  Variable may already exist. Updating...${NC}"
    vercel env rm VITE_API_URL preview --yes 2>/dev/null || true
    echo "${RAILWAY_URL}" | vercel env add VITE_API_URL preview
}

# Set for development
echo -e "${BLUE}  Setting for development...${NC}"
echo "http://localhost:3000" | vercel env add VITE_API_URL development 2>/dev/null || {
    echo -e "${YELLOW}  ⚠️  Variable may already exist. Updating...${NC}"
    vercel env rm VITE_API_URL development --yes 2>/dev/null || true
    echo "http://localhost:3000" | vercel env add VITE_API_URL development
}

echo ""
echo -e "${GREEN}✅ Vercel environment variables set!${NC}"
echo ""

echo -e "${BLUE}📋 Step 3: Verification${NC}"
echo ""

echo -e "${BLUE}Verifying Railway FRONTEND_URL...${NC}"
CURRENT_FRONTEND_URL=$(railway variables --kv | grep FRONTEND_URL | awk '{print $2}' || echo "")
if [[ "$CURRENT_FRONTEND_URL" == *"*.vercel.app"* ]]; then
    echo -e "${GREEN}✅ Railway FRONTEND_URL includes Vercel domains${NC}"
else
    echo -e "${RED}❌ Railway FRONTEND_URL may not include Vercel domains${NC}"
    echo -e "${YELLOW}   Current: ${CURRENT_FRONTEND_URL}${NC}"
fi

echo ""
echo -e "${BLUE}Verifying Vercel VITE_API_URL...${NC}"
VERCEL_ENV_COUNT=$(vercel env ls 2>/dev/null | grep -c VITE_API_URL || echo "0")
if [ "$VERCEL_ENV_COUNT" -ge 1 ]; then
    echo -e "${GREEN}✅ Vercel VITE_API_URL is set (${VERCEL_ENV_COUNT} environment(s))${NC}"
else
    echo -e "${RED}❌ Vercel VITE_API_URL not found${NC}"
fi

echo ""
echo -e "${BLUE}📋 Step 4: Next Steps${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Manual Steps Required${NC}"
echo ""
echo "1. ${BLUE}Vercel Root Directory${NC}:"
echo "   - Go to: https://vercel.com/dashboard"
echo "   - Open your project"
echo "   - Settings → General → Root Directory"
echo "   - Set to: ${GREEN}chat-client-vite${NC}"
echo "   - Save and redeploy"
echo ""
echo "2. ${BLUE}Railway Service Status${NC}:"
echo "   - Check Railway backend is running: ${GREEN}curl ${RAILWAY_URL}/health${NC}"
echo "   - If down, check Railway logs: ${GREEN}railway logs${NC}"
echo ""
echo "3. ${BLUE}Redeploy Vercel${NC}:"
echo "   - After setting root directory, trigger redeploy"
echo "   - Or push a commit to trigger auto-deploy"
echo ""
echo -e "${GREEN}✅ Configuration fixes applied!${NC}"
echo ""

