# Deployment Fix Execution - Ready to Deploy

**Date**: 2025-12-30
**Status**: Scripts created, ready for execution
**Current State**: Railway returning 502 (Bad Gateway)

---

## What Was Prepared

### 1. Diagnostic Analysis Complete

- **Root Cause Identified**: Railway v2 deprecated `railway.toml` for Root Directory settings
- **Environment Variables**: All verified present in Railway
- **Configuration Conflict**: `railway.toml` in root with `rootDirectory = "chat-server"` not being applied

### 2. Fix Scripts Created

#### Master Orchestration Script

**File**: `/Users/athenasees/Desktop/chat/scripts/fix-deployments-master.sh`

**What it does**:

- Coordinates Railway and Vercel deployment fixes
- Runs prerequisite checks
- Executes both fix scripts in sequence
- Performs integration testing
- Provides comprehensive deployment summary

**Usage**:

```bash
cd /Users/athenasees/Desktop/chat
./scripts/fix-deployments-master.sh
```

#### Railway Fix Script

**File**: `/Users/athenasees/Desktop/chat/scripts/fix-railway-deployment.sh`

**What it does**:

1. Verifies Railway CLI authentication
2. Checks all required environment variables exist
3. Backs up `railway.toml` to `railway.toml.backup`
4. Guides you through Railway dashboard settings
5. Commits the configuration change
6. Deploys to Railway
7. Tests health endpoint

**Required Dashboard Settings** (script will prompt):

- Root Directory: `chat-server`
- Build Command: (empty - uses nixpacks.toml)
- Start Command: `node server.js`
- Health Check Path: `/health`
- Health Check Timeout: `10000` ms
- Restart Policy: `ON_FAILURE`
- Max Retries: `10`

#### Vercel Fix Script

**File**: `/Users/athenasees/Desktop/chat/scripts/fix-vercel-deployment.sh`

**What it does**:

1. Gets Railway backend URL
2. Sets `VITE_API_URL` environment variable in Vercel
3. Creates `.env.production` for local testing
4. Tests production build locally
5. Deploys to Vercel
6. Tests deployment and CORS

---

## Current Railway Environment Variables (Verified)

All critical variables are set:

- ✅ `NODE_ENV=production`
- ✅ `PORT=3000`
- ✅ `DATABASE_URL` (PostgreSQL from Railway)
- ✅ `JWT_SECRET`
- ✅ `FRONTEND_URL=https://coparentliaizen.com`
- ✅ `OPENAI_API_KEY`
- ✅ `GMAIL_USER=info@liaizen.com`
- ✅ `GMAIL_APP_PASSWORD`
- ✅ `APP_NAME=LiaiZen`
- ✅ `APP_URL=https://coparentliaizen.com`

---

## Why Railway is Failing (502 Error)

**Problem**: Railway v2 changed how Root Directory works

**Old Way (deprecated)**:

```toml
# railway.toml
[service]
rootDirectory = "chat-server"
```

**New Way (current)**:

- Set in Railway Dashboard → Settings → Build → Root Directory: `chat-server`
- Remove `railway.toml` file

**What's happening now**:

1. Railway sees `railway.toml` in root
2. Railway v2 ignores `rootDirectory` setting in railway.toml
3. Railway tries to build from project root instead of `chat-server/`
4. Build fails or server starts in wrong directory
5. Node.js can't find modules → crash → 502 error

---

## Execution Plan

### Phase 1: Railway Backend Fix (Critical)

**Manual Steps Required**:

1. Run the Railway fix script
2. When prompted, open Railway dashboard
3. Set Root Directory to `chat-server` in dashboard
4. Wait for script to deploy and verify

**Expected Outcome**:

- Railway backend responds with HTTP 200 on `/health`
- Health check returns JSON with `status: "ok"`
- No module loading errors in logs

### Phase 2: Vercel Frontend Fix

**Automated**:

1. Script gets Railway URL
2. Sets Vercel environment variable
3. Deploys frontend
4. Tests deployment

