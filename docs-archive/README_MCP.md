# MCP Server Setup - Quick Start

This project uses Model Context Protocol (MCP) servers to extend Claude's capabilities in Cursor IDE.

## 🚀 Quick Setup (3 Steps)

### 1. Run the Setup Script

```bash
./scripts/setup-mcp.sh
```

This will:

- Check prerequisites (Node.js, npm)
- Create `.mcp-config.json` with proper database paths
- Provide instructions for your OS

### 2. Install MCP Servers (Optional but Recommended)

```bash
npm install -g @modelcontextprotocol/server-sqlite
npm install -g @modelcontextprotocol/server-github
```

### 3. Configure Cursor IDE

**macOS:**

```bash
# Option A: Manual copy
# Copy contents of .mcp-config.json to:
~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json

# Option B: Symlink (if directory exists)
mkdir -p ~/Library/Application\ Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings
ln -sf $(pwd)/.mcp-config.json ~/Library/Application\ Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

**Windows:**
Copy `.mcp-config.json` contents to:

```
%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

**Linux:**

```bash
mkdir -p ~/.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings
ln -sf $(pwd)/.mcp-config.json ~/.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

### 4. Set Environment Variables

For GitHub MCP, create a GitHub Personal Access Token:

1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Required scopes: `repo`, `read:org`
4. Set as environment variable:
   ```bash
   export GITHUB_TOKEN=your_token_here
   ```

### 5. Restart Cursor IDE

Close and reopen Cursor for MCP servers to load.

## ✅ Test MCP Servers

After restarting Cursor, test with these prompts:

**SQLite MCP:**

```
Query the database and show me all users with their email addresses.
```

**GitHub MCP:**

```
Show me the last 5 commits in this repository.
```

**Browser MCP (already available):**

```
Open http://localhost:5173 in the browser and take a screenshot.
```

## 📚 Documentation

- **Setup Guide**: `docs/MCP_SETUP.md` - Detailed setup instructions
- **Usage Examples**: `docs/MCP_USAGE_EXAMPLES.md` - Practical examples
- **SQL Queries**: `scripts/mcp-queries.sql` - Common database queries

## 🔧 Available MCP Servers

### SQLite MCP

- Query users, contacts, tasks, messages
- Inspect database schema
- Run analytics queries
- Debug data issues

### GitHub MCP

- Create and manage issues
- View commits and PRs
- Repository management

### Browser MCP (Pre-configured)

- Test UI in browser
- Take screenshots
- Automate testing

## 🛠 Troubleshooting

**MCP servers not working?**

1. Check Cursor config directory exists
2. Verify `.mcp-config.json` is valid JSON
3. Ensure database path is correct: `./chat-server/chat.db`
4. Check Node.js version: `node --version` (should be 18+)
5. Restart Cursor completely

**Database not found?**

- The database is created automatically when you first run the server
- Path: `chat-server/chat.db`
- Verify path in `.mcp-config.json` matches your setup

**GitHub MCP auth failed?**

- Verify `GITHUB_TOKEN` environment variable is set
- Check token has correct scopes
- Token may have expired - regenerate if needed

## 📝 Example Queries

See `docs/MCP_USAGE_EXAMPLES.md` for comprehensive examples including:

- User queries
- Contact relationship queries
- Task statistics
- Message analytics
- Database schema inspection

## 🔒 Security

- `.mcp-config.json` is in `.gitignore` (contains paths)
- Never commit GitHub tokens
- Use environment variables for secrets
- Review MCP server permissions regularly
