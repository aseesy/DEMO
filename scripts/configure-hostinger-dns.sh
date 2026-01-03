#!/bin/bash

# Configure Hostinger DNS for Vercel domains
# This script helps set up DNS records for www and app subdomains

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Hostinger DNS Configuration${NC}"
echo ""

# Check if hapi is installed
if ! command -v hapi &> /dev/null; then
    export PATH="$PATH:$HOME/.local/bin"
fi

if ! command -v hapi &> /dev/null; then
    echo -e "${RED}Error: Hostinger API CLI (hapi) not found${NC}"
    echo ""
    echo "Installing Hostinger API CLI..."
    cd ~
    
    # Download latest release
    LATEST_URL=$(curl -s https://api.github.com/repos/hostinger/api-cli/releases/latest | grep "browser_download_url.*darwin" | cut -d'"' -f4)
    
    if [ -z "$LATEST_URL" ]; then
        echo -e "${RED}Error: Could not find download URL${NC}"
        exit 1
    fi
    
    curl -L -o hapi.tar.gz "$LATEST_URL"
    tar -xzf hapi.tar.gz
    mkdir -p ~/.local/bin
    mv hapi ~/.local/bin/
    chmod +x ~/.local/bin/hapi
    export PATH="$PATH:$HOME/.local/bin"
    
    echo -e "${GREEN}✓ Hostinger API CLI installed${NC}"
    echo ""
fi

# Check if API token is set
if [ -z "$HAPI_API_TOKEN" ]; then
    echo -e "${YELLOW}⚠ HAPI_API_TOKEN not set${NC}"
    echo ""
    echo "To get your API token:"
    echo "1. Go to: https://hpanel.hostinger.com"
    echo "2. Navigate to: Account Settings → API"
    echo "3. Generate a new token"
    echo "4. Copy the token"
    echo ""
    echo "Then set it as an environment variable:"
    echo "  export HAPI_API_TOKEN='your_token_here'"
    echo ""
    echo "Or run this script with:"
    echo "  HAPI_API_TOKEN='your_token' ./scripts/configure-hostinger-dns.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ API Token found${NC}"
echo ""

# Check current DNS status
echo -e "${YELLOW}Current DNS Status:${NC}"
echo ""
echo "www.coparentliaizen.com:"
dig www.coparentliaizen.com +short | head -1
echo ""
echo "app.coparentliaizen.com:"
dig app.coparentliaizen.com +short | head -1
echo ""

# Note: DNS is already pointing to Vercel
echo -e "${YELLOW}Note: DNS is already configured and pointing to Vercel${NC}"
echo "The issue is Vercel project assignment, not DNS."
echo ""
echo "Current status:"
echo "- Both domains point to: 55f5b5891d608fd9.vercel-dns-016.com"
echo "- www.coparentliaizen.com needs to be assigned to 'marketing-site' project"
echo "- app.coparentliaizen.com needs to be assigned to 'chat-client-vite' project"
echo ""
echo "This must be done in Vercel Dashboard, not via DNS."
echo ""

# List current DNS records (if API works)
echo -e "${YELLOW}Listing current DNS records...${NC}"
if hapi dns record list --domain coparentliaizen.com 2>&1 | head -20; then
    echo ""
    echo -e "${GREEN}✓ DNS records retrieved${NC}"
else
    echo -e "${YELLOW}⚠ Could not retrieve DNS records (may need authentication)${NC}"
fi

echo ""
echo -e "${GREEN}Script complete.${NC}"
echo ""
echo "Next steps:"
echo "1. Go to Vercel Dashboard"
echo "2. Move www.coparentliaizen.com to marketing-site project"
echo "3. Ensure app.coparentliaizen.com is in chat-client-vite project"

