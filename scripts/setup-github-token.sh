#!/bin/bash

# GitHub Token Setup Script for MCP
# This script helps you securely add your GitHub token to your environment

set -e

echo "=========================================="
echo "  GitHub Token Setup for MCP"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detect shell
if [ -n "$ZSH_VERSION" ]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    if [ -f "$HOME/.bash_profile" ]; then
        SHELL_PROFILE="$HOME/.bash_profile"
    else
        SHELL_PROFILE="$HOME/.bashrc"
    fi
else
    SHELL_PROFILE="$HOME/.profile"
fi

echo -e "${BLUE}Detected shell profile: $SHELL_PROFILE${NC}"
echo ""

# Check if token already exists
if grep -q "GITHUB_TOKEN" "$SHELL_PROFILE" 2>/dev/null; then
    echo -e "${YELLOW}⚠ GITHUB_TOKEN already found in $SHELL_PROFILE${NC}"
    echo ""
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing token."
        exit 0
    fi
    # Remove old token line
    sed -i.bak '/export GITHUB_TOKEN=/d' "$SHELL_PROFILE"
fi

echo -e "${BLUE}Step 1: Create a GitHub Personal Access Token${NC}"
echo ""
echo "1. Go to: https://github.com/settings/tokens"
echo "2. Click 'Generate new token' → 'Generate new token (classic)'"
echo "3. Name it: 'LiaiZen MCP Access'"
echo "4. Select scopes: repo, read:org"
echo "5. Click 'Generate token'"
echo "6. Copy the token"
echo ""
read -p "Press Enter when you have your token ready..."

echo ""
echo -e "${BLUE}Step 2: Enter your GitHub token${NC}"
echo -e "${YELLOW}(Token will not be displayed as you type)${NC}"
read -s -p "GitHub Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠ No token provided. Exiting.${NC}"
    exit 1
fi

# Validate token format (GitHub tokens start with ghp_)
if [[ ! "$GITHUB_TOKEN" =~ ^ghp_ ]]; then
    echo -e "${YELLOW}⚠ Warning: GitHub tokens usually start with 'ghp_'.${NC}"
    echo "Are you sure this is correct? (y/n)"
    read -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting. Please try again with a valid token."
        exit 1
    fi
fi

# Add token to shell profile
echo "" >> "$SHELL_PROFILE"
echo "# GitHub token for MCP (added by setup-github-token.sh)" >> "$SHELL_PROFILE"
echo "export GITHUB_TOKEN=$GITHUB_TOKEN" >> "$SHELL_PROFILE"

echo ""
echo -e "${GREEN}✅ Token added to $SHELL_PROFILE${NC}"
echo ""

# Test token
echo -e "${BLUE}Testing token...${NC}"
export GITHUB_TOKEN="$GITHUB_TOKEN"
if curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Token is valid!${NC}"
    USERNAME=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user | grep -o '"login":"[^"]*' | cut -d'"' -f4)
    echo "   Authenticated as: $USERNAME"
else
    echo -e "${YELLOW}⚠ Could not verify token. Please check manually.${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Reload your shell: source $SHELL_PROFILE"
echo "2. Or restart your terminal"
echo "3. Restart Cursor IDE"
echo "4. Test MCP: Ask Claude to 'Show me recent commits'"
echo ""
echo -e "${YELLOW}Security reminder:${NC}"
echo "- Never commit your token to git"
echo "- Rotate tokens regularly"
echo "- Use minimal required scopes"

