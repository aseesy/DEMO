# LiaiZen MCP Servers Documentation

Complete guide to all Model Context Protocol (MCP) servers configured for the LiaiZen co-parenting platform.

## Overview

MCP servers enable Claude to access real-time data, documentation, and tools directly, eliminating the need to copy-paste information and keeping everything in sync.

## Installed MCP Servers

### 1. 🎨 **Design Tokens MCP Server**

**Status**: ✅ Active
**Type**: Custom
**Location**: `/Users/athenasees/Desktop/chat/.design-tokens-mcp/`

Access LiaiZen's complete design system including colors, spacing, typography, shadows, and component specifications.

**Key Features:**

- Get specific token values
- List all tokens by category
- Search tokens by keyword
- Update token values programmatically

**Quick Examples:**

```
"What's the primary brand color?"
"List all spacing tokens"
"Search for tokens related to navigation"
```

📖 [View Full Documentation](./.design-tokens-mcp/README.md)

---

### 2. 🎨 **Tailwind CSS MCP Server**

**Status**: ✅ Active
**Type**: npm package (`tailwindcss-mcp-server`)
**Project Path**: `/Users/athenasees/Desktop/chat/chat-client-vite`

Comprehensive Tailwind CSS utilities, documentation, conversion tools, and template generation.

**Key Features:**

- Get utility class information
- Browse color palette
- Convert CSS to Tailwind
- Search Tailwind documentation
- Installation guides
- Configuration guidance

**Quick Examples:**

```
"Convert this CSS to Tailwind: padding: 1rem; background: #275559;"
"What are the responsive breakpoints?"
"How do I create a modal backdrop?"
```

📖 [View Full Documentation](./TAILWIND_MCP.md)

---

### 3. 🧠 **Codebase Context MCP Server**

**Status**: ✅ Active
**Type**: Custom
**Location**: `/Users/athenasees/Desktop/chat/.codebase-context-mcp/`

Deep codebase knowledge including architecture, patterns, conventions, API endpoints, database schema, and best practices.

**Key Features:**

- Get architecture overview
- Access design system context
- Understand file structure
- Query API endpoints and database schema
- Learn common patterns (modals, navigation, forms)
- Search codebase context
- Get best practices and common issues

**Quick Examples:**

```
"What's the LiaiZen architecture?"
"Where are modal components located?"
"What are the common issues with navigation?"
"Show me the database schema"
```

📖 [View Full Documentation](./.codebase-context-mcp/README.md)

---

### 4. 🔍 **Brave Search MCP Server**

**Status**: ✅ Active
**Type**: Official (@modelcontextprotocol/server-brave-search)

Web search capabilities for up-to-date information and research.

**Use Cases:**

- Search for technical documentation
- Find solutions to errors
- Research best practices
- Check package versions

---

### 5. 🌐 **Chrome DevTools MCP Server**

**Status**: ✅ Active
**Type**: Community (chrome-devtools-mcp@latest)

Browser automation and debugging capabilities.

**Use Cases:**

- Test UI in real browsers
- Debug frontend issues
- Take screenshots
- Inspect DOM elements

---

### 6. 🎭 **Playwright MCP Server**

**Status**: ✅ Active
**Type**: Official (@playwright/mcp@latest)

Automated browser testing and end-to-end testing capabilities.

**Use Cases:**

- Write E2E tests
- Test user flows
- Capture screenshots
- Validate accessibility

---

### 7. 🗄️ **Neo4j Database MCP Server**

**Status**: ✅ Active
**Type**: Community (@alanse/mcp-neo4j-server)
**Connection**: bolt://localhost:7687

Access to Neo4j graph database for relationship mapping.

**Use Cases:**

- Query co-parent relationships
- Analyze family connections
- Visualize contact networks
- Test graph queries

---

### 8. 📁 **Filesystem MCP Server**

**Status**: ✅ Active
**Type**: Official (@modelcontextprotocol/server-filesystem)
**Allowed Paths**:

- `/Users/athenasees/Desktop`
- `/Users/athenasees/Downloads`

Safe file system access for reading and writing files.

**Use Cases:**

- Read project files
- Write documentation
- Manage configurations
- Process data files

---

### 9. 🐙 **GitHub MCP Server**

