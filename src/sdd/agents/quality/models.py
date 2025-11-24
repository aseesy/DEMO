"""
Quality Agent Data Models
DS-STAR Multi-Agent Enhancement - Feature 001

Provides Pydantic models for Quality department agents:
- VerificationDecision: Output from Verification Agent with quality assessment

Constitutional Compliance:
- Principle III: Contract-First Design - Verification contracts defined before implementation
- Principle II: Test-First Development - Quality gates enforce >80% code coverage

Usage:
    from sdd.agents.quality.models import VerificationDecision

    # Create verification decision
    decision = VerificationDecision(
        decision="insufficient",
        quality_score=0.72,
        dimension_scores={
            "completeness": 0.85,
            "constitutional_compliance": 0.65,
            "test_coverage": 0.70,
            "spec_alignment": 0.90
        },
        feedback=["Add contract for POST /api/users"],
        violations=["missing_contract_test"],
        passed_checks=["completeness", "spec_alignment"]
    )

    # Serialize to JSON
    json_data = decision.model_dump()

    # Save to file
    import json
    from pathlib import Path
    decision_file = Path(".docs/agents/quality/verifier/decisions/task-123.json")
    decision_file.parent.mkdir(parents=True, exist_ok=True)
    decision_file.write_text(json.dumps(json_data, indent=2))
"""

from enum import Enum
from typing import Dict, List

from pydantic import BaseModel, Field, field_validator, model_validator


# ===================================================================
# Enumerations
# ===================================================================

class DecisionType(str, Enum):
    """Binary quality gate decision."""
    SUFFICIENT = "sufficient"
    INSUFFICIENT = "insufficient"


# ===================================================================
# VerificationDecision (T021)
# ===================================================================

