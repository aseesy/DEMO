#!/bin/bash
# Script to link Railway to positive-recreation service
# Usage: ./scripts/link-railway-service.sh

set -e

echo "🔗 Linking Railway to positive-recreation service..."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm i -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "⚠️  Not logged in to Railway. Please run:"
    echo "   railway login"
    exit 1
fi

echo "✅ Railway CLI is ready"
echo ""

# Navigate to chat-server directory
cd "$(dirname "$0")/../chat-server"

echo "📋 Linking to Railway project..."
echo "   Project: LiaiZen Demo (6e885f2a-9248-4b5b-ab3c-242f2caa1e2a)"
echo "   Service: positive-recreation"
echo ""

# Link to project
echo "Step 1: Linking to project..."
railway link --project 6e885f2a-9248-4b5b-ab3c-242f2caa1e2a

# Link to service
echo ""
echo "Step 2: Linking to service..."
railway service positive-recreation

echo ""
echo "✅ Linked to positive-recreation service!"
echo ""
echo "📝 Verify with: railway status"
echo ""

