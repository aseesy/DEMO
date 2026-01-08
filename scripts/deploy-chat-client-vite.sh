#!/bin/bash
# Deploy chat-client-vite to Vercel
# This script ensures we ALWAYS deploy to the correct Vercel project

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT_DIR="$PROJECT_ROOT/chat-client-vite"

echo "=================================="
echo "Deploy chat-client-vite to Vercel"
echo "=================================="
echo ""

# Step 1: Validate we're deploying to the correct project
echo -e "${BLUE}Step 1: Validating Vercel project configuration...${NC}"
if [ -f "$PROJECT_ROOT/scripts/validate-vercel-project.sh" ]; then
    cd "$PROJECT_ROOT"
    bash scripts/validate-vercel-project.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Project validation failed! Deployment aborted.${NC}"
        echo ""
        echo "Fix the project configuration before deploying."
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Validation script not found - proceeding with manual check${NC}"
    
    # Manual validation
    VERCEL_CONFIG="$CLIENT_DIR/.vercel/project.json"
    if [ ! -f "$VERCEL_CONFIG" ]; then
        echo -e "${RED}❌ ERROR: Vercel project not linked${NC}"
        echo "Run: cd chat-client-vite && vercel link"
        exit 1
    fi
    
    PROJECT_NAME=$(cat "$VERCEL_CONFIG" | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4)
    if [ "$PROJECT_NAME" != "chat-client-vite" ]; then
        echo -e "${RED}❌ ERROR: Wrong project!${NC}"
        echo "Current: $PROJECT_NAME"
        echo "Expected: chat-client-vite"
        exit 1
    fi
fi

echo ""

# Step 2: Navigate to chat-client-vite directory
echo -e "${BLUE}Step 2: Navigating to chat-client-vite directory...${NC}"
cd "$CLIENT_DIR"

if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ ERROR: vercel.json not found in chat-client-vite/${NC}"
    exit 1
fi

echo -e "${GREEN}✓ In correct directory: $(pwd)${NC}"
echo ""

# Step 3: Verify Vercel CLI is available
echo -e "${BLUE}Step 3: Checking Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ ERROR: Vercel CLI not found${NC}"
    echo "Install with: npm install -g vercel"
    exit 1
fi

if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ ERROR: Not logged in to Vercel${NC}"
    echo "Run: vercel login"
    exit 1
fi

echo -e "${GREEN}✓ Vercel CLI ready${NC}"
echo ""

# Step 4: Show current project configuration
echo -e "${BLUE}Step 4: Current project configuration${NC}"
if [ -f ".vercel/project.json" ]; then
    cat .vercel/project.json
    echo ""
else
    echo -e "${YELLOW}⚠ .vercel/project.json not found${NC}"
    echo "Linking project..."
    vercel link
fi
echo ""

# Step 5: Confirm deployment
echo -e "${YELLOW}Ready to deploy to Vercel${NC}"
echo ""
echo "Project: chat-client-vite"
echo "URL: chat-client-vite-a3vgwwysr-aseesys-projects.vercel.app"
echo ""
read -p "Continue with deployment? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Step 6: Deploy
echo -e "${BLUE}Step 6: Deploying to production...${NC}"
vercel --prod --yes

echo ""
echo -e "${GREEN}=================================="
echo "✅ Deployment Complete!"
echo "=================================="
echo ""
echo "Frontend URL: https://chat-client-vite-a3vgwwysr-aseesys-projects.vercel.app"
echo ""

