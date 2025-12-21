# MCP (Model Context Protocol) Server Setup

This document outlines recommended MCP servers for the LiaiZen co-parenting application.

## Current MCP Servers Available

Based on your Cursor setup, you already have access to:

- ✅ **Filesystem MCP** - File read/write operations (built-in)
- ✅ **Browser MCP** (`mcp_cursor-ide-browser`) - Web automation and testing
- ✅ **Git Operations** - Via Cursor's built-in git integration

## Recommended MCP Servers for This Project

### 1. **Database MCP** (High Priority)

**Purpose**: Direct SQLite database management, queries, and migrations

**Benefits for LiaiZen**:

- Query user data, contacts, tasks directly
- Run database migrations
- Inspect schema and relationships
- Debug data issues

**Setup Options**:

- `@modelcontextprotocol/server-sqlite` - Direct SQLite support
- Custom SQLite MCP server

### 2. **GitHub MCP** (Medium Priority)

**Purpose**: Repository management, issue tracking, PR management

**Benefits**:

- Create issues for bugs/features
- Manage pull requests
- Access repository metadata
- View commit history

**Setup**:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "env:GITHUB_TOKEN"
      }
    }
  }
}
```

### 3. **PostgreSQL/SQLite MCP** (High Priority if migrating)

**Purpose**: If you plan to migrate from SQLite to PostgreSQL

**Benefits**:

- Schema management
- Migration tools
- Query execution
- Connection management

### 4. **Slack/Discord MCP** (Optional)

**Purpose**: Team notifications and alerts

**Benefits**:

- Deployment notifications
- Error alerts
- Status updates

### 5. **Railway MCP** (Medium Priority)

**Purpose**: Deployment and infrastructure management

**Benefits**:

- Deploy directly from Cursor
- View logs
- Manage environment variables
- Monitor deployments

**Note**: May require custom MCP server or Railway CLI integration

### 6. **Email MCP** (Low Priority)

**Purpose**: Email testing and management

**Benefits**:

- Test email templates
- Send test emails
- Verify email configuration

## Setup Instructions

### For Cursor IDE

MCP servers are configured in Cursor's settings. The configuration file location depends on your OS:

**macOS**: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

**Windows**: `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

**Linux**: `~/.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

### Example Configuration

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["path/to/filesystem-server"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "env:GITHUB_TOKEN"
      }
    },
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite"],
      "env": {
        "DATABASE_PATH": "./chat-server/chat.db"
      }
    }
  }
}
```

## Priority Recommendations

### Immediate Setup (High Value)

1. **SQLite MCP** - Direct database access for debugging and queries
2. **GitHub MCP** - Better repository management

### Future Considerations

3. **Railway MCP** - If you want deployment automation
4. **PostgreSQL MCP** - If migrating from SQLite

## Testing MCP Servers

After configuring MCP servers, you can test them by:

1. Restarting Cursor
2. Asking Claude to use MCP tools (e.g., "Query the database for all users")
3. Checking MCP server logs for errors

## Security Considerations

- **Never commit MCP configuration with secrets** - Use environment variables
- **Use least-privilege access** - Only grant necessary permissions
- **Rotate tokens regularly** - Especially for GitHub and other external services
- **Monitor MCP usage** - Review logs for unexpected access

## Current Project Needs

Based on your project structure:

**Most Useful**:

- ✅ Browser MCP (already available) - For testing the web app
- 🔲 SQLite MCP - For database operations
- 🔲 GitHub MCP - For repository management

**Nice to Have**:

- 🔲 Railway MCP - For deployment automation
- 🔲 Email MCP - For testing email functionality

## Next Steps

1. **Set up SQLite MCP** for database access
2. **Configure GitHub MCP** if you want better repo management
3. **Test MCP servers** with simple queries
4. **Document MCP usage** in your development workflow
