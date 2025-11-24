"""
Refinement Engine Data Models
DS-STAR Multi-Agent Enhancement - Feature 001

Provides Pydantic models for iterative refinement system:
- RefinementState: Tracks iterative refinement progress
- IterationRecord: Single refinement iteration result

Constitutional Compliance:
- Principle IV: Idempotent Operations - Max 20 rounds prevents infinite loops
- Principle VII: Observability - Complete audit trail of refinement iterations

Usage:
    from sdd.refinement.models import RefinementState, IterationRecord

    # Create iteration record
    iteration = IterationRecord(
        round=1,
        timestamp=datetime.now(),
        input_state={"plan_version": 0},
        output_state={"plan_version": 1},
        verification_result=VerificationDecision(...),
        quality_score=0.78,
        duration_seconds=45.2,
        agent_invocations=["quality.verifier"]
    )

    # Create refinement state
    state = RefinementState(
        task_id="550e8400-e29b-41d4-a716-446655440000",
        phase="planning",
        current_round=1,
        max_rounds=20,
        iterations=[iteration],
        cumulative_feedback=["Add contract for POST /api/users"],
        ema_quality=0.78,
        quality_threshold=0.85,
        early_stopping_threshold=0.95,
        started_at=datetime.now(),
        updated_at=datetime.now()
    )

    # Save to file
    state_path = Path(f".docs/agents/shared/refinement-state/{state.task_id}.json")
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(state.model_dump_json(indent=2))
"""

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from pydantic import BaseModel, Field, field_validator, model_validator


# ===================================================================
# IterationRecord (T026)
# ===================================================================

class IterationRecord(BaseModel):
    """
    Single refinement iteration result.

    This model represents one iteration of the refinement loop, including
    input/output states, verification results, and performance metrics.

    Fields:
        round: Iteration number (1-based)
        timestamp: When iteration executed
        input_state: Input snapshot (arbitrary structure)
        output_state: Output snapshot (arbitrary structure)
        verification_result: Quality gate result (VerificationDecision dict)
        quality_score: Quality score for this iteration (0.0 to 1.0)
        duration_seconds: Time taken for iteration
        agent_invocations: Agents invoked this iteration

    Validation:
        - round must match position in iterations list (enforced by RefinementState)
        - quality_score must match verification_result.quality_score

    Example:
        >>> from datetime import datetime
        >>> iteration = IterationRecord(
        ...     round=1,
        ...     timestamp=datetime.now(),
        ...     input_state={"plan_version": 0, "feedback_count": 0},
        ...     output_state={"plan_version": 1, "feedback_count": 1},
        ...     verification_result={
        ...         "decision": "insufficient",
        ...         "quality_score": 0.78,
        ...         "dimension_scores": {"completeness": 0.8},
        ...         "feedback": ["Add error handling"],
        ...         "violations": [],
        ...         "passed_checks": []
        ...     },
        ...     quality_score=0.78,
        ...     duration_seconds=45.2,
        ...     agent_invocations=["quality.verifier", "architecture.router"]
        ... )
        >>> iteration.round
        1
    """

    round: int = Field(
        ...,
        ge=1,
        description="Iteration number (1-based)"
    )

    timestamp: datetime = Field(
        ...,
        description="When iteration executed"
    )

    input_state: Dict[str, Any] = Field(
        ...,
        description="Input snapshot (arbitrary structure)"
    )

    output_state: Dict[str, Any] = Field(
        ...,
        description="Output snapshot (arbitrary structure)"
    )

    verification_result: Dict[str, Any] = Field(
        ...,
        description="Quality gate result (VerificationDecision dict)"
    )

    quality_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Quality score for this iteration (0.0 to 1.0)"
    )

    duration_seconds: float = Field(
        ...,
        gt=0.0,
        description="Time taken for iteration in seconds"
    )

    agent_invocations: List[str] = Field(
        default_factory=list,
        description="Agents invoked this iteration"
    )

    model_config = {
        "frozen": True,  # Immutable after creation (audit trail)
        "json_schema_extra": {
            "examples": [
                {
                    "round": 1,
                    "timestamp": "2025-11-10T10:30:00Z",
                    "input_state": {"plan_version": 0, "feedback_count": 0},
                    "output_state": {"plan_version": 1, "feedback_count": 1},
                    "verification_result": {
                        "decision": "insufficient",
                        "quality_score": 0.78,
                        "dimension_scores": {
                            "completeness": 0.85,
                            "constitutional_compliance": 0.75,
                            "test_coverage": 0.70,
                            "spec_alignment": 0.85
                        },
                        "feedback": ["Add error handling strategy"],
                        "violations": ["missing_error_handling"],
                        "passed_checks": ["completeness"]
                    },
                    "quality_score": 0.78,
                    "duration_seconds": 45.2,
                    "agent_invocations": ["quality.verifier", "architecture.router"]
                }
            ]
        }
    }

    @model_validator(mode="after")
    def validate_quality_score_matches_verification(self) -> "IterationRecord":
        """Validate that quality_score matches verification_result.quality_score."""
        if "quality_score" in self.verification_result:
            verification_score = self.verification_result["quality_score"]
            if abs(self.quality_score - verification_score) > 0.01:  # Allow small floating point error
                raise ValueError(
                    f"quality_score ({self.quality_score}) does not match "
                    f"verification_result.quality_score ({verification_score})"
                )
        return self


