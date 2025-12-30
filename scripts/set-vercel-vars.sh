#!/bin/bash
# Set all environment variables in Vercel
# Generated: 2025-12-29

set -e

echo "▲ Setting Vercel Environment Variables..."
echo ""

# Check if logged in
vercel whoami > /dev/null 2>&1 || {
    echo "❌ Not logged into Vercel. Run: vercel login"
    exit 1
}

# Navigate to frontend directory
cd /Users/athenasees/Desktop/chat/chat-client-vite

echo "📍 Working in: $(pwd)"
echo ""

# API URL (points to Railway backend)
echo "🔗 Setting API URL..."
vercel env add VITE_API_URL production <<< "https://demo-production-6dcd.up.railway.app"
vercel env add VITE_API_URL preview <<< "https://demo-production-6dcd.up.railway.app"
vercel env add VITE_API_URL development <<< "http://localhost:3000"

# WebSocket URL
echo "🔌 Setting WebSocket URL..."
vercel env add VITE_WS_URL production <<< "wss://demo-production-6dcd.up.railway.app"
vercel env add VITE_WS_URL preview <<< "wss://demo-production-6dcd.up.railway.app"
vercel env add VITE_WS_URL development <<< "ws://localhost:3000"

# Google Places API (if needed for frontend)
echo "🗺️  Setting Google Places API key..."
vercel env add VITE_GOOGLE_PLACES_API_KEY production <<< "AIzaSyBZJI34eh2mvjTeJgeioTh2qHHrQsEkPs8"
vercel env add VITE_GOOGLE_PLACES_API_KEY preview <<< "AIzaSyBZJI34eh2mvjTeJgeioTh2qHHrQsEkPs8"

echo ""
echo "✅ Vercel variables set successfully!"
echo ""
echo "📋 Variables set:"
echo "  - VITE_API_URL (production/preview/development)"
echo "  - VITE_WS_URL (production/preview/development)"
echo "  - VITE_GOOGLE_PLACES_API_KEY (production/preview)"
echo ""
echo "📋 Next steps:"
echo "  1. Verify: vercel env ls"
echo "  2. Deploy: vercel --prod"
echo ""
