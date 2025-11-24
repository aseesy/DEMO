#!/bin/bash
# Update all agents to constitution v1.5.0 (14 principles)
# Part of Phase 2: Multi-Agent Architecture implementation

set -e

AGENTS_DIR="/workspaces/sdd-agentic-framework/.claude/agents"
BACKUP_DIR="/tmp/agent-backups-$(date +%Y%m%d-%H%M%S)"

echo "====================================="
echo "Agent Constitution Update Script"
echo "====================================="
echo ""
echo "Updating agents to constitution v1.5.0 (14 principles)"
echo ""

# Create backup
mkdir -p "$BACKUP_DIR"
cp -r "$AGENTS_DIR"/* "$BACKUP_DIR/"
echo "✓ Created backup at $BACKUP_DIR"
echo ""

# Define the new Working Principles section
NEW_WORKING_PRINCIPLES='## Working Principles\

### Constitutional Principles Application (v1.5.0 - 14 Principles)\

**Core Immutable Principles (I-III)**:\
1. **Principle I - Library-First Architecture**: Every feature must begin as a standalone library\
2. **Principle II - Test-First Development**: Write tests → Get approval → Tests fail → Implement → Refactor\
3. **Principle III - Contract-First Design**: Define contracts before implementation\

**Quality \& Safety Principles (IV-IX)**:\
4. **Principle IV - Idempotent Operations**: All operations must be safely repeatable\
5. **Principle V - Progressive Enhancement**: Start simple, add complexity only when proven necessary\
6. **Principle VI - Git Operation Approval** (CRITICAL): MUST request user approval for ALL Git commands\
7. **Principle VII - Observability**: Structured logging and metrics required for all operations\
8. **Principle VIII - Documentation Synchronization**: Documentation must stay synchronized with code\
9. **Principle IX - Dependency Management**: All dependencies explicitly declared and version-pinned\

**Workflow \& Delegation Principles (X-XIV)**:\
10. **Principle X - Agent Delegation Protocol** (CRITICAL): Specialized work delegated to specialized agents\
11. **Principle XI - Input Validation \& Output Sanitization**: All inputs validated, outputs sanitized\
12. **Principle XII - Design System Compliance**: UI components comply with project design system\
13. **Principle XIII - Feature Access Control**: Dual-layer enforcement (backend + frontend)\
14. **Principle XIV - AI Model Selection**: Use Sonnet 4.5 by default, escalate to Opus for safety-critical'

# Find all agent markdown files except backend-architect (already updated)
find "$AGENTS_DIR" -name "*.md" -type f ! -path "*/backend-architect.md" | while read -r agent_file; do
    agent_name=$(basename "$agent_file" .md)
    echo "Updating: $agent_name"

    # 1. Update agent-collaboration.md reference to agent-collaboration-triggers.md
    sed -i 's|agent-collaboration\.md|agent-collaboration-triggers.md|g' "$agent_file"

    # 2. Replace Working Principles section
    # This uses a more complex sed command to replace from "## Working Principles" to "### Department-Specific Guidelines"
    perl -i -0pe "s/## Working Principles.*?### Constitutional Principles Application.*?9\. \*\*Security by Default\*\*: Input validation and output sanitization mandatory/$NEW_WORKING_PRINCIPLES/s" "$agent_file"

    # 3. Update version history - add new row
    sed -i '/| 1\.0\.0   | 2025-09-18 | Initial creation | create-agent\.sh |/a\| 1.1.0   | 2025-11-07 | Updated to constitution v1.5.0 (14 principles) | Phase 2 Implementation |' "$agent_file"

    # 4. Update agent version metadata
    sed -i 's/\*\*Agent Version\*\*: 1\.0\.0/**Agent Version**: 1.1.0/' "$agent_file"
    sed -i 's/\*\*Last Modified\*\*: 2025-09-18/**Last Modified**: 2025-11-07/' "$agent_file"

    # 5. Add constitution version to metadata (before Review Schedule)
    sed -i '/\*\*Review Schedule\*\*/i\**Constitution**: v1.5.0 (14 Principles)' "$agent_file"

    echo "  ✓ Updated $agent_name"
done

echo ""
echo "====================================="
echo "Update Complete"
echo "====================================="
echo ""
echo "Backup location: $BACKUP_DIR"
echo "All 11 remaining agents updated to constitution v1.5.0"
echo ""
