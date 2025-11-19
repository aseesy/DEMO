# MCP Server Configuration Guide

## Overview

This project is configured with Model Context Protocol (MCP) servers to enhance Claude Code's capabilities for the LiaiZen co-parenting platform.

## Configured MCP Servers

### 1. **SQLite MCP Server**
- **Purpose**: Direct database access and queries
- **Benefits**:
  - Query user data, messages, rooms, and contacts directly
  - Analyze database schema and relationships
  - Debug data issues without manual SQL commands
  - Generate reports and analytics
- **Database**: `/Users/athenasees/Desktop/chat/chat-server/chat.db`

### 2. **Filesystem MCP Server**
- **Purpose**: Advanced file operations
- **Benefits**:
  - Better file search and navigation
  - Batch file operations
  - Directory structure analysis
  - File watching and monitoring
- **Scope**: `/Users/athenasees/Desktop/chat`

### 3. **GitHub MCP Server**
- **Purpose**: Repository management and collaboration
- **Benefits**:
  - Create and manage issues
  - Review pull requests
  - Manage branches and commits
  - Track project progress
- **Setup Required**: Add GitHub Personal Access Token (see below)

### 4. **Fetch MCP Server**
- **Purpose**: HTTP requests and API testing
- **Benefits**:
  - Test backend API endpoints
  - Integrate with external services
  - Debug webhook integrations
  - Monitor service health

### 5. **Memory MCP Server**
- **Purpose**: Persistent context across Claude sessions
- **Benefits**:
  - Remember project-specific decisions
  - Track ongoing tasks and context
  - Maintain development history
  - Reduce context repetition

## Setup Instructions

### 1. Configuration File Location
The MCP configuration is stored at:
```
~/.config/Claude/claude_desktop_config.json
```

### 2. GitHub Token Setup (Optional but Recommended)

To enable GitHub MCP server:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these permissions:
   - `repo` (Full control of private repositories)
   - `read:org` (Read org and team membership)
   - `user` (Read user profile data)
3. Copy the token
4. Edit the config file:
   ```bash
   nano ~/.config/Claude/claude_desktop_config.json
   ```
5. Replace `YOUR_GITHUB_TOKEN_HERE` with your actual token

### 3. Restart Claude Code
After configuration changes, restart Claude Code to load the MCP servers.

## Usage Examples

### SQLite MCP
```
"Show me all users in the database"
"Query messages from the last 7 days"
"What's the schema of the rooms table?"
"Find all pending room invitations"
```

### Filesystem MCP
```
"Find all React components that use Socket.io"
"Search for files containing 'AI mediation' logic"
"Show me the directory structure of chat-server"
```

### GitHub MCP
```
"Create an issue for implementing calendar feature"
"Show me recent pull requests"
"What branches exist in this repo?"
```

### Fetch MCP
```
"Test the /api/health endpoint"
"Check if the backend server is running"
"Fetch user data from the API"
```

### Memory MCP
```
"Remember that we're using Railway for deployment"
"What did we decide about the database migration?"
"Recall the authentication flow we discussed"
```

## How MCP Enhances Development

1. **Faster Database Debugging**: Direct SQL queries without switching tools
2. **Better Code Navigation**: Advanced file search across the codebase
3. **Integrated Workflow**: GitHub operations without leaving Claude Code
4. **API Testing**: Test endpoints directly in conversation
5. **Context Retention**: Remember decisions across sessions

## Troubleshooting

### MCP Servers Not Loading
1. Check config file syntax: `cat ~/.config/Claude/claude_desktop_config.json`
2. Ensure Node.js is installed: `node --version` (requires v18+)
3. Restart Claude Code completely
4. Check Claude Code logs for errors

### Database Connection Issues
- Verify database path: `/Users/athenasees/Desktop/chat/chat-server/chat.db`
- Check file permissions: `ls -la chat-server/chat.db`
- Ensure database is not locked by another process

### GitHub MCP Not Working
- Verify token has correct permissions
- Check token hasn't expired
- Ensure no quotes around token in config file

## Security Notes

- **Never commit** the MCP config file to version control (it contains tokens)
- **Keep tokens secure**: Use environment variables or secret managers in production
- **Limit token permissions**: Only grant necessary GitHub permissions
- **Rotate tokens regularly**: Change GitHub tokens every 90 days

## Additional MCP Servers (Optional)

Consider adding these if needed:

- **PostgreSQL MCP**: If migrating from SQLite to PostgreSQL
- **Brave Search MCP**: For web research during development
- **Puppeteer MCP**: For automated browser testing
- **Slack MCP**: For team notifications and collaboration

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Available MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Claude Code MCP Guide](https://docs.anthropic.com/claude/docs/mcp)

---

*Last Updated: 2025-11-19*
*Project: LiaiZen Co-Parenting Platform*
