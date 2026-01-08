#!/bin/bash
# AI Deployment Wrapper
# This script is for AI assistants to use when deploying to Vercel
# It automatically runs validation and ensures correct project

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=================================="
echo "AI Deployment to Vercel"
echo "=================================="
echo ""
echo -e "${BLUE}This script ensures correct Vercel project deployment.${NC}"
echo ""

# Step 1: Validate project configuration
echo -e "${BLUE}Step 1: Validating Vercel project...${NC}"
if [ -f "$PROJECT_ROOT/scripts/validate-vercel-project.sh" ]; then
    cd "$PROJECT_ROOT"
    bash scripts/validate-vercel-project.sh
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}❌ Validation failed! Deployment aborted.${NC}"
        echo ""
        echo "Fix the project configuration before deploying:"
        echo "  1. cd chat-client-vite"
        echo "  2. vercel link"
        echo "  3. Select: chat-client-vite"
        echo "  4. Run validation again"
        exit 1
    fi
else
    echo -e "${RED}❌ Validation script not found!${NC}"
    exit 1
fi

echo ""

# Step 2: Deploy using safe script
echo -e "${BLUE}Step 2: Deploying to Vercel...${NC}"
if [ -f "$PROJECT_ROOT/scripts/deploy-chat-client-vite.sh" ]; then
    cd "$PROJECT_ROOT"
    bash scripts/deploy-chat-client-vite.sh
else
    echo -e "${YELLOW}⚠ Safe deployment script not found.${NC}"
    echo "Falling back to manual deployment with validation..."
    echo ""
    
    cd "$PROJECT_ROOT/chat-client-vite"
    
    # Verify we're in correct directory
    if [ ! -f "vercel.json" ]; then
        echo -e "${RED}❌ ERROR: Not in chat-client-vite directory!${NC}"
        exit 1
    fi
    
    # Show current project
    if [ -f ".vercel/project.json" ]; then
        echo "Current project configuration:"
        cat .vercel/project.json
        echo ""
    fi
    
    # Deploy
    echo "Deploying to production..."
    vercel --prod --yes
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""

