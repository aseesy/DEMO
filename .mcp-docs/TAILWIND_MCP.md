# Tailwind CSS MCP Server

A comprehensive Model Context Protocol (MCP) server that provides TailwindCSS utilities, documentation, conversion tools, and template generation capabilities for the LiaiZen project.

## Features

The Tailwind CSS MCP Server provides the following tools:

### 1. **get_tailwind_utilities**

Get information about specific Tailwind CSS utility classes.

**Use Cases:**

- Check if a utility class exists
- Get documentation for a specific utility
- Understand utility class variants and modifiers

**Example:**

```
get_tailwind_utilities with class: "bg-gradient-to-br"
get_tailwind_utilities with class: "rounded-xl"
get_tailwind_utilities with class: "hover:shadow-lg"
```

### 2. **get_tailwind_colors**

Retrieve Tailwind's color palette or specific color information.

**Use Cases:**

- Browse available colors
- Find color hex values
- Check color shades (50-900)

**Example:**

```
get_tailwind_colors (all colors)
get_tailwind_colors with color: "teal"
get_tailwind_colors with color: "gray"
```

### 3. **get_tailwind_config_guide**

Get guidance on configuring Tailwind CSS for your project.

**Use Cases:**

- Learn how to extend the default theme
- Add custom colors or spacing
- Configure plugins and variants

**Example:**

```
get_tailwind_config_guide
```

### 4. **search_tailwind_docs**

Search through Tailwind CSS documentation.

**Use Cases:**

- Find utilities for a specific use case
- Search for layout patterns
- Look up responsive design utilities

**Example:**

```
search_tailwind_docs with query: "flex layout"
search_tailwind_docs with query: "modal backdrop"
search_tailwind_docs with query: "z-index"
```

### 5. **install_tailwind**

Get installation instructions for Tailwind CSS.

**Use Cases:**

- Set up Tailwind in a new project
- Configure for specific frameworks (React, Vue, etc.)
- PostCSS configuration

**Example:**

```
install_tailwind with framework: "react"
install_tailwind with framework: "vite"
```

### 6. **convert_css_to_tailwind**

Convert vanilla CSS to Tailwind utility classes.

**Use Cases:**

- Migrate from custom CSS to Tailwind
- Learn Tailwind equivalents for CSS properties
- Optimize existing styles

**Example:**

```
convert_css_to_tailwind with css: "background-color: #275559; padding: 1rem; border-radius: 0.5rem;"
```

## LiaiZen-Specific Usage

### Brand Colors

Our brand colors are already defined in the design tokens:

- Primary: `#275559` → Use `bg-[#275559]` or `text-[#275559]`
- Secondary: `#4DA8B0` → Use `bg-[#4DA8B0]`
- Accent: `#6dd4b0` → Use `bg-[#6dd4b0]`

### Common Patterns

#### Modals

```
Ask: "What Tailwind classes should I use for a modal with proper z-index?"
```

#### Navigation

```
Ask: "How do I create a fixed navigation bar with Tailwind?"
```

#### Buttons

```
Ask: "Convert this CSS to Tailwind for a button: padding: 0.75rem 1.5rem; background: #275559; border-radius: 0.75rem;"
```

#### Responsive Design

```
Ask: "What are the responsive breakpoints in Tailwind?"
Ask: "How do I make this component responsive from mobile to desktop?"
```

## Configuration

The server is configured to work with your LiaiZen project:

- **Project Path**: `/Users/athenasees/Desktop/chat/chat-client-vite`
- **Tailwind Config**: `tailwind.config.js`
- **Tailwind Version**: v4.x (using @import directive)

## Benefits

✅ **Real-time Documentation**: Access Tailwind docs without leaving Claude
✅ **CSS Conversion**: Convert existing CSS to Tailwind classes
✅ **Class Validation**: Check if utility classes exist
✅ **Color Palette**: Browse and use Tailwind colors
✅ **Best Practices**: Get guidance on Tailwind configuration
✅ **Framework Integration**: Tailwind setup for React/Vite

## Common Use Cases

### Optimize Existing Components

```
"Review this component and suggest Tailwind optimizations:
<div className='bg-white rounded-xl shadow-lg p-6'>..."
```

### Convert Legacy CSS

```
"Convert this CSS to Tailwind classes:
.card { padding: 24px; background: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }"
```

### Responsive Design

```
"Help me make this button responsive:
- Mobile: Full width, smaller padding
- Desktop: Auto width, larger padding"
```

### Color Consistency

```
"What Tailwind classes should I use for these colors?
- Primary: #275559
- Light background: #E6F7F5
- Border: #C5E8E4"
```

### Layout Patterns

```
"Show me how to create a centered modal with backdrop using Tailwind"
"How do I create a sticky footer navigation?"
```

## Integration with Design Tokens

The Tailwind MCP server works alongside the Design Tokens MCP server:

1. **Design Tokens MCP**: Get brand-specific values (colors, spacing, shadows)
2. **Tailwind MCP**: Convert those values to Tailwind classes

**Example Workflow:**

```
1. Ask Design Tokens: "What's the primary brand color?"
   → Returns: #275559

2. Ask Tailwind: "How do I use #275559 in Tailwind?"
   → Returns: bg-[#275559] or extend theme in config
```

## Restarting Claude Desktop

After adding this MCP server, **restart Claude Desktop** to load the new configuration:

1. Quit Claude Desktop completely (Cmd+Q)
2. Reopen Claude Desktop
3. Both Design Tokens and Tailwind MCP servers will be available

## Troubleshooting

### Server Not Loading

- Ensure you restarted Claude Desktop after configuration
- Check that npx can access `tailwindcss-mcp-server`
- Verify the TAILWIND_PROJECT_PATH exists

### Classes Not Found

- Some custom classes may need to be added to `tailwind.config.js`
- Use arbitrary values with `[]` syntax for custom values

### Conversion Issues

- Not all CSS can be directly converted to Tailwind
- Some complex CSS may require custom classes

## Resources

- **Official Docs**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **MCP Server**: [tailwindcss-mcp-server on npm](https://www.npmjs.com/package/tailwindcss-mcp-server)
- **LiaiZen Design System**: See `.design-tokens-mcp/tokens.json`

---

**Configured for LiaiZen Co-Parenting Platform**
Better Co-Parenting Through Better Communication
