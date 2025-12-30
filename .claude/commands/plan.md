---
description: Create a comprehensive implementation plan for a feature. Uses MCP servers for codebase context, architecture, patterns, and design system.
---

# /plan - LiaiZen Edition

**Delegates to framework's planning-agent with LiaiZen-specific context.**

## LiaiZen Context Gathering (MCP Queries)

Before delegating, Claude Code should gather LiaiZen-specific context via MCP servers:

### Codebase Structure

```
1. "Get file structure for frontend"
   → Understand React component organization

2. "Get file structure for backend"
   → Know Express route and service structure
```

### Architecture & Patterns

```
3. "What's the LiaiZen architecture?"
   → System design, boundaries, data flow

4. "Get common patterns"
   → Existing code patterns to follow
```

### Design & API Context

```
5. "Get design system"
   → Design tokens, component library

6. "Get API endpoints"
   → Existing API structure to integrate with

7. "Show me database schema"
   → Tables, relationships, migrations
```

### Domain Principles

```
8. Review AI mediation constitution:
   - Location: chat-server/ai-mediation-constitution.md
   - Sender-first moderation principles
   - Communication coaching patterns
```

## Delegation to Framework

After gathering context, delegate to framework's planning-agent:

```markdown
Use the Task tool:

- subagent_type: "planning-agent"
- description: "Create implementation plan with LiaiZen context"
- prompt: "Execute the /plan command for the feature in specs/###-feature-name/

Context from LiaiZen MCP servers:

**File Structure**:

- Frontend: [Results from query 1]
- Backend: [Results from query 2]

**Architecture**: [Results from query 3]
**Code Patterns**: [Results from query 4]
**Design System**: [Results from query 5]
**API Endpoints**: [Results from query 6]
**Database Schema**: [Results from query 7]
**AI Mediation Principles**: [From constitution]

Please create an implementation plan following SDD methodology (research.md, data-model.md, contracts/, quickstart.md) with this LiaiZen-specific context."
```

## What the Framework Agent Will Do

The planning-agent (from `sdd-agentic-framework/.claude/agents/product/planning-agent.md`) will:

1. ✅ **Phase 0 - Research**: Technology evaluation, library selection, best practices
2. ✅ **Phase 1 - Design**: API contracts, data models, test scenarios
3. ✅ Constitutional validation (Library-First, Test-First, Contract-First)
4. ✅ Generate artifacts in `specs/###-feature-name/`:
   - `research.md` - Technical decisions and unknowns
   - `data-model.md` - Entity definitions and relationships
   - `contracts/` - API schemas (OpenAPI/GraphQL)
   - `quickstart.md` - Test scenarios and acceptance tests
5. ✅ Validate plan quality and completeness
6. ✅ Report readiness for `/tasks` phase

## Usage

Run after `/specify`:

```
/plan
```

The agent will automatically find the spec file and create the implementation plan.

## Next Steps

After `/plan` completes:

```
/tasks  # Generate dependency-ordered task list
```

## Framework Reference

- **Agent**: `sdd-agentic-framework/.claude/agents/product/planning-agent.md`
- **Template**: `sdd-agentic-framework/.specify/templates/plan-template.md`
- **Scripts**: `sdd-agentic-framework/.specify/scripts/bash/setup-plan.sh`
- **Workflow**: Phase 2 of SDD methodology

---

**Pattern**: LiaiZen context → Framework delegation → Plan artifacts
