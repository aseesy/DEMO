#!/bin/bash
# Validate Vercel Project Configuration
# Ensures we're deploying to the correct project
#
# This script is REQUIRED before any Vercel deployment.
# AI assistants MUST run this before deploying.
#
# Usage: ./scripts/validate-vercel-project.sh
#
# This checks:
# - Correct directory structure
# - Correct project name (chat-client-vite)
# - Correct project ID (prj_3Iz716ASKvPuwjAcu6oGzs8LUhRr)
# - Correct organization ID
#
# If any check fails, deployment is blocked.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# CORRECT PROJECT CONFIGURATION
CORRECT_PROJECT_NAME="chat-client-vite"
CORRECT_PROJECT_ID="prj_3Iz716ASKvPuwjAcu6oGzs8LUhRr"
CORRECT_ORG_ID="team_HQ1x0PlLlVkC2xk3bQ8RXAcH"
EXPECTED_DIR="chat-client-vite"

echo "=================================="
echo "Vercel Project Validation"
echo "=================================="
echo ""

# Check if we're in the correct directory structure
if [ ! -d "$EXPECTED_DIR" ]; then
    echo -e "${RED}❌ ERROR: Must run from project root${NC}"
    echo "Expected to find: $EXPECTED_DIR/"
    exit 1
fi

# Check if .vercel directory exists
VERCEL_CONFIG="$EXPECTED_DIR/.vercel/project.json"
if [ ! -f "$VERCEL_CONFIG" ]; then
    echo -e "${RED}❌ ERROR: Vercel project not linked${NC}"
    echo "Run: cd $EXPECTED_DIR && vercel link"
    exit 1
fi

# Read project configuration
PROJECT_JSON=$(cat "$VERCEL_CONFIG")
PROJECT_NAME=$(echo "$PROJECT_JSON" | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4)
PROJECT_ID=$(echo "$PROJECT_JSON" | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
ORG_ID=$(echo "$PROJECT_JSON" | grep -o '"orgId":"[^"]*"' | cut -d'"' -f4)

echo "Current Configuration:"
echo "  Project Name: $PROJECT_NAME"
echo "  Project ID:   $PROJECT_ID"
echo "  Org ID:       $ORG_ID"
echo ""

# Validate project name
if [ "$PROJECT_NAME" != "$CORRECT_PROJECT_NAME" ]; then
    echo -e "${RED}❌ ERROR: Wrong project name!${NC}"
    echo "  Current: $PROJECT_NAME"
    echo "  Expected: $CORRECT_PROJECT_NAME"
    echo ""
    echo "Fix by running:"
    echo "  cd $EXPECTED_DIR"
    echo "  vercel link"
    echo "  Select: $CORRECT_PROJECT_NAME"
    exit 1
fi

# Validate project ID
if [ "$PROJECT_ID" != "$CORRECT_PROJECT_ID" ]; then
    echo -e "${RED}❌ ERROR: Wrong project ID!${NC}"
    echo "  Current: $PROJECT_ID"
    echo "  Expected: $CORRECT_PROJECT_ID"
    echo ""
    echo "This project is linked to a different Vercel project."
    echo "Fix by running:"
    echo "  cd $EXPECTED_DIR"
    echo "  rm -rf .vercel"
    echo "  vercel link"
    echo "  Select: $CORRECT_PROJECT_NAME"
    exit 1
fi

# Validate org ID
if [ "$ORG_ID" != "$CORRECT_ORG_ID" ]; then
    echo -e "${RED}❌ ERROR: Wrong organization ID!${NC}"
    echo "  Current: $ORG_ID"
    echo "  Expected: $CORRECT_ORG_ID"
    exit 1
fi

echo -e "${GREEN}✅ Project configuration is correct!${NC}"
echo ""
echo "Safe to deploy from: $EXPECTED_DIR/"
echo ""

