#!/usr/bin/env bash
# (Moved to scripts/bash/) Create a new feature with branch, directory structure, and template
set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
ARGS=()
for arg in "$@"; do
    case "$arg" in
        --json) JSON_MODE=true ;;
        --help|-h) echo "Usage: $0 [--json] <feature_description>"; exit 0 ;;
        *) ARGS+=("$arg") ;;
    esac
done

FEATURE_DESCRIPTION="${ARGS[*]}"
if [ -z "$FEATURE_DESCRIPTION" ]; then
    echo "Usage: $0 [--json] <feature_description>" >&2
    exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
SPECS_DIR="$REPO_ROOT/specs"
mkdir -p "$SPECS_DIR"

HIGHEST=0
if [ -d "$SPECS_DIR" ]; then
    for dir in "$SPECS_DIR"/*; do
        [ -d "$dir" ] || continue
        dirname=$(basename "$dir")
        number=$(echo "$dirname" | grep -o '^[0-9]\+' || echo "0")
        number=$((10#$number))
        if [ "$number" -gt "$HIGHEST" ]; then HIGHEST=$number; fi
    done
fi

NEXT=$((HIGHEST + 1))
FEATURE_NUM=$(printf "%03d" "$NEXT")

BRANCH_NAME=$(echo "$FEATURE_DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-//' | sed 's/-$//')
WORDS=$(echo "$BRANCH_NAME" | tr '-' '\n' | grep -v '^$' | head -3 | tr '\n' '-' | sed 's/-$//')
BRANCH_NAME="${FEATURE_NUM}-${WORDS}"

# Constitutional Principle VI: Request approval for branch creation
if ! request_git_approval "Branch Creation" "Create new branch: $BRANCH_NAME"; then
    echo "Branch creation cancelled. Exiting." >&2
    exit 1
fi

git checkout -b "$BRANCH_NAME"

FEATURE_DIR="$SPECS_DIR/$BRANCH_NAME"
mkdir -p "$FEATURE_DIR"

TEMPLATE="$REPO_ROOT/.specify/templates/spec-template.md"
SPEC_FILE="$FEATURE_DIR/spec.md"
if [ -f "$TEMPLATE" ]; then cp "$TEMPLATE" "$SPEC_FILE"; else touch "$SPEC_FILE"; fi

# T041: DS-STAR Multi-Agent Enhancement - Refinement Integration
# After spec generation, invoke verification gate with refinement loop
echo ""
echo "=========================================="
echo "DS-STAR Refinement: Verifying specification quality"
echo "=========================================="

# Check if Python and DS-STAR components are available
if command -v python3 &> /dev/null && [ -d "$REPO_ROOT/src/sdd" ]; then
    # Generate task_id for tracking
    TASK_ID=$(python3 -c "import uuid; print(str(uuid.uuid4()))")

    # Invoke refinement engine with verification
    # Uses RefinementEngine.refine_until_sufficient() from src/sdd/refinement/engine.py
    python3 -c "
import sys
sys.path.insert(0, '$REPO_ROOT/src')

from sdd.refinement.engine import RefinementEngine
from sdd.agents.quality.verifier import VerificationAgent
from sdd.agents.shared.models import AgentContext

try:
    # Initialize refinement engine and verifier
    engine = RefinementEngine()
    verifier = VerificationAgent()

    # Create context
    context = AgentContext(spec_path='$SPEC_FILE')

    # Refine until sufficient (max 20 rounds)
    print('Starting iterative refinement loop (max 20 rounds)...')
    final_state = engine.refine_until_sufficient(
        task_id='$TASK_ID',
        phase='specification',
        artifact_path='$SPEC_FILE',
        verifier=verifier,
        context=context
    )

    # Check results
    if final_state.ema_quality >= final_state.quality_threshold:
        print(f'✓ Specification quality sufficient: {final_state.ema_quality:.2f}')
        print(f'  Iterations: {final_state.current_round}')
        print(f'  Ready to proceed to /plan phase')
        sys.exit(0)
    else:
        print(f'✗ Specification quality insufficient after {final_state.current_round} rounds')
        print(f'  Current: {final_state.ema_quality:.2f}, Required: {final_state.quality_threshold}')
        print(f'  Cumulative feedback:')
        for i, feedback in enumerate(final_state.cumulative_feedback, 1):
            print(f'    {i}. {feedback}')
        print(f'  Escalated to human - please review spec.md manually')
        sys.exit(0)  # Don't block workflow on quality issues

except Exception as e:
    print(f'Warning: DS-STAR refinement unavailable: {e}')
    print('Proceeding without quality verification (manual review recommended)')
    sys.exit(0)
" || {
    # Refinement failed or unavailable - continue without blocking
    echo "Note: DS-STAR refinement unavailable, proceeding with manual review workflow"
}
else
    echo "Note: DS-STAR components not installed, skipping automated quality verification"
    echo "Recommendation: Manually review spec.md for completeness and constitutional compliance"
fi

echo "=========================================="
echo ""

if $JSON_MODE; then
    printf '{"BRANCH_NAME":"%s","SPEC_FILE":"%s","FEATURE_NUM":"%s","TASK_ID":"%s"}\n' "$BRANCH_NAME" "$SPEC_FILE" "$FEATURE_NUM" "$TASK_ID"
else
    echo "BRANCH_NAME: $BRANCH_NAME"
    echo "SPEC_FILE: $SPEC_FILE"
    echo "FEATURE_NUM: $FEATURE_NUM"
fi
