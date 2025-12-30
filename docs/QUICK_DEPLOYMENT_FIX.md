# Quick Deployment Fix - Immediate Actions

**CRITICAL**: Follow these steps in order to fix Railway deployment crashes.

## Status Check

Run verification script first:

```bash
./scripts/verify-deployments.sh
```

## Critical Fix #1: Railway Configuration

### Current Problem

- `railway.toml` in root with `rootDirectory = "chat-server"`
- This may cause working directory issues
- Module resolution fails

### Immediate Fix

**Option A: Update Railway Dashboard (Recommended)**

1. Go to Railway dashboard: https://railway.app
2. Select your project
3. Settings → Build
4. Set **Root Directory**: `chat-server`
5. Set **Build Command**: (leave empty to use nixpacks)
6. Set **Start Command**: `node server.js`
7. Click Save

Then remove root railway.toml:

```bash
cd /Users/athenasees/Desktop/chat
git rm railway.toml
git commit -m "fix: Remove root railway.toml, configure via dashboard"
git push
```

**Option B: Fix railway.toml (Alternative)**

Keep root railway.toml but ensure it's correct:

```bash
cd /Users/athenasees/Desktop/chat
cat > railway.toml << 'EOF'
[build]
builder = "nixpacks"

[deploy]
startCommand = "cd chat-server && node server.js"
healthcheckPath = "/health"
healthcheckTimeout = 10000
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
EOF

git add railway.toml
git commit -m "fix: Update railway.toml with explicit cd command"
git push
```

## Critical Fix #2: Environment Variables

### Check Current Variables

```bash
railway variables
```

### Set Missing Variables

**Method 1: Interactive Script** (Recommended)

```bash
./scripts/setup-railway-env.sh
```

**Method 2: Manual Commands**

```bash
# Critical variables
railway variables set NODE_ENV=production
railway variables set PORT=8080
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set FRONTEND_URL="https://coparentliaizen.com,https://www.coparentliaizen.com"

# AI service (REQUIRED for core features)
railway variables set OPENAI_API_KEY="your-key-here"

# Email (optional)
railway variables set GMAIL_USER="info@liaizen.com"
railway variables set GMAIL_APP_PASSWORD="your-app-password"
```

### Verify DATABASE_URL

Railway PostgreSQL plugin should auto-set `DATABASE_URL`. Check:

```bash
railway variables | grep DATABASE_URL
```

If not set:

1. Railway dashboard → Plugins
2. Add PostgreSQL plugin
3. Wait for provisioning
4. DATABASE_URL will appear automatically

## Critical Fix #3: Verify Files are Committed

Check that ThreadServiceFactory and all dependencies are pushed:

```bash
cd /Users/athenasees/Desktop/chat

# Check if files exist locally
ls -la chat-server/src/services/threads/ThreadServiceFactory.js
ls -la chat-server/src/services/threads/analyzers/
ls -la chat-server/src/services/threads/useCases/

# Check git status
git status

# If any files are untracked, add them
git add chat-server/src/services/threads/
git commit -m "fix: Ensure all thread service files are committed"
git push
```

## Critical Fix #4: Vercel Frontend

### Set Backend URL

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Set production env var
vercel env add VITE_API_URL production
# Enter when prompted: https://demo-production-6dcd.up.railway.app

# Or use .env.production file
cd /Users/athenasees/Desktop/chat/chat-client-vite
echo "VITE_API_URL=https://demo-production-6dcd.up.railway.app" > .env.production
git add .env.production
git commit -m "fix: Add production API URL"
git push
```

### Verify Vercel Configuration

```bash
# Should show correct vercel.json
cat /Users/athenasees/Desktop/chat/vercel.json
```

Expected:

```json
{
  "buildCommand": "cd chat-client-vite && npm ci && npm run build",
  "outputDirectory": "chat-client-vite/dist",
  "installCommand": "cd chat-client-vite && npm ci"
}
```

## Deploy and Monitor

### Deploy Railway

```bash
# Trigger new deployment
railway up

# Or wait for auto-deploy from git push
git push

# Watch logs
railway logs --tail
```

### Deploy Vercel

```bash
# From root directory
vercel --prod

# Or push to trigger auto-deploy
git push
```

### Monitor Deployment

Watch Railway logs for errors:

```bash
railway logs --tail
```

Expected success indicators:

```
✅ Server listening on 0.0.0.0:8080
✅ Health check ready at: http://0.0.0.0:8080/health
📊 Using PostgreSQL database
✅ Schema validation passed
```

## Verify Success

Run verification script:

```bash
./scripts/verify-deployments.sh
```

Expected output:

```
✓ All checks passed!

Deployments are healthy:
  - Backend: https://demo-production-6dcd.up.railway.app
  - Frontend: https://coparentliaizen.com
```

## If Still Failing

### Get Railway Deployment Logs

```bash
railway logs -n 200 > railway-error-logs.txt
cat railway-error-logs.txt
```

### Check Specific Errors

**Error: "Cannot find module"**

```bash
# Verify module exists
railway run ls -la src/services/threads/ThreadServiceFactory.js
```

**Error: "DATABASE_URL not set"**

```bash
# Check if PostgreSQL plugin is active
railway plugins
```

**Error: "Health check timeout"**

```bash
# Increase timeout in railway.toml
healthcheckTimeout = 20000  # 20 seconds
```

## Emergency Rollback

If deployment is completely broken:

```bash
# Revert to last working commit
git log --oneline -10
# Find last stable commit (before 87c57cd)
git revert HEAD --no-commit
git commit -m "Rollback: revert to stable deployment"
git push
```

Or use Railway dashboard:

1. Go to Deployments
2. Find last successful deployment
3. Click "Redeploy"

## Contact Support

If issues persist after following all steps:

1. **Share Railway logs**:

   ```bash
   railway logs -n 200 > logs.txt
   ```

2. **Share environment check**:

   ```bash
   railway variables > env-vars.txt
   # Remove secrets before sharing!
   ```

3. **Share configuration**:
   ```bash
   cat railway.toml
   cat chat-server/nixpacks.toml
   cat vercel.json
   ```

---

## Summary Checklist

Before marking as fixed, verify:

- [ ] Railway Root Directory set to `chat-server` (or railway.toml has explicit `cd`)
- [ ] All environment variables set (NODE_ENV, PORT, JWT_SECRET, FRONTEND_URL, OPENAI_API_KEY)
- [ ] DATABASE_URL exists (PostgreSQL plugin active)
- [ ] All thread service files committed and pushed
- [ ] Vercel VITE_API_URL set to Railway backend URL
- [ ] Railway deployment shows no errors in logs
- [ ] Health endpoint returns 200: `curl https://demo-production-6dcd.up.railway.app/health`
- [ ] Vercel frontend loads: `curl https://coparentliaizen.com`
- [ ] CORS allows frontend to connect to backend

---

**Last Updated**: 2025-12-30
**Next Review**: After deployment fixes applied
