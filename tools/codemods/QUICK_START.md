# Codemod Quick Start Guide

## Setup (One-time)

```bash
cd tools/codemods
npm install
```

## Run Console.log → Logger Codemod

### Step 1: Analyze

See how many console calls exist:

```bash
node utils/analyze.js chat-server/routes/profile.js
```

### Step 2: Preview (Dry Run)

See what will change without modifying files:

```bash
jscodeshift -t transforms/console-to-logger.js --dry chat-server/routes/profile.js
```

### Step 3: Apply

Run the transformation:

```bash
jscodeshift -t transforms/console-to-logger.js chat-server/routes/profile.js
```

### Step 4: Validate

```bash
cd ../..
npm run lint:fix
npm run format
```

## Using the Orchestration Script

For a safer, automated workflow:

```bash
# Preview changes
./run.sh --codemod console-to-logger --target chat-server/routes/profile.js --dry

# Apply changes
./run.sh --codemod console-to-logger --target chat-server/routes/profile.js
```

## Example: Transform a Directory

```bash
# Preview
./run.sh --codemod console-to-logger --target chat-server/routes --dry

# Apply
./run.sh --codemod console-to-logger --target chat-server/routes
```

## What Gets Transformed

**Before:**

```javascript
console.log('Processing message', { userId, email });
console.error('Error occurred', error);
```

**After:**

```javascript
const { defaultLogger } = require('../../infrastructure/logging/logger');
const logger = defaultLogger.child({ module: 'profile' });

logger.debug('Processing message', { userId, hasEmail: !!email });
logger.error('Error occurred', error, { errorCode: error.code });
```

## Safety Tips

1. ✅ Always run `--dry` first
2. ✅ Commit or stash changes before running
3. ✅ Start with a single file
4. ✅ Review the diff: `git diff`
5. ✅ Run tests after transformation
