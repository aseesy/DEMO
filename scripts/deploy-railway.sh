#!/bin/bash

# Railway Deployment Script
# Ensures deployment from correct directory to prevent "Could not find root directory" errors

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Railway Deployment Script ==="
echo ""

# Verify we're deploying from the correct location
if [ ! -f "$PROJECT_ROOT/railway.toml" ]; then
    echo "ERROR: railway.toml not found in project root!"
    echo "Expected location: $PROJECT_ROOT/railway.toml"
    exit 1
fi

if [ ! -d "$PROJECT_ROOT/chat-server" ]; then
    echo "ERROR: chat-server directory not found!"
    echo "Expected location: $PROJECT_ROOT/chat-server"
    exit 1
fi

echo "Project root: $PROJECT_ROOT"
echo "Railway config: $PROJECT_ROOT/railway.toml"
echo "Server directory: $PROJECT_ROOT/chat-server"
echo ""

# Check for pnpm files that cause Railway build failures
PNPM_FILES=$(find "$PROJECT_ROOT" -name "pnpm-lock.yaml" -o -name "pnpm-workspace.yaml" 2>/dev/null | grep -v ".bak" | grep -v "node_modules")
if [ -n "$PNPM_FILES" ]; then
    echo "WARNING: pnpm files detected (these cause Railway build failures):"
    echo "$PNPM_FILES"
    echo ""
    read -p "Rename these files to .bak? (y/n): " RENAME
    if [ "$RENAME" = "y" ]; then
        for f in $PNPM_FILES; do
            mv "$f" "${f}.bak"
            echo "Renamed: $f -> ${f}.bak"
        done
    fi
    echo ""
fi

# Deploy
echo "Deploying from $PROJECT_ROOT..."
cd "$PROJECT_ROOT"

# Check if Railway CLI is logged in
if ! railway whoami > /dev/null 2>&1; then
    echo "ERROR: Not logged in to Railway. Run 'railway login' first."
    exit 1
fi

# Check service status
echo ""
echo "Current Railway status:"
railway status 2>/dev/null || echo "(Unable to get status)"
echo ""

# Deploy
echo "Starting deployment..."
railway up

echo ""
echo "=== Deployment initiated ==="
echo "Monitor logs with: railway logs -f"
echo "Check build status at: https://railway.app"
