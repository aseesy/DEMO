#!/bin/bash
# Vercel Deployment Fix Script
# Ensures proper configuration for frontend deployment

set -e  # Exit on error

echo "=================================="
echo "Vercel Deployment Fix"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "chat-client-vite/vercel.json" ]; then
    echo -e "${RED}Error: Must run from project root (vercel.json should be in chat-client-vite/)${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Verify Vercel CLI is installed and authenticated${NC}"
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI not installed${NC}"
    echo "Install with: npm i -g vercel"
    exit 1
fi

if ! vercel whoami &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI not authenticated. Run 'vercel login' first${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Vercel CLI authenticated${NC}"
echo ""

echo -e "${YELLOW}Step 2: Get Railway backend URL${NC}"
cd /Users/athenasees/Desktop/chat
RAILWAY_URL=$(railway domain 2>&1 | grep "https://" | awk '{print $2}')

if [ -z "$RAILWAY_URL" ]; then
    echo -e "${RED}Error: Could not get Railway URL${NC}"
    echo "Please ensure Railway is deployed first"
    exit 1
fi

echo "Railway Backend URL: $RAILWAY_URL"
echo ""

echo -e "${YELLOW}Step 3: Set Vercel environment variable${NC}"
echo "Setting VITE_API_URL=$RAILWAY_URL"

# Navigate to chat-client-vite for vercel commands
cd chat-client-vite

# Check if variable already exists
if vercel env ls production 2>&1 | grep -q "VITE_API_URL"; then
    echo "Removing existing VITE_API_URL..."
    vercel env rm VITE_API_URL production --yes 2>/dev/null || true
fi

# Add new value
echo "$RAILWAY_URL" | vercel env add VITE_API_URL production

echo -e "${GREEN}✓ VITE_API_URL set to $RAILWAY_URL${NC}"
echo ""

# Return to project root
cd ..

echo -e "${YELLOW}Step 4: Verify vercel.json configuration${NC}"
cat chat-client-vite/vercel.json
echo ""

# Verify vercel.json has correct structure (no cd commands, paths relative to chat-client-vite)
if grep -q "cd chat-client-vite" chat-client-vite/vercel.json; then
    echo -e "${RED}Error: vercel.json should not contain 'cd chat-client-vite' commands${NC}"
    echo -e "${YELLOW}  (Vercel Root Directory is set to chat-client-vite, so paths are already relative)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ vercel.json configuration looks correct${NC}"
echo ""

echo -e "${YELLOW}Step 5: Create .env.production for local testing${NC}"
cat > chat-client-vite/.env.production << EOF
VITE_API_URL=$RAILWAY_URL
EOF
echo -e "${GREEN}✓ Created chat-client-vite/.env.production${NC}"
echo ""

echo -e "${YELLOW}Step 6: Test local build${NC}"
echo "Testing production build locally..."
cd chat-client-vite

# Clean install
echo "Installing dependencies..."
npm ci --quiet

# Build
echo "Building for production..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Build failed - dist directory not created${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"
echo ""

echo -e "${YELLOW}Step 7: Deploy to Vercel${NC}"
cd ..
echo "Deploying to production..."
vercel --prod --yes

echo ""
echo -e "${GREEN}=================================="
echo "Vercel Deployment SUCCESS!"
echo "=================================="
echo ""

# Get Vercel deployment URL
VERCEL_URL="https://coparentliaizen.com"
echo "Frontend URL: $VERCEL_URL"
echo "Backend URL: $RAILWAY_URL"
echo ""

echo -e "${YELLOW}Step 8: Test deployment${NC}"
echo "Waiting 10 seconds for deployment to propagate..."
sleep 10

echo ""
echo "Testing frontend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Frontend is accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ Frontend check failed (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo "Testing CORS..."
CORS_RESPONSE=$(curl -s -H "Origin: $VERCEL_URL" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     "$RAILWAY_URL/api/auth/login")

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✓ CORS is configured correctly${NC}"
else
    echo -e "${YELLOW}⚠ CORS may need verification${NC}"
    echo "Check that FRONTEND_URL in Railway includes: $VERCEL_URL"
fi

echo ""
echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo "URLs:"
echo "  Frontend: $VERCEL_URL"
echo "  Backend:  $RAILWAY_URL"
echo "  Health:   $RAILWAY_URL/health"
echo ""
echo "Next steps:"
echo "1. Test login at $VERCEL_URL"
echo "2. Verify WebSocket connection"
echo "3. Test AI mediation features"
