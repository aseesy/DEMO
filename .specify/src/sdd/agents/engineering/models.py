"""
Engineering Agent Data Models
DS-STAR Multi-Agent Enhancement - Feature 001

Provides Pydantic models for Engineering department agents:
- DebugAttempt: Single auto-debug iteration record
- DebugSession: Complete auto-debug session for an error

Constitutional Compliance:
- Principle IV: Idempotent Operations - Max 5 debug iterations prevents infinite loops
- Principle VII: Observability - Complete audit trail of debug attempts

Usage:
    from sdd.agents.engineering.models import DebugAttempt, DebugSession

    # Create debug attempt
    attempt = DebugAttempt(
        iteration=1,
        error_pattern="type",
        error_message="TypeError: unsupported operand type(s) for +: 'int' and 'str'",
        stack_trace="Traceback...",
        repair_action="Convert string to int before addition",
        repaired_code="result = int(user_input) + count",
        test_result="passed",
        reasoning="Error indicates string + int operation"
    )

    # Create debug session
    session = DebugSession(
        task_id="550e8400-e29b-41d4-a716-446655440000",
        original_code="result = user_input + count",
        final_code="result = int(user_input) + count",
        attempts=[attempt],
        success=True,
        escalated=False,
        total_iterations=1,
        resolution_time_seconds=5.2
    )
"""

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, computed_field, field_validator, model_validator


# ===================================================================
# Enumerations
# ===================================================================

class ErrorPattern(str, Enum):
    """Classified error types for pattern matching."""
    SYNTAX = "syntax"
    TYPE = "type"
    NAME = "name"
    NULL = "null"
    IMPORT = "import"
    LOGIC = "logic"
    UNKNOWN = "unknown"


class TestResult(str, Enum):
    """Test execution result after repair."""
    PASSED = "passed"
    FAILED = "failed"
    ERROR = "error"


# ===================================================================
# DebugAttempt (T023 - Part 1)
# ===================================================================

class DebugAttempt(BaseModel):
    """
    Single auto-debug iteration record.

    This model represents one attempt to repair an error through automated
    debugging. Part of a DebugSession tracking multiple iterations.

    Fields:
        iteration: Iteration number (1-5, max debug iterations)
        error_pattern: Classified error type (syntax, type, name, null, import, logic)
        error_message: Original error message
        stack_trace: Full stack trace
        repair_action: Description of attempted repair
        repaired_code: Code after repair attempt
        test_result: Outcome (passed, failed, error)
        reasoning: Why this repair was attempted

    Validation:
        - iteration must be 1-5 (max debug iterations from refinement.conf)
        - error_pattern must be recognized type
        - test_result must be valid outcome

    Example:
        >>> attempt = DebugAttempt(
        ...     iteration=1,
        ...     error_pattern="type",
        ...     error_message="TypeError: unsupported operand type(s) for +: 'int' and 'str'",
        ...     stack_trace="Traceback (most recent call last):\\n  File 'app.py', line 42...",
        ...     repair_action="Convert string to int before addition: int(user_input) + count",
        ...     repaired_code="result = int(user_input) + count",
        ...     test_result="passed",
        ...     reasoning="Error indicates string + int operation. Spec requires numerical calculation."
        ... )
        >>> attempt.iteration
        1
        >>> attempt.test_result
        <TestResult.PASSED: 'passed'>
    """

    iteration: int = Field(
        ...,
        ge=1,
        le=5,
        description="Iteration number (1-5, max debug iterations)"
    )

    error_pattern: ErrorPattern = Field(
        ...,
        description="Classified error type (syntax, type, name, null, import, logic)"
    )

    error_message: str = Field(
        ...,
        min_length=1,
        description="Original error message"
    )

    stack_trace: str = Field(
        ...,
        min_length=1,
        description="Full stack trace"
    )

    repair_action: str = Field(
        ...,
        min_length=10,
        description="Description of attempted repair"
    )

    repaired_code: str = Field(
        ...,
        min_length=1,
        description="Code after repair attempt"
    )

    test_result: TestResult = Field(
        ...,
        description="Outcome (passed, failed, error)"
    )

    reasoning: str = Field(
        ...,
        min_length=10,
        description="Why this repair was attempted"
    )

    model_config = {
        "frozen": True,  # Immutable after creation (audit trail)
        "json_schema_extra": {
            "examples": [
                {
                    "iteration": 1,
                    "error_pattern": "type",
                    "error_message": "TypeError: unsupported operand type(s) for +: 'int' and 'str'",
                    "stack_trace": "Traceback (most recent call last):\n  File 'app.py', line 42, in calculate\n    result = user_input + count\nTypeError: unsupported operand type(s) for +: 'int' and 'str'",
                    "repair_action": "Convert string to int before addition: int(user_input) + count",
                    "repaired_code": "result = int(user_input) + count",
                    "test_result": "passed",
                    "reasoning": "Error indicates string + int operation. Spec requires numerical calculation, so convert input to int."
                }
            ]
        }
    }


