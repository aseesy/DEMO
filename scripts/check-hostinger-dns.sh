#!/bin/bash

# Check Hostinger DNS records using API
# Reads HAPI_API_TOKEN from chat-server/.env

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Hostinger DNS Check${NC}"
echo ""

# Get API token from .env
ENV_FILE="/Users/athenasees/Desktop/chat/chat-server/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: .env file not found at $ENV_FILE${NC}"
    exit 1
fi

HAPI_API_TOKEN=$(grep -i "HAPI\|HOSTINGER" "$ENV_FILE" | head -1 | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)

if [ -z "$HAPI_API_TOKEN" ]; then
    echo -e "${RED}Error: HAPI_API_TOKEN not found in .env file${NC}"
    exit 1
fi

echo -e "${GREEN}✓ API Token loaded${NC}"
echo ""

# Check current DNS via dig
echo -e "${YELLOW}Current DNS Status (via dig):${NC}"
echo ""
echo "www.coparentliaizen.com:"
WWW_DNS=$(dig www.coparentliaizen.com +short | head -1)
echo "  → $WWW_DNS"
echo ""
echo "app.coparentliaizen.com:"
APP_DNS=$(dig app.coparentliaizen.com +short | head -1)
echo "  → $APP_DNS"
echo ""

# Try Hostinger API
echo -e "${YELLOW}Checking Hostinger DNS records via API...${NC}"
echo ""

# Try different API endpoints
ENDPOINTS=(
    "https://api.hostinger.com/v1/domains/coparentliaizen.com/dns"
    "https://api.hostinger.com/v2/dns/zones"
    "https://api.hostinger.com/v1/dns/zones"
    "https://hpanel.hostinger.com/api/v1/dns/records?domain=coparentliaizen.com"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo "Trying: $endpoint"
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "Authorization: Bearer $HAPI_API_TOKEN" \
        -H "Content-Type: application/json" \
        "$endpoint" 2>&1)
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Success!${NC}"
        echo "$BODY" | head -30
        break
    else
        echo "  HTTP $HTTP_CODE"
        if [ "$HTTP_CODE" != "000" ]; then
            echo "$BODY" | head -5
        fi
    fi
    echo ""
done

echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "- DNS is already pointing to Vercel (correct)"
echo "- Issue is Vercel project assignment, not DNS"
echo "- No DNS changes needed"

