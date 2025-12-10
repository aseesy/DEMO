# Naming Conventions - Protections & Safeguards

This document outlines the protections in place to maintain code consistency and catch breaks early.

## 🛡️ Current Protections

### 1. ESLint Rules (Frontend)

**Location**: `chat-client-vite/eslint.config.js`

**Rules Enforced**:
- ✅ `camelcase` rule enforces camelCase for variables, functions, and object properties
- ✅ Allows snake_case for known database/API fields (user_id, created_at, etc.)
- ✅ Catches violations during development

**Usage**:
```bash
cd chat-client-vite
npm run lint
```

### 2. Naming Convention Validator Script

**Location**: `chat-server/scripts/validate-naming-conventions.js`

**What it checks**:
- ✅ localStorage keys using snake_case (should use STORAGE_KEYS constants)
- ✅ Object properties using snake_case (should use camelCase or transformation)
- ✅ JavaScript variables using snake_case

**Usage**:
```bash
cd chat-server
node scripts/validate-naming-conventions.js
```

**Integration**: Add to CI/CD pipeline or pre-commit hooks

### 3. Migration Utilities (Backward Compatibility)

**Location**: `chat-client-vite/src/utils/storageMigration.js`

**Protection**:
- ✅ Automatically migrates old localStorage keys to new camelCase keys
- ✅ Provides backward compatibility during transition
- ✅ Runs on app startup

**Prevents**: Data loss when migrating localStorage keys

### 4. API Transformation Layer

**Location**: `chat-client-vite/src/utils/apiTransform.js`

**Protection**:
- ✅ Converts snake_case API responses to camelCase
- ✅ Converts camelCase frontend objects to snake_case for API requests
- ✅ Centralized transformation prevents inconsistencies

**Usage**:
```javascript
import { transformPrivacySettings, transformPrivacySettingsForAPI } from './utils/apiTransform';

// When receiving from API
const settings = transformPrivacySettings(apiResponse);

// When sending to API
const apiData = transformPrivacySettingsForAPI(frontendSettings);
```

### 5. Centralized Constants

**Location**: `chat-client-vite/src/utils/storageKeys.js`

**Protection**:
- ✅ All localStorage keys defined in one place
- ✅ Prevents typos and inconsistencies
- ✅ Easy to update keys across codebase

**Usage**:
```javascript
import { STORAGE_KEYS } from './utils/storageKeys';

localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
```

## 🔧 Recommended Additional Protections

### 1. Pre-commit Hooks

**Setup with Husky** (recommended):

```bash
# Install husky
cd chat-client-vite
npm install --save-dev husky

# Initialize husky
npx husky init

# Add pre-commit hook
echo "npm run lint && cd ../chat-server && node scripts/validate-naming-conventions.js" > .husky/pre-commit
chmod +x .husky/pre-commit
```

**What it does**:
- Runs ESLint before commit
- Validates naming conventions
- Prevents committing code with violations

### 2. CI/CD Pipeline Checks

**Add to GitHub Actions / CI pipeline**:

```yaml
# .github/workflows/lint.yml
name: Lint & Validate

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: |
          cd chat-client-vite
          npm install
          npm run lint
      - run: |
          cd chat-server
          npm install
          node scripts/validate-naming-conventions.js
```

### 3. TypeScript / JSDoc Type Checking

**For better type safety** (optional):

```javascript
/**
 * @typedef {Object} PrivacySettings
 * @property {string} personalVisibility - 'shared' | 'private'
 * @property {string} workVisibility - 'shared' | 'private'
 * @property {string} healthVisibility - 'shared' | 'private'
 * @property {string} financialVisibility - 'shared' | 'private'
 * @property {string} backgroundVisibility - 'shared' | 'private'
 * @property {Object} fieldOverrides - Field-level overrides
 */
```

### 4. Code Review Checklist

**Add to PR template**:

```markdown
## Naming Conventions Checklist

- [ ] JavaScript variables/functions use camelCase
- [ ] localStorage keys use STORAGE_KEYS constants
- [ ] API responses transformed using apiTransform utilities
- [ ] Database columns remain snake_case (no changes needed)
- [ ] ESLint passes without errors
- [ ] Naming convention validator passes
```

## 🚨 Handling Breaks

### Detection

1. **ESLint errors** - Caught during development
2. **Validator script** - Run manually or in CI/CD
3. **Runtime errors** - localStorage migration handles old keys
4. **Type errors** - If using TypeScript/JSDoc

### Recovery

1. **localStorage breaks**: Migration utility automatically fixes
2. **API breaks**: Transformation layer handles conversion
3. **Code breaks**: ESLint catches before commit

### Prevention

1. **Always use STORAGE_KEYS constants** for localStorage
2. **Always use transformation utilities** for API data
3. **Run validator before committing**
4. **Update ESLint rules** when adding new allowed patterns

## 📋 Maintenance Checklist

### Weekly
- [ ] Run naming convention validator
- [ ] Check for new localStorage usage
- [ ] Review ESLint warnings

### Monthly
- [ ] Update allowed snake_case patterns if needed
- [ ] Review API transformation utilities
- [ ] Update documentation

### On New Features
- [ ] Add new localStorage keys to STORAGE_KEYS
- [ ] Add API transformation if needed
- [ ] Update ESLint allowed patterns if needed
- [ ] Run validator before merging

## 🔍 Monitoring

### What to Watch

1. **ESLint warnings** - New violations
2. **localStorage usage** - Direct key usage instead of constants
3. **API responses** - Untransformed snake_case data
4. **Object properties** - New snake_case properties

### Alerts

- ESLint errors in CI/CD
- Validator script failures
- Runtime errors from localStorage
- Type errors (if using TypeScript)

## 📚 Related Documentation

- `NAMING_CONVENTIONS_AUDIT.md` - Full audit report
- `NAMING_CONVENTIONS_COMPLETION.md` - Completion summary
- `chat-client-vite/eslint.config.js` - ESLint configuration
- `chat-server/scripts/validate-naming-conventions.js` - Validator script

---

**Last Updated**: 2025-01-27  
**Maintained By**: Development Team

