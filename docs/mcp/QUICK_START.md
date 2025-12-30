# Quick Start Guide: Using LiaiZen MCP Servers

This guide shows you how to use the three custom MCP servers (Design Tokens, Tailwind CSS, and Codebase Context) together for maximum productivity.

## 🚀 First Time Setup

### 1. Restart Claude Desktop

After adding MCP servers, restart Claude Desktop to activate them:

1. Quit Claude Desktop (Cmd+Q)
2. Reopen Claude Desktop
3. All MCP servers load automatically

### 2. Verify Servers Are Active

Ask Claude:

```
"List all available MCP servers"
```

You should see:

- ✅ liaizen-design-tokens
- ✅ tailwindcss
- ✅ liaizen-codebase-context
- ✅ 6 other servers (Brave Search, Chrome DevTools, etc.)

## 💡 Common Workflows

### Workflow 1: Building a New Component

**Step 1: Understand the Pattern**

```
"What's the common pattern for React components in LiaiZen?"
```

→ Codebase Context returns: Functional components with hooks, naming conventions, file structure

**Step 2: Get Design Values**

```
"What's the primary brand color?"
"What's the standard border radius?"
```

→ Design Tokens returns: #275559, 0.75rem (lg)

**Step 3: Convert to Tailwind**

```
"Convert these to Tailwind classes:
- Background: #275559
- Border radius: 0.75rem
- Padding: 1rem"
```

