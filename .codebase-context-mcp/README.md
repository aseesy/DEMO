# LiaiZen Codebase Context MCP Server

A custom Model Context Protocol (MCP) server that provides Claude with deep understanding of the LiaiZen codebase structure, architectural patterns, design decisions, and development conventions.

## Overview

This MCP server acts as a **knowledge base** for the LiaiZen co-parenting platform, enabling Claude to understand:

- Project architecture and technology stack
- Design system and UI patterns
- File organization and structure
- API endpoints and database schema
- Common coding patterns and best practices
- Development workflows
- Known issues and solutions

## Features

### 🏗️ **Architecture Knowledge**

Get comprehensive information about frontend (React/Vite) and backend (Node.js/Express) architecture.

### 🎨 **Design System**

Access brand colors, typography, spacing rules, and UI component patterns.

### 📁 **File Structure**

Understand where components, hooks, services, and other code lives.

### 🔌 **API & Database**

Query information about REST endpoints, Socket.io events, and database schema.

### 🧩 **Common Patterns**

Learn component patterns, modal standards, navigation structure, button styles, and form conventions.

### ⚡ **Development Workflow**

Get instructions for starting services, running builds, and deploying.

### 🐛 **Common Issues**

Access solutions to frequent problems (modal overlap, mobile zoom, touch targets, etc.).

### 📚 **Best Practices**

Follow LiaiZen-specific coding standards and design principles.

## Available Tools

### 1. `get_architecture`

**Description**: Get LiaiZen architecture overview
**Returns**: Project overview, frontend/backend tech stack, deployment info

**Example:**

```
"What's the LiaiZen architecture?"
"How is the frontend structured?"
```

### 2. `get_design_system`

**Description**: Get design system (colors, typography, spacing, patterns)
**Returns**: Complete design token system

**Example:**

```
"What colors does LiaiZen use?"
"What's the standard border radius?"
```

### 3. `get_file_structure`

**Parameters**: `area` (frontend, backend, or all)
**Returns**: File/folder organization

**Example:**

```
"Where are React components located?"
"Show me the backend file structure"
```

### 4. `get_api_endpoints`

**Description**: Get list of all API endpoints
**Returns**: Categorized endpoints (auth, users, contacts, tasks, rooms, messages)

**Example:**

```
"What API endpoints are available?"
"How do I create a new task?"
```

### 5. `get_common_patterns`

**Parameters**: `pattern` (components, modals, navigation, buttons, forms, or all)
**Returns**: Coding pattern details and examples

**Example:**

```
"What's the modal pattern?"
"How should I structure buttons?"
```

### 6. `get_database_schema`

**Description**: Get database schema and table structures
**Returns**: All tables with column definitions

**Example:**

```
"What's in the users table?"
"Show me the database schema"
```

### 7. `get_socket_events`

**Description**: Get Socket.io event names and purposes
**Returns**: Client and server events

**Example:**

```
"What Socket.io events are available?"
"How do I send a message?"
```

### 8. `search_context`

**Parameters**: `query` (search term)
**Returns**: Matching context entries

**Example:**

```
"Search for 'navigation' in codebase context"
"Find information about z-index"
```

### 9. `get_best_practices`

**Description**: Get development best practices
**Returns**: LiaiZen coding standards and core philosophies

**Example:**

```
"What are the best practices?"
"What are LiaiZen's core philosophies?"
```

### 10. `get_common_issues`

**Description**: Get common issues and solutions
**Returns**: Known problems and their fixes

**Example:**

```
"What are common issues?"
"How do I fix modal overlap?"
```

### 11. `get_dependencies`

**Description**: Get project dependencies
**Returns**: Frontend and backend npm packages

**Example:**

```
"What dependencies does LiaiZen use?"
"What's the tech stack?"
```

### 12. `get_workflow`

**Description**: Get development workflow
**Returns**: Commands for starting, building, and deploying

**Example:**

```
"How do I start development?"
"What's the deployment process?"
```

## Resource URIs

Access codebase context as resources:

### `liaizen://codebase-context`

Complete codebase context (entire knowledge base)

### `liaizen://architecture`

Architecture details only

### `liaizen://design-system`

Design system only

## Usage Examples

### Starting a New Feature

```
1. "What's the file structure for frontend components?"
2. "What are the common patterns for modals?"
3. "What's the primary brand color?"
4. "Show me the API endpoints for tasks"
```

### Debugging Issues

```
1. "What are common issues with modals?"
2. "How do I fix navigation overlap?"
3. "Search for 'z-index' in codebase context"
```

### Understanding Architecture

```
1. "Get the LiaiZen architecture"
2. "What's the database schema?"
3. "What Socket.io events are available?"
```

