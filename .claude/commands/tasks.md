---
description: Break down an implementation plan into actionable tasks using the tasks-agent. Executes Phase 3 of the SDD workflow (after planning).
---

# /tasks Command

**Execute this command to break down an implementation plan into granular, actionable tasks.**

## What This Command Does

The `/tasks` command invokes the **tasks-agent** to:

1. **Load the implementation plan** (from planning-agent)
2. **Query MCP servers** for file structure, patterns, design tokens
3. **Decompose plan** into atomic, actionable tasks
4. **Map task dependencies** and execution sequence
5. **Add acceptance criteria** for each task
6. **Estimate complexity** and time requirements
7. **Produce task artifact**: `tasks.md` (or tasks.yaml)

## Prerequisites

Before running `/tasks`:

- ✅ Implementation plan exists (`plan.md` from `/plan`)
- ✅ MCP servers are active (restart Claude Desktop if needed)
- ✅ You're in the project root: `/Users/athenasees/Desktop/chat`

## Usage

### Basic Usage (with existing plan):

```
/tasks
```

This will:

1. Look for the most recent plan.md
2. Execute tasks-agent workflow
3. Create tasks.md with dependency-ordered task list

### With Feature Name:

```
/tasks expense-tracking
```

### With Path to Plan:

```
/tasks --plan path/to/plan.md
```

## How It Works

The tasks-agent will **automatically**:

### Query MCP for Context

```
1. "Get file structure for frontend/backend"
   → Know exact paths for task file locations

2. "What are common patterns for [feature type]?"
   → Include pattern details in tasks

3. "Get design tokens"
   → Reference colors/spacing in styling tasks

4. "Get dependencies"
   → Know available libraries

5. "Get API endpoints"
   → Reference existing APIs
```

### Create Tasks with MCP Context

Each task will include:

- **Exact file paths** from Codebase Context MCP
- **Pattern details** from common patterns
- **Design tokens** from Design Tokens MCP
- **API/database references** from Codebase Context

## Output File

After `/tasks` completes:

```
specs/[feature-id]/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan
└── tasks.md             # Task list ⭐ NEW
```

## Example Output (tasks.md)

```markdown
# Task List: Expense Tracking Feature

## Task 1: Create Expenses Database Table

**Type**: infrastructure
**Priority**: critical
**Complexity**: small
**Estimated Hours**: 1

**Description**:
Create expenses table in SQLite database (from Codebase Context MCP):

- Fields: id, user_id, amount, category, date, description, receipt_url
- Schema follows existing pattern (users, contacts, tasks tables)

**Files**:

- Path: chat-server/db.js (from "Get file structure")
  Action: modify

**Acceptance Criteria**:

- [ ] Expenses table created
- [ ] Migration script added
- [ ] Table schema validated

---

## Task 2: Create ExpenseModal Component

**Type**: feature
**Priority**: high
**Complexity**: medium
**Estimated Hours**: 3
**Dependencies**: []

**Description**:
Create modal following LiaiZen pattern (from Codebase Context MCP):

- Container: z-[100] (above navigation z-50)
- Positioning: items-center justify-center
- Padding: pt-16 pb-24 (mobile), pt-4 pb-4 (desktop)
- Backdrop: bg-black/40

**Files**:

- Path: chat-client-vite/src/components/modals/ExpenseModal.jsx (from "Get file structure")
  Action: create

**Acceptance Criteria**:

- [ ] Modal follows standard pattern
- [ ] Form fields included (amount, category, date, description)
- [ ] Receipt upload functionality
- [ ] Proper z-index and padding

---

## Task 3: Style Expense Form

**Type**: feature
**Priority**: medium
**Complexity**: small
**Estimated Hours**: 2
**Dependencies**: [Task 2]

**Description**:
Apply brand styling (from Design Tokens MCP):

- Primary button: bg-[#275559], rounded-lg, min-h-[44px]
- Input fields: min-h-[44px], border-2, focus:border-[#275559]
- Success button: bg-[#6dd4b0]

**Acceptance Criteria**:

- [ ] Follows design tokens
- [ ] Touch targets 44px minimum
- [ ] Responsive on mobile
```

## Next Steps After /tasks

Once tasks are created:

1. **Review task list** for accuracy and completeness
2. **Assign tasks** to team members or AI agents
3. **Execute tasks** in dependency order
4. **Track progress** through task checklist

## MCP Server Benefits

The tasks-agent **automatically uses MCP servers** to:

- ✅ **Exact file paths** from Codebase Context (no guessing)
- ✅ **Pattern compliance** in task descriptions
- ✅ **Design token references** for styling tasks
- ✅ **API/database accuracy** from Codebase Context
- ✅ **Dependency awareness** through context queries

## Troubleshooting

### "Plan not found"

**Solution**: Run `/plan` first to create plan.md

### "MCP servers not responding"

**Solution**: Restart Claude Desktop (Cmd+Q, reopen)

### "Tasks too granular/not granular enough"

**Solution**: Specify `--granularity [coarse|fine]` when running command

### "Incorrect file paths"

**Solution**: Update Codebase Context MCP if file structure changed

## Task Execution Order

Tasks are ordered by dependencies:

1. **Infrastructure tasks** (database, API setup) - no dependencies
2. **Component tasks** - depend on infrastructure
3. **Styling tasks** - depend on components
4. **Integration tasks** - depend on components + API
5. **Testing tasks** - depend on implementation
6. **Documentation tasks** - depend on completion

## Related Commands

- `/specify` - Create feature specification (Phase 1)
- `/plan` - Create implementation plan (Phase 2)
- `/validate-domain` - Validate against co-parenting domain

## Learn More

- **Tasks Agent Details**: `sdd-agentic-framework/.claude/agents/product/tasks-agent.md`
- **MCP Integration Guide**: `sdd-agentic-framework/.docs/mcp-integration-guide.md`

---

**Tasks with MCP = Accurate Paths, Patterns, and Design References**