class VerificationDecision(BaseModel):
    """
    Output from Verification Agent.

    This model represents the quality gate decision for a workflow artifact
    (specification, plan, or code). Uses binary decision logic with detailed
    dimension scoring and actionable feedback.

    Fields:
        decision: Binary decision ("sufficient" or "insufficient")
        quality_score: Numerical quality assessment (0.0 to 1.0)
        dimension_scores: Scores per evaluation dimension (each 0.0 to 1.0)
        feedback: Actionable improvement suggestions
        violations: Specific issues identified
        passed_checks: Checks that passed

    Evaluation Dimensions:
        - completeness: All required sections present
        - constitutional_compliance: Follows all 14 principles
        - test_coverage: >80% code coverage (for implementation phase)
        - spec_alignment: Matches specification requirements

    Validation:
        - decision must be "sufficient" or "insufficient"
        - quality_score must match decision (sufficient >= threshold)
        - feedback required if decision is insufficient
        - dimension_scores must all be 0.0-1.0

    State Transitions:
        Immutable once created (frozen=True for audit trail)

    Storage:
        Stored in .docs/agents/quality/verifier/decisions/{task_id}.json

    Example:
        >>> decision = VerificationDecision(
        ...     decision="insufficient",
        ...     quality_score=0.72,
        ...     dimension_scores={
        ...         "completeness": 0.85,
        ...         "constitutional_compliance": 0.65,
        ...         "test_coverage": 0.70,
        ...         "spec_alignment": 0.90
        ...     },
        ...     feedback=[
        ...         "Add contract tests for POST /api/users endpoint",
        ...         "Library-first principle not followed: extract auth logic to library"
        ...     ],
        ...     violations=["missing_contract_test", "library_first_violation"],
        ...     passed_checks=["completeness", "spec_alignment"]
        ... )
        >>> decision.decision
        <DecisionType.INSUFFICIENT: 'insufficient'>
        >>> decision.quality_score
        0.72
        >>> decision.calculate_weighted_quality_score()
        0.73
    """

    decision: DecisionType = Field(
        ...,
        description="Binary decision (sufficient or insufficient)"
    )

    quality_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Numerical quality assessment (0.0 to 1.0)"
    )

    dimension_scores: Dict[str, float] = Field(
        ...,
        description="Scores per evaluation dimension (each 0.0 to 1.0)"
    )

    feedback: List[str] = Field(
        default_factory=list,
        description="Actionable improvement suggestions"
    )

    violations: List[str] = Field(
        default_factory=list,
        description="Specific issues identified"
    )

    passed_checks: List[str] = Field(
        default_factory=list,
        description="Checks that passed"
    )

    model_config = {
        "frozen": True,  # Immutable after creation (audit trail)
        "json_schema_extra": {
            "examples": [
                {
                    "decision": "insufficient",
                    "quality_score": 0.72,
                    "dimension_scores": {
                        "completeness": 0.85,
                        "constitutional_compliance": 0.65,
                        "test_coverage": 0.70,
                        "spec_alignment": 0.90
                    },
                    "feedback": [
                        "Add contract tests for POST /api/users endpoint",
                        "Library-first principle not followed: extract auth logic to library"
                    ],
                    "violations": [
                        "missing_contract_test",
                        "library_first_violation"
                    ],
                    "passed_checks": [
                        "completeness",
                        "spec_alignment"
                    ]
                }
            ]
        }
    }

    @field_validator("dimension_scores")
    @classmethod
    def validate_dimension_score_ranges(cls, v: Dict[str, float]) -> Dict[str, float]:
        """Validate that all dimension scores are between 0.0 and 1.0."""
        for dimension, score in v.items():
            if not 0.0 <= score <= 1.0:
                raise ValueError(
                    f"dimension_score '{dimension}' must be between 0.0 and 1.0, got: {score}"
                )
        return v

    @model_validator(mode="after")
    def validate_decision_matches_quality_score(self) -> "VerificationDecision":
        """
        Validate that decision matches quality_score.

        Sufficient decisions should have quality_score >= 0.85 (default threshold).
        Insufficient decisions should have quality_score < 0.85.
        """
        # Default threshold from refinement.conf
        threshold = 0.85

        if self.decision == DecisionType.SUFFICIENT and self.quality_score < threshold:
            raise ValueError(
                f"decision='sufficient' but quality_score={self.quality_score} < {threshold}"
            )

        if self.decision == DecisionType.INSUFFICIENT and self.quality_score >= threshold:
            raise ValueError(
                f"decision='insufficient' but quality_score={self.quality_score} >= {threshold}"
            )

        return self

    @model_validator(mode="after")
    def validate_feedback_required_if_insufficient(self) -> "VerificationDecision":
        """Validate that feedback is provided if decision is insufficient."""
        if self.decision == DecisionType.INSUFFICIENT and len(self.feedback) == 0:
            raise ValueError(
                "feedback required if decision is 'insufficient'"
            )
        return self

    def calculate_weighted_quality_score(
        self,
        weight_completeness: float = 0.25,
        weight_constitutional: float = 0.30,
        weight_test_coverage: float = 0.25,
        weight_spec_alignment: float = 0.20,
    ) -> float:
        """
        Calculate weighted quality score from dimension scores.

        Uses dimension weights from refinement.conf:
        - completeness: 0.25
        - constitutional_compliance: 0.30
        - test_coverage: 0.25
        - spec_alignment: 0.20

        Args:
            weight_completeness: Weight for completeness dimension (default 0.25)
            weight_constitutional: Weight for constitutional_compliance (default 0.30)
            weight_test_coverage: Weight for test_coverage (default 0.25)
            weight_spec_alignment: Weight for spec_alignment (default 0.20)

        Returns:
            Weighted quality score (0.0 to 1.0)

        Example:
            >>> decision = VerificationDecision(...)
            >>> weighted_score = decision.calculate_weighted_quality_score()
            >>> assert 0.0 <= weighted_score <= 1.0
        """
        # Ensure weights sum to 1.0
        total_weight = (
            weight_completeness +
            weight_constitutional +
            weight_test_coverage +
            weight_spec_alignment
        )
        if not 0.99 <= total_weight <= 1.01:  # Allow small floating point error
            raise ValueError(f"Weights must sum to 1.0, got: {total_weight}")

        # Calculate weighted sum
        weighted_score = (
            self.dimension_scores.get("completeness", 0.0) * weight_completeness +
            self.dimension_scores.get("constitutional_compliance", 0.0) * weight_constitutional +
            self.dimension_scores.get("test_coverage", 0.0) * weight_test_coverage +
            self.dimension_scores.get("spec_alignment", 0.0) * weight_spec_alignment
        )

        return weighted_score

    def generate_feedback_summary(self) -> str:
        """
        Generate human-readable feedback summary.

        Returns:
            Formatted feedback summary string

        Example:
            >>> decision = VerificationDecision(...)
            >>> summary = decision.generate_feedback_summary()
            >>> print(summary)
            Decision: INSUFFICIENT
            Quality Score: 0.72
            Violations: 2
            - missing_contract_test
            - library_first_violation
            Feedback: 2 items
            - Add contract tests for POST /api/users endpoint
            - Library-first principle not followed: extract auth logic
        """
        lines = [
            f"Decision: {self.decision.value.upper()}",
            f"Quality Score: {self.quality_score:.2f}",
            "",
        ]

        if self.violations:
            lines.append(f"Violations: {len(self.violations)}")
            for violation in self.violations:
                lines.append(f"  - {violation}")
            lines.append("")

        if self.feedback:
            lines.append(f"Feedback: {len(self.feedback)} items")
            for feedback_item in self.feedback:
                # Truncate long feedback to 80 chars for summary
                truncated = (
                    feedback_item[:77] + "..."
                    if len(feedback_item) > 80
                    else feedback_item
                )
                lines.append(f"  - {truncated}")
            lines.append("")

        if self.passed_checks:
            lines.append(f"Passed Checks: {len(self.passed_checks)}")
            for check in self.passed_checks:
                lines.append(f"  ✓ {check}")

        return "\n".join(lines)
