#!/bin/bash
# Sync environment variables from local .env to Railway
# Reads values from chat-server/.env and sets them in Railway

set -e

echo "🚂 Syncing Environment Variables to Railway..."
echo ""

# Check if logged in
railway whoami > /dev/null 2>&1 || {
    echo "❌ Not logged into Railway. Run: railway login"
    exit 1
}

echo "✅ Authenticated with Railway"
echo ""

# Navigate to chat-server directory
cd "$(dirname "$0")/../chat-server"

if [ ! -f ".env" ]; then
    echo "❌ .env file not found in chat-server directory"
    exit 1
fi

echo "📖 Reading variables from chat-server/.env..."
echo ""

# Build array of --set arguments for single Railway command
# This prevents Railway from redeploying after each variable
RAILWAY_VARS=()

# Function to add variable to array
add_var() {
    local key=$1
    local value=$2
    
    if [ -z "$value" ]; then
        echo "⚠️  Skipping $key (empty value)"
        return
    fi
    
    # Escape value properly for Railway CLI
    # Replace single quotes with '\'' for shell escaping
    local escaped_value=$(printf '%s' "$value" | sed "s/'/'\\\\''/g")
    RAILWAY_VARS+=("--set" "${key}=${escaped_value}")
    echo "✓ Prepared $key"
}

echo "🔧 Preparing variables..."

# Required variables
JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
if [ -n "$JWT_SECRET" ]; then
    add_var "JWT_SECRET" "$JWT_SECRET"
else
    echo "❌ JWT_SECRET not found in .env"
    exit 1
fi

# NODE_ENV (required - use production for Railway)
add_var "NODE_ENV" "production"

# FRONTEND_URL (required)
FRONTEND_URL=$(grep "^FRONTEND_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
if [ -n "$FRONTEND_URL" ]; then
    # Replace localhost URLs with production URLs
    FRONTEND_URL=$(echo "$FRONTEND_URL" | sed 's|http://localhost:[0-9]*|https://coparentliaizen.com|g')
    add_var "FRONTEND_URL" "$FRONTEND_URL"
else
    echo "⚠️  FRONTEND_URL not found, using default"
    add_var "FRONTEND_URL" "https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app"
fi

# Optional variables
APP_NAME=$(grep "^APP_NAME=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$APP_NAME" ] && add_var "APP_NAME" "$APP_NAME"

APP_URL=$(grep "^APP_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$APP_URL" ] && add_var "APP_URL" "$APP_URL"

EMAIL_SERVICE=$(grep "^EMAIL_SERVICE=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$EMAIL_SERVICE" ] && add_var "EMAIL_SERVICE" "$EMAIL_SERVICE"

GMAIL_USER=$(grep "^GMAIL_USER=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$GMAIL_USER" ] && add_var "GMAIL_USER" "$GMAIL_USER"

GMAIL_APP_PASSWORD=$(grep "^GMAIL_APP_PASSWORD=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$GMAIL_APP_PASSWORD" ] && add_var "GMAIL_APP_PASSWORD" "$GMAIL_APP_PASSWORD"

EMAIL_FROM=$(grep "^EMAIL_FROM=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$EMAIL_FROM" ] && add_var "EMAIL_FROM" "$EMAIL_FROM"

OPENAI_API_KEY=$(grep "^OPENAI_API_KEY=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$OPENAI_API_KEY" ] && add_var "OPENAI_API_KEY" "$OPENAI_API_KEY"

ANTHROPIC_API_KEY=$(grep "^ANTHROPIC_API_KEY=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$ANTHROPIC_API_KEY" ] && add_var "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY"

NEO4J_URI=$(grep "^NEO4J_URI=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$NEO4J_URI" ] && add_var "NEO4J_URI" "$NEO4J_URI"

NEO4J_USER=$(grep "^NEO4J_USER=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$NEO4J_USER" ] && add_var "NEO4J_USER" "$NEO4J_USER"

NEO4J_PASSWORD=$(grep "^NEO4J_PASSWORD=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$NEO4J_PASSWORD" ] && add_var "NEO4J_PASSWORD" "$NEO4J_PASSWORD"

NEO4J_DATABASE=$(grep "^NEO4J_DATABASE=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$NEO4J_DATABASE" ] && add_var "NEO4J_DATABASE" "$NEO4J_DATABASE"

GOOGLE_CLIENT_ID=$(grep "^GOOGLE_CLIENT_ID=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$GOOGLE_CLIENT_ID" ] && add_var "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID"

GOOGLE_CLIENT_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$GOOGLE_CLIENT_SECRET" ] && add_var "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"

OAUTH_CLIENT_ID=$(grep "^OAUTH_CLIENT_ID=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$OAUTH_CLIENT_ID" ] && add_var "OAUTH_CLIENT_ID" "$OAUTH_CLIENT_ID"

OAUTH_CLIENT_SECRET=$(grep "^OAUTH_CLIENT_SECRET=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$OAUTH_CLIENT_SECRET" ] && add_var "OAUTH_CLIENT_SECRET" "$OAUTH_CLIENT_SECRET"

GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$GITHUB_TOKEN" ] && add_var "GITHUB_TOKEN" "$GITHUB_TOKEN"

MCP_SERVICE_TOKEN=$(grep "^MCP_SERVICE_TOKEN=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
[ -n "$MCP_SERVICE_TOKEN" ] && add_var "MCP_SERVICE_TOKEN" "$MCP_SERVICE_TOKEN"

echo ""
echo "🚀 Setting all variables in Railway (single command to prevent multiple redeploys)..."
echo ""

# Set all variables in one command - Railway will only redeploy once
if railway variables "${RAILWAY_VARS[@]}"; then
    echo ""
    echo "✅ All Railway variables set successfully in a single operation!"
    echo "   Railway will redeploy once with all new variables."
else
    echo ""
    echo "❌ Failed to set Railway variables"
    exit 1
fi

echo ""
echo "✅ Railway variables synced successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Verify variables: npm run validate:railway"
echo "  2. Check Railway dashboard: https://railway.app"
echo "  3. Railway will automatically redeploy with new variables"
echo ""

