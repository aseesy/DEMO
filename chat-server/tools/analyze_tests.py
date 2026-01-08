#!/usr/bin/env python3
"""
Test Failure Analysis Tool
==========================

Analyzes Jest test failures and identifies patterns to help fix them:
1. Parse Jest test output to extract failure patterns
2. Categorize failures by type (mock issues, null references, etc.)
3. Analyze test files for common anti-patterns
4. Suggest fixes based on identified patterns

Usage:
    python tools/analyze_tests.py
    python tools/analyze_tests.py --test-file mediator.test.js
    python tools/analyze_tests.py --pattern "null|undefined"
    python tools/analyze_tests.py --suggest-fixes
"""

import os
import re
import json
import sys
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple, Set, Optional
from dataclasses import dataclass, field, asdict
from collections import defaultdict
import argparse

# Resolve paths
SCRIPT_DIR = Path(__file__).parent.resolve()
BASE_DIR = SCRIPT_DIR.parent.parent  # Workspace root
SERVER_DIR = BASE_DIR / "chat-server"
TEST_DIR = SERVER_DIR / "__tests__"
SRC_TEST_DIR = SERVER_DIR / "src"

# Try to import tree-sitter for AST parsing
try:
    from tree_sitter import Language, Parser
    import tree_sitter_javascript
    HAS_TREE_SITTER = True
    JS_LANGUAGE = Language(tree_sitter_javascript.language())
except ImportError:
    HAS_TREE_SITTER = False
    JS_LANGUAGE = None


@dataclass
class TestFailure:
    """Represents a single test failure"""
    test_file: str
    test_suite: str
    test_name: str
    error_type: str
    error_message: str
    line_number: Optional[int] = None
    expected: Optional[str] = None
    received: Optional[str] = None
    stack_trace: List[str] = field(default_factory=list)
    severity: str = "error"  # error, warning, info


@dataclass
class TestPattern:
    """Represents a pattern found in test failures"""
    pattern_type: str  # null_reference, mock_missing, undefined_variable, etc.
    description: str
    count: int
    examples: List[str] = field(default_factory=list)
    suggested_fix: Optional[str] = None


@dataclass
class TestAnalysis:
    """Complete test analysis results"""
    total_tests: int
    passed: int
    failed: int
    skipped: int
    failures: List[TestFailure] = field(default_factory=list)
    patterns: List[TestPattern] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)


