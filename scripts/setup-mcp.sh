#!/bin/bash

# MCP Server Setup Script for LiaiZen Project
# This script helps configure MCP servers for Cursor IDE

set -e

echo "=========================================="
echo "  MCP Server Setup for LiaiZen"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    CURSOR_CONFIG_DIR="$HOME/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    CURSOR_CONFIG_DIR="$HOME/.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    OS="windows"
    CURSOR_CONFIG_DIR="$APPDATA/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings"
else
    echo -e "${YELLOW}⚠ Warning: Unknown OS. Please configure manually.${NC}"
    OS="unknown"
fi

echo -e "${BLUE}Detected OS: $OS${NC}"
echo ""

# Check if Cursor config directory exists
if [ "$OS" != "unknown" ] && [ ! -d "$CURSOR_CONFIG_DIR" ]; then
    echo -e "${YELLOW}⚠ Cursor config directory not found at:${NC}"
    echo "  $CURSOR_CONFIG_DIR"
    echo ""
    echo "This might mean:"
    echo "  1. Cursor is not installed"
    echo "  2. Cursor hasn't been opened yet"
    echo "  3. The path is different on your system"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for required tools
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}⚠ npm not found. Please install npm first.${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm found: $NPM_VERSION${NC}"
echo ""

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="$PROJECT_ROOT/chat-server/chat.db"

echo -e "${BLUE}Project root: $PROJECT_ROOT${NC}"
echo -e "${BLUE}Database path: $DB_PATH${NC}"
echo ""

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo -e "${YELLOW}⚠ Database not found at $DB_PATH${NC}"
    echo "  The database will be created when you first run the server."
    echo ""
fi

# Create MCP configuration
echo -e "${BLUE}Creating MCP configuration...${NC}"

MCP_CONFIG='{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["'$(which node)'", "-e", "require(\"@modelcontextprotocol/server-filesystem\").default()"],
      "description": "File system operations"
    },
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite"],
      "env": {
        "DATABASE_PATH": "'"$DB_PATH"'"
      },
      "description": "SQLite database operations for LiaiZen chat database"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "env:GITHUB_TOKEN"
      },
      "description": "GitHub repository management"
    }
  }
}'

# Save configuration to example file
echo "$MCP_CONFIG" > "$PROJECT_ROOT/.mcp-config.json"
echo -e "${GREEN}✅ Created .mcp-config.json${NC}"
echo ""

# Instructions for manual setup
echo "=========================================="
echo "  Setup Instructions"
echo "=========================================="
echo ""
echo -e "${BLUE}1. Install MCP servers globally (optional but recommended):${NC}"
echo "   npm install -g @modelcontextprotocol/server-sqlite"
echo "   npm install -g @modelcontextprotocol/server-github"
echo ""
echo -e "${BLUE}2. Configure Cursor IDE:${NC}"
if [ "$OS" != "unknown" ]; then
    echo "   Config location: $CURSOR_CONFIG_DIR/cline_mcp_settings.json"
    echo ""
    echo "   Option A: Copy the configuration manually"
    echo "   - Copy contents of .mcp-config.json"
    echo "   - Paste into Cursor's MCP settings"
    echo ""
    echo "   Option B: Use symlink (macOS/Linux only)"
    read -p "   Create symlink to Cursor config? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mkdir -p "$CURSOR_CONFIG_DIR"
        ln -sf "$PROJECT_ROOT/.mcp-config.json" "$CURSOR_CONFIG_DIR/cline_mcp_settings.json"
        echo -e "${GREEN}✅ Symlink created${NC}"
    fi
else
    echo "   - Open Cursor Settings"
    echo "   - Search for 'MCP' or 'Model Context Protocol'"
    echo "   - Copy contents of .mcp-config.json into the settings"
fi
echo ""
echo -e "${BLUE}3. Set up environment variables:${NC}"
echo "   - GITHUB_TOKEN: Create a GitHub Personal Access Token"
echo "     https://github.com/settings/tokens"
echo "     Required scopes: repo, read:org (if using org repos)"
echo ""
echo -e "${BLUE}4. Restart Cursor IDE${NC}"
echo ""
echo -e "${BLUE}5. Test MCP servers:${NC}"
echo "   Ask Claude: 'Query the database for all users'"
echo "   or: 'Show me the database schema'"
echo ""
echo "=========================================="
echo -e "${GREEN}Setup complete!${NC}"
echo "=========================================="
echo ""
echo "Configuration saved to: .mcp-config.json"
echo "See docs/MCP_SETUP.md for detailed documentation"

