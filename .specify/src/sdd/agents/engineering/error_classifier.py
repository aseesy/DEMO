"""
Error Pattern Classifier - Automatic Error Analysis
DS-STAR Multi-Agent Enhancement - Feature 001

Purpose:
    Detects and classifies execution errors into known patterns.
    Extracts error context (stack trace, line number, code snippet).
    Provides fix templates per error type for auto-debug agent.

Constitutional Compliance:
    - Principle I: Library-First - ErrorClassifier is standalone library
    - Principle VII: Observability - Structured error logging

Error Types Classified:
    - SyntaxError: Invalid Python syntax
    - TypeError: Type mismatch or invalid operation
    - NameError: Undefined variable or function
    - AttributeError: Invalid attribute access (often None)
    - ImportError/ModuleNotFoundError: Missing imports
    - ValueError: Invalid value for operation
    - AssertionError: Test assertion failure
    - Logic errors: Incorrect behavior

Usage:
    from sdd.agents.engineering.error_classifier import ErrorClassifier

    classifier = ErrorClassifier()

    # Classify error
    pattern = classifier.classify(
        error_message="NameError: name 'foo' is not defined",
        stack_trace="Traceback (most recent call last):\\n  File ...",
        code_context="def bar():\\n    return foo + 1"
    )

    print(f"Error type: {pattern['error_type']}")
    print(f"Confidence: {pattern['confidence']}")
    print(f"Fix template: {pattern['fix_template']}")
"""

import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Configure structured logging (Principle VII)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ===================================================================
# Error Pattern Model
# ===================================================================

class ErrorPattern:
    """
    Classified error pattern.

    Attributes:
        error_type: Type of error (syntax, type, name, attribute, import, logic)
        error_class: Python exception class name
        message: Error message
        confidence: Classification confidence (0.0-1.0)
        line_number: Line number where error occurred (optional)
        code_snippet: Code snippet showing error (optional)
        stack_trace: Full stack trace (optional)
        fix_template: Suggested fix template
        explanation: Human-readable explanation
    """

    def __init__(
        self,
        error_type: str,
        error_class: str,
        message: str,
        confidence: float,
        line_number: Optional[int] = None,
        code_snippet: Optional[str] = None,
        stack_trace: Optional[str] = None,
        fix_template: str = "",
        explanation: str = ""
    ):
        self.error_type = error_type
        self.error_class = error_class
        self.message = message
        self.confidence = confidence
        self.line_number = line_number
        self.code_snippet = code_snippet
        self.stack_trace = stack_trace
        self.fix_template = fix_template
        self.explanation = explanation

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'error_type': self.error_type,
            'error_class': self.error_class,
            'message': self.message,
            'confidence': self.confidence,
            'line_number': self.line_number,
            'code_snippet': self.code_snippet,
            'stack_trace': self.stack_trace,
            'fix_template': self.fix_template,
            'explanation': self.explanation
        }


# ===================================================================
# ErrorClassifier
# ===================================================================

