"""
Metrics Data Models
DS-STAR Multi-Agent Enhancement - Feature 001

Provides Pydantic models for performance metrics and KPI tracking:
- TaskMetrics: Comprehensive metrics for a task

Constitutional Compliance:
- Principle VII: Observability - Structured metrics for monitoring
- FR-047: Achieve 3.5x improvement in task completion accuracy

Usage:
    from sdd.metrics.models import TaskMetrics

    # Create task metrics
    metrics = TaskMetrics(
        task_id="550e8400-e29b-41d4-a716-446655440000",
        phase="planning",
        started_at=datetime.now(),
        completed_at=datetime.now(),
        duration_seconds=120.5,
        refinement_rounds=3,
        refinement_quality_scores=[0.72, 0.78, 0.88],
        early_stopped=False,
        errors_encountered=2,
        errors_auto_resolved=2,
        debug_iterations=[3, 2],
        context_queries=5,
        avg_context_latency_ms=450.2,
        context_relevance_scores=[0.92, 0.88, 0.85, 0.91, 0.89],
        verification_checks=3,
        verification_passes_first_time=1,
        completed_without_intervention=True,
        escalated_to_human=False
    )

    # Calculate KPIs
    completion_accuracy = metrics.calculate_task_completion_accuracy([metrics])
    debug_rate = metrics.calculate_debug_success_rate()
    compliance_rate = metrics.calculate_constitutional_compliance_rate()

    # Save to file
    metrics_path = metrics.save_to_file()
"""

from datetime import datetime
from pathlib import Path
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ===================================================================
# TaskMetrics (T027)
# ===================================================================

