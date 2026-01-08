# Codemods - Automated Code Transformations

Automated refactoring tools for LiaiZen codebase using jscodeshift.

## Setup

```bash
cd tools/codemods
npm install
```

## Available Codemods

### 1. Console.log → Logger

Transforms `console.*` calls to structured logger calls.

**Usage:**

```bash
# Dry run (preview changes)
jscodeshift -t transforms/console-to-logger.js --dry chat-server/src/core/engine/

# Apply changes
jscodeshift -t transforms/console-to-logger.js chat-server/src/core/engine/

# Specific file
jscodeshift -t transforms/console-to-logger.js chat-server/src/core/engine/mediator.js
```

**What it does:**

- `console.log` → `logger.debug`
- `console.error` → `logger.error`
- `console.warn` → `logger.warn`
- `console.debug` → `logger.debug`
- Adds logger import if missing
- Creates logger instance with module context
- Preserves existing logger usage

**Example:**

```javascript
// BEFORE
console.log('Processing message', { userId, email });
console.error('Error occurred', error);

// AFTER
const { defaultLogger } = require('../../infrastructure/logging/logger');
const logger = defaultLogger.child({ module: 'mediator' });

logger.debug('Processing message', { userId, hasEmail: !!email }); // Email auto-redacted
logger.error('Error occurred', error, { errorCode: error.code });
```

## Workflow

### 1. Analyze (Pre-check)

```bash
# Count console calls (Python tool)
python3 ../audit/code_quality.py --dir chat-server/src/core/engine

# Or use the codemod analyzer (faster, focused)
node utils/analyze.js chat-server/src/core/engine
```

### 2. Preview Changes

```bash
# Dry run to see what will change
jscodeshift -t transforms/console-to-logger.js --dry chat-server/src/core/engine/
```

### 3. Apply Changes

```bash
# Run on specific directory
jscodeshift -t transforms/console-to-logger.js chat-server/src/core/engine/

# Run on entire codebase
jscodeshift -t transforms/console-to-logger.js chat-server/
```

### 4. Validate

```bash
# Run linter
cd ../..
npm run lint:fix

# Run tests
npm run test:backend

# Format code
npm run format
```

## Safety

- Always run `--dry` first to preview changes
- Commit or stash changes before running
- Run on small directories first
- Test after each transformation
- Review generated code before committing

## Adding New Codemods

1. Create transform file in `transforms/`
2. Follow jscodeshift API: https://github.com/facebook/jscodeshift
3. Add test fixtures in `__tests__/fixtures/`
4. Document in this README

## Troubleshooting

**Issue**: Transform doesn't apply

- Check file path is correct
- Verify jscodeshift can parse the file
- Check for syntax errors

**Issue**: Import path incorrect

- Manually fix relative paths
- Check file structure matches expected pattern

**Issue**: Logger not created

- Check if logger import exists
- Verify module name detection works
