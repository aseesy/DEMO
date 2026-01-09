# Contract & Architecture Analysis Setup

## Overview

This analysis tool uses tree-sitter (or regex fallback) to enforce:

1. **No cross-layer imports** - Client and server must remain separate
2. **API schema validation** - All routes must have Zod schemas
3. **Forbidden patterns** - Detect `@ts-ignore`, `any` types, hardcoded URLs
4. **Architecture boundaries** - Enforce proper separation of concerns

## Quick Start

### Option 1: Regex-Based (No Setup Required)

```bash
# Works immediately, uses regex patterns
python3 tools/analyze_contracts.py
```

### Option 2: Tree-Sitter (More Accurate)

```bash
# Install tree-sitter
./tools/setup_tree_sitter.sh

# Or manually:
pip3 install tree-sitter tree-sitter-languages --user

# Run analysis
python3 tools/analyze_contracts.py
```

## What It Checks

### 1. Cross-Layer Imports ❌

**Forbidden:**

```javascript
// In chat-client-vite/src/...
import { something } from '../../../chat-server/src/...';
require('../../chat-server/...');
```

**Allowed:**

```javascript
// Shared types/config only (if you have a shared package)
import { SharedType } from '@liaizen/shared-types';
```

### 2. API Schema Validation ✅

**Required:**

```javascript
// routes/user.js
const { z } = require('zod');
const userSchema = z.object({ ... });
router.post('/user', validateSchema(userSchema), handler);
```

**Violation:**

```javascript
// Missing schema validation
router.post('/user', handler); // ❌ No schema!
```

### 3. Forbidden Patterns ⚠️

**Detects:**

- `@ts-ignore` / `@ts-expect-error` comments
- `any` type usage
- Hardcoded localhost URLs (should use config)

### 4. API Contract Validation 🔍

**Checks:**

- Client API calls match server routes
- Missing routes (client calls endpoint that doesn't exist)
- Unused routes (server has route client never calls)

## Usage

### Basic Analysis

```bash
python3 tools/analyze_contracts.py
```

### Auto-Fix (Future)

```bash
python3 tools/analyze_contracts.py --fix
```

## Output

Reports are saved to `reports/`:

- `contract_analysis.json` - Machine-readable
- `contract_analysis.txt` - Human-readable summary

## Integration with CI/CD

Add to your CI pipeline:

```yaml
- name: Check Contracts
  run: |
    python3 tools/analyze_contracts.py
    # Fail if violations found
    if [ $? -ne 0 ]; then
      echo "❌ Contract violations found!"
      exit 1
    fi
```

## Current Status

✅ **Regex-based analysis**: Working  
⏳ **Tree-sitter setup**: Available but optional  
⏳ **Auto-fix**: Not yet implemented

## Why This Matters for Shipping

1. **Prevents Architecture Violations**
   - Client and server must stay separate
   - Shared code should be in a proper shared package

2. **Ensures API Safety**
   - All routes must have validation
   - Prevents runtime errors from invalid input

3. **Maintains Code Quality**
   - Catches type safety issues
   - Prevents technical debt

4. **Validates Contracts**
   - Client and server APIs must match
   - Prevents broken integrations

## Future Enhancements

- [ ] Full tree-sitter AST parsing
- [ ] TypeScript support (when codebase migrates)
- [ ] Auto-fix for common issues
- [ ] Integration with OpenAPI spec validation
- [ ] Real-time analysis in IDE

---

**Status**: ✅ Ready to use (regex mode)  
**Tree-sitter**: Optional enhancement
