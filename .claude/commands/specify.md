---
description: Create a detailed feature specification using the specification-agent. Executes Phase 1 of the SDD workflow.
---

# /specify - LiaiZen Edition

**Delegates to framework's specification-agent with LiaiZen-specific context.**

## LiaiZen Context Gathering (MCP Queries)

Before delegating, Claude Code should gather LiaiZen-specific context via MCP servers:

### Architecture & Technical Context

```
1. "What's the LiaiZen architecture?"
   → Get system architecture, tech stack, deployment info

2. "Get API endpoints"
   → Understand existing APIs to reference

3. "Show me database schema"
   → Know data structures and relationships
```

### Design & Domain Context

```
4. "Get design system"
   → Colors, spacing, components for UI specs

5. "Get best practices"
   → LiaiZen coding standards and co-parenting domain principles
```

### Co-Parenting Domain Context

```
6. Review co-parenting principles from CLAUDE.md:
   - Win/Win Outcomes (benefit all parties)
   - Conflict Reduction (de-escalation focus)
   - Privacy & Security (COPPA, GDPR)
   - Accessibility (varying technical skills)
```

## Delegation to Framework

After gathering context, delegate to framework's specification-agent:

```markdown
Use the Task tool:

- subagent_type: "specification-agent"
- description: "Create feature specification with LiaiZen context"
- prompt: "Execute the /specify command for feature: $FEATURE_NAME

Context from LiaiZen MCP servers:

**Architecture**: [Results from query 1]
**Existing APIs**: [Results from query 2]
**Database Schema**: [Results from query 3]
**Design System**: [Results from query 4]
**Best Practices**: [Results from query 5]
**Co-Parenting Principles**: [From CLAUDE.md]

Please create a detailed specification following SDD methodology with this LiaiZen-specific context."
```

## What the Framework Agent Will Do

The specification-agent (from `sdd-agentic-framework/.claude/agents/product/specification-agent.md`) will:

1. ✅ Create or update feature branch (with user approval)
2. ✅ Generate `specs/###-feature-name/spec.md` using template
3. ✅ Include user stories, acceptance criteria, requirements
4. ✅ Run domain detection to identify needed agents
5. ✅ Validate specification quality
6. ✅ Report completion with validation score

## Usage Examples

### Basic Usage

```
/specify expense-tracking
```

### With Description

```
/specify expense-tracking "Allow co-parents to track and split child-related expenses with receipt uploads and fair split calculations"
```

## Next Steps

After `/specify` completes:

```
/plan   # Create implementation plan with architecture details
```

## Framework Reference

- **Agent**: `sdd-agentic-framework/.claude/agents/product/specification-agent.md`
- **Template**: `sdd-agentic-framework/.specify/templates/spec-template.md`
- **Workflow**: Phase 1 of SDD methodology

---

**Pattern**: LiaiZen context → Framework delegation → Spec artifact