class ErrorClassifier:
    """
    Error Pattern Classifier for automatic error analysis.

    Detects error types, extracts context, and provides fix templates
    for the auto-debug agent.

    Attributes:
        patterns: Dictionary of error patterns and detection rules
        fix_templates: Dictionary of fix templates per error type
    """

    def __init__(self):
        """Initialize Error Classifier."""
        # Error detection patterns
        self.patterns = {
            'syntax': [
                (r'SyntaxError', 'Invalid Python syntax'),
                (r'IndentationError', 'Incorrect indentation'),
                (r'TabError', 'Mixed tabs and spaces')
            ],
            'type': [
                (r'TypeError', 'Type mismatch or invalid operation'),
                (r'unsupported operand type', 'Invalid operation between types')
            ],
            'name': [
                (r'NameError', 'Undefined variable or function'),
                (r"name '(\w+)' is not defined", 'Variable not defined')
            ],
            'attribute': [
                (r'AttributeError', 'Invalid attribute access'),
                (r"'NoneType' object has no attribute", 'Null reference error'),
                (r"object has no attribute '(\w+)'", 'Missing attribute')
            ],
            'import': [
                (r'ImportError', 'Import failed'),
                (r'ModuleNotFoundError', 'Module not installed'),
                (r"No module named '(\w+)'", 'Missing dependency')
            ],
            'value': [
                (r'ValueError', 'Invalid value for operation'),
                (r'invalid literal', 'String to number conversion failed'),
                (r'not enough values to unpack', 'Unpacking mismatch')
            ],
            'assertion': [
                (r'AssertionError', 'Test assertion failed'),
                (r'assert', 'Assertion condition not met')
            ]
        }

        # Fix templates per error type
        self.fix_templates = {
            'syntax': """
# Fix syntax errors:
1. Check for missing colons, parentheses, brackets
2. Verify correct indentation (use 4 spaces)
3. Check for unclosed strings/quotes
4. Ensure Python keywords used correctly
""",
            'type': """
# Fix type errors:
1. Check variable types match expected types
2. Add type conversion: int(), str(), float(), etc.
3. Verify function arguments match signature
4. Use isinstance() to check types before operations
""",
            'name': """
# Fix name errors:
1. Check if variable is defined before use
2. Verify function is imported or defined
3. Check for typos in variable/function names
4. Ensure variable is in correct scope
""",
            'attribute': """
# Fix attribute errors:
1. Check if object is None before accessing attributes
2. Verify attribute name is correct
3. Check if object has the attribute (hasattr())
4. Initialize object before accessing attributes
""",
            'import': """
# Fix import errors:
1. Check if module is installed: pip install <module>
2. Verify import path is correct
3. Check for circular imports
4. Ensure __init__.py exists in package
""",
            'value': """
# Fix value errors:
1. Validate input values before operations
2. Check for edge cases (empty strings, zero values)
3. Use try/except to handle conversion failures
4. Verify data format matches expected format
""",
            'assertion': """
# Fix assertion errors:
1. Check test expectations vs actual behavior
2. Review logic in function being tested
3. Update test if behavior is correct
4. Add debug logging to see actual values
""",
            'logic': """
# Fix logic errors:
1. Review algorithm for correctness
2. Add debug logging at key points
3. Check boundary conditions
4. Test with edge cases
5. Verify assumptions about data
"""
        }

        logger.info("ErrorClassifier initialized")

    def classify(
        self,
        error_message: str,
        stack_trace: Optional[str] = None,
        code_context: Optional[str] = None
    ) -> ErrorPattern:
        """
        Classify error and provide fix template.

        Args:
            error_message: Error message from exception
            stack_trace: Full stack trace (optional)
            code_context: Code snippet showing error location (optional)

        Returns:
            ErrorPattern with classification and fix template

        Example:
            >>> classifier = ErrorClassifier()
            >>> pattern = classifier.classify(
            ...     error_message="NameError: name 'foo' is not defined",
            ...     stack_trace="Traceback...\\nLine 10",
            ...     code_context="def bar():\\n    return foo + 1"
            ... )
            >>> print(pattern.error_type)
            'name'
            >>> print(pattern.fix_template)
            # Fix name errors:...
        """
        logger.info(f"Classifying error: {error_message[:100]}")

        # Detect error type
        error_type, error_class, confidence = self._detect_error_type(error_message)

        # Extract line number from stack trace
        line_number = self._extract_line_number(stack_trace) if stack_trace else None

        # Extract code snippet if not provided
        if not code_context and stack_trace:
            code_context = self._extract_code_snippet(stack_trace)

        # Get fix template
        fix_template = self.fix_templates.get(error_type, self.fix_templates['logic'])

        # Generate explanation
        explanation = self._generate_explanation(error_type, error_message)

        pattern = ErrorPattern(
            error_type=error_type,
            error_class=error_class,
            message=error_message,
            confidence=confidence,
            line_number=line_number,
            code_snippet=code_context,
            stack_trace=stack_trace,
            fix_template=fix_template,
            explanation=explanation
        )

        logger.info(
            f"Error classified: type={error_type}, class={error_class}, "
            f"confidence={confidence:.2f}"
        )

        return pattern

    def get_pattern(self, error_type: str) -> str:
        """
        Get fix template for error type.

        Args:
            error_type: Error type (syntax, type, name, etc.)

        Returns:
            Fix template string

        Example:
            >>> classifier = ErrorClassifier()
            >>> template = classifier.get_pattern('name')
            >>> print(template)
        """
        return self.fix_templates.get(error_type, self.fix_templates['logic'])

    def _detect_error_type(self, error_message: str) -> Tuple[str, str, float]:
        """
        Detect error type from message.

        Returns:
            (error_type, error_class, confidence)
        """
        for error_type, patterns in self.patterns.items():
            for pattern, description in patterns:
                if re.search(pattern, error_message, re.IGNORECASE):
                    # Extract error class name
                    error_class_match = re.search(r'(\w+Error)', error_message)
                    error_class = error_class_match.group(1) if error_class_match else error_type

                    confidence = 0.95  # High confidence for pattern match
                    return error_type, error_class, confidence

        # Unknown error type - classify as logic error
        return 'logic', 'LogicError', 0.5

    def _extract_line_number(self, stack_trace: str) -> Optional[int]:
        """Extract line number from stack trace."""
        # Look for "line N" pattern
        match = re.search(r'[Ll]ine (\d+)', stack_trace)
        if match:
            return int(match.group(1))
        return None

    def _extract_code_snippet(self, stack_trace: str) -> Optional[str]:
        """Extract code snippet from stack trace."""
        # Look for code lines (typically indented)
        lines = stack_trace.split('\n')
        code_lines = []

        for i, line in enumerate(lines):
            # Code lines are typically indented or start with spaces
            if line.startswith('    ') or line.startswith('\t'):
                code_lines.append(line.strip())

        if code_lines:
            return '\n'.join(code_lines[-3:])  # Last 3 lines of code context
        return None

    def _generate_explanation(self, error_type: str, error_message: str) -> str:
        """Generate human-readable explanation."""
        explanations = {
            'syntax': "Python syntax is incorrect. Check for missing colons, brackets, or quotes.",
            'type': "Type mismatch between variables. Ensure types match expected operations.",
            'name': "Variable or function name is not defined. Check spelling and scope.",
            'attribute': "Attribute does not exist on object. Often caused by None values.",
            'import': "Module import failed. Check if module is installed and path is correct.",
            'value': "Value is invalid for the operation. Validate inputs and handle edge cases.",
            'assertion': "Test assertion failed. Review expected vs actual behavior.",
            'logic': "Logic error in code. Review algorithm and test with edge cases."
        }

        base_explanation = explanations.get(error_type, "Unknown error type.")

        # Add specific details from error message
        if "name '" in error_message:
            match = re.search(r"name '(\w+)'", error_message)
            if match:
                var_name = match.group(1)
                base_explanation += f" Variable '{var_name}' is not defined."

        elif "'NoneType'" in error_message:
            base_explanation += " Object is None - add null check before accessing attributes."

        elif "No module named" in error_message:
            match = re.search(r"No module named '(\w+)'", error_message)
            if match:
                module_name = match.group(1)
                base_explanation += f" Install module: pip install {module_name}"

        return base_explanation

    def analyze_error_trend(
        self,
        error_history: List[ErrorPattern]
    ) -> Dict[str, Any]:
        """
        Analyze trends in error history.

        Args:
            error_history: List of ErrorPattern instances

        Returns:
            Dictionary with trend analysis

        Example:
            >>> classifier = ErrorClassifier()
            >>> history = [pattern1, pattern2, pattern3]
            >>> trends = classifier.analyze_error_trend(history)
            >>> print(f"Most common: {trends['most_common_type']}")
        """
        if not error_history:
            return {
                'total_errors': 0,
                'most_common_type': None,
                'type_distribution': {}
            }

        # Count error types
        type_counts: Dict[str, int] = {}
        for pattern in error_history:
            type_counts[pattern.error_type] = type_counts.get(pattern.error_type, 0) + 1

        # Find most common
        most_common_type = max(type_counts.items(), key=lambda x: x[1])[0]

        return {
            'total_errors': len(error_history),
            'most_common_type': most_common_type,
            'type_distribution': type_counts,
            'unique_types': len(type_counts)
        }

    def suggest_preventive_measures(self, error_type: str) -> List[str]:
        """
        Suggest preventive measures for error type.

        Args:
            error_type: Error type

        Returns:
            List of preventive measures

        Example:
            >>> classifier = ErrorClassifier()
            >>> measures = classifier.suggest_preventive_measures('name')
            >>> for m in measures:
            ...     print(f"- {m}")
        """
        measures = {
            'syntax': [
                "Use a linter (pylint, flake8) to catch syntax errors",
                "Enable editor syntax highlighting",
                "Configure auto-formatting (black, autopep8)"
            ],
            'type': [
                "Use type hints for function signatures",
                "Enable type checking with mypy",
                "Use Pydantic for data validation"
            ],
            'name': [
                "Use linters to detect undefined variables",
                "Follow naming conventions consistently",
                "Use IDE auto-completion"
            ],
            'attribute': [
                "Check for None before accessing attributes",
                "Use Optional type hints",
                "Add null guards with hasattr()"
            ],
            'import': [
                "Pin dependencies in requirements.txt",
                "Use virtual environments",
                "Document all dependencies"
            ],
            'value': [
                "Validate inputs at function boundaries",
                "Use Pydantic for schema validation",
                "Add comprehensive test cases"
            ],
            'assertion': [
                "Review test expectations carefully",
                "Add descriptive assertion messages",
                "Test edge cases and boundaries"
            ],
            'logic': [
                "Write tests before implementation (TDD)",
                "Add debug logging",
                "Review code with peers"
            ]
        }

        return measures.get(error_type, [
            "Follow test-first development",
            "Add comprehensive logging",
            "Review code carefully"
        ])