# ===================================================================
# RefinementState (T025)
# ===================================================================

class RefinementState(BaseModel):
    """
    Tracks iterative refinement progress.

    This model maintains state for the refinement loop, including iteration
    history, cumulative feedback, quality tracking, and early stopping logic.

    Fields:
        task_id: Task identifier (UUID format)
        phase: Workflow phase being refined
        current_round: Current iteration number (0-based, 0 = not started)
        max_rounds: Maximum iterations allowed (default 20 from refinement.conf)
        iterations: History of all iterations (chronologically ordered)
        cumulative_feedback: Accumulated feedback from all iterations
        ema_quality: Exponential moving average of quality scores
        quality_threshold: Minimum quality to proceed (default 0.85)
        early_stopping_threshold: Quality for early stopping (default 0.95)
        started_at: When refinement began
        updated_at: Last update timestamp

    Validation:
        - current_round must be <= max_rounds
        - ema_quality must be between 0.0 and 1.0
        - quality_threshold < early_stopping_threshold
        - iterations must be chronologically ordered

    State Transitions:
        1. Initialize at round 0
        2. Each iteration: increment current_round, append IterationRecord
        3. Terminal states: quality achieved OR max_rounds reached

    Storage:
        Stored in .docs/agents/shared/refinement-state/{task_id}.json

    Example:
        >>> from datetime import datetime
        >>> state = RefinementState(
        ...     task_id="550e8400-e29b-41d4-a716-446655440000",
        ...     phase="planning",
        ...     current_round=1,
        ...     max_rounds=20,
        ...     iterations=[iteration1],
        ...     cumulative_feedback=["Add contract for POST /api/users"],
        ...     ema_quality=0.78,
        ...     quality_threshold=0.85,
        ...     early_stopping_threshold=0.95,
        ...     started_at=datetime.now(),
        ...     updated_at=datetime.now()
        ... )
        >>> state.should_stop()
        False
        >>> state.can_continue()
        True
    """

    task_id: str = Field(
        ...,
        description="Task identifier (UUID format)"
    )

    phase: str = Field(
        ...,
        description="Workflow phase being refined"
    )

    current_round: int = Field(
        ...,
        ge=0,
        description="Current iteration number (0-based, 0 = not started)"
    )

    max_rounds: int = Field(
        20,
        gt=0,
        description="Maximum iterations allowed (default 20 from refinement.conf)"
    )

    iterations: List[IterationRecord] = Field(
        default_factory=list,
        description="History of all iterations (chronologically ordered)"
    )

    cumulative_feedback: List[str] = Field(
        default_factory=list,
        description="Accumulated feedback from all iterations"
    )

    ema_quality: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Exponential moving average of quality scores"
    )

    quality_threshold: float = Field(
        0.85,
        ge=0.0,
        le=1.0,
        description="Minimum quality to proceed (default 0.85)"
    )

    early_stopping_threshold: float = Field(
        0.95,
        ge=0.0,
        le=1.0,
        description="Quality for early stopping (default 0.95)"
    )

    started_at: datetime = Field(
        default_factory=datetime.now,
        description="When refinement began"
    )

    updated_at: datetime = Field(
        default_factory=datetime.now,
        description="Last update timestamp"
    )

    @field_validator("task_id")
    @classmethod
    def validate_task_id_uuid(cls, v: str) -> str:
        """Validate that task_id is a valid UUID."""
        from uuid import UUID
        try:
            UUID(v)
        except ValueError:
            raise ValueError(f"task_id must be a valid UUID, got: {v}")
        return v

    @model_validator(mode="after")
    def validate_current_round_within_max(self) -> "RefinementState":
        """Validate that current_round is within max_rounds."""
        if self.current_round > self.max_rounds:
            raise ValueError(
                f"current_round ({self.current_round}) exceeds "
                f"max_rounds ({self.max_rounds})"
            )
        return self

    @model_validator(mode="after")
    def validate_quality_thresholds(self) -> "RefinementState":
        """Validate that quality_threshold < early_stopping_threshold."""
        if self.quality_threshold >= self.early_stopping_threshold:
            raise ValueError(
                f"quality_threshold ({self.quality_threshold}) must be < "
                f"early_stopping_threshold ({self.early_stopping_threshold})"
            )
        return self

    @model_validator(mode="after")
    def validate_iterations_chronological(self) -> "RefinementState":
        """Validate that iterations are chronologically ordered."""
        if len(self.iterations) > 1:
            for i in range(len(self.iterations) - 1):
                current = self.iterations[i].timestamp
                next_iter = self.iterations[i + 1].timestamp
                if current > next_iter:
                    raise ValueError(
                        f"iterations not chronologically ordered: "
                        f"{current} > {next_iter}"
                    )
        return self

    @model_validator(mode="after")
    def validate_iterations_sequential(self) -> "RefinementState":
        """Validate that iteration rounds are sequential (1, 2, 3, ...)."""
        for i, iteration in enumerate(self.iterations):
            expected_round = i + 1
            if iteration.round != expected_round:
                raise ValueError(
                    f"Iteration {i} has round={iteration.round}, "
                    f"expected {expected_round}"
                )
        return self

    def should_stop(self) -> bool:
        """
        Check if refinement should stop (quality achieved or max rounds reached).

        Returns:
            True if refinement should stop, False otherwise

        Example:
            >>> state = RefinementState(...)
            >>> if state.should_stop():
            ...     print("Refinement complete")
        """
        # Stop if quality threshold met
        if self.ema_quality >= self.quality_threshold:
            return True

        # Stop if max rounds reached
        if self.current_round >= self.max_rounds:
            return True

        return False

    def should_early_stop(self) -> bool:
        """
        Check if early stopping threshold is met.

        Returns:
            True if early stopping triggered, False otherwise

        Example:
            >>> state = RefinementState(...)
            >>> if state.should_early_stop():
            ...     print("Early stopping - exceptional quality achieved")
        """
        return self.ema_quality >= self.early_stopping_threshold

    def can_continue(self) -> bool:
        """
        Check if refinement can continue (hasn't reached limits).

        Returns:
            True if can continue, False if stopped

        Example:
            >>> state = RefinementState(...)
            >>> if not state.can_continue():
            ...     print("Cannot continue - max rounds reached")
        """
        return not self.should_stop()

    def add_iteration(self, iteration: IterationRecord) -> "RefinementState":
        """
        Add iteration and update state (immutable, returns new state).

        Args:
            iteration: IterationRecord to add

        Returns:
            New RefinementState with iteration added

        Example:
            >>> state = RefinementState(...)
            >>> iteration = IterationRecord(...)
            >>> updated_state = state.add_iteration(iteration)
        """
        # Calculate new EMA quality (exponential moving average)
        # EMA formula: new_ema = alpha * new_value + (1 - alpha) * old_ema
        # Use alpha = 0.3 for reasonable smoothing
        alpha = 0.3
        new_ema = alpha * iteration.quality_score + (1 - alpha) * self.ema_quality

        # Accumulate feedback from verification result
        new_feedback = self.cumulative_feedback.copy()
        if "feedback" in iteration.verification_result:
            new_feedback.extend(iteration.verification_result["feedback"])

        return self.model_copy(
            update={
                "current_round": self.current_round + 1,
                "iterations": self.iterations + [iteration],
                "cumulative_feedback": new_feedback,
                "ema_quality": new_ema,
                "updated_at": datetime.now(),
            }
        )

    def get_latest_iteration(self) -> IterationRecord | None:
        """
        Get most recent iteration.

        Returns:
            Most recent IterationRecord or None if no iterations

        Example:
            >>> state = RefinementState(...)
            >>> latest = state.get_latest_iteration()
            >>> if latest:
            ...     print(f"Latest quality: {latest.quality_score}")
        """
        return self.iterations[-1] if self.iterations else None

    def save_to_file(self, base_path: str = ".docs/agents/shared/refinement-state") -> Path:
        """
        Save refinement state to JSON file.

        Args:
            base_path: Base directory for state files (default from constitution)

        Returns:
            Path to saved file

        Example:
            >>> state = RefinementState(...)
            >>> saved_path = state.save_to_file()
            >>> print(f"Saved to {saved_path}")
        """
        state_dir = Path(base_path)
        state_dir.mkdir(parents=True, exist_ok=True)

        state_file = state_dir / f"{self.task_id}.json"
        state_file.write_text(self.model_dump_json(indent=2))

        return state_file

    @classmethod
    def load_from_file(cls, task_id: str, base_path: str = ".docs/agents/shared/refinement-state") -> "RefinementState":
        """
        Load refinement state from JSON file.

        Args:
            task_id: Task identifier
            base_path: Base directory for state files

        Returns:
            RefinementState loaded from file

        Example:
            >>> state = RefinementState.load_from_file("550e8400-e29b-41d4-a716-446655440000")
            >>> print(f"Current round: {state.current_round}")
        """
        state_file = Path(base_path) / f"{task_id}.json"
        if not state_file.exists():
            raise FileNotFoundError(f"Refinement state not found: {state_file}")

        return cls.model_validate_json(state_file.read_text())
