# LiaiZen Design Tokens MCP Server

A Model Context Protocol (MCP) server that provides access to LiaiZen's design tokens, enabling Claude to read, search, and update design tokens directly.

## Features

- **Get Token**: Retrieve specific design token values by path
- **List Tokens**: View all tokens or filter by category
- **Search Tokens**: Find tokens by keyword across names, values, and descriptions
- **Update Token**: Modify token values programmatically
- **Resource Access**: Read the entire design token system as a resource

## Installation

Already installed and configured in your Claude Desktop app!

## Available Tools

### 1. `get_token`

Get a specific design token value by its path.

**Example:**

```
get_token with path: "colors.brand.primary"
```

**Returns:**

```json
{
  "value": "#275559",
  "type": "color",
  "description": "Primary brand color - used for headers, important buttons, and key UI elements"
}
```

### 2. `list_tokens`

List all available design tokens or filter by category.

**Examples:**

```
list_tokens (no category = all tokens)
list_tokens with category: "colors"
list_tokens with category: "spacing"
```

**Returns:** Array of all tokens in the specified category with their paths, values, types, and descriptions.

### 3. `search_tokens`

Search for design tokens by keyword.

**Example:**

```
search_tokens with query: "primary"
search_tokens with query: "shadow"
search_tokens with query: "#275559"
```

**Returns:** Array of matching tokens.

### 4. `update_token`

Update a design token value (writes to tokens.json).

**Example:**

```
update_token with path: "colors.brand.primary" and value: "#2a5a5e"
```

## Design Token Categories

### Colors

- **Brand Colors**: `primary`, `secondary`, `accent`, `focus`
- **Background Colors**: `light`, `lighter`
- **UI Colors**: `white`, `gray` (50-900)

### Spacing

- `xs` (4px) through `3xl` (64px)

### Border Radius

- `sm` (6px) through `full` (rounded circles)

### Typography

- **Font Family**: Inter with system fallbacks
- **Font Size**: `xs` (12px) through `4xl` (36px)
- **Font Weight**: `normal`, `medium`, `semibold`, `bold`

### Shadows

- `sm` through `2xl` - various elevation levels

### Navigation

- **Heights**: Desktop (40px) and Mobile (48px)
- **Z-Index**: 50

### Modal

- **Z-Index**: 100 (above navigation)
- **Padding**: Mobile (96px) and Desktop (16px)

## Resource URI

Access the complete design token system:

```
liaizen://design-tokens
```

## File Structure

```
.design-tokens-mcp/
├── index.js          # MCP server implementation
├── package.json      # Dependencies
├── tokens.json       # Design token definitions
└── README.md         # This file
```

## Usage in Claude

Once configured, you can ask Claude to:

- "What's the primary brand color?"
- "List all spacing tokens"
- "Search for tokens related to navigation"
- "Update the modal z-index to 150"
- "Show me all shadow values"

## Updating Tokens

You can update tokens in two ways:

1. **Via Claude**: Use the `update_token` tool
2. **Manually**: Edit `tokens.json` and the changes will be immediately available

## Benefits

✅ **No Copy-Paste**: Claude has direct access to your design system
✅ **Always In Sync**: Real-time token values
✅ **Bidirectional**: Read AND write tokens
✅ **Searchable**: Find tokens by keyword
✅ **Persistent**: Token context across all Claude conversations

## Restarting Claude Desktop

After adding this MCP server, **restart Claude Desktop** to load the new configuration:

1. Quit Claude Desktop completely
2. Reopen Claude Desktop
3. The Design Tokens MCP server will be available automatically

## Testing

Test the server manually:

```bash
cd /Users/athenasees/Desktop/chat/.design-tokens-mcp
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node index.js
```

---

**Created for LiaiZen Co-Parenting Platform**
Better Co-Parenting Through Better Communication
