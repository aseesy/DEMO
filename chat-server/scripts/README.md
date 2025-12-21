# LiaiZen Development Scripts

Phase 1 development scripts for maintaining code quality and developer productivity.

## Available Scripts

### Database & Data Hygiene

#### `npm run db:validate`

Validates PostgreSQL schema matches expected structure. Catches schema drift before production.

**Usage:**

```bash
cd chat-server
npm run db:validate
```

**What it checks:**

- All required tables exist
- Required columns are present
- Schema matches expected structure

---

#### `npm run reset:data`

Safely resets development environment by deleting user data only. Keeps schema intact.

**Usage:**

```bash
cd chat-server
npm run reset:data
```

**What it does:**

- Deletes data from: messages, user_context, invitations, notifications
- Preserves: schema, system tables
- Requires confirmation (type "yes")
- **WARNING**: Only works in development (NODE_ENV !== 'production')

---

### AI Pipeline Quality

#### `npm run prompts:lint`

Validates LiaiZen mediation prompts for quality and compliance.

**Usage:**

```bash
cd chat-server
npm run prompts:lint
```

**What it checks:**

- Missing 1-2-3 framework structure (ADDRESS + TIP + REWRITES)
- Banned phrases (e.g., "you should", "diagnose")
- Tone issues (directive language)
- Formatting problems

**Files checked:**

- `src/liaizen/core/mediator.js`
- `src/liaizen/agents/proactiveCoach.js`
- `src/liaizen/agents/feedbackLearner.js`

---

#### `npm run ai:test`

Runs regression tests for AI mediation quality.

**Usage:**

```bash
cd chat-server
npm run ai:test
```

**What it tests:**

- Toxic message rewrites
- Safety rule enforcement
- Mediation quality
- Sender perspective validation

**Requirements:**

- `OPENAI_API_KEY` environment variable must be set
- If not set, script will skip tests gracefully

---

### Developer Productivity

#### `npm run dev:stack`

Starts all development services with one command.

**Usage:**

```bash
npm run dev:stack
```

**What it starts:**

- Backend API server (port 3001)
- Frontend dev server (port 5173)
- WebSocket server (via API)

**Note:** Uses existing `start-dev.sh` script. Press Ctrl+C to stop all services.

---

#### `npm run lint:fix`

Auto-fixes common code quality issues.

**Usage:**

```bash
npm run lint:fix
```

**What it fixes:**

- Unused imports
- Formatting inconsistencies
- ESLint auto-fixable issues

**Requirements:**

- ESLint must be installed (checks automatically)

---

## Script Locations

All scripts are located in `chat-server/scripts/`:

- `db-validate.js` - Schema validation
- `reset-data.js` - Safe data reset
- `prompts-lint.js` - Prompt validation
- `ai-test.js` - AI regression tests
- `dev-stack.js` - Development stack startup
- `lint-fix.js` - Code quality fixes

---

## Environment Variables

Some scripts require environment variables:

- `DATABASE_URL` - Required for database scripts
- `OPENAI_API_KEY` - Required for AI tests (optional, will skip if not set)
- `NODE_ENV` - Must not be 'production' for reset:data

---

## Next Steps

See `DEVELOPMENT_SCRIPTS_PLAN.md` for Phase 2 and Phase 3 scripts.
