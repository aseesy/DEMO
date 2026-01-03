#!/bin/bash

# Deploy Marketing Site to Vercel
# This script helps deploy the marketing site using Vercel CLI

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Marketing Site Vercel Deployment${NC}"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
    echo -e "${GREEN}✓ Vercel CLI installed${NC}"
fi

# Navigate to marketing site directory
cd "$(dirname "$0")/../marketing-site"

echo -e "${YELLOW}Current directory: $(pwd)${NC}"
echo ""

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Vercel. Please log in...${NC}"
    vercel login
fi

echo -e "${GREEN}✓ Logged in to Vercel${NC}"
echo ""

# Check if project is linked
if [ ! -f ".vercel/project.json" ]; then
    echo -e "${YELLOW}Project not linked. Linking...${NC}"
    vercel link
    echo -e "${GREEN}✓ Project linked${NC}"
else
    echo -e "${GREEN}✓ Project already linked${NC}"
fi

echo ""

# Check environment variable
echo -e "${YELLOW}Checking environment variables...${NC}"
if ! vercel env ls | grep -q "VITE_API_URL"; then
    echo -e "${YELLOW}Environment variable VITE_API_URL not found. Adding...${NC}"
    echo -e "${YELLOW}Enter the backend API URL (default: https://demo-production-6dcd.up.railway.app):${NC}"
    read -r API_URL
    API_URL=${API_URL:-https://demo-production-6dcd.up.railway.app}
    
    echo "$API_URL" | vercel env add VITE_API_URL production
    echo "$API_URL" | vercel env add VITE_API_URL preview
    echo "$API_URL" | vercel env add VITE_API_URL development
    echo -e "${GREEN}✓ Environment variable added${NC}"
else
    echo -e "${GREEN}✓ Environment variable already exists${NC}"
fi

echo ""

# Deploy
echo -e "${YELLOW}Deploying to production...${NC}"
vercel --prod

echo ""
echo -e "${GREEN}=================================="
echo "Deployment Complete!"
echo "=================================="
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Go to Vercel Dashboard"
echo "2. Find your project: liaizen-marketing"
echo "3. Go to Settings → Domains"
echo "4. Add domain: www.coparentliaizen.com"
echo "5. Follow DNS configuration instructions"
echo ""

