#!/bin/bash
# Set all environment variables in Railway
# Generated: 2025-12-29
# Updated syntax for Railway CLI v4.15.0+

set -e

echo "🚂 Setting Railway Environment Variables..."
echo ""

# Check if logged in
railway whoami > /dev/null 2>&1 || {
    echo "❌ Not logged into Railway. Run: railway login"
    exit 1
}

echo "📦 Setting all variables..."
echo ""

# Set all variables in one go
railway variables \
  --set "NODE_ENV=production" \
  --set "PORT=3000" \
  --set "FRONTEND_URL=https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app" \
  --set "APP_NAME=LiaiZen" \
  --set "APP_URL=https://coparentliaizen.com" \
  --set "JWT_SECRET=[YOUR_JWT_SECRET]" \
  --set "OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]" \
  --set "EMAIL_SERVICE=gmail" \
  --set "GMAIL_USER=[YOUR_GMAIL_USER]" \
  --set "GMAIL_APP_PASSWORD=[YOUR_GMAIL_APP_PASSWORD]" \
  --set "EMAIL_FROM=[YOUR_EMAIL_FROM]" \
  --set "GOOGLE_CLIENT_ID=[YOUR_GOOGLE_CLIENT_ID]" \
  --set "GOOGLE_CLIENT_SECRET=[YOUR_GOOGLE_CLIENT_SECRET]" \
  --set "OAUTH_CLIENT_ID=[YOUR_OAUTH_CLIENT_ID]" \
  --set "OAUTH_CLIENT_SECRET=[YOUR_OAUTH_CLIENT_SECRET]" \
  --set "GITHUB_TOKEN=[YOUR_GITHUB_TOKEN]" \
  --set "MCP_SERVICE_TOKEN=[YOUR_MCP_SERVICE_TOKEN]" \
  --set "NEO4J_URI=neo4j+s://9173a337.databases.neo4j.io" \
  --set "NEO4J_USER=neo4j" \
  --set "NEO4J_PASSWORD=ICB8k-aP389rQRbRVqxBeBcJ9R6crmzkDK2vU_JaUCU" \
  --set "NEO4J_DATABASE=neo4j"

echo ""
echo "✅ Railway variables set successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Verify variables: railway variables --kv"
echo "  2. Deploy: railway up"
echo "  3. Check logs: railway logs"
echo "  4. Test health endpoint: curl https://demo-production-6dcd.up.railway.app/health"
echo ""
