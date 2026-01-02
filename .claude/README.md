# .claude/ - LiaiZen Project Extensions

This directory contains **LiaiZen-specific extensions** to the SDD framework.

## Architecture Pattern: Integrated Framework + Project Extensions

```
.specify/                        ← SDD framework code (integrated)
├── memory/                      ← Constitutional governance
├── scripts/bash/                ← Automation scripts
├── src/sdd/                     ← Python DS-STAR agents
├── config/                      ← Framework configuration
└── specs/                       ← Feature specifications

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

**General-purpose agents are referenced via SDD framework patterns:**

The SDD framework provides general-purpose agent patterns and workflows. For specific agent implementations, refer to the SDD framework documentation in `.specify/` and `docs/AGENTS.md`.

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

### Skills (SDD Framework)

SDD framework skills and workflows are integrated into the framework codebase in `.specify/`. For skill patterns and workflows, refer to the SDD framework documentation.

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

### Example: Using SDD Framework Patterns

```markdown
# In a LiaiZen feature spec

When implementing backend changes, refer to SDD framework patterns:

Use the Task tool with appropriate agent type for backend architecture work.
Refer to docs/AGENTS.md for available agent patterns.
```

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

### ✅ Clear Separation

- **Framework** = General SDD methodology (in `.specify/`)
- **Project** = LiaiZen domain expertise, MCP integration, custom validation

### ✅ Reduced Duplication

- 3 LiaiZen-specific agents
- Commands reference framework but add LiaiZen context
- Framework code integrated in `.specify/`

### ✅ Easier Maintenance

- Framework code integrated directly (no submodule complexity)
- Only maintain LiaiZen-specific additions
- Clear documentation of what's custom vs standard

## Framework vs Project Responsibilities

| Concern                                  | Owned By    | Location                                                |
| ---------------------------------------- | ----------- | ------------------------------------------------------- |
| SDD methodology                          | Framework   | `.specify/`                                             |
| Constitutional principles                | Framework   | `.specify/memory/constitution.md`                       |
| DS-STAR quality gates                    | Framework   | `.specify/src/sdd/`                                     |
| Automation scripts                       | Framework   | `.specify/scripts/bash/`                                |
| **Co-parenting domain**                  | **Project** | `.claude/agents/product/product-manager.md`             |
| **MCP integration**                      | **Project** | `.claude/commands/*.md`                                 |
| **LiaiZen validation**                   | **Project** | `.claude/commands/validate-domain.md`                   |
| **Project permissions**                  | **Project** | `.claude/settings.local.json`                           |

## Troubleshooting

### "Agent not found"

LiaiZen-specific agents are in `.claude/agents/`. For general SDD framework agent patterns, refer to `docs/AGENTS.md`.

### "Command behavior changed"

If framework changes break LiaiZen commands, update `.claude/commands/*.md` to work with the updated framework code in `.specify/`.

## Related Documentation

- **SDD Framework**: `.specify/` directory (framework code)
- **SDD Agents Reference**: `docs/AGENTS.md`
- **LiaiZen Architecture**: `CLAUDE.md`
- **Co-Parenting Domain**: See agents/product/product-manager.md

---

**Last Updated**: 2025-01-02
**Pattern**: Integrated Framework + Project Extensions