class TestFailureAnalyzer:
    """Analyzes Jest test failures and identifies patterns"""

    def __init__(self):
        self.failures: List[TestFailure] = []
        self.patterns: Dict[str, List[TestFailure]] = defaultdict(list)

    def run_tests(self, quiet: bool = False) -> str:
        """Run Jest tests and capture output"""
        print("🧪 Running Jest tests...")
        cmd = ["npm", "test", "--", "--passWithNoTests"]
        if quiet:
            cmd.append("--silent")
        
        try:
            result = subprocess.run(
                cmd,
                cwd=SERVER_DIR,
                capture_output=True,
                text=True,
                timeout=300
            )
            return result.stdout + result.stderr
        except subprocess.TimeoutExpired:
            return "ERROR: Test run timed out after 5 minutes"
        except Exception as e:
            return f"ERROR: Failed to run tests: {e}"

    def parse_test_output(self, output: str) -> TestAnalysis:
        """Parse Jest test output and extract failures"""
        lines = output.split('\n')
        current_failure: Optional[TestFailure] = None
        in_stack_trace = False
        test_file = None
        test_suite = None
        
        # Extract summary
        total_tests = 0
        passed = 0
        failed = 0
        skipped = 0
        
        for line in lines:
            # Extract test summary
            if "Test Suites:" in line:
                match = re.search(r'(\d+) failed, (\d+) passed', line)
                if match:
                    failed = int(match.group(1))
                    passed = int(match.group(2))
            if "Tests:" in line:
                match = re.search(r'(\d+) failed, (\d+) passed', line)
                if match:
                    failed = int(match.group(1))
                    passed = int(match.group(2))
                match = re.search(r'(\d+) total', line)
                if match:
                    total_tests = int(match.group(1))
            
            # Detect test file
            if line.startswith("FAIL ") and "test.js" in line:
                test_file = line.replace("FAIL ", "").strip()
                current_failure = None
                in_stack_trace = False
            
            # Detect test suite
            if line.strip() and not line.startswith(" ") and "●" not in line and "FAIL" not in line and "PASS" not in line:
                if current_failure is None:
                    test_suite = line.strip()
            
            # Detect test failure
            if "●" in line:
                if current_failure:
                    self.failures.append(current_failure)
                
                # Extract test name
                test_name = line.split("●")[-1].strip()
                current_failure = TestFailure(
                    test_file=test_file or "unknown",
                    test_suite=test_suite or "unknown",
                    test_name=test_name,
                    error_type="unknown",
                    error_message=""
                )
                in_stack_trace = False
            
            # Extract error details
            if current_failure:
                # Error type
                if "TypeError:" in line:
                    current_failure.error_type = "TypeError"
                    current_failure.error_message = line.split("TypeError:")[-1].strip()
                elif "ReferenceError:" in line:
                    current_failure.error_type = "ReferenceError"
                    current_failure.error_message = line.split("ReferenceError:")[-1].strip()
                elif "expect(" in line and "Expected:" in line:
                    # Jest assertion failure
                    current_failure.error_type = "AssertionError"
                    if "Expected:" in line:
                        parts = line.split("Expected:")
                        if len(parts) > 1:
                            current_failure.expected = parts[1].strip()
                    if "Received:" in line:
                        parts = line.split("Received:")
                        if len(parts) > 1:
                            current_failure.received = parts[1].strip()
                
                # Line number
                if ">" in line and "|" in line:
                    match = re.search(r'(\d+)\s+\|', line)
                    if match:
                        current_failure.line_number = int(match.group(1))
                
                # Stack trace
                if in_stack_trace or "at " in line:
                    in_stack_trace = True
                    if "at " in line:
                        current_failure.stack_trace.append(line.strip())
        
        if current_failure:
            self.failures.append(current_failure)
        
        # Categorize failures
        self._categorize_failures()
        
        # Generate patterns
        patterns = self._generate_patterns()
        
        # Generate suggestions
        suggestions = self._generate_suggestions()
        
        return TestAnalysis(
            total_tests=total_tests,
            passed=passed,
            failed=failed,
            skipped=skipped,
            failures=self.failures,
            patterns=patterns,
            suggestions=suggestions
        )

    def _categorize_failures(self):
        """Categorize failures by type"""
        for failure in self.failures:
            # Null reference errors
            if "Cannot read properties of null" in failure.error_message or "Cannot set properties of null" in failure.error_message:
                self.patterns["null_reference"].append(failure)
            
            # Undefined variable errors
            elif "is not defined" in failure.error_message:
                self.patterns["undefined_variable"].append(failure)
            
            # Mock missing errors
            elif "toHaveBeenCalled" in failure.error_message or "Expected number of calls:" in failure.error_message:
                self.patterns["mock_missing"].append(failure)
            
            # Assertion failures
            elif failure.error_type == "AssertionError":
                if "toBeDefined" in failure.error_message or "Received: undefined" in str(failure.received):
                    self.patterns["undefined_assertion"].append(failure)
                elif "toBe" in failure.error_message or "toEqual" in failure.error_message:
                    self.patterns["value_mismatch"].append(failure)
            
            # Other
            else:
                self.patterns["other"].append(failure)

    def _generate_patterns(self) -> List[TestPattern]:
        """Generate pattern summaries"""
        patterns = []
        
        for pattern_type, failures in self.patterns.items():
            if not failures:
                continue
            
            pattern = TestPattern(
                pattern_type=pattern_type,
                description=self._get_pattern_description(pattern_type),
                count=len(failures),
                examples=[f"{f.test_file}: {f.test_name}" for f in failures[:3]],
                suggested_fix=self._get_suggested_fix(pattern_type, failures)
            )
            patterns.append(pattern)
        
        return sorted(patterns, key=lambda p: p.count, reverse=True)

    def _get_pattern_description(self, pattern_type: str) -> str:
        """Get human-readable description for pattern type"""
        descriptions = {
            "null_reference": "Cannot read/set properties of null",
            "undefined_variable": "Variable is not defined",
            "mock_missing": "Mock function not called as expected",
            "undefined_assertion": "Expected value to be defined but received undefined",
            "value_mismatch": "Expected value doesn't match received value",
            "other": "Other errors"
        }
        return descriptions.get(pattern_type, pattern_type)

    def _get_suggested_fix(self, pattern_type: str, failures: List[TestFailure]) -> Optional[str]:
        """Generate suggested fix based on pattern"""
        if pattern_type == "null_reference":
            # Check if it's stateManager related
            state_manager_failures = [f for f in failures if "stateManager" in f.test_file.lower()]
            if state_manager_failures:
                return "Initialize conversationContext Maps before calling stateManager methods. Example: escalationState: new Map(), emotionalState: new Map(), policyState: new Map()"
            return "Check if object is null before accessing properties. Add null check or initialize the object."
        
        elif pattern_type == "undefined_variable":
            return "Variable is referenced but not defined. Check if variable name is correct, or if it needs to be passed as a parameter."
        
        elif pattern_type == "mock_missing":
            return "Mock function was not called. Check if: 1) Mock is properly set up, 2) Code path actually calls the function, 3) Mock return value is configured correctly."
        
        elif pattern_type == "undefined_assertion":
            return "Expected value is undefined. Check if: 1) Function returns a value, 2) Mock returns expected value, 3) Object property exists."
        
        elif pattern_type == "value_mismatch":
            return "Expected value doesn't match. Check if: 1) Mock return value is correct, 2) Function logic is correct, 3) Test expectations match implementation."
        
        return None

    def _generate_suggestions(self) -> List[str]:
        """Generate actionable suggestions"""
        suggestions = []
        
        # State manager suggestions
        state_manager_failures = [f for f in self.failures if "stateManager" in f.test_file.lower()]
        if state_manager_failures:
            suggestions.append(
                f"🔧 Fix {len(state_manager_failures)} stateManager test failures: "
                "Initialize conversationContext with proper Maps (escalationState, emotionalState, policyState) before calling stateManager methods."
            )
        
        # Mediator suggestions
        mediator_failures = [f for f in self.failures if "mediator" in f.test_file.lower()]
        if mediator_failures:
            null_refs = [f for f in mediator_failures if "null" in f.error_message.lower()]
            if null_refs:
                suggestions.append(
                    f"🔧 Fix {len(null_refs)} mediator null reference errors: "
                    "Check if responseProcessor.processResponse returns null, or if mediator returns null due to error handling."
                )
            
            mock_missing = [f for f in mediator_failures if "toHaveBeenCalled" in f.error_message]
            if mock_missing:
                suggestions.append(
                    f"🔧 Fix {len(mock_missing)} mediator mock issues: "
                    "Verify that mocks are properly configured and code paths actually call the mocked functions."
                )
        
        # Undefined variable suggestions
        undefined_vars = [f for f in self.failures if f.error_type == "ReferenceError"]
        if undefined_vars:
            suggestions.append(
                f"🔧 Fix {len(undefined_vars)} undefined variable errors: "
                "Check function parameters and variable names. Some variables may need to be passed as arguments."
            )
        
        return suggestions

    def analyze_test_file(self, test_file: str) -> Dict:
        """Analyze a specific test file for common issues"""
        test_path = None
        
        # Find test file
        for root, dirs, files in os.walk(SERVER_DIR):
            if test_file in files:
                test_path = Path(root) / test_file
                break
        
        if not test_path or not test_path.exists():
            return {"error": f"Test file not found: {test_file}"}
        
        issues = []
        
        # Read test file
        content = test_path.read_text()
        
        # Check for common issues
        # 1. Missing jest.mock() calls
        if "jest.mock" not in content and "describe" in content:
            issues.append("No jest.mock() calls found - may need to mock dependencies")
        
        # 2. Missing beforeEach setup
        if "beforeEach" not in content and "describe" in content:
            issues.append("No beforeEach() setup - may need to reset mocks between tests")
        
        # 3. Check for null/undefined in test expectations
        null_expectations = len(re.findall(r'toBe\(null\)|toBeNull\(\)|toBeUndefined\(\)', content))
        if null_expectations > 0:
            issues.append(f"Found {null_expectations} null/undefined expectations - verify these are intentional")
        
        # 4. Check for missing Map initialization
        if "stateManager" in content.lower() and "new Map()" not in content:
            issues.append("StateManager tests may need Map initialization in mockConversationContext")
        
        return {
            "file": str(test_path),
            "issues": issues,
            "line_count": len(content.splitlines())
        }

    def generate_report(self, analysis: TestAnalysis, output_file: Optional[str] = None) -> str:
        """Generate a formatted report"""
        report = []
        report.append("=" * 80)
        report.append("TEST FAILURE ANALYSIS REPORT")
        report.append("=" * 80)
        report.append("")
        
        # Summary
        report.append("📊 Summary")
        report.append("-" * 80)
        report.append(f"Total Tests: {analysis.total_tests}")
        report.append(f"Passed: {analysis.passed} ✅")
        report.append(f"Failed: {analysis.failed} ❌")
        report.append(f"Skipped: {analysis.skipped} ⏭️")
        report.append("")
        
        # Patterns
        report.append("🔍 Failure Patterns")
        report.append("-" * 80)
        for pattern in analysis.patterns:
            report.append(f"\n{pattern.pattern_type.upper()}: {pattern.count} failures")
            report.append(f"  Description: {pattern.description}")
            if pattern.examples:
                report.append(f"  Examples:")
                for example in pattern.examples:
                    report.append(f"    - {example}")
            if pattern.suggested_fix:
                report.append(f"  💡 Suggested Fix: {pattern.suggested_fix}")
        report.append("")
        
        # Suggestions
        if analysis.suggestions:
            report.append("💡 Actionable Suggestions")
            report.append("-" * 80)
            for suggestion in analysis.suggestions:
                report.append(f"  {suggestion}")
            report.append("")
        
        # Detailed failures
        report.append("📋 Detailed Failures")
        report.append("-" * 80)
        for failure in analysis.failures[:20]:  # Limit to first 20
            report.append(f"\n{failure.test_file}: {failure.test_name}")
            report.append(f"  Type: {failure.error_type}")
            report.append(f"  Message: {failure.error_message[:100]}")
            if failure.line_number:
                report.append(f"  Line: {failure.line_number}")
        report.append("")
        
        report_text = "\n".join(report)
        
        # Save to file if requested
        if output_file:
            output_path = SERVER_DIR / "reports" / output_file
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(report_text)
            report.append(f"\n📄 Report saved to: {output_path}")
        
        return report_text


