#!/bin/bash
# Complete Vercel and Railway Setup Script
# This script sets up everything from scratch

set -e

echo "🚀 Complete Vercel & Railway Setup"
echo "==================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RAILWAY_URL="https://demo-production-6dcd.up.railway.app"

# Step 1: Verify config files exist
echo -e "${BLUE}📋 Step 1: Verify Config Files${NC}"
echo ""

if [ ! -f "$PROJECT_ROOT/vercel.json" ]; then
    echo -e "${RED}❌ vercel.json not found at root${NC}"
    exit 1
fi
echo -e "${GREEN}✅ vercel.json found${NC}"

if [ ! -f "$PROJECT_ROOT/railway.toml" ]; then
    echo -e "${RED}❌ railway.toml not found at root${NC}"
    exit 1
fi
echo -e "${GREEN}✅ railway.toml found${NC}"

# Step 2: Setup Vercel
echo ""
echo -e "${BLUE}📋 Step 2: Setup Vercel${NC}"
echo ""

if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Install: npm install -g vercel${NC}"
    exit 1
fi

if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged into Vercel${NC}"
    echo -e "${BLUE}   Please run: vercel login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI ready${NC}"

# Link Vercel project from root
echo ""
echo -e "${BLUE}🔗 Linking Vercel project...${NC}"
cd "$PROJECT_ROOT"
vercel link --yes 2>&1 | head -10

# Set Vercel environment variables (from root, since we linked from root)
echo ""
echo -e "${BLUE}🔧 Setting Vercel Environment Variables...${NC}"
cd "$PROJECT_ROOT"

echo -e "${BLUE}  Setting VITE_API_URL for production...${NC}"
echo "$RAILWAY_URL" | vercel env add VITE_API_URL production 2>/dev/null || {
    vercel env rm VITE_API_URL production --yes 2>/dev/null || true
    echo "$RAILWAY_URL" | vercel env add VITE_API_URL production
}

echo -e "${BLUE}  Setting VITE_API_URL for preview...${NC}"
echo "$RAILWAY_URL" | vercel env add VITE_API_URL preview 2>/dev/null || {
    vercel env rm VITE_API_URL preview --yes 2>/dev/null || true
    echo "$RAILWAY_URL" | vercel env add VITE_API_URL preview
}

echo -e "${BLUE}  Setting VITE_API_URL for development...${NC}"
echo "http://localhost:3000" | vercel env add VITE_API_URL development 2>/dev/null || {
    vercel env rm VITE_API_URL development --yes 2>/dev/null || true
    echo "http://localhost:3000" | vercel env add VITE_API_URL development
}

echo -e "${GREEN}✅ Vercel setup complete!${NC}"

# Step 3: Setup Railway
echo ""
echo -e "${BLUE}📋 Step 3: Setup Railway${NC}"
echo ""

if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Install: npm install -g @railway/cli${NC}"
    exit 1
fi

if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged into Railway${NC}"
    echo -e "${BLUE}   Please run: railway login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI ready${NC}"

# Set Railway environment variables
echo ""
echo -e "${BLUE}🔧 Setting Railway Environment Variables...${NC}"
cd "$PROJECT_ROOT"

# Use the dedicated Railway setup script instead of hardcoding secrets here
echo -e "${BLUE}   Running Railway setup script...${NC}"
bash "$PROJECT_ROOT/scripts/set-railway-vars.sh"

echo -e "${GREEN}✅ Railway setup complete!${NC}"

# Step 4: Verification
echo ""
echo -e "${BLUE}📋 Step 4: Verification${NC}"
echo ""

echo -e "${BLUE}Vercel Environment Variables:${NC}"
cd "$PROJECT_ROOT"
vercel env ls 2>/dev/null | grep VITE_API_URL || echo "  ⚠️  Could not fetch"

echo ""
echo -e "${BLUE}Railway Variables:${NC}"
railway variables --kv 2>&1 | grep -E "NODE_ENV|PORT|FRONTEND_URL|JWT_SECRET" | head -5

echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "  1. Commit and push config files:"
echo "     git add vercel.json railway.toml"
echo "     git commit -m 'Add root-level Vercel and Railway configs'"
echo "     git push"
echo ""
echo "  2. Vercel will auto-deploy on push"
echo ""
echo "  3. Railway will use root railway.toml on next deployment"
echo ""
echo "  4. Verify deployments:"
echo "     - Vercel: https://vercel.com/dashboard"
echo "     - Railway: https://railway.app/dashboard"
echo ""

