# Command Naming Conventions

## Overview

This document defines the naming conventions for npm scripts across the LiaiZen monorepo.

---

## Format

**Pattern:** `<category>:<subcategory>` (max 2 levels)

**Examples:**

- ✅ `test:backend` - Testing category, backend subcategory
- ✅ `dev:safe` - Development category, safe subcategory
- ✅ `build:client` - Build category, client subcategory

---

## Categories

### Development (`dev`)

Development server commands:

- `dev` - Start all development servers
- `dev:all` - Alias for dev
- `dev:backend` - Start backend only
- `dev:frontend` - Start frontend only
- `dev:safe` - Start with CPU watchdog protection

### Production (`start`)

**Important:** `npm start` means **production** in all contexts.

- Root `npm start` → Production server
- Server `npm start` → Production server (`node server.js`)
- Client: No production start (use `build` then `preview`)

### Testing (`test`)

All testing and verification uses `test:` prefix:

- `test` - Run all tests
- `test:all` - Run all tests with continue-on-error
- `test:backend` - Backend tests
- `test:frontend` - Frontend tests
- `test:coverage` - Tests with coverage
- `test:production` - Verify production deployment
- `test:deploy` - Test deployment configuration

### Building (`build`)

- `build` - Build default target
- `build:client` - Build client
- `build:server` - Build server (if needed)

### Linting (`lint`)

- `lint` - Run linter
- `lint:fix` - Auto-fix linting issues

### Formatting (`format`)

- `format` - Format code
- `format:check` - Check formatting without fixing

### Validation (`validate`)

Environment and configuration validation:

- `validate:env` - Validate environment variables
- `validate:railway` - Validate Railway configuration

### Monitoring (`monitor`)

- `monitor:tasks` - Monitor background tasks
- `monitor:events` - Monitor events

### Tools (`tools`)

External tools and utilities:

- `tools:git-history` - Analyze git history
- `tools:db-analysis` - Analyze database
- `tools:dashboard` - Run dashboard
- `tools:all` - Run all tools

### Watchdog (`watchdog`)

CPU watchdog management:

- `watchdog` - Start watchdog
- `watchdog:start` - Start via manager
- `watchdog:stop` - Stop watchdog
- `watchdog:status` - Check status

### Process Management (`kill`)

- `kill:emergency` - Emergency process termination

---

## Separator Rules

### Commands: Use Colons (`:`)

All npm script names use colons for separation:

- ✅ `test:backend`
- ✅ `dev:safe`
- ✅ `lint:fix`

### File Names: Use Hyphens (`-`)

Script files can use hyphens (standard Node.js convention):

- ✅ `lint-fix.js` (file)
- ✅ `dev-safe.mjs` (file)

**Note:** File naming is independent of command naming.

---

## Start vs Dev Clarification

### `npm start` = Production

**Root:**

```bash
npm start  # → Production server (node server.js)
```

**Server workspace:**

```bash
npm start  # → Production server (node server.js)
```

### `npm dev` = Development

**Root:**

```bash
npm run dev  # → Development servers (with hot reload)
```

**Server workspace:**

```bash
npm run dev  # → Development server (nodemon)
```

**Client workspace:**

```bash
npm run dev  # → Development server (vite)
```

---

## Consistency Guidelines

### 1. Use Consistent Prefixes

✅ **Good:**

- All testing: `test:*`
- All development: `dev:*`
- All building: `build:*`

❌ **Bad:**

- Mixing `verify:*` and `test:*` for similar operations
- Mixing `check:*` and `validate:*` for similar operations

### 2. Group Related Commands

✅ **Good:**

- `test:backend`, `test:frontend`, `test:coverage`
- `dev:backend`, `dev:frontend`, `dev:safe`

❌ **Bad:**

- `test:backend`, `verify:frontend`, `check:coverage`

### 3. Be Descriptive

✅ **Good:**

- `test:production` - Clear it's testing production
- `dev:safe` - Clear it's safe development mode

❌ **Bad:**

- `test:prod` - Abbreviation unclear
- `dev:s` - Too cryptic

---

## Examples

### ✅ Correct Naming

```json
{
  "dev": "node scripts/dev.mjs",
  "dev:backend": "node scripts/dev.mjs backend",
  "dev:frontend": "node scripts/dev.mjs frontend",
  "test": "node scripts/test-runner.mjs",
  "test:backend": "npm test -w chat-server",
  "test:frontend": "npm test -w chat-client-vite",
  "test:production": "node scripts/test/verify-production.js",
  "build": "npm run build -w chat-client-vite",
  "build:client": "npm run build -w chat-client-vite"
}
```

### ❌ Incorrect Naming

```json
{
  "dev": "node scripts/dev.mjs",
  "test:backend": "npm test -w chat-server",
  "verify:frontend": "npm test -w chat-client-vite", // Should be test:frontend
  "check:production": "node scripts/test/verify-production.js" // Should be test:production
}
```

---

## Summary

- **Format:** `<category>:<subcategory>`
- **Separators:** Colons (`:`) in commands, hyphens (`-`) in files
- **Start:** Always production
- **Dev:** Always development
- **Consistency:** Use same prefix for related commands
