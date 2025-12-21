---
description: Create a detailed feature specification using the specification-agent. Executes Phase 1 of the SDD workflow.
---

# /specify Command

**Execute this command to create a detailed, executable feature specification.**

## What This Command Does

The `/specify` command invokes the **specification-agent** to:

1. **Gather requirements** from user input or business objectives
2. **Query MCP servers** for technical constraints and design system
3. **Create user stories** with acceptance criteria
4. **Define functional requirements** with business rules
5. **Document non-functional requirements** (performance, security, usability)
6. **Specify technical constraints** (architecture, APIs, design system)
7. **Produce specification artifact**: `spec.md`

## Prerequisites

Before running `/specify`:

- ✅ MCP servers are active (restart Claude Desktop if needed)
- ✅ You're in the project root: `/Users/athenasees/Desktop/chat`
- ✅ You have a clear feature idea or requirement

## Usage

### Basic Usage (interactive):

```
/specify
```

This will:

1. Prompt you for feature name and description
2. Ask for user stories and requirements
3. Query MCP servers for context
4. Generate spec.md

### With Feature Name:

```
/specify expense-tracking
```

### With Initial Description:

```
/specify expense-tracking --description "Allow co-parents to track and split child-related expenses"
```

## How It Works

The specification-agent will **automatically**:

### Query MCP for Context

```
1. "What's the LiaiZen architecture?"
   → Understand technical constraints

2. "Get API endpoints"
   → Know existing APIs to reference

3. "Show me database schema"
   → Understand data structure

4. "Get design system"
   → Colors, spacing for UI specs

5. "Get best practices"
   → LiaiZen standards and philosophies
```

### Create Specification Sections

- **Overview**: Feature name, objective, success metrics
- **User Stories**: As a [user], I want to [action], so that [benefit]
- **Functional Requirements**: Core functionality, business rules
- **Non-Functional Requirements**: Performance, security, usability
- **Technical Constraints**: Architecture, API integration, design system
- **Acceptance Criteria**: Testable conditions for completion

## Output File

After `/specify` completes:

```
specs/[feature-id]-[feature-name]/
└── spec.md              # Feature specification ⭐
```

## Example Output (spec.md)

```markdown
# Feature Specification: Expense Tracking

## Overview

**Feature Name**: Expense Tracking
**Business Objective**: Allow co-parents to track, categorize, and fairly split child-related expenses

**Technical Context** (from Codebase Context MCP):

- Architecture: React 18 + Vite frontend, Node.js + Express backend
- Database: SQLite (expenses table will be added)
- Deployment: Vercel (frontend), Railway (backend)

## User Stories

**As a co-parent**, I want to **log child-related expenses**, so that **I can track spending and request reimbursement**.

**Acceptance Criteria**:

- Can add expense with amount, category, date, description
- Can attach receipt photo
- Can mark as reimbursable or informational
- Expense appears in shared expense list

## Technical Constraints

**Architecture** (Codebase Context MCP):

- Must integrate with existing authentication (JWT + Google OAuth)
- Must use Socket.io for real-time updates
- Must follow React functional component + hooks pattern

**Design System** (Design Tokens MCP):

- Colors: Primary #275559, Success #6dd4b0
- Forms: min-h-[44px] inputs, border-2
- Buttons: rounded-lg, min-h-[44px]

**API Integration** (Codebase Context MCP):

- Create new endpoints: GET/POST /api/expenses
- Follow existing API pattern (RESTful, JWT auth)
```

## Next Steps After /specify

Once specification is complete:

```
/plan
```

This will invoke **planning-agent** to create an implementation plan.

## MCP Server Benefits

The specification-agent **automatically uses MCP servers** to:

- ✅ **Accurate technical constraints** from Codebase Context
- ✅ **Design system compliance** from Design Tokens
- ✅ **Existing API patterns** referenced
- ✅ **Database schema awareness**
- ✅ **Best practices** automatically incorporated

## Troubleshooting

### "Feature already exists"

**Solution**: Use a different feature name or update existing spec

### "MCP servers not responding"

**Solution**: Restart Claude Desktop (Cmd+Q, reopen)

### "Unclear requirements"

**Solution**: Agent will ask clarifying questions - provide more detail

## Related Commands

- `/plan` - Create implementation plan (Phase 2)
- `/tasks` - Break down plan into tasks (Phase 3)
- `/validate-domain` - Validate against co-parenting domain

## Learn More

- **Specification Agent Details**: `sdd-agentic-framework/.claude/agents/product/specification-agent.md`
- **MCP Integration Guide**: `sdd-agentic-framework/.docs/mcp-integration-guide.md`

---

**Specification with MCP = Technically Accurate, Design-Consistent Specs**
