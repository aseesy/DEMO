#!/bin/bash

# Railway Environment Variables Setup Script
# Sets all required environment variables for deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "Railway Environment Setup"
echo "========================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}✗ Railway CLI not installed${NC}"
    echo ""
    echo "Install with: npm i -g @railway/cli"
    echo "Or: brew install railway"
    exit 1
fi

echo -e "${GREEN}✓ Railway CLI found${NC}"
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠ Not logged in to Railway${NC}"
    echo "Running: railway login"
    railway login
fi

echo -e "${GREEN}✓ Logged in to Railway${NC}"
echo ""

# Function to set variable with confirmation
set_var() {
    local var_name=$1
    local var_value=$2
    local is_secret=$3

    if [ "$is_secret" = "true" ]; then
        echo -n "Setting $var_name... "
    else
        echo -n "Setting $var_name=$var_value... "
    fi

    if railway variables set "$var_name=$var_value" &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        return 1
    fi
}

# Function to prompt for value
prompt_var() {
    local var_name=$1
    local var_description=$2
    local var_default=$3
    local is_secret=$4

    echo ""
    echo -e "${BLUE}$var_name${NC}"
    echo "Description: $var_description"

    if [ -n "$var_default" ]; then
        echo "Default: $var_default"
    fi

    if [ "$is_secret" = "true" ]; then
        read -s -p "Enter value (hidden): " var_value
        echo ""
    else
        read -p "Enter value: " var_value
    fi

    # Use default if empty
    if [ -z "$var_value" ] && [ -n "$var_default" ]; then
        var_value="$var_default"
    fi

    echo "$var_value"
}

echo "This script will set up all required environment variables."
echo "You can skip optional variables by pressing Enter."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "========================================="
echo "Critical Variables"
echo "========================================="

# NODE_ENV
NODE_ENV=$(prompt_var "NODE_ENV" "Node environment" "production" false)
set_var "NODE_ENV" "$NODE_ENV" false

# PORT
PORT=$(prompt_var "PORT" "Server port" "8080" false)
set_var "PORT" "$PORT" false

# JWT_SECRET
echo ""
echo -e "${YELLOW}⚠ JWT_SECRET must be at least 32 characters${NC}"
JWT_SECRET=$(prompt_var "JWT_SECRET" "JWT signing secret (min 32 chars)" "" true)

# Validate JWT_SECRET length
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}✗ JWT_SECRET must be at least 32 characters${NC}"
    echo "Generating random secret..."
    JWT_SECRET=$(openssl rand -base64 32)
    echo -e "${GREEN}✓ Generated secure JWT_SECRET${NC}"
fi
set_var "JWT_SECRET" "$JWT_SECRET" true

echo ""
echo "========================================="
echo "CORS Configuration"
echo "========================================="

# FRONTEND_URL
FRONTEND_URL=$(prompt_var "FRONTEND_URL" "Allowed frontend URLs (comma-separated)" "https://coparentliaizen.com,https://www.coparentliaizen.com" false)
set_var "FRONTEND_URL" "$FRONTEND_URL" false

echo ""
echo "========================================="
echo "AI Services"
echo "========================================="

# OPENAI_API_KEY
OPENAI_API_KEY=$(prompt_var "OPENAI_API_KEY" "OpenAI API key (required for AI mediation)" "" true)
if [ -n "$OPENAI_API_KEY" ]; then
    set_var "OPENAI_API_KEY" "$OPENAI_API_KEY" true
else
    echo -e "${YELLOW}⚠ Skipping OPENAI_API_KEY - AI features will not work${NC}"
fi

# ANTHROPIC_API_KEY (optional)
read -p "Configure Anthropic API? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ANTHROPIC_API_KEY=$(prompt_var "ANTHROPIC_API_KEY" "Anthropic API key (optional)" "" true)
    if [ -n "$ANTHROPIC_API_KEY" ]; then
        set_var "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY" true
    fi
fi

echo ""
echo "========================================="
echo "Email Service"
echo "========================================="

# Email configuration
read -p "Configure email service? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    GMAIL_USER=$(prompt_var "GMAIL_USER" "Gmail address" "info@liaizen.com" false)
    set_var "GMAIL_USER" "$GMAIL_USER" false

    GMAIL_APP_PASSWORD=$(prompt_var "GMAIL_APP_PASSWORD" "Gmail App Password" "" true)
    if [ -n "$GMAIL_APP_PASSWORD" ]; then
        set_var "GMAIL_APP_PASSWORD" "$GMAIL_APP_PASSWORD" true
    fi

    EMAIL_FROM=$(prompt_var "EMAIL_FROM" "Email 'From' address" "$GMAIL_USER" false)
    set_var "EMAIL_FROM" "$EMAIL_FROM" false

    APP_NAME=$(prompt_var "APP_NAME" "Application name" "LiaiZen" false)
    set_var "APP_NAME" "$APP_NAME" false
fi

echo ""
echo "========================================="
echo "Neo4j (Optional)"
echo "========================================="

# Neo4j configuration
read -p "Configure Neo4j graph database? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    NEO4J_URI=$(prompt_var "NEO4J_URI" "Neo4j connection URI" "" false)
    if [ -n "$NEO4J_URI" ]; then
        set_var "NEO4J_URI" "$NEO4J_URI" false

        NEO4J_USER=$(prompt_var "NEO4J_USER" "Neo4j username" "neo4j" false)
        set_var "NEO4J_USER" "$NEO4J_USER" false

        NEO4J_PASSWORD=$(prompt_var "NEO4J_PASSWORD" "Neo4j password" "" true)
        set_var "NEO4J_PASSWORD" "$NEO4J_PASSWORD" true
    fi
fi

echo ""
echo "========================================="
echo "Summary"
echo "========================================="

echo ""
echo "Environment variables have been set."
echo "Verifying configuration..."
echo ""

# Show current variables (without secrets)
railway variables | grep -E "NODE_ENV|PORT|FRONTEND_URL|DATABASE_URL"

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify DATABASE_URL is set (auto-added by PostgreSQL plugin)"
echo "  2. Deploy: railway up"
echo "  3. Check logs: railway logs --tail"
echo "  4. Verify deployment: ./scripts/verify-deployments.sh"
echo ""
echo "Note: DATABASE_URL is automatically set when you add the PostgreSQL plugin"
echo "in the Railway dashboard. If not set, add it via Dashboard → Plugins → PostgreSQL"
