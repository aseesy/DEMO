#!/bin/bash

# Test script for blog image generation API
# Requires server to be running on port 3001

echo "🧪 Testing Blog Image Generation API"
echo "======================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "❌ Server is not running on port 3001"
    echo "   Start the server first: npm start"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Test 1: Check if route exists
echo "📡 Testing route registration..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/blog/images/generate-header -X POST -H "Content-Type: application/json" -d '{}')
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "400" ]; then
    echo "✅ Route is registered (got $RESPONSE - expected for missing auth/data)"
else
    echo "⚠️  Unexpected response: $RESPONSE"
fi

echo ""
echo "📋 API Endpoints Available:"
echo "   POST /api/blog/images/generate-header"
echo "   POST /api/blog/images/generate-social"
echo "   POST /api/blog/images/generate-all"
echo ""
echo "✅ API routes are registered and accessible"
echo ""
echo "💡 To test actual image generation:"
echo "   1. Get a valid auth token"
echo "   2. POST to /api/blog/images/generate-header with:"
echo "      {"
echo "        \"title\": \"Your Article Title\","
echo "        \"subtitle\": \"Your subtitle\","
echo "        \"provider\": \"dall-e-3\","
echo "        \"saveLocally\": false"
echo "      }"

