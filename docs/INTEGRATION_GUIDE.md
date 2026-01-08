# SDD Agentic Framework Integration Guide

## LiaiZen Co-Parenting Platform

### Integration Complete! 🎉

The SDD Agentic Framework v2.0.0 has been successfully integrated into your project.

## What's Been Added

### 1. Constitutional Governance

- **Location**: `.specify/memory/constitution.md`
- **Principles**: 14 base + 3 co-parenting specific = 17 total
- **Purpose**: Enforceable development standards

### 2. DS-STAR Multi-Agent System

- **Components**: Quality gates, intelligent routing, self-healing, refinement engine
- **Location**: `src/sdd/`
- **Status**: Active (if Python available) or gracefully degraded

### 3. Specialized Agents

- **Departments**: Architecture, Engineering, Quality, Data, Product, Operations
- **Location**: `.claude/agents/`
- **Usage**: Automatic delegation based on task domain

### 4. Skills System

- **Location**: `.claude/skills/`
- **Benefit**: 30-50% context reduction through progressive disclosure

### 5. Governance Policies (6 Base + 4 Co-Parenting)

- **Location**: `.docs/policies/`
- **Coverage**: Testing, security, code review, deployment, branching, release, privacy, conflict handling

### 6. Automation Scripts

- **Location**: `.specify/scripts/bash/`
- **Scripts**: Feature creation, planning, task prerequisites, finalization, constitutional checks

### 7. Refinement Engine

- **Config**: `.specify/config/refinement.conf`
- **Capability**: Automatic iterative improvement with quality thresholds

## Quick Start Commands

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
# → Checks 14 co-parenting specific requirements

# 5. Pre-commit compliance check
/finalize
# → Validates all 17 constitutional principles
# → Suggests manual git commands (never auto-commits)
```

### Agent Management

```bash
# Create specialized agent
/create-agent "agent-name" "Purpose description"

# Create reusable skill
/create-skill "skill-name" "Skill description"
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

- Specifications must meet 0.90 completeness threshold
- Plans must meet 0.85 quality and 0.90 spec alignment
- Blocks progression with actionable feedback if insufficient

### Intelligent Agent Routing

- Automatic delegation to appropriate specialists
- Domain-based task analysis
- Parallel execution planning

### Refinement Loop

- Up to 20 refinement rounds
- Early stop at 0.95 quality
- Iterative improvement with feedback accumulation

### Self-Healing (Optional)

- AutoDebugAgent for common error fixes
- > 70% fix rate target
- Requires approval before execution

### Co-Parenting Domain Integration

- Child-centered outcomes validation
- Conflict reduction mechanisms
- Privacy-first design enforcement
- Mobile/PWA compatibility checks
- AI mediation integration
- Real-time communication support

## Configuration Files

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

## Documentation

### Essential Reading

1. `docs/sdd-framework.md` - Framework overview and setup
2. `docs/AGENTS.md` - Agent reference guide
3. `.specify/memory/constitution.md` - Development principles
4. Framework source: [kelleysd-apps/sdd-agentic-framework](https://github.com/kelleysd-apps/sdd-agentic-framework)

### Domain-Specific

- `.specify/memory/constitution.md` - 17 development principles
- `.docs/policies/` - Operational policies
- `CLAUDE.md` - AI assistant instructions (auto-updated)

## Validation Checklist

Run these commands to verify integration:

```bash
# 1. Check framework integrity
./.specify/scripts/bash/sanitization-audit.sh

# 2. Validate constitutional compliance
./.specify/scripts/bash/constitutional-check.sh

# 3. Test Python availability (optional)
python3 --version && pip3 list | grep anthropic

# 4. Test workflow
/specify "Test feature for validation"
# Should trigger automatic refinement

# 5. Verify agent system
ls -la .claude/agents/*/

# 6. Check policies
ls -la .docs/policies/
```

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

## Next Steps

1. **Read Documentation**
   - Review `START_HERE.md`
   - Understand 17 constitutional principles
   - Familiarize with agent system

2. **Test Workflow**
   - Create a simple test specification
   - Run through complete workflow
   - Validate domain requirements

3. **Customize for LiaiZen**
   - Add co-parenting specific agents
   - Create domain skills
   - Adjust thresholds for your needs

4. **Enable Advanced Features**
   - Gradually activate DS-STAR capabilities
   - Test self-healing with approval mode
   - Configure intelligent routing

## Support

For issues or questions:

- Review framework documentation in `docs/sdd-framework.md`
- Check `.docs/policies/` for operational guidance
- Review framework source repository for latest changes
- Use `/create-agent` to add specialized expertise

---

**Integration Date**: $(date +"%Y-%m-%d %H:%M:%S")
**Framework Version**: v2.0.0 with DS-STAR
**Project**: LiaiZen Co-Parenting Platform
