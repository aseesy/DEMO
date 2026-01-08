# Architecture Analysis Tool

The `analyze_architecture.py` tool performs comprehensive project-wide architecture checks that are difficult to express in ESLint alone. It uses Python with tree-sitter for AST parsing and networkx for graph analysis.

## Features

### 1. Dependency Graph Analysis

**Circular Dependencies**: Detects circular import chains that can cause runtime errors like "Cannot access X before initialization".

**Forbidden Dependencies**: Enforces architectural boundaries:

- Domain core (`src/liaizen/`, `src/core/`) must not import from routes, socketHandlers, or Express
- Client code must not import from server code
- Server code must not import from client code

### 2. Environment Variable Consistency

**Usage Tracking**: Scans code for `process.env.X` and `import.meta.env.X` usage.

**Documentation Validation**:

- Warns when variables are used but not documented in `.env.example`
- Reports variables documented but never used (potential cleanup)

### 3. Dead Code Detection

**Unused Files**: Identifies files that are never imported by any other file.

**Confidence Levels**:

- **High**: File is definitely unused (not an entry point, not a test, never imported)
- **Medium**: File might be unused (could be dynamically imported)
- **Low**: File is likely used (test files, entry points)

## Usage

### Quick Start

```bash
# From chat-server directory
./tools/analyze-architecture

# Or via npm
npm run analyze:architecture
```

### Run Specific Checks

```bash
# Only check dependencies
npm run analyze:architecture:circular

# Only check environment variables
npm run analyze:architecture:env

# Only check for dead code
npm run analyze:architecture:dead-code
```

### Command Line Options

```bash
# Run all checks (default)
./tools/analyze-architecture

# Run specific checks
./tools/analyze-architecture --check dependencies env

# Quiet mode (only show errors)
./tools/analyze-architecture --quiet

# JSON output only
./tools/analyze-architecture --json
```

## Setup

### First Time Setup

The tool requires Python 3 and a virtual environment:

```bash
cd chat-server
./tools/ensure_venv.sh
```

This installs:

- `tree-sitter` - AST parsing
- `tree-sitter-javascript` - JavaScript grammar
- `tree-sitter-typescript` - TypeScript grammar
- `networkx` - Graph analysis

### CI/CD Integration

The tool is automatically run in CI (`.github/workflows/quality-gates.yml`) and will fail the build if errors are found.

## Output

### Console Output

The tool prints:

- Progress indicators for each analysis phase
- Summary of issues found
- Detailed reports for each issue type

### JSON Report

A detailed JSON report is saved to `reports/architecture_analysis.json`:

```json
{
  "dependency_issues": [
    {
      "file": "src/core/mediator.js",
      "line": 0,
      "issue_type": "circular",
      "message": "Circular dependency detected: ...",
      "severity": "error",
      "details": {
        "cycle": ["file1.js", "file2.js", "file1.js"]
      }
    }
  ],
  "env_var_issues": [
    {
      "var_name": "DATABASE_URL",
      "issue_type": "used_but_not_documented",
      "file": "src/config.js",
      "line": 42,
      "severity": "warning"
    }
  ],
  "dead_code_issues": [
    {
      "file": "src/utils/oldHelper.js",
      "confidence": "high",
      "reason": "File is never imported by any other file",
      "suggested_action": "Review and remove if truly unused"
    }
  ],
  "summary": {
    "total_dependency_issues": 2,
    "total_env_var_issues": 5,
    "total_dead_code_issues": 10,
    "circular_dependencies": 1,
    "forbidden_dependencies": 1
  }
}
```

## Architecture Rules

The tool enforces these architectural boundaries (from `scripts/check-boundaries.js`):

### Domain Core Isolation

**Rule**: Domain core (`src/liaizen/`, `src/core/`, `src/domain/`) must not depend on:

- Routes (`routes/`)
- Socket handlers (`socketHandlers/`)
- Express framework
- Server entry point (`server.js`)

**Why**: Domain core should be framework-agnostic and testable in isolation.

### Client-Server Separation

**Rule**:

- Client code (`chat-client-vite/`) must not import from server (`chat-server/`)
- Server code (`chat-server/`) must not import from client (`chat-client-vite/`)

**Why**: Maintains clear separation between frontend and backend.

## Examples

### Fixing Circular Dependencies

If you see:

```
❌ Found 1 circular dependency chain(s):
  Cycle 1:
    src/services/userService.js → src/utils/userHelper.js
    src/utils/userHelper.js → src/services/userService.js
```

**Solution**: Extract shared code to a third module, or use dependency injection.

### Fixing Environment Variable Issues

If you see:

```
⚠️  3 variables used but not in .env.example:
  NEW_FEATURE_FLAG (used in src/config.js:15)
```

**Solution**: Add `NEW_FEATURE_FLAG=...` to `.env.example` with a comment explaining its purpose.

### Reviewing Dead Code

If you see:

```
⚠️  Found 5 potentially unused files:
  [HIGH] src/utils/oldHelper.js
```

**Solution**:

1. Verify the file is truly unused (check for dynamic imports, string-based requires)
2. If unused, remove it
3. If used, add a comment explaining why it's not detected

## Integration with Other Tools

This tool complements:

- **ESLint**: Catches syntax and style issues
- **analyze_contracts.py**: Catches API contract violations
- **check-boundaries.js**: Node.js-based boundary checking (this tool is more comprehensive)
- **madge**: Dependency visualization (this tool adds enforcement)

## Troubleshooting

### "tree-sitter not available"

**Solution**: Run `./tools/ensure_venv.sh` to set up the virtual environment.

### "networkx not available"

**Solution**: The tool will fall back to simple DFS cycle detection. Install networkx for better performance:

```bash
source .venv/bin/activate
pip install networkx
```

### False Positives in Dead Code Detection

**Common causes**:

- Dynamic imports: `import(path)` or `require(dynamicPath)`
- String-based requires: `require(variableName)`
- Entry points not recognized

**Solution**: Review flagged files manually. The tool provides confidence levels to help prioritize.

## Performance

- **Small projects** (< 100 files): ~2-5 seconds
- **Medium projects** (100-500 files): ~5-15 seconds
- **Large projects** (> 500 files): ~15-30 seconds

The tool uses AST parsing when available (faster and more accurate) and falls back to regex when tree-sitter is unavailable.

## Contributing

To add new checks:

1. Add a new method to `ArchitectureAnalyzer` class
2. Call it from `analyze_all()` method
3. Add appropriate dataclasses for issue types
4. Update this documentation

See `analyze_contracts.py` for examples of similar analysis patterns.
