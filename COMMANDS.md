# Available Commands

This document lists all available commands in the LiaiZen project, organized by category.

## 🚀 Development & Server Management

### Development (Canonical Commands)

- `npm run dev` - Start all development servers (frontend + backend)
- `npm run dev:all` - Alias for `dev` (explicit)
- `npm run dev:backend` - Start backend server only (port 3000)
- `npm run dev:frontend` - Start frontend server only (port 5173)
- `npm run dev:safe` - Start with CPU watchdog (optional safety)

### Production

- `npm start` - Start production server (Railway/Vercel compatible)
  - Root: Delegates to `npm start -w chat-server`
  - chat-server: Runs `node server.js`

### Stop & Restart

- `npm stop` - Stop all development servers (cross-platform)
- `npm run restart` - Restart all development servers
- `npm run restart:backend` - Restart backend server only
- `npm run restart:frontend` - Restart frontend server only

### Discovery & Validation

- `npm run help` - Show all canonical commands
- `npm run doctor` - Validate environment, ports, and dependencies

### Backend Server (chat-server workspace)

- `npm run start` - Start production server (`node server.js`)
- `npm run start:with-migrate` - Run migrations then start server
- `npm run dev` - Start development server with nodemon

### Frontend Client (chat-client-vite workspace)

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Marketing Site (Separate Project)

> **⚠️ Important:** The marketing site is a **separate project** and is **not** part of the monorepo workspace structure. It requires separate setup.

#### Setup (First Time)

```bash
cd marketing-site
npm install
```

#### Development Commands

Run these commands from the `marketing-site/` directory:

- `npm run dev` - Start Vite development server (port 5174)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

#### Deployment

Deployed separately to Vercel as an independent project.  
See: `docs/deployment/VERCEL_MARKETING_SITE_SETUP.md`

**Why Separate?**

- Independent deployment cycle
- Different domain (`www.coparentliaizen.com` vs `app.coparentliaizen.com`)
- No shared dependencies with main app
- Faster content updates without affecting app

### Process Management (Advanced)

- `npm run watchdog` - Start CPU watchdog monitor (cross-platform)
- `npm run watchdog:start` - Start watchdog via manager (cross-platform)
- `npm run watchdog:stop` - Stop watchdog (cross-platform)
- `npm run watchdog:status` - Check watchdog status (cross-platform)
- `npm run kill:emergency` - Emergency kill all Node processes (cross-platform)
- `npm run dev:safe:all` - Start all servers with watchdog protection
- `npm run dev:safe:backend` - Start backend with watchdog protection
- `npm run dev:safe:frontend` - Start frontend with watchdog protection

---

## 🧪 Testing

### Root Level Tests

- `npm test` - Run all tests (backend + frontend)
- `npm run test:backend` - Run backend tests only
- `npm run test:frontend` - Run frontend tests only
- `npm run test:coverage` - Run all tests with coverage
- `npm run test:coverage:backend` - Backend coverage
- `npm run test:coverage:frontend` - Frontend coverage

### Backend Tests (chat-server)

- `npm test` - Run Jest tests
- `npm run test:watch` - Watch mode for tests
- `npm run test:coverage` - Run tests with coverage
- `npm run test:integration` - Run integration tests only

### Frontend Tests (chat-client-vite)

- `npm test` - Run Vitest tests
- `npm run test:run` - Run tests once (no watch)
- `npm run test:coverage` - Run tests with coverage
- `npm run test:watch` - Watch mode for tests

### Test Scripts (scripts/test/)

