# Naming Conventions Analysis

## Current Issues

### 1. Inconsistent Separators

**Commands use colons (good):**

- ✅ `test:backend`
- ✅ `test:frontend`
- ✅ `dev:all`
- ✅ `lint:fix`

**But file names use hyphens:**

- `lint-fix.js` (file) vs `lint:fix` (command)
- This is actually fine - files can use hyphens, commands use colons

### 2. Disjointed Naming

**Inconsistent prefixes:**

- ❌ `verify:production` - uses "verify" prefix
- ❌ `test:deploy` - uses "test" prefix
- **Issue**: Both are verification/testing, but use different prefixes

**Inconsistent grouping:**

- `test:backend` - clearly testing
- `test:deploy` - deployment testing (should be consistent)
- `verify:production` - production verification (should be consistent)

### 3. Ambiguous "Start"

**Current state:**

- ✅ Root `npm start` → production server (good!)
- ✅ Root `npm dev` → development servers (good!)
- ✅ Server `npm start` → `node server.js` (production)
- ✅ Server `npm dev` → `nodemon server.js` (development)
- ✅ Client `npm dev` → `vite` (development)

**Status:** Actually clear now! `start` = production, `dev` = development.

---

## Proposed Fixes

### 1. Standardize Verification/Testing Names

**Current (inconsistent):**

```json
{
  "verify:production": "node scripts/test/verify-production.js",
  "test:deploy": "node scripts/test/git-vercel.test.js"
}
```

**Proposed (consistent):**

```json
{
  "test:production": "node scripts/test/verify-production.js",
  "test:deploy": "node scripts/test/git-vercel.test.js"
}
```

**OR keep verify for non-test verification:**

```json
{
  "verify:production": "node scripts/test/verify-production.js",
  "verify:deploy": "node scripts/test/git-vercel.test.js"
}
```

### 2. Naming Convention Standard

**Format:** `<category>:<subcategory>:<specific>` (max 2 levels)

**Categories:**

- `dev` - Development servers
- `test` - Testing
- `build` - Building
- `lint` - Linting
- `format` - Formatting
- `verify` - Verification (non-test)
- `validate` - Validation
- `deploy` - Deployment
- `monitor` - Monitoring
- `tools` - External tools
- `watchdog` - Watchdog management
- `kill` - Process termination

**Examples:**

- ✅ `test:backend` - Testing, backend
- ✅ `test:frontend` - Testing, frontend
- ✅ `test:coverage` - Testing, with coverage
- ✅ `dev:backend` - Development, backend
- ✅ `build:client` - Build, client
- ❌ `verify:production` → `test:production` (if it's a test) OR `verify:production` (if it's verification)
- ❌ `test:deploy` → `test:deploy` (consistent with test category)

---

## Recommendation

### Option A: Standardize on `test:` prefix

All verification/testing uses `test:`:

- `test:production` (was `verify:production`)
- `test:deploy` (keep as is)

### Option B: Keep `verify:` for non-Jest/Vitest checks

Use `verify:` for deployment/production checks, `test:` for unit/integration tests:

- `verify:production` (keep)
- `verify:deploy` (rename from `test:deploy`)

**Recommendation:** Option A - simpler, all verification is "testing" in broader sense.
