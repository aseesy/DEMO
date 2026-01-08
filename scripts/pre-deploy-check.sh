#!/bin/bash
# Pre-deploy check to ensure correct Vercel project
# This should be run before any deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if we're trying to deploy from root or wrong directory
CURRENT_DIR=$(pwd)

if [ "$CURRENT_DIR" = "$PROJECT_ROOT" ]; then
    echo -e "${RED}❌ ERROR: Do not deploy from project root!${NC}"
    echo ""
    echo "Deployments must be done from the chat-client-vite/ directory."
    echo ""
    echo "Safe deployment methods:"
    echo "  1. ./scripts/deploy-chat-client-vite.sh"
    echo "  2. cd chat-client-vite && npm run deploy"
    echo ""
    exit 1
fi

# Check if we're in chat-client-vite
if [[ "$CURRENT_DIR" != *"chat-client-vite" ]]; then
    echo -e "${RED}❌ ERROR: Must deploy from chat-client-vite/ directory!${NC}"
    echo ""
    echo "Current directory: $CURRENT_DIR"
    echo "Expected: $PROJECT_ROOT/chat-client-vite"
    echo ""
    exit 1
fi

# Run full validation
if [ -f "$PROJECT_ROOT/scripts/validate-vercel-project.sh" ]; then
    bash "$PROJECT_ROOT/scripts/validate-vercel-project.sh"
else
    echo -e "${YELLOW}⚠ Validation script not found${NC}"
fi

