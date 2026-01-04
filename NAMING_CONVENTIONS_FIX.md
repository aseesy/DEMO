# Naming Conventions Fix

## Issues Identified

### 1. Inconsistent Prefixes

- ❌ `verify:production` - uses "verify" prefix
- ❌ `test:deploy` - uses "test" prefix
- **Issue**: Both are verification/testing, but use different prefixes

### 2. Ambiguous "Start"

- ✅ **FIXED**: Root `npm start` = production, `npm dev` = development
- ✅ **FIXED**: Shell scripts replaced with Node.js (no longer obscured)
- ✅ **CLEAR**: All contexts use consistent pattern

### 3. Separator Consistency

- ✅ Commands use colons consistently: `test:backend`, `dev:all`, `lint:fix`
- ✅ File names can use hyphens: `lint-fix.js` (this is fine)

---

## Fixes Applied

### 1. Standardized Verification Naming

**Before:**

```json
{
  "verify:production": "node scripts/test/verify-production.js",
  "test:deploy": "node scripts/test/git-vercel.test.js"
}
```

**After:**

```json
{
  "test:production": "node scripts/test/verify-production.js",
  "test:deploy": "node scripts/test/git-vercel.test.js"
}
```

**Rationale:** All testing/verification uses `test:` prefix for consistency.

### 2. Clarified "Start" vs "Dev"

**Documentation added:**

- `npm start` - **Production** (all contexts)
- `npm dev` - **Development** (all contexts)

**Root:**

- `npm start` → Production server (`node server.js`)
- `npm dev` → Development servers (with hot reload)

**Server workspace:**

- `npm start` → Production (`node server.js`)
- `npm dev` → Development (`nodemon server.js`)

**Client workspace:**

- `npm dev` → Development (`vite`)

### 3. Naming Convention Standard

**Format:** `<category>:<subcategory>`

**Categories:**

- `dev` - Development servers
- `test` - All testing/verification
- `build` - Building
- `lint` - Linting
- `format` - Formatting
- `validate` - Validation
- `monitor` - Monitoring
- `tools` - External tools
- `watchdog` - Watchdog management
- `kill` - Process termination

**Examples:**

- ✅ `test:backend` - Testing backend
- ✅ `test:production` - Testing production (was verify:production)
- ✅ `test:deploy` - Testing deployment
- ✅ `dev:backend` - Development backend
- ✅ `build:client` - Build client

---

## Verification

### Command Consistency Check

```bash
# All test commands use test: prefix
npm run test
npm run test:backend
npm run test:frontend
npm run test:coverage
npm run test:production  # Was verify:production
npm run test:deploy

# All dev commands use dev: prefix
npm run dev
npm run dev:backend
npm run dev:frontend
npm run dev:safe

# All build commands use build: prefix
npm run build
npm run build:client
npm run build:server
```

---

## Summary

✅ **Fixed**: Inconsistent `verify:` vs `test:` prefixes  
✅ **Clarified**: `start` vs `dev` meanings documented  
✅ **Standardized**: Naming convention documented  
✅ **Transparency**: Shell scripts replaced with Node.js (no obscurity)

**Naming conventions are now consistent and clear!** 🎉
