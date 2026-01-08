# Specification-Driven Development (SDD) Framework

## Overview

LiaiZen uses the SDD Agentic Framework v2.0.0, a specification-driven development system with constitutional AI governance. This framework enforces architectural and domain constraints while maintaining consistency in AI-mediated behavior.

**Framework Version**: v2.0.0 with DS-STAR  
**Status**: Optional for contributors - framework usage is not required but recommended

## What is SDD?

Specification-Driven Development (SDD) is a methodology that:

1. **Defines features before implementation** - Detailed specifications with quality thresholds
2. **Enforces architectural constraints** - Constitutional principles guide development
3. **Maintains domain consistency** - Co-parenting domain principles enforced
4. **Provides quality gates** - Automatic validation before code is written
5. **Enables agentic development** - Specialized agents handle different aspects

## Framework Components

### 1. Constitutional Governance

**Location**: `.specify/memory/constitution.md`

**14 Development Principles:**
- Core immutable principles (I-III): Library-first, Test-first, Contract-first
- Quality and safety principles (IV-IX): Idempotent operations, Progressive enhancement, Git safety, Observability, Documentation sync, Dependency management
- Workflow and delegation principles (X-XIV): Agent delegation, Input validation, Design system, Access control, AI model selection

**Purpose**: Enforceable development standards that guide all feature development.

### 2. DS-STAR Multi-Agent System

**Location**: `.specify/src/sdd/`

**Components:**
- Quality gates (spec completeness, plan quality)
- Intelligent routing (automatic agent delegation)
- Self-healing (automatic error fixes - optional)
- Refinement engine (iterative spec improvement)

**Status**: Active if Python 3.9+ is available, gracefully degraded otherwise.

### 3. Specialized Agents

**Location**: `.claude/agents/`

**Specialized Agents:**

- **Architecture** (2 agents): System design, SDD compliance
- **Engineering** (2 agents): Frontend, full-stack development
- **Quality** (2 agents): Testing, security
- **Data** (2 agents): Database, analytics
- **Product** (2 agents): UX, domain expertise
- **Operations** (2 agents): DevOps, monitoring

**Usage**: Automatic delegation based on task domain.

### 4. Skills System

**Location**: `.claude/skills/`

**Benefit**: 30-50% context reduction through progressive disclosure.

**Purpose**: Reusable skill modules that agents can use for common tasks.

### 5. Governance Policies

**Location**: `.docs/policies/`

**Policies:**
- Testing policy
- Security policy
- Code review policy
- Deployment policy
- Branching strategy
- Release policy
- Privacy policy
- Conflict handling policy

### 6. Automation Scripts

**Location**: `.specify/scripts/bash/`

**Available Scripts:**
- `create-new-feature.sh` - Create feature specification
- `constitutional-check.sh` - Validate constitutional compliance
- `sanitization-audit.sh` - Verify framework integrity
- `finalize-feature.sh` - Pre-commit compliance check

### 7. Refinement Engine

**Location**: `.specify/config/refinement.conf`

**Capability**: Automatic iterative improvement with quality thresholds.

**Settings:**
- Spec completeness: 0.90
- Plan quality: 0.85
- Spec alignment: 0.90
- Early stop: 0.95 quality

## Quick Start

### Feature Development Workflow

```bash
# 1. Create specification (with automatic refinement)
/specify "User story or feature description"
# → Auto-refines until quality ≥0.90

# 2. Generate implementation plan (with quality gates)
/plan
# → Verifies plan quality ≥0.85 and spec alignment ≥0.90

# 3. Create task breakdown
/tasks
# → Generates tasks with [P] parallel markers

# 4. Validate co-parenting domain requirements
/validate-domain --spec specs/###-feature-name/spec.md
# → Checks co-parenting specific requirements

# 5. Pre-commit compliance check
/finalize
# → Validates all 14 constitutional principles
# → Suggests manual git commands (never auto-commits)
```

### Manual Scripts

```bash
# Create new feature specification
./.specify/scripts/bash/create-new-feature.sh "Feature Name"

# Check constitutional compliance
./.specify/scripts/bash/constitutional-check.sh

# Verify framework integrity
./.specify/scripts/bash/sanitization-audit.sh

# Finalize feature (pre-commit)
./.specify/scripts/bash/finalize-feature.sh
```

## Key Features

### Automatic Quality Gates

- **Specifications**: Must meet 0.90 completeness threshold
- **Plans**: Must meet 0.85 quality and 0.90 spec alignment
- **Blocks progression** with actionable feedback if insufficient

### Intelligent Agent Routing

