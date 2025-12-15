#!/bin/bash
# Script to set Neo4j environment variables in Railway
# Usage: ./scripts/setup-neo4j-railway.sh

set -e

echo "🔧 Setting up Neo4j in Railway..."
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

# Read Neo4j config from local .env
cd "$(dirname "$0")/../chat-server"
source <(grep -E '^NEO4J_' .env 2>/dev/null || echo "")

if [ -z "$NEO4J_URI" ] || [ -z "$NEO4J_PASSWORD" ]; then
    echo "❌ Neo4j variables not found in .env file"
    echo "   Please set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD in chat-server/.env"
    exit 1
fi

echo "📋 Current Neo4j Configuration:"
echo "   NEO4J_URI: $NEO4J_URI"
echo "   NEO4J_USER: ${NEO4J_USER:-neo4j}"
echo "   NEO4J_DATABASE: ${NEO4J_DATABASE:-neo4j}"
echo ""

# Prompt for confirmation
read -p "Set these variables in Railway? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🚀 Setting Railway environment variables..."

# Set variables in Railway (v4 syntax uses --set flag)
railway variables --set "NEO4J_URI=$NEO4J_URI"
railway variables --set "NEO4J_USER=${NEO4J_USER:-neo4j}"
railway variables --set "NEO4J_PASSWORD=$NEO4J_PASSWORD"
railway variables --set "NEO4J_DATABASE=${NEO4J_DATABASE:-neo4j}"

echo ""
echo "✅ Neo4j variables set in Railway!"
echo ""
echo "📝 Next steps:"
echo "   1. Railway will automatically redeploy with new variables"
echo "   2. Check Railway logs to verify Neo4j connection"
echo "   3. Test by creating a new user (should create Neo4j node)"
echo ""

