#!/bin/bash
# Update .env with new OAuth credentials
# Usage: ./scripts/update-env-oauth.sh <NEW_CLIENT_ID> <NEW_CLIENT_SECRET>

set -e

if [ $# -ne 2 ]; then
    echo "❌ Error: Missing arguments"
    echo ""
    echo "Usage: $0 <NEW_CLIENT_ID> <NEW_CLIENT_SECRET>"
    echo ""
    echo "Example:"
    echo "  $0 '123456789-abc.apps.googleusercontent.com' 'GOCSPX-xyz123'"
    exit 1
fi

NEW_CLIENT_ID="$1"
NEW_CLIENT_SECRET="$2"
ENV_FILE="/Users/athenasees/Desktop/chat/chat-server/.env"

echo "🔄 Updating OAuth credentials in .env..."
echo ""

# Backup existing .env
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created: ${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Update GOOGLE_CLIENT_ID
if grep -q "^GOOGLE_CLIENT_ID=" "$ENV_FILE"; then
    sed -i '' "s|^GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$NEW_CLIENT_ID|" "$ENV_FILE"
    echo "✅ Updated GOOGLE_CLIENT_ID"
else
    echo "GOOGLE_CLIENT_ID=$NEW_CLIENT_ID" >> "$ENV_FILE"
    echo "✅ Added GOOGLE_CLIENT_ID"
fi

# Update GOOGLE_CLIENT_SECRET
if grep -q "^GOOGLE_CLIENT_SECRET=" "$ENV_FILE"; then
    sed -i '' "s|^GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$NEW_CLIENT_SECRET|" "$ENV_FILE"
    echo "✅ Updated GOOGLE_CLIENT_SECRET"
else
    echo "GOOGLE_CLIENT_SECRET=$NEW_CLIENT_SECRET" >> "$ENV_FILE"
    echo "✅ Added GOOGLE_CLIENT_SECRET"
fi

# Also update OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET (legacy compatibility)
if grep -q "^OAUTH_CLIENT_ID=" "$ENV_FILE"; then
    sed -i '' "s|^OAUTH_CLIENT_ID=.*|OAUTH_CLIENT_ID=$NEW_CLIENT_ID|" "$ENV_FILE"
    echo "✅ Updated OAUTH_CLIENT_ID (legacy)"
fi

if grep -q "^OAUTH_CLIENT_SECRET=" "$ENV_FILE"; then
    sed -i '' "s|^OAUTH_CLIENT_SECRET=.*|OAUTH_CLIENT_SECRET=$NEW_CLIENT_SECRET|" "$ENV_FILE"
    echo "✅ Updated OAUTH_CLIENT_SECRET (legacy)"
fi

echo ""
echo "✅ OAuth credentials updated successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Verify: cat $ENV_FILE | grep GOOGLE_CLIENT"
echo "  2. Set in Railway: railway variables set GOOGLE_CLIENT_ID='$NEW_CLIENT_ID'"
echo "  3. Set in Railway: railway variables set GOOGLE_CLIENT_SECRET='$NEW_CLIENT_SECRET'"
echo "  4. Restart services: npm run restart"
echo ""