- **Automatic delegation** to appropriate specialists
- **Domain-based** task analysis
- **Parallel execution** planning

### Refinement Loop

- **Up to 20** refinement rounds
- **Early stop** at 0.95 quality
- **Iterative improvement** with feedback accumulation

### Self-Healing (Optional)

- **AutoDebugAgent** for common error fixes
- **>70% fix rate** target
- **Requires approval** before execution

### Co-Parenting Domain Integration

- **Child-centered outcomes** validation
- **Conflict reduction** mechanisms
- **Privacy-first** design enforcement
- **Mobile/PWA** compatibility checks
- **AI mediation** integration
- **Real-time communication** support

## Configuration

### DS-STAR Settings

**File**: `.config/ds-star.json`

Enable/disable features:
- Quality gates
- Intelligent routing
- Self-healing
- Refinement engine

### Refinement Thresholds

**File**: `.specify/config/refinement.conf`

Adjust quality thresholds:
- Spec completeness: 0.90
- Plan quality: 0.85
- Test coverage: 0.80
- Domain alignment: 0.85
- Conflict reduction: 0.90
- Privacy compliance: 0.95

## When to Use SDD

### Recommended For

- **New features** requiring architectural decisions
- **Complex features** with multiple components
- **Features affecting** AI mediation behavior
- **Features touching** co-parenting domain principles
- **Major refactoring** efforts

### Optional For

- **Simple bug fixes** (can skip SDD workflow)
- **Minor UI changes** (direct implementation OK)
- **Documentation updates** (no SDD needed)
- **Dependency updates** (standard process)

## Troubleshooting

### Python Not Available

- DS-STAR features will gracefully degrade
- Workflow continues with warnings
- Manual quality checks recommended
- Install Python 3.9+ to enable full features

### Quality Gates Too Strict

Edit `.specify/config/refinement.conf` and adjust thresholds:

```bash
SPEC_COMPLETENESS_THRESHOLD=0.85  # Reduced from 0.90
PLAN_QUALITY_THRESHOLD=0.80       # Reduced from 0.85
```

### Agent Not Delegating

Check agent collaboration triggers:

```bash
cat .specify/memory/agent-collaboration-triggers.md
```

### Constitutional Check Failing

Review principles:

```bash
cat .specify/memory/constitution.md
```

## Framework Structure

```
.specify/
├── memory/
│   ├── constitution.md                    # 14 development principles
│   └── agent-collaboration-triggers.md    # Agent delegation rules
├── config/
│   └── refinement.conf                    # Quality thresholds
├── scripts/bash/                          # Automation scripts
├── specs/                                 # Feature specifications
└── src/sdd/                               # DS-STAR Python agents

.claude/
├── agents/                                # Specialized agents
│   ├── architecture/
│   ├── engineering/
│   ├── quality/
│   ├── data/
│   ├── product/
│   └── operations/
└── skills/                                # Reusable skills

.docs/
└── policies/                              # Governance policies
```

## Benefits

### For Developers

- **Clear requirements** before coding starts
- **Quality assurance** built into workflow
- **Consistent patterns** across features
- **Automatic validation** of requirements

### For Project

- **Architectural consistency** maintained
- **Domain principles** enforced
- **Quality standards** upheld
- **Documentation** auto-generated

### For Users

- **Consistent UX** across features
- **Reliable features** with fewer bugs
- **Privacy-first** approach maintained
- **Child-centered** design principles

## Integration Status

### ✅ Integrated

- Constitutional framework
- Agent system
- Automation scripts
- Policy templates
- Quality gates (if Python available)

### ⚠️ Optional

- DS-STAR features (requires Python 3.9+)
- Self-healing agents
- Advanced refinement engine

### 📋 Planned

- Enhanced agent capabilities
- More automation scripts
- Integration with CI/CD

## Additional Resources

- **Integration Guide**: See `docs/INTEGRATION_GUIDE.md`
- **Agent Reference**: See `docs/AGENTS.md`
- **Constitution**: See `.specify/memory/constitution.md`
- **Policies**: See `.docs/policies/`
- **Framework Source**: https://github.com/kelleysd-apps/sdd-agentic-framework

## Support

For questions or issues:

1. Review framework documentation in `.specify/`
2. Check `.docs/policies/` for operational guidance
3. Review `docs/INTEGRATION_GUIDE.md` for setup
4. Consult framework source repository for advanced usage

---

**Framework Version**: v2.0.0 with DS-STAR  
**Integration Date**: See `docs/INTEGRATION_GUIDE.md`  
**Project**: LiaiZen Co-Parenting Platform

