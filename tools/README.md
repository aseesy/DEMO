# Project Root Tools

This directory contains convenience scripts that can be run from the project root.

## Contract Analysis

### Quick Start

```bash
./tools/analyze-contracts
```

### What It Does

- Runs contract & architecture analysis
- Auto-activates virtual environment
- Analyzes client/server boundaries
- Checks API contracts and schemas

### Options

```bash
./tools/analyze-contracts              # Basic analysis
./tools/analyze-contracts --debug      # Debug output
./tools/analyze-contracts --quiet      # Quiet mode
```

### Setup (First Time)

```bash
cd chat-server
./tools/ensure_venv.sh
```

## Alternative: Run from chat-server/

You can also run directly from `chat-server/`:

```bash
cd chat-server
./tools/analyze
```

---

## Code Quality Metrics Dashboard

### Quick Start

```bash
./tools/generate-quality-report
```

### What It Does

- Analyzes JavaScript/TypeScript codebase for code quality metrics
- Counts console.log occurrences and flags them in production code
- Measures function complexity (length, nesting depth)
- Tracks modern pattern adoption (async/await vs callbacks, ES modules vs CommonJS)
- Identifies refactoring hotspots
- Generates weekly or per-PR reports

### Options

```bash
./tools/generate-quality-report                    # Full text report
./tools/generate-quality-report --weekly           # Weekly markdown report
./tools/generate-quality-report --pr               # PR-specific report
./tools/generate-quality-report --pr --pr-number 123  # PR report with number
./tools/generate-quality-report --json output.json # JSON output
./tools/generate-quality-report --client-only      # Only analyze client
./tools/generate-quality-report --server-only      # Only analyze server
./tools/generate-quality-report --exclude-test     # Exclude test files
```

### Metrics Collected

1. **Console.log Analysis**
   - Total occurrences across codebase
   - Files with console.log statements
   - Production files with console.log (flagged for cleanup)

2. **Function Complexity**
   - Average function length
   - Maximum function length
   - Functions over 50 lines (flagged)

3. **Nesting Complexity**
   - Average nesting depth
   - Maximum nesting depth
   - Files with deep nesting (>5 levels)

4. **Modern Pattern Adoption**
   - Percentage of files using async/await
   - Percentage of files using callbacks
   - Promise chain depth issues

5. **Module System**
   - ES Modules (ESM) files
   - CommonJS files
   - Mixed module usage

6. **File Size**
   - Average file size
   - Large files (>500 lines)

7. **Refactoring Hotspots**
   - Files flagged for refactoring based on complexity metrics

### Integration with Dashboard

The code quality metrics are integrated into the existing dashboard:

```bash
# Run full dashboard (includes git, database, and code quality)
python tools/dashboard/backend.py
```

### Weekly Reports

Generate a weekly markdown report:

```bash
./tools/generate-quality-report --weekly --output reports/weekly-quality-report.md
```

### PR Reports

Generate a report for a pull request:

```bash
./tools/generate-quality-report --pr --pr-number 123 --output reports/pr-123-quality.md
```

### Python API

You can also use the Python API directly:

```python
from tools.audit.code_quality import analyze_code_quality
from pathlib import Path

# Analyze specific directories
metrics = analyze_code_quality(
    base_dir=Path('.'),
    directories=['chat-client-vite', 'chat-server'],
    exclude_test_files=False,
)

print(f"Total files: {metrics['total_files']}")
print(f"Console.log issues: {metrics['production_files_with_logs']}")
```

### Setup (First Time)

The tool uses tree-sitter for AST parsing when available (more accurate). If not available, it falls back to regex-based analysis:

```bash
cd chat-server
./tools/ensure_venv.sh  # Installs tree-sitter if not already installed
```

---

For more details, see: `chat-server/docs/AUTOMATION_GUIDE.md`
