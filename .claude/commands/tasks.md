---
description: Break down an implementation plan into actionable tasks using the tasks-agent. Executes Phase 3 of the SDD workflow.
---

# /tasks - LiaiZen Edition

**Delegates to framework's tasks-agent with dependency analysis.**

## Prerequisites

Before running `/tasks`:

- ✅ Feature specification exists (`specs/###-feature-name/spec.md`)
- ✅ Implementation plan complete (`specs/###-feature-name/plan.md`)
- ✅ Design artifacts generated:
  - `research.md`
  - `data-model.md`
  - `contracts/`
  - `quickstart.md`

## Delegation to Framework

Delegate directly to framework's tasks-agent:

```markdown
Use the Task tool:

- subagent_type: "tasks-agent"
- description: "Generate dependency-ordered task list"
- prompt: "Execute the /tasks command for the feature in specs/###-feature-name/

Please generate a task list from the implementation plan following SDD methodology with:

- Dependency analysis (sequential vs parallel tasks)
- Parallel execution markers [P] for independent work
- Agent assignment recommendations
- Acceptance criteria linkage"
```

## What the Framework Agent Will Do

The tasks-agent (from `sdd-agentic-framework/.claude/agents/product/tasks-agent.md`) will:

1. ✅ Read implementation plan and design artifacts
2. ✅ Analyze task dependencies
3. ✅ Generate `specs/###-feature-name/tasks.md` with:
   - Task breakdown by component
   - Dependency order (what must come first)
   - Parallel execution markers `[P]`
   - Suggested agent for each task
   - Acceptance criteria references
4. ✅ Validate prerequisites exist
5. ✅ Report task count and parallelization opportunities

## Usage

Run after `/plan`:

```
/tasks
```

The agent will automatically find the plan and generate the task list.

## Output Format

Tasks will be organized as:

```markdown
## Phase 1: Foundation [Sequential]

1. Create database migration for expense table
   - Agent: database-specialist
   - Depends on: none
   - Acceptance: Migration creates expense table with required fields

2. Define expense API contracts
   - Agent: backend-architect
   - Depends on: task 1
   - Acceptance: OpenAPI schema validated

## Phase 2: Implementation [Parallel]

3. [P] Implement backend expense endpoints
   - Agent: backend-architect
   - Depends on: task 2

4. [P] Create expense form UI components
   - Agent: frontend-specialist
   - Depends on: task 2

5. [P] Write contract tests for expense API
   - Agent: testing-specialist
   - Depends on: task 2
```

## LiaiZen-Specific Agent Recommendations

The tasks-agent may recommend LiaiZen-specific agents:

- **product-manager**: Feature validation against co-parenting principles
- **ui-designer**: UI/UX design for co-parent workflows
- **engineering-diagnostic-agent**: Complex debugging scenarios

These are found in `.claude/agents/` and work seamlessly with framework agents.

## Next Steps

After `/tasks` completes:

1. Review task list with team/stakeholders
2. Assign tasks to developers
3. Execute tasks in dependency order
4. Use `/finalize` before committing (framework command for constitutional validation)

## Framework Reference

- **Agent**: `sdd-agentic-framework/.claude/agents/product/tasks-agent.md`
- **Template**: `sdd-agentic-framework/.specify/templates/tasks-template.md`
- **Scripts**: `sdd-agentic-framework/.specify/scripts/bash/check-task-prerequisites.sh`
- **Workflow**: Phase 3 of SDD methodology

---

**Pattern**: Framework delegation → Dependency-ordered task list
