#!/bin/bash
# Rotate OAuth 2.0 Client Credentials
# Project: genial-aspect-478301-b4

set -e

PROJECT_ID="genial-aspect-478301-b4"
OLD_CLIENT_ID="625150025596-anntpr2du1p5ppktpa516rg8s9ftvqm3.apps.googleusercontent.com"

echo "🔄 Rotating OAuth 2.0 Credentials..."
echo ""

# Get access token
echo "1️⃣ Getting access token..."
ACCESS_TOKEN=$(gcloud auth application-default print-access-token)

# Note: gcloud doesn't have direct commands for OAuth client deletion
# We need to use the Google Cloud Console Web UI or REST API

echo ""
echo "⚠️  OAuth 2.0 credentials must be rotated via Google Cloud Console"
echo ""
echo "📋 Steps to rotate:"
echo ""
echo "1. Visit: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo ""
echo "2. Find OAuth 2.0 Client ID: $OLD_CLIENT_ID"
echo "   (Look for 'Web client' or similar name)"
echo ""
echo "3. Click the trash icon to DELETE it"
echo ""
echo "4. Click '+ CREATE CREDENTIALS' → 'OAuth client ID'"
echo ""
echo "5. Select 'Web application'"
echo ""
echo "6. Name it 'LiaiZen Web Client'"
echo ""
echo "7. Add Authorized JavaScript origins:"
echo "   - http://localhost:5173"
echo "   - http://localhost:3000"
echo "   - https://coparentliaizen.com"
echo "   - https://www.coparentliaizen.com"
echo ""
echo "8. Add Authorized redirect URIs:"
echo "   - http://localhost:5173/auth/google/callback"
echo "   - http://localhost:3000/auth/google/callback"
echo "   - https://coparentliaizen.com/auth/google/callback"
echo "   - https://www.coparentliaizen.com/auth/google/callback"
echo ""
echo "9. Click 'CREATE'"
echo ""
echo "10. COPY the new Client ID and Client Secret"
echo ""
echo "11. Update your .env file with the new credentials"
echo ""
echo "✅ Once complete, run: ./scripts/update-env-oauth.sh <NEW_CLIENT_ID> <NEW_CLIENT_SECRET>"
echo ""
