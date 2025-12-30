# .claude/ - LiaiZen Project Extensions

This directory contains **LiaiZen-specific extensions** to the [sdd-agentic-framework](../sdd-agentic-framework/).

## Architecture Pattern: Framework + Project Extensions

```
sdd-agentic-framework/           ← Core SDD framework (git submodule)
├── .claude/                     ← Framework's agents, skills, commands
├── .specify/                    ← Templates, scripts, constitution
└── src/sdd/                     ← Python DS-STAR agents

.claude/                         ← LiaiZen-specific extensions (THIS DIRECTORY)
├── agents/                      ← LiaiZen domain-specific agents only
├── commands/                    ← LiaiZen-customized command wrappers
└── settings.local.json          ← Project-specific permissions
```

## What's in This Directory

### Agents (LiaiZen-Specific Only)

**We only keep agents that are unique to LiaiZen's co-parenting domain:**

- `agents/product/product-manager.md` - Product strategy for co-parenting communication
- `agents/product/ui-designer.md` - UI/UX design specialist
- `agents/quality/engineering-diagnostic-agent.md` - Error diagnosis and root cause analysis

**All other agents come from the framework:**

```bash
# Framework agents (use these via relative paths):
../sdd-agentic-framework/.claude/agents/
├── architecture/
│   ├── backend-architect.md
│   └── subagent-architect.md
├── data/
│   └── database-specialist.md
├── engineering/
│   ├── frontend-specialist.md
│   └── full-stack-developer.md
├── operations/
│   ├── devops-engineer.md
│   └── performance-engineer.md
├── product/
│   ├── planning-agent.md
│   ├── prd-specialist.md
│   ├── specification-agent.md
│   ├── task-orchestrator.md
│   └── tasks-agent.md
└── quality/
    ├── security-specialist.md
    └── testing-specialist.md
```

### Commands (LiaiZen-Customized Wrappers)

These commands are **customized for LiaiZen** with:

- MCP server queries for codebase context
- LiaiZen architecture awareness
- Co-parenting domain validation
- Design system integration

**Commands:**

- `/create-prd` - Create Product Requirements Document
- `/specify` - Create feature specification (with MCP context)
- `/plan` - Create implementation plan (with MCP context)
- `/tasks` - Generate tasks from plan
- `/create-agent` - Create new specialized agent
- `/create-skill` - Create new skill
- `/validate-domain` - **LiaiZen-specific** co-parenting domain validation

These commands **delegate to framework agents** but add LiaiZen-specific context.

### Skills (Use Framework's)

We **DO NOT duplicate skills** - use framework versions directly:

```bash
# Framework skills (symlink or reference these):
../sdd-agentic-framework/.claude/skills/
├── sdd-workflow/
│   ├── planning-agent/
│   ├── sdd-planning/
│   ├── sdd-specification/
│   └── sdd-tasks/
└── validation/
```

**To use framework skills:**

Claude Code automatically searches parent directories for `.claude/skills/`, so the framework's skills are accessible.

## Usage Pattern

### When to Add to This Directory

**Add here ONLY if:**

- ✅ Agent is specific to co-parenting domain (not general software development)
- ✅ Command needs LiaiZen MCP integration or domain validation
- ✅ Configuration is project-specific (settings.local.json)

**Use framework version if:**

- ❌ Agent is general-purpose (backend, frontend, database, testing, etc.)
- ❌ Skill is part of SDD workflow (planning, specification, tasks)
- ❌ Command is standard SDD workflow step

### Example: Using Framework Agent

```markdown
# In a LiaiZen feature spec

When implementing backend changes, delegate to framework's backend-architect:

Use the Task tool:

- subagent_type: "backend-architect"
- description: "Design API endpoints for expense sharing"
- prompt: "Design RESTful API for co-parent expense tracking..."
```

Claude Code will find `backend-architect` in `../sdd-agentic-framework/.claude/agents/`.

### Example: Using LiaiZen Agent

```markdown
# For product strategy work

Use the Task tool:

- subagent_type: "product-manager"
- description: "Validate feature aligns with co-parenting best practices"
- prompt: "Review this expense feature for co-parenting suitability..."
```

Claude Code will find `product-manager` in `.claude/agents/product/`.

## Benefits of This Pattern

### ✅ Framework Updates

Get improvements from sdd-agentic-framework:

```bash
cd sdd-agentic-framework
git pull origin main
# Automatically get updated agents, skills, and core commands
```

### ✅ Clear Separation

- **Framework** = General SDD methodology, agents, workflows
- **Project** = LiaiZen domain expertise, MCP integration, custom validation

### ✅ Reduced Duplication

- 3 agents instead of 17
- 0 duplicate skills
- Commands reference framework but add LiaiZen context

### ✅ Easier Maintenance

- Framework agents update automatically via git submodule
- Only maintain LiaiZen-specific additions
- Clear documentation of what's custom vs standard

## Updating the Framework

To get latest framework improvements:

```bash
# Update submodule
git submodule update --remote sdd-agentic-framework

# Review changes
cd sdd-agentic-framework
git log --oneline -10

# Test that LiaiZen extensions still work
cd ..
# Run your /specify or /plan commands
```

## Framework vs Project Responsibilities

| Concern                                  | Owned By    | Location                                                |
| ---------------------------------------- | ----------- | ------------------------------------------------------- |
| SDD methodology                          | Framework   | `sdd-agentic-framework/.specify/`                       |
| Constitutional principles                | Framework   | `sdd-agentic-framework/.specify/memory/constitution.md` |
| General agents (backend, frontend, etc.) | Framework   | `sdd-agentic-framework/.claude/agents/`                 |
| SDD workflow skills                      | Framework   | `sdd-agentic-framework/.claude/skills/`                 |
| DS-STAR quality gates                    | Framework   | `sdd-agentic-framework/src/sdd/`                        |
| **Co-parenting domain**                  | **Project** | `.claude/agents/product/product-manager.md`             |
| **MCP integration**                      | **Project** | `.claude/commands/*.md`                                 |
| **LiaiZen validation**                   | **Project** | `.claude/commands/validate-domain.md`                   |
| **Project permissions**                  | **Project** | `.claude/settings.local.json`                           |

## Troubleshooting

### "Agent not found"

Check if it's a framework agent:

```bash
find sdd-agentic-framework/.claude/agents -name "backend-architect.md"
```

If found, it's accessible - Claude Code searches parent `.claude/` directories.

### "Skill not found"

Framework skills should be auto-discovered. If not:

```bash
ls sdd-agentic-framework/.claude/skills/
```

Verify the framework submodule is properly initialized:

```bash
git submodule status
git submodule update --init
```

### "Command behavior changed"

If framework updates break LiaiZen commands, you have two options:

1. **Pin framework version**: `cd sdd-agentic-framework && git checkout <stable-tag>`
2. **Update LiaiZen commands**: Adjust `.claude/commands/*.md` to work with new framework

## Related Documentation

- **Framework README**: `../sdd-agentic-framework/README.md`
- **Framework Setup**: `../sdd-agentic-framework/START_HERE.md`
- **SDD Workflow**: `../sdd-agentic-framework/AGENTS.md`
- **LiaiZen Architecture**: `../CLAUDE.md`
- **Co-Parenting Domain**: See agents/product/product-manager.md

---

**Last Updated**: 2025-12-29
**Pattern**: Framework + Project Extensions (Option 2)