- `node scripts/test/automated-login.js` - Automated browser login test
- `node scripts/test/login-and-chat.js` - Login and chat navigation test
- `node scripts/test/navigate-to-chat.js` - Navigate to chat test
- `node scripts/test/quick-check.js` - Quick app verification
- `node scripts/test/test-activities-api.js` - Test activities API
- `node scripts/test/test-login-errors.js` - Test login error handling
- `node scripts/test/test-rewrite-bypass.js` - Test rewrite bypass
- `node scripts/test/verify-app.js` - Verify app functionality
- `node scripts/test/verify-production.js` - Verify production deployment
- `node scripts/test/create-test-user.js` - Create test user
- `node scripts/test/create-debug-user.js` - Create debug user
- `node scripts/test/create-test-child.js` - Create test child
- `node scripts/test/count-users.js` - Count users in database
- `node scripts/test/inspect-browser.js` - Inspect browser state

### Test Utilities

- `npm run test:shutdown` - Test graceful shutdown
- `npm run test:shutdown:kill` - Test shutdown with kill signal
- `npm run test:production` - Test production deployment
- `npm run test:deploy` - Test Git/Vercel deployment

---

## 🗄️ Database

### Migrations

- `npm run migrate` - Run database migrations
- `npm run migrate:status` - Check migration status

### Database Utilities (chat-server)

- `npm run db:validate` - Validate database schema
- `npm run db:backup` - Backup database
- `npm run db:monitor` - Monitor database
- `npm run reset:data` - Reset database data

---

## 🛠️ Code Quality & Linting

### Linting

- `npm run lint` - Run ESLint (frontend)
- `npm run lint:fix` - Auto-fix ESLint issues (frontend)
- `npm run lint:fix` - Fix linting issues (root level, via script)

### Formatting

- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting without fixing

### Security

- `npm run secrets:scan` - Scan for secrets in codebase
- `npm run secrets:scan:staged` - Scan staged files for secrets

### Validation

- `npm run validate:naming` - Validate naming conventions
- `npm run validate:boundaries` - Validate code boundaries
- `npm run validate:env` - Validate environment variables
- `npm run validate:railway` - Validate Railway environment

### Code Analysis (chat-server workspace)

> **Note:** These commands are in the `chat-server` workspace. Use workspace syntax: `npm run <command> -w chat-server` or run from the `chat-server` directory.

- `npm run scan:duplication -w chat-server` - Scan for code duplication
- `npm run scan:dependencies -w chat-server` - Scan for circular dependencies
- `npm run scan:dependency-graph -w chat-server` - Generate dependency graph
- `npm run scan:all -w chat-server` - Run all scans

---

## 📦 Build & Deployment

### Build

- `npm run build` - Build frontend client
- `npm run build:client` - Alias for build
- `npm run build:server` - No-op (server has no build step)

### Deployment Scripts (scripts/)

- `./scripts/deploy-railway.sh` - Deploy to Railway
- `./scripts/deploy-marketing-site.sh` - Deploy marketing site
- `./scripts/verify-before-deploy.sh` - Verify before deployment
- `./scripts/verify-deployments.sh` - Verify deployments
- `./scripts/fix-vercel-deployment.sh` - Fix Vercel deployment
- `./scripts/fix-railway-deployment.sh` - Fix Railway deployment
- `./scripts/fix-railway-vercel.sh` - Fix Railway/Vercel integration

### Deployment Utilities (scripts/deploy/)

- `./scripts/deploy/check-deployment-config.sh` - Check deployment config
- `./scripts/deploy/check-dns.sh` - Check DNS configuration
- `./scripts/deploy/retrieve-secrets.sh` - Retrieve deployment secrets
- `./scripts/deploy/integrate-sdd-framework.sh` - Integrate SDD framework

### Environment Setup

- `./scripts/setup-railway-env.sh` - Setup Railway environment
- `./scripts/setup-vercel-railway.sh` - Setup Vercel/Railway integration
- `./scripts/setup-quality-enforcement.sh` - Setup quality enforcement
- `./scripts/setup-github-token.sh` - Setup GitHub token
- `./scripts/setup-mcp.sh` - Setup MCP
- `./scripts/setup-neo4j-railway.sh` - Setup Neo4j on Railway

### Environment Variables

