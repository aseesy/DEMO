#!/bin/bash
# Master script to rotate ALL compromised secrets
# Run this interactively to rotate everything

set -e

echo "🚨 SECRET ROTATION WIZARD"
echo "========================"
echo ""
echo "This script will help you rotate all compromised credentials."
echo "You'll need access to:"
echo "  - OpenAI Platform"
echo "  - Google Account (Gmail App Passwords)"
echo "  - GitHub Settings"
echo "  - Railway Dashboard"
echo "  - Neo4j Aura Console"
echo ""
read -p "Press ENTER to continue..."
echo ""

# 1. OAuth 2.0 (already handled above)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  OAUTH 2.0 CREDENTIALS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Instructions already provided via: ./scripts/rotate-oauth.sh"
echo ""
read -p "Have you completed OAuth rotation? (y/n): " oauth_done
echo ""

# 2. OpenAI API Key
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  OPENAI API KEY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Visit: https://platform.openai.com/api-keys"
echo ""
echo "Steps:"
echo "  1. Click 'Delete' on key: sk-proj-3SQH2M0cHQKmm..."
echo "  2. Click '+ Create new secret key'"
echo "  3. Name it: 'LiaiZen Production'"
echo "  4. Copy the new key (starts with sk-)"
echo ""
read -p "Paste new OpenAI API key: " new_openai_key
echo ""

# 3. Gmail App Password
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  GMAIL APP PASSWORD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Visit: https://myaccount.google.com/apppasswords"
echo ""
echo "Steps:"
echo "  1. Find 'LiaiZen' app password"
echo "  2. Click 'Revoke'"
echo "  3. Click 'Generate new app password'"
echo "  4. Select app: 'Mail', device: 'Other (Custom name)'"
echo "  5. Name it: 'LiaiZen Server'"
echo "  6. Copy the 16-character password (no spaces)"
echo ""
read -p "Paste new Gmail app password: " new_gmail_password
echo ""

# 4. GitHub Token
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  GITHUB TOKEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Visit: https://github.com/settings/tokens"
echo ""
echo "Steps:"
echo "  1. Find token: [YOUR_GITHUB_TOKEN]"
echo "  2. Click 'Delete'"
echo "  3. Click 'Generate new token (classic)'"
echo "  4. Name it: 'LiaiZen MCP Service'"
echo "  5. Select scopes: 'repo' (if for private repos)"
echo "  6. Click 'Generate token'"
echo "  7. Copy the new token (starts with ghp_)"
echo ""
read -p "Paste new GitHub token: " new_github_token
echo ""

# 5. JWT Secret
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  JWT SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Generating new JWT secret..."
new_jwt_secret=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "✅ Generated: $new_jwt_secret"
echo ""

# 6. Neo4j Password
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  NEO4J PASSWORD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Visit: https://console.neo4j.io"
echo ""
echo "Steps:"
echo "  1. Find your database: 9173a337.databases.neo4j.io"
echo "  2. Click 'Reset password'"
echo "  3. Copy the new password"
echo ""
read -p "Paste new Neo4j password: " new_neo4j_password
echo ""

# 7. Railway Database (handled by Railway)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  RAILWAY DATABASE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Visit: https://railway.app/project/your-project"
echo ""
echo "⚠️  Railway manages DATABASE_URL automatically."
echo "    If you need to rotate, delete and recreate the PostgreSQL service."
echo ""
read -p "Keep current Railway database? (y/n): " keep_railway_db
echo ""

# Update .env file
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 UPDATING .ENV FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ENV_FILE="/Users/athenasees/Desktop/chat/chat-server/.env"

# Backup
BACKUP_FILE="${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$ENV_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Update each secret
sed -i '' "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$new_openai_key|" "$ENV_FILE"
sed -i '' "s|^GMAIL_APP_PASSWORD=.*|GMAIL_APP_PASSWORD=$new_gmail_password|" "$ENV_FILE"
sed -i '' "s|^GITHUB_TOKEN=.*|GITHUB_TOKEN=$new_github_token|" "$ENV_FILE"
sed -i '' "s|^MCP_SERVICE_TOKEN=.*|MCP_SERVICE_TOKEN=$new_github_token|" "$ENV_FILE"
sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=$new_jwt_secret|" "$ENV_FILE"
sed -i '' "s|^NEO4J_PASSWORD=.*|NEO4J_PASSWORD=$new_neo4j_password|" "$ENV_FILE"

echo "✅ All secrets updated in .env file"
echo ""

# Generate Railway commands
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚂 RAILWAY VARIABLE UPDATES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Run these commands to update Railway:"
echo ""
echo "railway variables set OPENAI_API_KEY='$new_openai_key'"
echo "railway variables set GMAIL_APP_PASSWORD='$new_gmail_password'"
echo "railway variables set GITHUB_TOKEN='$new_github_token'"
echo "railway variables set JWT_SECRET='$new_jwt_secret'"
echo "railway variables set NEO4J_PASSWORD='$new_neo4j_password'"
echo ""

# Save commands to file
cat > /Users/athenasees/Desktop/chat/scripts/railway-update-secrets.sh << EOF
#!/bin/bash
# Auto-generated Railway secret update commands
railway variables set OPENAI_API_KEY='$new_openai_key'
railway variables set GMAIL_APP_PASSWORD='$new_gmail_password'
railway variables set GITHUB_TOKEN='$new_github_token'
railway variables set JWT_SECRET='$new_jwt_secret'
railway variables set NEO4J_PASSWORD='$new_neo4j_password'
EOF

chmod +x /Users/athenasees/Desktop/chat/scripts/railway-update-secrets.sh

echo "✅ Commands saved to: scripts/railway-update-secrets.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SECRET ROTATION COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next steps:"
echo "  1. Run: ./scripts/railway-update-secrets.sh"
echo "  2. Restart your local server: npm run restart"
echo "  3. Test authentication and API calls"
echo "  4. Deploy to Railway: railway up"
echo ""
