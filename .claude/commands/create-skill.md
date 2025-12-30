---
description: Create a new agent skill with procedural guidance templates for workflow automation (project)
---

# /create-skill - Framework Delegation

**Delegates to framework's skill creation system.**

## Purpose

Creates a new skill in the framework's skill library at `sdd-agentic-framework/.claude/skills/`.

Skills are procedural workflows that:

- Provide step-by-step guidance
- Enforce constitutional compliance
- Enable workflow automation
- Reduce context usage through progressive disclosure

## Delegation to Framework

```markdown
Use the Task tool:

- subagent_type: "general-purpose"
- description: "Create new skill in framework"
- prompt: "Create a new skill using the framework's create-skill workflow.

Skill details from arguments: $ARGUMENTS

The skill should be created in: sdd-agentic-framework/.claude/skills/

Follow the framework's skill template and structure."
```

## Skill Categories

Skills are organized by category:

- `sdd-workflow/` - SDD methodology procedures (specify, plan, tasks)
- `validation/` - Quality and compliance checks
- `technical/` - Technical procedures (migrations, deployments)
- `integration/` - External service integrations

## Usage

```
/create-skill skill-name [options]
```

### With Agent Association

```
/create-skill api-design --agent backend-architect --category technical
```

### With Description

```
/create-skill api-design --description "Design RESTful API contracts following OpenAPI standards"
```

## Output

Creates skill structure in framework:

```
sdd-agentic-framework/.claude/skills/{category}/{skill-name}/
└── SKILL.md
```

## LiaiZen-Specific Note

Since we removed `.claude/skills/` from the main project to avoid duplication, all skills should be created in the framework. This ensures:

- ✅ Skills are shared across all projects using the framework
- ✅ No duplication between project and framework
- ✅ Framework updates include new/improved skills
- ✅ Consistent workflow procedures

If you need a LiaiZen-specific procedure, consider:

1. Adding it to framework skills (if useful for other co-parenting apps)
2. Creating a command instead (if it's project-specific orchestration)
3. Documenting it in CLAUDE.md (if it's just guidance)

## Framework Reference

- **Skills location**: `sdd-agentic-framework/.claude/skills/`
- **Template**: Framework provides skill structure template
- **Examples**: See existing skills in framework

---

**Pattern**: Framework skill creation (shared across projects)