→ Tailwind CSS returns: bg-[#275559] rounded-lg p-4

**Step 4: Apply the Pattern**
Create your component following the pattern with the correct classes.

---

### Workflow 2: Creating a Modal

**Step 1: Get Modal Pattern**

```
"What's the modal pattern in LiaiZen?"
```

→ Codebase Context returns: z-[100], items-center, pt-16 pb-24 (mobile), max-h-full

**Step 2: Get Colors and Spacing**

```
"List all spacing tokens"
"Get the modal z-index token"
```

→ Design Tokens returns: Spacing values and z-index specifications

**Step 3: Build with Tailwind**

```
"Show me Tailwind classes for:
- Fixed overlay with backdrop
- Centered modal
- White background with shadow
- Responsive padding"
```

→ Tailwind CSS returns: Complete class list

---

### Workflow 3: Styling a Button

**Step 1: Get Button Pattern**

```
"What's the button pattern in LiaiZen?"
```

→ Codebase Context returns: Primary (bg-[#275559]), Secondary (bg-[#4DA8B0]), rounded-lg, min-h-[44px]

**Step 2: Get Exact Color Values**

```
"Get the primary button color"
"Get the secondary button color"
```

→ Design Tokens returns: Exact hex values and descriptions

**Step 3: Optimize with Tailwind**

```
"What's the best way to style a primary button in Tailwind with:
- Background: #275559
- White text
- Rounded corners
- Hover effect"
```

→ Tailwind CSS returns: Optimized class string

---

### Workflow 4: Understanding the Codebase

**Step 1: Get Architecture Overview**

```
"What's the LiaiZen architecture?"
```

→ Codebase Context returns: Frontend (React/Vite), Backend (Node.js/Express), deployment strategy

**Step 2: Find File Locations**

```
"Where are React components located?"
"Where are API routes defined?"
```

→ Codebase Context returns: Exact file paths and structure

**Step 3: Understand API Patterns**

```
"What API endpoints are available for tasks?"
"What's the database schema for tasks?"
```

→ Codebase Context returns: Endpoint list and table structure

---

### Workflow 5: Fixing Common Issues

**Step 1: Identify the Issue**

```
"What are common issues with modals?"
```

→ Codebase Context returns: Modal overlap problems and solutions

**Step 2: Get Correct Values**

```
"What's the navigation z-index?"
"What's the modal z-index?"
```

→ Design Tokens returns: nav z-50, modal z-100

**Step 3: Apply the Fix**

```
"Show me Tailwind classes for a modal that won't overlap navigation"
```

→ Tailwind CSS returns: z-[100], proper padding classes

---

## 🎯 Power Tips

### Tip 1: Chain Multiple Servers

Don't ask everything at once. Chain requests for better results:

❌ **Bad:**

```
"Give me everything about buttons"
```

✅ **Good:**

```
1. "What's the button pattern?" (Codebase Context)
2. "Get the primary color" (Design Tokens)
3. "Convert #275559 to Tailwind" (Tailwind CSS)
```

### Tip 2: Be Specific About Which Server

When ambiguous, specify the server:

```
"Get the primary brand color from Design Tokens"
"Search for 'modal' in Codebase Context"
"Convert this CSS to Tailwind using the Tailwind MCP"
```

### Tip 3: Update Context When Things Change

When you make architectural changes:

1. Update `.codebase-context-mcp/codebase-context.json`
2. Update `.design-tokens-mcp/tokens.json` if design system changes
3. Restart Claude Desktop to reload

### Tip 4: Use Search Functions

All three servers have search capabilities:

**Design Tokens:**

```
"Search for tokens with 'shadow'"
```

**Codebase Context:**

```
"Search context for 'navigation'"
```

**Tailwind CSS:**

```
"Search Tailwind docs for 'flex layout'"
```

### Tip 5: Combine with Other MCP Servers

Use alongside Filesystem, GitHub, and Chrome DevTools:

**Complete Feature Workflow:**

```
1. "What's the component pattern?" (Codebase Context)
2. "Get brand colors" (Design Tokens)
3. "Convert to Tailwind" (Tailwind CSS)
4. "Read the similar component file" (Filesystem)
5. "Create the new component" (You write code)
6. "Test in Chrome" (Chrome DevTools)
7. "Create a PR" (GitHub)
```

---

## 📋 Quick Reference Commands

### Design Tokens MCP

```
"Get primary brand color"
"List all spacing tokens"
"Search for 'shadow' tokens"
"Update modal z-index to 150"
```

### Tailwind CSS MCP

```
"Convert CSS to Tailwind: padding: 1rem; background: #275559;"
"What are Tailwind responsive breakpoints?"
"How do I create a modal backdrop?"
"Search Tailwind docs for 'z-index'"
```

### Codebase Context MCP

```
"What's the LiaiZen architecture?"
"Get the modal pattern"
"Where are components located?"
"What are the API endpoints?"
"Show me the database schema"
"Get best practices"
"What are common issues?"
"Search context for 'navigation'"
```

---

## 🔧 Troubleshooting

### Server Not Responding

1. Check if Claude Desktop was restarted after config changes
2. Verify config file: `/Users/athenasees/Library/Application Support/Claude/claude_desktop_config.json`
3. Check server logs in Claude Desktop settings

### Wrong Information Returned

1. Ensure you're asking the right server
2. Be more specific in your query
3. Update context files if codebase changed

### Multiple Servers Conflicting

1. Use specific server names in queries
2. Ask one server at a time for clarity
3. Chain requests in sequence

---

## 🎓 Learning Path

### Week 1: Get Familiar

- Use Codebase Context to understand architecture
- Browse Design Tokens to learn the design system
- Ask Tailwind CSS for class recommendations

### Week 2: Build Features

- Create components following patterns from Codebase Context
- Use Design Tokens for consistent styling
- Optimize with Tailwind CSS utilities

### Week 3: Master the Workflow

- Chain all three servers together
- Combine with Filesystem and GitHub MCP
- Update context files with your changes

---

## 💪 Advanced Usage

### Create New Patterns

When you establish a new pattern:

1. **Document in Codebase Context**

   ```json
   {
     "commonPatterns": {
       "yourNewPattern": {
         "description": "...",
         "usage": "..."
       }
     }
   }
   ```

2. **Add to Design Tokens** (if applicable)

   ```json
   {
     "yourCategory": {
       "value": "...",
       "type": "...",
       "description": "..."
     }
   }
   ```

3. **Query via MCP**
   ```
   "Get the pattern for [yourNewPattern]"
   ```

### Build Custom Workflows

Combine MCP servers with shell scripts:

```bash
# Example: Generate component with tokens
echo "1. Get architecture" && \
echo "2. Get design tokens" && \
echo "3. Generate Tailwind classes" && \
echo "4. Create component file"
```

---

## 🚀 Next Steps

1. ✅ Restart Claude Desktop (if you haven't)
2. ✅ Try the "Building a New Component" workflow
3. ✅ Explore Codebase Context with "What's the architecture?"
4. ✅ Get familiar with Design Tokens
5. ✅ Practice converting CSS to Tailwind

---

**Happy Coding! 🎉**

_LiaiZen Co-Parenting Platform_
_Better Co-Parenting Through Better Communication_