**Status**: ✅ Active
**Type**: Official (@modelcontextprotocol/server-github)

GitHub API integration for repository management.

**Use Cases:**

- Create issues
- Manage pull requests
- Review code
- Check repository status

---

## Configuration

All MCP servers are configured in:

```
/Users/athenasees/Library/Application Support/Claude/claude_desktop_config.json
```

## Activating MCP Servers

After adding or modifying MCP servers:

1. **Quit Claude Desktop** completely (Cmd+Q)
2. **Reopen Claude Desktop**
3. MCP servers load automatically

## Using MCP Servers

### Ask Questions

```
"What's our primary brand color?" → Design Tokens
"Convert this CSS to Tailwind" → Tailwind CSS
"Search for React best practices" → Brave Search
"Query Neo4j for co-parent relationships" → Neo4j
```

### Combine Multiple Servers

```
1. "Get the primary brand color" (Design Tokens)
   → Returns: #275559

2. "How do I use this in Tailwind?" (Tailwind CSS)
   → Returns: bg-[#275559] or theme extension

3. "Show me an example component" (Filesystem)
   → Reads existing component files
```

## Development Workflow

### Frontend Development

1. **Design Tokens MCP**: Get brand colors, spacing, typography
2. **Tailwind MCP**: Convert to Tailwind classes
3. **Filesystem MCP**: Read/write component files
4. **Chrome DevTools MCP**: Test in browser

### Backend Development

1. **Neo4j MCP**: Query database relationships
2. **GitHub MCP**: Manage code and PRs
3. **Brave Search MCP**: Research solutions

### Testing

1. **Playwright MCP**: E2E test automation
2. **Chrome DevTools MCP**: Manual browser testing
3. **Filesystem MCP**: Read test files

## MCP Server Statuses

Check if MCP servers are working:

```
"List all available MCP servers"
"Test the Design Tokens MCP server"
"Check Tailwind MCP connection"
```

## Troubleshooting

### Server Not Loading

1. Verify configuration in `claude_desktop_config.json`
2. Restart Claude Desktop
3. Check server logs in Claude Desktop settings

### Tool Not Working

1. Ensure server is in the active list
2. Check required environment variables
3. Verify file paths exist

### Conflicting Servers

- Each server has a unique name
- Use descriptive names when asking questions
- Specify which server if ambiguous

## Best Practices

### 1. **Use Specific Queries**

❌ "What colors do we have?"
✅ "What's the primary brand color from Design Tokens?"

### 2. **Combine Tools**

Use multiple MCP servers together for complex tasks:

```
1. Design Tokens → Get value
2. Tailwind CSS → Convert to classes
3. Filesystem → Apply to component
```

### 3. **Update Tokens**

When brand values change:

```
1. Update Design Tokens MCP
2. Regenerate Tailwind config
3. Test with Chrome DevTools
```

## Future MCP Servers

Consider adding:

- **Figma MCP**: Design-to-code workflow
- **Firebase MCP**: Direct database access
- **OpenAI MCP**: AI model integration
- **Vercel MCP**: Deployment management
- **Railway MCP**: Backend deployment

## Support

- **Design Tokens Issues**: Check `.design-tokens-mcp/README.md`
- **Tailwind Issues**: Check `.mcp-docs/TAILWIND_MCP.md`
- **General MCP Help**: [MCP Documentation](https://modelcontextprotocol.io)

---

## Quick Reference

| Server           | Primary Use       | Quick Command              |
| ---------------- | ----------------- | -------------------------- |
| Design Tokens    | Brand values      | "Get primary color"        |
| Tailwind CSS     | Class utilities   | "Convert CSS to Tailwind"  |
| Codebase Context | Project knowledge | "What's the architecture?" |
| Brave Search     | Web research      | "Search for..."            |
| Chrome DevTools  | Browser testing   | "Test in Chrome"           |
| Playwright       | E2E testing       | "Write test for..."        |
| Neo4j            | Graph queries     | "Query relationships"      |
| Filesystem       | File operations   | "Read component file"      |
| GitHub           | Repository mgmt   | "Create PR"                |

---

**Last Updated**: 2025-01-20
**LiaiZen Co-Parenting Platform**
Better Co-Parenting Through Better Communication
