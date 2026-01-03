#!/bin/bash

# Fix Vercel Project Settings
# This script provides instructions and attempts to fix common Vercel configuration issues

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Vercel Project Settings Fix${NC}"
echo ""

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    export PATH="$PATH:$(npm config get prefix)/bin"
fi

if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI not found${NC}"
    echo "Install with: npm install -g vercel"
    exit 1
fi

echo -e "${GREEN}✓ Vercel CLI found${NC}"
echo ""

# Main App Project
echo -e "${YELLOW}Main App Project (chat-client-vite)${NC}"
cd "$(dirname "$0")/../chat-client-vite"

if [ -f ".vercel/project.json" ]; then
    echo -e "${GREEN}✓ Project linked${NC}"
    PROJECT_NAME=$(cat .vercel/project.json | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4)
    echo "  Project: $PROJECT_NAME"
else
    echo -e "${YELLOW}⚠ Project not linked${NC}"
    echo "  Run: vercel link"
fi

echo ""
echo -e "${YELLOW}⚠ IMPORTANT: Root Directory must be set in Vercel Dashboard${NC}"
echo ""
echo "To fix Root Directory:"
echo "1. Go to: https://vercel.com/aseesys-projects/chat-client-vite/settings"
echo "2. Find 'Root Directory' section"
echo "3. Change to: chat-client-vite"
echo "4. Save"
echo ""

# Marketing Site Project
echo -e "${YELLOW}Marketing Site Project${NC}"
cd "$(dirname "$0")/../marketing-site"

if [ -f ".vercel/project.json" ]; then
    echo -e "${GREEN}✓ Project linked${NC}"
    PROJECT_NAME=$(cat .vercel/project.json | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4)
    echo "  Project: $PROJECT_NAME"
else
    echo -e "${YELLOW}⚠ Project not linked${NC}"
fi

echo ""
echo -e "${YELLOW}Domain Configuration${NC}"
echo ""
echo "To move www.coparentliaizen.com:"
echo "1. Go to Vercel Dashboard: https://vercel.com/dashboard"
echo "2. Find the project that has www.coparentliaizen.com"
echo "3. Remove the domain from that project"
echo "4. Add it to the marketing-site project"
echo ""

echo -e "${GREEN}Script complete. Follow the instructions above to complete the setup.${NC}"

