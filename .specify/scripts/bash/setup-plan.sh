#!/usr/bin/env bash
set -e
JSON_MODE=false
for arg in "$@"; do case "$arg" in --json) JSON_MODE=true ;; --help|-h) echo "Usage: $0 [--json]"; exit 0 ;; esac; done
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"
eval $(get_feature_paths)
check_feature_branch "$CURRENT_BRANCH" || exit 1
mkdir -p "$FEATURE_DIR"
TEMPLATE="$REPO_ROOT/.specify/templates/plan-template.md"
[[ -f "$TEMPLATE" ]] && cp "$TEMPLATE" "$IMPL_PLAN"

# T042: DS-STAR Multi-Agent Enhancement - Verification Integration
# After plan generation, invoke verification gate (blocks if insufficient)
echo ""
echo "=========================================="
echo "DS-STAR Verification: Checking plan quality"
echo "=========================================="

# Check if Python and DS-STAR components are available
if command -v python3 &> /dev/null && [ -d "$REPO_ROOT/src/sdd" ]; then
    # Check if plan file was created
    if [ ! -f "$IMPL_PLAN" ]; then
        echo "Error: Plan file not found at $IMPL_PLAN"
        exit 1
    fi

    # Generate task_id for tracking
    TASK_ID=$(python3 -c "import uuid; print(str(uuid.uuid4()))")

    # Invoke verification agent (single check, no refinement)
    # Uses VerificationAgent.verify() from src/sdd/agents/quality/verifier.py
    VERIFICATION_RESULT=$(python3 -c "
import sys
sys.path.insert(0, '$REPO_ROOT/src')

from sdd.agents.quality.verifier import VerificationAgent
from sdd.agents.shared.models import AgentInput, AgentContext

try:
    # Initialize verifier
    verifier = VerificationAgent()

    # Create agent input
    agent_input = AgentInput(
        agent_id='quality.verifier',
        task_id='$TASK_ID',
        phase='planning',
        input_data={
            'artifact_path': '$IMPL_PLAN',
            'artifact_type': 'plan',
            'quality_thresholds': {
                'completeness': 0.85,
                'constitutional_compliance': 0.85,
                'test_coverage': 1.0,  # Not applicable for plans
                'spec_alignment': 0.90
            }
        },
        context=AgentContext(spec_path='$FEATURE_SPEC')
    )

    # Verify plan
    result = verifier.verify(agent_input)

    # Extract decision
    decision = result.output_data.get('decision', 'UNKNOWN')
    quality_score = result.output_data.get('quality_score', 0.0)
    feedback = result.output_data.get('feedback', [])

    print(f'{decision}|{quality_score}|{\";;;\".join(feedback)}')
    sys.exit(0 if decision == 'sufficient' else 1)

except Exception as e:
    print(f'ERROR|0.0|Verification failed: {e}')
    sys.exit(2)
")

    VERIFICATION_EXIT_CODE=$?
    IFS='|' read -r DECISION QUALITY_SCORE FEEDBACK <<< "$VERIFICATION_RESULT"

    if [ $VERIFICATION_EXIT_CODE -eq 0 ]; then
        echo "✓ Plan quality sufficient: $QUALITY_SCORE"
        echo "  Ready to proceed to /tasks phase"
    elif [ $VERIFICATION_EXIT_CODE -eq 1 ]; then
        echo "✗ Plan quality insufficient: $QUALITY_SCORE"
        echo "  Decision: $DECISION"
        if [ -n "$FEEDBACK" ]; then
            echo "  Feedback:"
            IFS=';;;' read -ra FEEDBACK_ITEMS <<< "$FEEDBACK"
            for item in "${FEEDBACK_ITEMS[@]}"; do
                echo "    - $item"
            done
        fi
        echo ""
        echo "  Action Required: Please address the feedback above and regenerate the plan."
        echo "  Blocking progression to /tasks until quality threshold is met."
        echo ""
        exit 1
    else
        echo "Warning: Verification error (code: $VERIFICATION_EXIT_CODE)"
        echo "  Result: $VERIFICATION_RESULT"
        echo "  Proceeding without quality gate (manual review recommended)"
    fi
else
    echo "Note: DS-STAR components not installed, skipping automated quality verification"
    echo "Recommendation: Manually review plan.md for completeness and constitutional compliance"
fi

echo "=========================================="
echo ""

if $JSON_MODE; then
  printf '{"FEATURE_SPEC":"%s","IMPL_PLAN":"%s","SPECS_DIR":"%s","BRANCH":"%s"}\n' \
    "$FEATURE_SPEC" "$IMPL_PLAN" "$FEATURE_DIR" "$CURRENT_BRANCH"
else
  echo "FEATURE_SPEC: $FEATURE_SPEC"; echo "IMPL_PLAN: $IMPL_PLAN"; echo "SPECS_DIR: $FEATURE_DIR"; echo "BRANCH: $CURRENT_BRANCH"
fi
