---
description: /create-prd - Create Product Requirements Document (project)
---

# /create-prd - LiaiZen Edition

**Delegates to framework's prd-specialist for comprehensive PRD creation.**

## Purpose

Creates a Product Requirements Document (PRD) that serves as the Single Source of Truth (SSOT) for:

- Product vision and goals
- User personas and journeys (co-parent specific)
- Core features and requirements
- Constitutional customizations (all 14 SDD principles)
- Technical constraints
- Release strategy and MVP definition

## LiaiZen Context

Before delegating, note LiaiZen-specific context:

### Co-Parenting Domain Principles

```
1. Win/Win Outcomes - Features benefit both parents and children
2. Conflict Reduction - De-escalation and respectful communication
3. Privacy & Security - COPPA and GDPR compliance for family data
4. Accessibility - Work for varying technical skill levels
5. Emotional Safety - Design for high-stress situations
6. Child-Centric - Prioritize children's wellbeing
```

### LiaiZen-Specific Personas

```
- Separated parents (primary and secondary custody)
- High-conflict co-parents needing mediation
- Tech-savvy vs non-technical users
- Parents with varying emotional regulation
- Parents prioritizing child wellbeing
```

### Product Context

```
- Platform: Web app (React + Vite frontend, Node.js + Express backend)
- Key Features: AI-mediated messaging, shared calendars, expense tracking
- Deployment: Vercel (frontend), Railway (backend)
- Database: PostgreSQL (Railway), Neo4j (relationships)
```

## Delegation to Framework

Delegate to framework's prd-specialist:

```markdown
Use the Task tool:

- subagent_type: "prd-specialist"
- description: "Create comprehensive PRD for LiaiZen"
- prompt: "Execute the /create-prd command for: $PROJECT_NAME

LiaiZen Context:

- Domain: Co-parenting communication platform
- Mission: Transform high-tension co-parenting exchanges into respectful, child-centric dialogue
- Key Principles: [List 6 principles above]
- Target Personas: [List persona types above]
- Technical Stack: [Product context above]

Please create a comprehensive PRD following SDD methodology with LiaiZen domain customizations."
```

## What the Framework Agent Will Do

The prd-specialist (from `sdd-agentic-framework/.claude/agents/product/prd-specialist.md`) will:

1. ✅ Conduct discovery and vision alignment
2. ✅ Develop detailed user personas for co-parenting scenarios
3. ✅ Define features with acceptance criteria
4. ✅ Customize constitutional principles for LiaiZen context
5. ✅ Document technical constraints and integration requirements
6. ✅ Create release strategy with MVP definition
7. ✅ Plan custom agents needed for co-parenting domain
8. ✅ Generate `.docs/prd/prd.md` and quick reference guide

## Output Artifacts

```
.docs/prd/
├── prd.md                    # Main PRD document
└── PRD_QUICK_REFERENCE.md   # Executive summary
```

## Usage

### New Project

```
/create-prd LiaiZen
```

### Update Existing PRD

```
/create-prd
```

## Next Steps

After PRD is created:

1. Review and approve PRD with stakeholders
2. Use PRD as reference for all `/specify` commands
3. Constitutional customizations inform `/plan` decisions
4. Agent recommendations guide team composition

## Integration with SDD Workflow

- `/specify` → References PRD for personas, user stories, acceptance criteria
- `/plan` → References PRD for technical constraints, architecture principles
- Constitution → Updated with project-specific guidance from PRD
- Custom agents → Created based on needs identified in PRD

## Framework Reference

- **Agent**: `sdd-agentic-framework/.claude/agents/product/prd-specialist.md`
- **Script**: `sdd-agentic-framework/.specify/scripts/bash/create-prd.sh`
- **Workflow**: Phase 0 (before `/specify`)

---

**Pattern**: LiaiZen domain → Framework delegation → SSOT PRD