### Following Best Practices

```
1. "Get best practices"
2. "What's the common pattern for buttons?"
3. "How should I structure form inputs?"
```

## Integration with Other MCP Servers

The Codebase Context MCP works alongside other MCP servers:

### With Design Tokens MCP

```
1. Codebase Context: "What's the primary brand color?" → #275559
2. Design Tokens: "Get the primary token" → Full token details
3. Tailwind CSS: "Convert #275559 to Tailwind" → bg-[#275559]
```

### With Filesystem MCP

```
1. Codebase Context: "Where are modal components?" → chat-client-vite/src/components/modals/
2. Filesystem: Read files in that directory
```

### With GitHub MCP

```
1. Codebase Context: "What are best practices?" → Get standards
2. GitHub: Create PR following those standards
```

## Context Included

### ✅ Project Information

- Name, description, domain, mission
- Technology stack
- Deployment strategy

### ✅ Architecture

- Frontend: React, Vite, Tailwind CSS, Socket.io-client
- Backend: Node.js, Express, SQLite, Socket.io, OpenAI API
- Real-time communication patterns
- Database structure

### ✅ Design System

- Brand colors (#275559 primary, #4DA8B0 secondary, etc.)
- Typography (Inter font family)
- Spacing rules
- Border radius standards
- Component patterns

### ✅ File Structure

- Component locations
- Hook locations
- Service locations
- API client structure

### ✅ API & Database

- REST endpoint documentation
- Socket.io event catalog
- Database schema (users, contacts, tasks, rooms, messages)
- Authentication flow

### ✅ Common Patterns

- Component structure (functional with hooks)
- Modal patterns (z-index, padding, responsive)
- Navigation (desktop/mobile differences)
- Button styles (primary, secondary, success)
- Form conventions (input height, focus states)

### ✅ Development Workflow

- Starting development (npm run dev)
- Building for production
- Deployment (Vercel for frontend, Railway for backend)

### ✅ Best Practices

- Child-centered outcomes
- Conflict reduction focus
- Privacy & security standards
- Mobile-first design
- Accessibility requirements
- AI-assisted communication

### ✅ Common Issues

- Modal overlap solutions
- Mobile zoom prevention
- Touch target sizing
- Hot reload fixes

## Benefits

✅ **Instant Context** - Claude knows your codebase without reading files
✅ **Consistent Patterns** - Always follow established conventions
✅ **Faster Development** - No need to explain architecture repeatedly
✅ **Error Prevention** - Avoid common pitfalls with known solutions
✅ **Onboarding** - New developers (or AI) understand structure immediately
✅ **Documentation** - Single source of truth for project knowledge

## Maintenance

### Updating Context

When making significant architectural changes:

1. Edit `/Users/athenasees/Desktop/chat/.codebase-context-mcp/codebase-context.json`
2. Update relevant sections (architecture, patterns, etc.)
3. Restart Claude Desktop to reload

### Adding New Patterns

To add new common patterns:

```json
{
  "commonPatterns": {
    "yourNewPattern": {
      "description": "...",
      "example": "...",
      "usage": "..."
    }
  }
}
```

### Documenting New Features

When adding features, update:

- `keyFeatures` array
- `apiEndpoints` object (if applicable)
- `databaseSchema` (if tables change)
- `fileStructure` (if new directories)

## Restarting Claude Desktop

After adding this MCP server, **restart Claude Desktop**:

1. Quit Claude Desktop completely (Cmd+Q)
2. Reopen Claude Desktop
3. The Codebase Context MCP will be available automatically

## Testing

Test the server manually:

```bash
cd /Users/athenasees/Desktop/chat/.codebase-context-mcp
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node index.js
```

## Troubleshooting

### Server Not Loading

- Verify Node.js path: `/Users/athenasees/.nvm/versions/node/v20.19.4/bin/node`
- Check file permissions: `chmod +x index.js`
- Restart Claude Desktop

### Context Out of Date

- Edit `codebase-context.json` with current information
- Restart Claude Desktop to reload

### Tool Not Found

- Ensure tool name matches exactly (e.g., `get_architecture`)
- Check that MCP server is active in Claude Desktop

## Future Enhancements

Consider adding:

- **Semantic Code Search**: Search actual code, not just context
- **Dependency Graph**: Understand component relationships
- **Performance Metrics**: Track bundle size, render performance
- **Test Coverage**: Integration with test suites
- **Change History**: Track architectural decisions over time

---

**Created for LiaiZen Co-Parenting Platform**
Better Co-Parenting Through Better Communication

This MCP server makes Claude an expert on your codebase, enabling faster development and more consistent code quality.