**Expected Outcome**:

- Frontend loads at https://coparentliaizen.com
- Can connect to Railway backend
- CORS works correctly

### Phase 3: Integration Testing

**Automated**:

1. Backend health check
2. Frontend accessibility check
3. CORS verification
4. Database connection check

**Manual Verification**:

- Test user login
- Send test message
- Verify AI mediation
- Check WebSocket connection

---

## Safety & Rollback

### What's Being Changed

- `railway.toml` → `railway.toml.backup` (reversible)
- Railway dashboard settings (can revert in dashboard)
- Git commit with clear message (can revert)

### Rollback Plan

If deployment fails:

```bash
# Restore railway.toml
mv railway.toml.backup railway.toml

# Revert git commit
git revert HEAD

# Or use Railway dashboard to redeploy previous version
# Dashboard → Deployments → Click previous deployment → Redeploy
```

---

## Prerequisites Verified

✅ Railway CLI installed and authenticated
✅ All environment variables set in Railway
✅ `chat-server/nixpacks.toml` exists and correct
✅ Git repository clean (can commit)
✅ Scripts created and executable

---

## What You Need to Do

### Option 1: Run Master Script (Recommended)

```bash
cd /Users/athenasees/Desktop/chat
./scripts/fix-deployments-master.sh
```

This will:

- Guide you through all steps
- Fix both Railway and Vercel
- Run integration tests
- Provide deployment summary

### Option 2: Run Scripts Individually

```bash
# Fix Railway first
./scripts/fix-railway-deployment.sh

# Then fix Vercel
./scripts/fix-vercel-deployment.sh
```

### Option 3: Manual Execution

If you prefer to do it manually, follow the steps in:

- `docs/DEPLOYMENT_DIAGNOSTIC_AND_FIXES.md`
- `docs/QUICK_DEPLOYMENT_FIX.md`

---

## Expected Timeline

- **Railway dashboard setup**: 2 minutes
- **Railway deployment**: 3-5 minutes
- **Vercel deployment**: 2-3 minutes
- **Integration testing**: 2 minutes
- **Total**: ~10-15 minutes

---

## Post-Deployment Monitoring

### Railway Logs

```bash
railway logs
```

Watch for:

- ✅ "Server running on port 8080"
- ✅ "Database connected"
- ✅ "Socket.io server started"
- ❌ Any module loading errors
- ❌ Any crash/restart loops

### Vercel Logs

```bash
vercel logs https://coparentliaizen.com --follow
```

Watch for:

- ✅ Successful page loads
- ✅ API requests to Railway backend
- ❌ CORS errors
- ❌ API connection failures

### Health Check

```bash
# Should return HTTP 200 with JSON
curl https://demo-production-6dcd.up.railway.app/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-12-30T...",
  "database": "connected"
}
```

---

## Documentation Created

All documentation is in place:

1. **DEPLOYMENT_CHECKLIST.md** - Pre-deployment verification
2. **docs/QUICK_DEPLOYMENT_FIX.md** - Quick reference guide
3. **docs/DEPLOYMENT_DIAGNOSTIC_AND_FIXES.md** - Comprehensive diagnostics
4. **scripts/verify-deployments.sh** - Verification script
5. **scripts/setup-railway-env.sh** - Environment variable setup
6. **scripts/fix-railway-deployment.sh** - Railway fix (NEW)
7. **scripts/fix-vercel-deployment.sh** - Vercel fix (NEW)
8. **scripts/fix-deployments-master.sh** - Master orchestrator (NEW)

---

## Next Action Required

**You must approve and execute the deployment fix.**

Recommend running the master script:

```bash
cd /Users/athenasees/Desktop/chat
./scripts/fix-deployments-master.sh
```

The script will:

1. ✅ Check prerequisites
2. ⏸️ Pause for you to update Railway dashboard
3. 🚀 Deploy both services
4. ✅ Verify everything works

**Ready to proceed?**