- `./scripts/set-railway-vars.sh` - Set Railway variables
- `./scripts/set-vercel-vars.sh` - Set Vercel variables
- `./scripts/sync-railway-vars.sh` - Sync Railway variables
- `./scripts/update-env-oauth.sh` - Update OAuth environment

### DNS & Hosting

- `./scripts/check-hostinger-dns.sh` - Check Hostinger DNS
- `./scripts/configure-hostinger-dns.sh` - Configure Hostinger DNS

### Secrets Management

- `./scripts/rotate-all-secrets.sh` - Rotate all secrets
- `./scripts/rotate-oauth.sh` - Rotate OAuth secrets

### Linking Services

- `./scripts/link-railway-service.sh` - Link Railway service

---

## 🔍 Monitoring & Debugging

### Monitoring

- `npm run monitor:tasks` - Monitor background tasks
- `npm run monitor:events` - Monitor events
- `npm run db:monitor` - Monitor database

### Preflight Checks

- `npm run preflight` - Run preflight checks
- `npm run preflight:quick` - Quick preflight check
- `npm run preflight:full` - Full preflight with health check

---

## 🤖 AI & Prompts

### AI Testing (chat-server)

- `npm run ai:test` - Test AI functionality
- `npm run prompts:lint` - Lint AI prompts

---

## 🛡️ Utilities & Tools

### Python Tools (tools/)

- `npm run tools:git-history` - Analyze git history
- `npm run tools:db-analysis` - Analyze database
- `npm run tools:dashboard` - Run backend dashboard
- `npm run tools:socket-diagnostic` - Diagnose socket connections
- `npm run tools:all` - Run all tools

### Cleanup

- `./scripts/cleanup-markdown.sh` - Cleanup markdown files
- `./scripts/verify-markdown-cleanup.sh` - Verify markdown cleanup

### Restart Scripts

- `./scripts/restart-dev.sh` - Restart development servers
- `./scripts/restart-server.sh` - Restart single server
- `./scripts/restart-servers.sh` - Restart all servers

### Other Scripts

- `./scripts/start-chat.sh` - Start chat service
- `./scripts/cpu-watchdog.sh` - CPU watchdog script
- `./scripts/emergency-kill.sh` - Emergency kill script
- `./scripts/start-dev.sh` - Start development servers
- `./scripts/start-dev-safe.sh` - Start development (safe mode)
- `./scripts/stop-dev.sh` - Stop development servers

---

## 📝 Git Hooks (via Husky)

- Pre-commit hooks run automatically (configured via Husky)
- `npm run prepare` - Install Husky hooks

---

## 🔐 Workspace Commands

### Workspace Aliases

- All root-level commands use `-w` flag to target specific workspaces:
  - `-w chat-client-vite` - Target frontend client
  - `-w chat-server` - Target backend server

### Examples

- `npm run build -w chat-client-vite` - Build client from root
- `npm test -w chat-server` - Run server tests from root
- `npm run dev -w chat-client-vite` - Run client dev server from root

---

## 📋 Quick Reference

### Daily Development

```bash
npm run dev              # Start all development servers
npm run doctor           # Validate your setup
npm test                 # Run all tests
npm run lint:fix         # Fix linting
npm run format           # Format code
npm stop                 # Stop servers when done
```

### Before Committing

```bash
npm run format:check     # Check formatting
npm run lint             # Check linting
npm run secrets:scan:staged  # Check for secrets
npm test                 # Run tests
```

### Deployment Checklist

```bash
npm run preflight        # Preflight checks
npm run test:coverage    # Full test coverage
npm run build            # Build everything
npm run test:production # Test production deployment
```

### Database Management

```bash
npm run migrate          # Run migrations
npm run db:validate      # Validate schema
npm run db:backup        # Backup database
```

### Emergency

```bash
npm stop                 # Stop servers
npm run kill:emergency   # Emergency kill
npm run watchdog:stop    # Stop watchdog
```