def main():
    parser = argparse.ArgumentParser(description="Analyze Jest test failures")
    parser.add_argument("--quiet", "-q", action="store_true", help="Run tests quietly")
    parser.add_argument("--test-file", help="Analyze specific test file")
    parser.add_argument("--pattern", help="Filter failures by pattern")
    parser.add_argument("--suggest-fixes", action="store_true", help="Show suggested fixes")
    parser.add_argument("--output", "-o", help="Output file for report")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    
    args = parser.parse_args()
    
    analyzer = TestFailureAnalyzer()
    
    # Analyze specific test file
    if args.test_file:
        result = analyzer.analyze_test_file(args.test_file)
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(f"Analysis of {args.test_file}:")
            print(json.dumps(result, indent=2))
        return
    
    # Run tests and analyze
    print("🔍 Analyzing test failures...")
    output = analyzer.run_tests(quiet=args.quiet)
    analysis = analyzer.parse_test_output(output)
    
    # Filter by pattern if requested
    if args.pattern:
        analysis.failures = [
            f for f in analysis.failures
            if args.pattern.lower() in f.error_message.lower() or
               args.pattern.lower() in f.test_name.lower()
        ]
    
    # Generate report
    if args.json:
        report_data = {
            "summary": {
                "total": analysis.total_tests,
                "passed": analysis.passed,
                "failed": analysis.failed,
                "skipped": analysis.skipped
            },
            "patterns": [asdict(p) for p in analysis.patterns],
            "failures": [asdict(f) for f in analysis.failures],
            "suggestions": analysis.suggestions
        }
        output_file = args.output or "test_analysis.json"
        output_path = SERVER_DIR / "reports" / output_file
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(report_data, indent=2))
        print(f"📄 JSON report saved to: {output_path}")
    else:
        report = analyzer.generate_report(analysis, args.output)
        print(report)


if __name__ == "__main__":
    main()
