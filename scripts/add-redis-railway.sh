#!/bin/bash
# Add Redis to Railway project
# This script guides you through adding Redis via Railway CLI

set -e

echo "🚂 Adding Redis to Railway..."
echo ""

# Check if logged in
railway whoami > /dev/null 2>&1 || {
    echo "❌ Not logged into Railway. Run: railway login"
    exit 1
}

# Check current status
echo "Current Railway status:"
railway status
echo ""

# Check if Redis already exists
echo "Checking for existing Redis..."
if railway variables 2>&1 | grep -qi "REDIS_URL\|REDISHOST"; then
    echo "✅ Redis already appears to be configured!"
    echo ""
    echo "Redis variables found:"
    railway variables | grep -i "REDIS"
    exit 0
fi

echo "⚠️  Redis not found. Adding Redis database..."
echo ""
echo "The Railway CLI will prompt you interactively."
echo "When prompted:"
echo "  1. Select 'Database'"
echo "  2. Select 'redis'"
echo ""

# Add Redis (interactive)
railway add --database redis

echo ""
echo "⏳ Waiting for Redis to be provisioned..."
sleep 5

echo ""
echo "Checking for REDIS_URL variable..."
if railway variables 2>&1 | grep -qi "REDIS_URL\|REDISHOST"; then
    echo "✅ Redis successfully added!"
    echo ""
    echo "Redis variables:"
    railway variables | grep -i "REDIS"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Railway will automatically redeploy your service"
    echo "  2. Check logs: railway logs"
    echo "  3. Look for: '✅ Redis: Connected and ready'"
else
    echo "⚠️  Redis variables not found yet. This might take a moment."
    echo "   Check Railway dashboard or run: railway variables"
    echo ""
    echo "💡 If Redis was added, Railway will automatically:"
    echo "   - Create the Redis service"
    echo "   - Add REDIS_URL environment variable"
    echo "   - Redeploy your service"
fi