class TaskMetrics(BaseModel):
    """
    Comprehensive metrics for a task.

    This model tracks all performance metrics for a task across the workflow
    phases. Used to calculate KPIs and validate 3.5x improvement targets.

    Fields:
        task_id: Task identifier (UUID format)
        phase: Workflow phase (specification, planning, implementation, validation)
        started_at: Task start time
        completed_at: Task completion time (if finished)
        duration_seconds: Total duration (if finished)
        refinement_rounds: Number of refinement iterations
        refinement_quality_scores: Quality score per iteration
        early_stopped: Whether early stopping triggered
        errors_encountered: Total errors during task
        errors_auto_resolved: Errors fixed by auto-debug
        debug_iterations: Debug iterations per error
        context_queries: Number of context retrieval queries
        avg_context_latency_ms: Average context query latency
        context_relevance_scores: Relevance per query
        verification_checks: Total verification checks
        verification_passes_first_time: Checks passed without refinement
        completed_without_intervention: No manual intervention needed
        escalated_to_human: Required human intervention

    Validation:
        - If completed_at is set, duration_seconds must be set
        - errors_auto_resolved <= errors_encountered
        - verification_passes_first_time <= verification_checks

    KPI Calculations:
        - Task Completion Accuracy = (completed_without_intervention / total_tasks) * 100
        - Debug Success Rate = (errors_auto_resolved / errors_encountered) * 100
        - Constitutional Compliance Rate = (verification_passes_first_time / verification_checks) * 100

    Storage:
        Stored in .docs/agents/shared/metrics/{phase}/{task_id}.json

    Example:
        >>> from datetime import datetime, timedelta
        >>> start = datetime.now()
        >>> end = start + timedelta(seconds=120)
        >>> metrics = TaskMetrics(
        ...     task_id="550e8400-e29b-41d4-a716-446655440000",
        ...     phase="planning",
        ...     started_at=start,
        ...     completed_at=end,
        ...     duration_seconds=120.5,
        ...     refinement_rounds=3,
        ...     refinement_quality_scores=[0.72, 0.78, 0.88],
        ...     early_stopped=False,
        ...     errors_encountered=2,
        ...     errors_auto_resolved=2,
        ...     debug_iterations=[3, 2],
        ...     context_queries=5,
        ...     avg_context_latency_ms=450.2,
        ...     context_relevance_scores=[0.92, 0.88, 0.85, 0.91, 0.89],
        ...     verification_checks=3,
        ...     verification_passes_first_time=1,
        ...     completed_without_intervention=True,
        ...     escalated_to_human=False
        ... )
        >>> metrics.calculate_debug_success_rate()
        100.0
    """

    task_id: str = Field(
        ...,
        description="Task identifier (UUID format)"
    )

    phase: str = Field(
        ...,
        description="Workflow phase (specification, planning, implementation, validation)"
    )

    started_at: datetime = Field(
        ...,
        description="Task start time"
    )

    completed_at: Optional[datetime] = Field(
        None,
        description="Task completion time (if finished)"
    )

    duration_seconds: Optional[float] = Field(
        None,
        gt=0.0,
        description="Total duration in seconds (if finished)"
    )

    refinement_rounds: int = Field(
        0,
        ge=0,
        description="Number of refinement iterations"
    )

    refinement_quality_scores: List[float] = Field(
        default_factory=list,
        description="Quality score per iteration (0.0 to 1.0)"
    )

    early_stopped: bool = Field(
        False,
        description="Whether early stopping triggered"
    )

    errors_encountered: int = Field(
        0,
        ge=0,
        description="Total errors during task"
    )

    errors_auto_resolved: int = Field(
        0,
        ge=0,
        description="Errors fixed by auto-debug"
    )

    debug_iterations: List[int] = Field(
        default_factory=list,
        description="Debug iterations per error"
    )

    context_queries: int = Field(
        0,
        ge=0,
        description="Number of context retrieval queries"
    )

    avg_context_latency_ms: float = Field(
        0.0,
        ge=0.0,
        description="Average context query latency in milliseconds"
    )

    context_relevance_scores: List[float] = Field(
        default_factory=list,
        description="Relevance per query (0.0 to 1.0)"
    )

    verification_checks: int = Field(
        0,
        ge=0,
        description="Total verification checks"
    )

    verification_passes_first_time: int = Field(
        0,
        ge=0,
        description="Checks passed without refinement"
    )

    completed_without_intervention: bool = Field(
        False,
        description="No manual intervention needed"
    )

    escalated_to_human: bool = Field(
        False,
        description="Required human intervention"
    )

    model_config = {
        "frozen": True,  # Immutable after creation (audit trail)
        "json_schema_extra": {
            "examples": [
                {
                    "task_id": "550e8400-e29b-41d4-a716-446655440000",
                    "phase": "planning",
                    "started_at": "2025-11-10T10:00:00Z",
                    "completed_at": "2025-11-10T10:02:00Z",
                    "duration_seconds": 120.5,
                    "refinement_rounds": 3,
                    "refinement_quality_scores": [0.72, 0.78, 0.88],
                    "early_stopped": False,
                    "errors_encountered": 2,
                    "errors_auto_resolved": 2,
                    "debug_iterations": [3, 2],
                    "context_queries": 5,
                    "avg_context_latency_ms": 450.2,
                    "context_relevance_scores": [0.92, 0.88, 0.85, 0.91, 0.89],
                    "verification_checks": 3,
                    "verification_passes_first_time": 1,
                    "completed_without_intervention": True,
                    "escalated_to_human": False
                }
            ]
        }
    }

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

    @field_validator("refinement_quality_scores", "context_relevance_scores")
    @classmethod
    def validate_score_ranges(cls, v: List[float]) -> List[float]:
        """Validate that all scores are between 0.0 and 1.0."""
        for score in v:
            if not 0.0 <= score <= 1.0:
                raise ValueError(f"Score must be between 0.0 and 1.0, got: {score}")
        return v

    @model_validator(mode="after")
    def validate_completed_requires_duration(self) -> "TaskMetrics":
        """Validate that duration_seconds is set if completed_at is set."""
        if self.completed_at is not None and self.duration_seconds is None:
            raise ValueError("duration_seconds must be set if completed_at is set")
        return self

    @model_validator(mode="after")
    def validate_errors_auto_resolved_within_encountered(self) -> "TaskMetrics":
        """Validate that errors_auto_resolved <= errors_encountered."""
        if self.errors_auto_resolved > self.errors_encountered:
            raise ValueError(
                f"errors_auto_resolved ({self.errors_auto_resolved}) cannot exceed "
                f"errors_encountered ({self.errors_encountered})"
            )
        return self

    @model_validator(mode="after")
    def validate_verification_passes_within_checks(self) -> "TaskMetrics":
        """Validate that verification_passes_first_time <= verification_checks."""
        if self.verification_passes_first_time > self.verification_checks:
            raise ValueError(
                f"verification_passes_first_time ({self.verification_passes_first_time}) "
                f"cannot exceed verification_checks ({self.verification_checks})"
            )
        return self

    def calculate_debug_success_rate(self) -> float:
        """
        Calculate debug success rate (% of errors auto-resolved).

        Returns:
            Debug success rate (0.0 to 100.0)

        Example:
            >>> metrics = TaskMetrics(errors_encountered=10, errors_auto_resolved=7, ...)
            >>> metrics.calculate_debug_success_rate()
            70.0
        """
        if self.errors_encountered == 0:
            return 100.0  # No errors = 100% success
        return (self.errors_auto_resolved / self.errors_encountered) * 100.0

    def calculate_constitutional_compliance_rate(self) -> float:
        """
        Calculate constitutional compliance rate (% passing first time).

        Returns:
            Compliance rate (0.0 to 100.0)

        Example:
            >>> metrics = TaskMetrics(verification_checks=10, verification_passes_first_time=8, ...)
            >>> metrics.calculate_constitutional_compliance_rate()
            80.0
        """
        if self.verification_checks == 0:
            return 100.0  # No checks = 100% pass
        return (self.verification_passes_first_time / self.verification_checks) * 100.0

    def calculate_avg_refinement_quality(self) -> float:
        """
        Calculate average refinement quality score.

        Returns:
            Average quality score (0.0 to 1.0)

        Example:
            >>> metrics = TaskMetrics(refinement_quality_scores=[0.7, 0.8, 0.9], ...)
            >>> metrics.calculate_avg_refinement_quality()
            0.8
        """
        if not self.refinement_quality_scores:
            return 0.0
        return sum(self.refinement_quality_scores) / len(self.refinement_quality_scores)

    def calculate_avg_context_relevance(self) -> float:
        """
        Calculate average context relevance score.

        Returns:
            Average relevance score (0.0 to 1.0)

        Example:
            >>> metrics = TaskMetrics(context_relevance_scores=[0.9, 0.85, 0.95], ...)
            >>> metrics.calculate_avg_context_relevance()
            0.9
        """
        if not self.context_relevance_scores:
            return 0.0
        return sum(self.context_relevance_scores) / len(self.context_relevance_scores)

    @staticmethod
    def calculate_task_completion_accuracy(metrics_list: List["TaskMetrics"]) -> float:
        """
        Calculate task completion accuracy across multiple tasks.

        Args:
            metrics_list: List of TaskMetrics to aggregate

        Returns:
            Task completion accuracy (0.0 to 100.0)

        Example:
            >>> metrics1 = TaskMetrics(completed_without_intervention=True, ...)
            >>> metrics2 = TaskMetrics(completed_without_intervention=False, ...)
            >>> TaskMetrics.calculate_task_completion_accuracy([metrics1, metrics2])
            50.0
        """
        if not metrics_list:
            return 0.0

        completed_without_intervention = sum(
            1 for m in metrics_list if m.completed_without_intervention
        )
        return (completed_without_intervention / len(metrics_list)) * 100.0

    def validate_3_5x_improvement(self, baseline_accuracy: float) -> bool:
        """
        Validate that task completion accuracy meets 3.5x improvement target.

        Args:
            baseline_accuracy: Pre-enhancement task completion accuracy (0.0 to 100.0)

        Returns:
            True if 3.5x improvement achieved, False otherwise

        Example:
            >>> metrics = TaskMetrics(completed_without_intervention=True, ...)
            >>> baseline = 20.0  # 20% baseline
            >>> target = baseline * 3.5  # 70% target
            >>> # If current accuracy is 75%, improvement is met
        """
        target_accuracy = baseline_accuracy * 3.5
        current_accuracy = 100.0 if self.completed_without_intervention else 0.0
        return current_accuracy >= target_accuracy

    def save_to_file(self, base_path: str = ".docs/agents/shared/metrics") -> Path:
        """
        Save metrics to JSON file.

        Args:
            base_path: Base directory for metrics files

        Returns:
            Path to saved file

        Example:
            >>> metrics = TaskMetrics(...)
            >>> saved_path = metrics.save_to_file()
            >>> print(f"Saved to {saved_path}")
        """
        metrics_dir = Path(base_path) / self.phase
        metrics_dir.mkdir(parents=True, exist_ok=True)

        metrics_file = metrics_dir / f"{self.task_id}.json"
        metrics_file.write_text(self.model_dump_json(indent=2))

        return metrics_file

    @classmethod
    def load_from_file(cls, task_id: str, phase: str, base_path: str = ".docs/agents/shared/metrics") -> "TaskMetrics":
        """
        Load metrics from JSON file.

        Args:
            task_id: Task identifier
            phase: Workflow phase
            base_path: Base directory for metrics files

        Returns:
            TaskMetrics loaded from file

        Example:
            >>> metrics = TaskMetrics.load_from_file(
            ...     "550e8400-e29b-41d4-a716-446655440000",
            ...     "planning"
            ... )
            >>> print(f"Duration: {metrics.duration_seconds}s")
        """
        metrics_file = Path(base_path) / phase / f"{task_id}.json"
        if not metrics_file.exists():
            raise FileNotFoundError(f"Metrics file not found: {metrics_file}")

        return cls.model_validate_json(metrics_file.read_text())

    def export_for_analysis(self) -> dict:
        """
        Export metrics in format optimized for analysis.

        Returns:
            Dictionary with flattened metrics structure

        Example:
            >>> metrics = TaskMetrics(...)
            >>> export = metrics.export_for_analysis()
            >>> import json
            >>> print(json.dumps(export, indent=2))
        """
        return {
            "task_id": self.task_id,
            "phase": self.phase,
            "duration_seconds": self.duration_seconds,
            "refinement_rounds": self.refinement_rounds,
            "avg_refinement_quality": self.calculate_avg_refinement_quality(),
            "early_stopped": self.early_stopped,
            "debug_success_rate": self.calculate_debug_success_rate(),
            "avg_debug_iterations": (
                sum(self.debug_iterations) / len(self.debug_iterations)
                if self.debug_iterations else 0.0
            ),
            "context_queries": self.context_queries,
            "avg_context_latency_ms": self.avg_context_latency_ms,
            "avg_context_relevance": self.calculate_avg_context_relevance(),
            "constitutional_compliance_rate": self.calculate_constitutional_compliance_rate(),
            "completed_without_intervention": self.completed_without_intervention,
            "escalated_to_human": self.escalated_to_human,
        }
