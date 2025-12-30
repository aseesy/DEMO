#!/bin/bash
# Railway Deployment Fix Script
# Fixes the 502 error by ensuring proper configuration

set -e  # Exit on error

echo "=================================="
echo "Railway Deployment Fix"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "railway.toml" ]; then
    echo -e "${RED}Error: Must run from project root (where railway.toml is)${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Verify Railway CLI is authenticated${NC}"
if ! railway whoami &> /dev/null; then
    echo -e "${RED}Error: Railway CLI not authenticated. Run 'railway login' first${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Railway CLI authenticated${NC}"
echo ""

echo -e "${YELLOW}Step 2: Check current Railway configuration${NC}"
railway status
echo ""

echo -e "${YELLOW}Step 3: Verify all required environment variables are set${NC}"
echo "Checking critical variables..."

REQUIRED_VARS=(
    "NODE_ENV"
    "PORT"
    "DATABASE_URL"
    "JWT_SECRET"
    "FRONTEND_URL"
    "OPENAI_API_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if railway variables | grep -q "^║ $var"; then
        echo -e "${GREEN}✓ $var is set${NC}"
    else
        echo -e "${RED}✗ $var is MISSING${NC}"
        MISSING_VARS+=("$var")
    fi
done
echo ""

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}Error: Missing required environment variables:${NC}"
    printf '%s\n' "${MISSING_VARS[@]}"
    echo ""
    echo -e "${YELLOW}Please set them using:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  railway variables set $var='<value>'"
    done
    exit 1
fi

echo -e "${GREEN}✓ All required environment variables are set${NC}"
echo ""

echo -e "${YELLOW}Step 4: Remove deprecated railway.toml (Railway v2 uses dashboard config)${NC}"
if [ -f "railway.toml" ]; then
    echo "Moving railway.toml to railway.toml.backup..."
    mv railway.toml railway.toml.backup
    echo -e "${GREEN}✓ railway.toml backed up${NC}"
else
    echo -e "${GREEN}✓ railway.toml already removed${NC}"
fi
echo ""

echo -e "${YELLOW}Step 5: Verify chat-server/nixpacks.toml exists${NC}"
if [ ! -f "chat-server/nixpacks.toml" ]; then
    echo -e "${RED}Error: chat-server/nixpacks.toml not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ nixpacks.toml exists in chat-server/${NC}"
cat chat-server/nixpacks.toml
echo ""

echo -e "${YELLOW}Step 6: Instructions for Railway Dashboard Settings${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: You must manually update Railway dashboard settings:${NC}"
echo ""
echo "1. Go to: https://railway.app/project/<your-project-id>"
echo "2. Click on your service (DEMO)"
echo "3. Go to Settings → Build"
echo "4. Set the following:"
echo "   - Root Directory: ${GREEN}chat-server${NC}"
echo "   - Build Command: ${GREEN}(leave empty - uses nixpacks.toml)${NC}"
echo "   - Start Command: ${GREEN}node server.js${NC}"
echo "5. Go to Settings → Deploy"
echo "   - Health Check Path: ${GREEN}/health${NC}"
echo "   - Health Check Timeout: ${GREEN}10000${NC} (10 seconds)"
echo "   - Restart Policy: ${GREEN}ON_FAILURE${NC}"
echo "   - Max Retries: ${GREEN}10${NC}"
echo "6. Click 'Save Changes'"
echo ""
echo -e "${YELLOW}Press ENTER when you've completed the dashboard settings...${NC}"
read -r

echo ""
echo -e "${YELLOW}Step 7: Commit railway.toml removal${NC}"
if [ -f "railway.toml.backup" ]; then
    git add railway.toml.backup
    git add railway.toml 2>/dev/null || true
    git commit -m "fix: Remove railway.toml, use Railway dashboard settings for Root Directory

- Railway v2 deprecated railway.toml in favor of dashboard settings
- Moved railway.toml to railway.toml.backup for reference
- Root Directory must be set to 'chat-server' in Railway dashboard
- Uses nixpacks.toml in chat-server/ for build configuration"
    echo -e "${GREEN}✓ Changes committed${NC}"
else
    echo -e "${YELLOW}No changes to commit${NC}"
fi
echo ""

echo -e "${YELLOW}Step 8: Deploy to Railway${NC}"
echo "Deploying..."
railway up --detach

echo ""
echo -e "${YELLOW}Step 9: Monitor deployment${NC}"
echo "Waiting 10 seconds for deployment to start..."
sleep 10

echo ""
echo "Recent logs:"
railway logs | tail -30

echo ""
echo -e "${YELLOW}Step 10: Test health endpoint${NC}"
echo "Waiting 20 seconds for service to start..."
sleep 20

RAILWAY_URL=$(railway domain 2>&1 | grep "https://" | awk '{print $2}')
echo "Testing: $RAILWAY_URL/health"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/health")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed (HTTP $HTTP_CODE)${NC}"
    echo ""
    echo "Response:"
    curl -s "$RAILWAY_URL/health" | jq .
else
    echo -e "${RED}✗ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo ""
    echo "Recent logs:"
    railway logs | tail -50
    exit 1
fi

echo ""
echo -e "${GREEN}=================================="
echo "Railway Deployment SUCCESS!"
echo "=================================="
echo ""
echo "Backend URL: $RAILWAY_URL"
echo "Health Check: $RAILWAY_URL/health"
echo ""
echo "Next steps:"
echo "1. Update Vercel environment variable VITE_API_URL=$RAILWAY_URL"
echo "2. Deploy Vercel frontend"
echo "3. Test full integration"