# ===================================================================
# DebugSession (T023 - Part 2)
# ===================================================================

class DebugSession(BaseModel):
    """
    Complete auto-debug session for an error.

    This model tracks the entire debugging process, including all attempts,
    final outcome, and escalation status. Supports max 5 iterations before
    human escalation (Constitutional Principle IV: Idempotent Operations).

    Fields:
        task_id: Task identifier (UUID format)
        original_code: Code before debugging
        final_code: Code after successful debugging (if resolved)
        attempts: All debug attempts (1-5 iterations)
        success: Whether error was auto-resolved
        escalated: Whether escalated to human
        total_iterations: Number of attempts made
        resolution_time_seconds: Time to resolve (if successful)

    Validation:
        - attempts must be non-empty
        - total_iterations must match len(attempts)
        - If success=True, final_code must be provided
        - If escalated=True, success must be False

    State Transitions:
        1. Initialize with original_code
        2. Add attempts (1-5 iterations)
        3. Either: Mark success=True with final_code, OR escalated=True

    Storage:
        Stored in .docs/agents/engineering/autodebug/sessions/{task_id}.json

    Example:
        >>> session = DebugSession(
        ...     task_id="550e8400-e29b-41d4-a716-446655440000",
        ...     original_code="result = user_input + count",
        ...     final_code="result = int(user_input) + count",
        ...     attempts=[attempt1],
        ...     success=True,
        ...     escalated=False,
        ...     total_iterations=1,
        ...     resolution_time_seconds=5.2
        ... )
        >>> session.success
        True
        >>> session.total_iterations
        1
    """

    task_id: str = Field(
        ...,
        description="Task identifier (UUID format)"
    )

    original_code: str = Field(
        ...,
        min_length=1,
        description="Code before debugging"
    )

    final_code: Optional[str] = Field(
        None,
        description="Code after successful debugging (if resolved)"
    )

    attempts: List[DebugAttempt] = Field(
        ...,
        min_length=1,
        max_length=5,  # MAX_DEBUG_ITERATIONS from refinement.conf
        description="All debug attempts (1-5 iterations)"
    )

    success: bool = Field(
        ...,
        description="Whether error was auto-resolved"
    )

    escalated: bool = Field(
        ...,
        description="Whether escalated to human"
    )

    total_iterations: int = Field(
        ...,
        ge=1,
        le=5,
        description="Number of attempts made"
    )

    resolution_time_seconds: Optional[float] = Field(
        None,
        gt=0.0,
        description="Time to resolve in seconds (if successful)"
    )

    error_pattern: ErrorPattern = Field(
        ...,
        description="Primary error pattern from first attempt"
    )

    escalation_context: Optional[Dict[str, Any]] = Field(
        None,
        description="Context and reasoning when escalated to human (dict with original_error, attempted_repairs)"
    )

    repair_summary: Optional[str] = Field(
        None,
        description="Summary of successful repair (if resolved)"
    )

    @computed_field
    @property
    def resolved(self) -> bool:
        """Alias for 'success' field for backward compatibility with tests."""
        return self.success

    model_config = {
        "frozen": True,  # Immutable after creation (audit trail)
        "json_schema_extra": {
            "examples": [
                {
                    "task_id": "550e8400-e29b-41d4-a716-446655440000",
                    "original_code": "result = user_input + count",
                    "final_code": "result = int(user_input) + count",
                    "attempts": [
                        {
                            "iteration": 1,
                            "error_pattern": "type",
                            "error_message": "TypeError: unsupported operand type(s) for +: 'int' and 'str'",
                            "stack_trace": "Traceback...",
                            "repair_action": "Convert string to int",
                            "repaired_code": "result = int(user_input) + count",
                            "test_result": "passed",
                            "reasoning": "Type conversion needed"
                        }
                    ],
                    "success": True,
                    "escalated": False,
                    "total_iterations": 1,
                    "resolution_time_seconds": 5.2,
                    "error_pattern": "type",
                    "escalation_context": None,
                    "repair_summary": "Converted string to int before addition"
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

    @model_validator(mode="after")
    def validate_total_iterations_matches_attempts(self) -> "DebugSession":
        """Validate that total_iterations matches len(attempts)."""
        if self.total_iterations != len(self.attempts):
            raise ValueError(
                f"total_iterations ({self.total_iterations}) must match "
                f"len(attempts) ({len(self.attempts)})"
            )
        return self

    @model_validator(mode="after")
    def validate_success_requires_final_code(self) -> "DebugSession":
        """Validate that final_code is provided if success=True."""
        if self.success and not self.final_code:
            raise ValueError("final_code must be provided if success=True")
        return self

    @model_validator(mode="after")
    def validate_escalated_means_not_successful(self) -> "DebugSession":
        """Validate that if escalated=True, success must be False."""
        if self.escalated and self.success:
            raise ValueError(
                "If escalated=True, success must be False (cannot be both)"
            )
        return self

    @model_validator(mode="after")
    def validate_iteration_sequence(self) -> "DebugSession":
        """Validate that attempts have sequential iteration numbers (1, 2, 3, ...)."""
        for i, attempt in enumerate(self.attempts):
            expected_iteration = i + 1
            if attempt.iteration != expected_iteration:
                raise ValueError(
                    f"Attempt {i} has iteration={attempt.iteration}, "
                    f"expected {expected_iteration}"
                )
        return self

    @model_validator(mode="after")
    def validate_escalation_context(self) -> "DebugSession":
        """Validate that escalation_context is provided if escalated=True."""
        if self.escalated and not self.escalation_context:
            raise ValueError("escalation_context must be provided if escalated=True")
        return self

    @model_validator(mode="after")
    def validate_repair_summary(self) -> "DebugSession":
        """Validate that repair_summary is provided if success=True."""
        if self.success and not self.repair_summary:
            raise ValueError("repair_summary must be provided if success=True")
        return self

    @model_validator(mode="after")
    def validate_error_pattern_matches_first_attempt(self) -> "DebugSession":
        """Validate that error_pattern matches first attempt's error_pattern."""
        if self.attempts and self.error_pattern != self.attempts[0].error_pattern:
            raise ValueError(
                f"error_pattern ({self.error_pattern.value}) must match "
                f"first attempt's error_pattern ({self.attempts[0].error_pattern.value})"
            )
        return self

    def get_last_error(self) -> str:
        """
        Get the error message from the last attempt.

        Returns:
            Error message from most recent attempt

        Example:
            >>> session = DebugSession(...)
            >>> last_error = session.get_last_error()
        """
        return self.attempts[-1].error_message if self.attempts else ""

    def get_error_patterns(self) -> List[ErrorPattern]:
        """
        Get all error patterns encountered during session.

        Returns:
            List of error patterns (may contain duplicates)

        Example:
            >>> session = DebugSession(...)
            >>> patterns = session.get_error_patterns()
            >>> assert ErrorPattern.TYPE in patterns
        """
        return [attempt.error_pattern for attempt in self.attempts]

    def generate_escalation_context(self) -> str:
        """
        Generate human-readable escalation context for manual debugging.

        Returns:
            Formatted escalation report with all attempts

        Example:
            >>> session = DebugSession(...)
            >>> report = session.generate_escalation_context()
            >>> print(report)
            AUTO-DEBUG ESCALATION REPORT
            Task ID: 550e8400-e29b-41d4-a716-446655440000
            Status: ESCALATED TO HUMAN
            Total Iterations: 5 (max reached)
            ...
        """
        lines = [
            "AUTO-DEBUG ESCALATION REPORT",
            "=" * 60,
            f"Task ID: {self.task_id}",
            f"Status: {'ESCALATED TO HUMAN' if self.escalated else 'RESOLVED'}",
            f"Total Iterations: {self.total_iterations}",
            "",
            "ORIGINAL CODE:",
            "-" * 60,
            self.original_code,
            "",
        ]

        if self.final_code:
            lines.extend([
                "FINAL CODE:",
                "-" * 60,
                self.final_code,
                "",
            ])

        lines.extend([
            "DEBUG ATTEMPTS:",
            "-" * 60,
        ])

        for attempt in self.attempts:
            lines.extend([
                f"\nIteration {attempt.iteration}: {attempt.error_pattern.value.upper()}",
                f"  Error: {attempt.error_message[:80]}...",
                f"  Action: {attempt.repair_action[:80]}...",
                f"  Result: {attempt.test_result.value.upper()}",
                f"  Reasoning: {attempt.reasoning[:80]}...",
            ])

        lines.extend([
            "",
            "=" * 60,
            f"Resolution Time: {self.resolution_time_seconds:.2f}s" if self.resolution_time_seconds else "Not resolved",
        ])

        return "\n".join(lines)
