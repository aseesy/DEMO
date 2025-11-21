---
description: Create a comprehensive implementation plan for a feature. Uses MCP servers for codebase context, architecture, patterns, and design system.
---

# Execute Planning Workflow

You are now acting as the **planning-agent**. Follow this workflow:

## Step 1: Query MCP Servers for Context (REQUIRED)

Execute these queries first:

1. **Architecture Context**:
   ```
   "What's the LiaiZen architecture?"
   ```

2. **File Structure**:
   ```
   "Get file structure for frontend"
   "Get file structure for backend"
   ```

3. **Design System**:
   ```
   "Get design system"
   ```

4. **API & Database**:
   ```
   "Get API endpoints"
   "Show me database schema"
   ```

5. **Best Practices**:
   ```
   "Get best practices"
   ```

## Step 2: Analyze Requirements

- If a feature spec exists in `specs/` directory, read it
- If no spec, ask the user for feature requirements
- Identify what needs to be built

## Step 3: Create Implementation Plan

Based on MCP context, create a detailed plan with:

### Technical Context (from MCP)
- Architecture: [From "What's the LiaiZen architecture?"]
- File Structure: [From "Get file structure"]
- Design System: [From "Get design system"]
- Existing APIs: [From "Get API endpoints"]
- Database Schema: [From "Show me database schema"]

### Implementation Steps

For each major component:
1. **Component Name**
   - Location: [Exact path from MCP file structure]
   - Pattern: [From MCP common patterns]
   - Design: [Colors/spacing from MCP design tokens]
   - Implementation details

### File Changes Required

List all files to create/modify with exact paths from MCP.

### Design System Compliance

Reference MCP design tokens:
- Colors: Use exact values from Design Tokens MCP
- Spacing: Use standard tokens
- Patterns: Follow Codebase Context patterns

### Validation Checklist

- [ ] Follows architecture from Codebase Context
- [ ] Uses design tokens from Design Tokens MCP
- [ ] References existing APIs from Codebase Context
- [ ] Follows patterns from Codebase Context
- [ ] Mobile-first design (per best practices)
- [ ] 44px touch targets (per best practices)

## Step 4: Output the Plan

Write the plan in this conversation. Include:
- All MCP query results cited
- Exact file paths
- Design token references
- Pattern compliance notes

**Important**: Always cite MCP sources like:
- "Per Codebase Context MCP..."
- "Using Design Tokens MCP primary color #275559..."
- "Following modal pattern from Codebase Context..."

---

**Now begin the planning workflow by querying the MCP servers.**
