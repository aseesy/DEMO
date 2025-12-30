# Deployment Diagnostic and Fixes

**Date**: 2025-12-30
**Status**: Railway and Vercel deployments need configuration fixes

## Current Situation

### Railway (Backend - chat-server)

- **Status**: Crashing with module loading errors
- **Initial Error**: `Cannot find module './src/services/threads/ThreadServiceFactory'`
- **Resolution**: Files committed, but deployment still has errors
- **URL**: https://demo-production-6dcd.up.railway.app

### Vercel (Frontend - chat-client-vite)

- **Status**: Unknown, needs verification
- **Expected URL**: https://coparentliaizen.com

---

## Root Cause Analysis

### Problem 1: Railway Configuration Location

The current setup has `railway.toml` in the **root** directory with `rootDirectory = "chat-server"`. This creates two potential issues:

1. **Working directory confusion**: Railway may not properly change to `chat-server` before running commands
2. **Module resolution**: Node.js module resolution may fail if the working directory is incorrect

### Problem 2: Missing or Incorrect Environment Variables

Railway deployment requires all environment variables to be set via Railway dashboard or CLI. The following are **REQUIRED**:

#### Critical (Required for Server to Start)

- `NODE_ENV=production`
- `PORT=8080` (or Railway's auto-assigned PORT)
- `DATABASE_URL` (PostgreSQL connection string from Railway)
- `JWT_SECRET` (minimum 32 characters)

#### Required for Full Functionality

- `OPENAI_API_KEY` (for AI mediation)
- `FRONTEND_URL` (CORS - must include Vercel URL)
- `GMAIL_USER` (for email notifications)
- `GMAIL_APP_PASSWORD` (Gmail app password)

#### Optional

- `ANTHROPIC_API_KEY` (if using Anthropic models)
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` (if using Neo4j)
- `FIGMA_ACCESS_TOKEN` (if using Figma integration)

### Problem 3: Build vs Runtime Configuration Mismatch

- **nixpacks.toml** is in `/chat-server/` directory
- **railway.toml** is in root with `rootDirectory = "chat-server"`
- This may cause Nixpacks to not find its config file

---

## Solutions

### Solution 1: Consolidate Railway Configuration

**Option A: Keep Root Config (Current Approach)**

```toml
# /railway.toml
[service]
rootDirectory = "chat-server"

[build]
builder = "nixpacks"
buildCommand = "npm ci --legacy-peer-deps"

[deploy]
startCommand = "node server.js"
healthcheckPath = "/health"
healthcheckTimeout = 5000
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**Option B: Move Config to chat-server (Recommended)**

```bash
# Remove root railway.toml
rm /Users/athenasees/Desktop/chat/railway.toml

# Keep only chat-server/nixpacks.toml
# Set Railway's Root Directory to "chat-server" in dashboard
```

Then in Railway dashboard:

- Settings → Build → Root Directory: `chat-server`
- This makes Railway work entirely within chat-server directory

### Solution 2: Fix Environment Variables

Run these commands to set Railway environment variables:

```bash
# Navigate to project
cd /Users/athenasees/Desktop/chat

# Set critical variables
railway variables set NODE_ENV=production
railway variables set PORT=8080
railway variables set JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# Database (Railway PostgreSQL plugin provides this automatically)
# railway variables set DATABASE_URL="postgresql://..." # Auto-set by Railway

# CORS - CRITICAL for frontend to connect
railway variables set FRONTEND_URL="https://coparentliaizen.com,https://www.coparentliaizen.com"

# AI Services
railway variables set OPENAI_API_KEY="sk-..."

# Email (optional but recommended)
railway variables set GMAIL_USER="info@liaizen.com"
railway variables set GMAIL_APP_PASSWORD="your-app-password"
railway variables set EMAIL_FROM="info@liaizen.com"
railway variables set APP_NAME="LiaiZen"

# Optional services
railway variables set NEO4J_URI="neo4j+s://..."
railway variables set NEO4J_USER="neo4j"
railway variables set NEO4J_PASSWORD="..."
```

### Solution 3: Fix Vercel Frontend Configuration

The current `vercel.json` is correct but needs environment variables set:

```bash
# In Vercel dashboard or CLI:
vercel env add VITE_API_URL production
# Enter: https://demo-production-6dcd.up.railway.app

# Verify .env.production exists in chat-client-vite/
cd chat-client-vite
echo "VITE_API_URL=https://demo-production-6dcd.up.railway.app" > .env.production
```

### Solution 4: Add Health Check Endpoint Verification

The server has `/health` endpoint. Verify it's working:

```javascript
// In chat-server/server.js - Already implemented correctly:
app.get('/health', (req, res) => healthCheckHandler(req, res, dbConnected, dbError));
```

This is correct. Railway will use this for health checks.

---

## Step-by-Step Fix Procedure

### Phase 1: Verify Local Build Works

```bash
cd /Users/athenasees/Desktop/chat/chat-server

# Install dependencies (simulate Railway build)
npm ci --legacy-peer-deps

# Set required env vars locally
export NODE_ENV=production
export PORT=8080
export DATABASE_URL="postgresql://localhost:5432/test"
export JWT_SECRET="test-secret-minimum-32-characters-long"

# Test if server starts
node server.js

# Verify health endpoint
curl http://localhost:8080/health
```

**Expected Output**:

```json
{
  "status": "ok",
  "timestamp": "2025-12-30T...",
  "database": "connected" // or "unavailable" if no DB
}
```

### Phase 2: Fix Railway Configuration

**Step 1: Choose Configuration Strategy**

I recommend **Option B** (move everything to chat-server):

```bash
# Remove root railway.toml
git rm railway.toml

# Verify chat-server/nixpacks.toml exists
cat chat-server/nixpacks.toml

# Commit
git add -A
git commit -m "fix: Remove root railway.toml, use chat-server as root directory"
git push
```

**Step 2: Update Railway Dashboard Settings**

1. Go to Railway dashboard → Your project
2. Settings → Build
3. Set **Root Directory**: `chat-server`
4. Set **Build Command**: `npm ci --legacy-peer-deps`
5. Set **Start Command**: `node server.js`
6. Save changes

**Step 3: Set Environment Variables**

Use the Railway CLI or dashboard to set all required variables (see Solution 2 above).

**Critical Variables Checklist**:

- [ ] `NODE_ENV=production`
- [ ] `PORT=8080`
- [ ] `DATABASE_URL` (auto-set by Railway PostgreSQL plugin)
- [ ] `JWT_SECRET` (generate secure random string)
- [ ] `FRONTEND_URL` (Vercel URL for CORS)
- [ ] `OPENAI_API_KEY` (for AI features)

### Phase 3: Fix Vercel Configuration

**Step 1: Set Environment Variables**

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login
vercel login

# Link project
cd /Users/athenasees/Desktop/chat
vercel link

# Set production env var
vercel env add VITE_API_URL production
# Enter: https://demo-production-6dcd.up.railway.app
```

**Step 2: Verify Build Configuration**

The `vercel.json` is already correct:

```json
{
  "buildCommand": "cd chat-client-vite && npm ci && npm run build",
  "outputDirectory": "chat-client-vite/dist",
  "installCommand": "cd chat-client-vite && npm ci"
}
```

**Step 3: Test Build Locally**

```bash
cd /Users/athenasees/Desktop/chat/chat-client-vite
npm ci
npm run build
npm run preview # Test production build
```

### Phase 4: Deploy and Verify

**Step 1: Deploy Railway**

```bash
railway up # Or push to trigger auto-deploy
railway logs # Watch deployment logs
```

**Step 2: Deploy Vercel**

```bash
vercel --prod
```

**Step 3: Verify Deployments**

```bash
# Test Railway backend health
curl https://demo-production-6dcd.up.railway.app/health

# Test Vercel frontend
curl https://coparentliaizen.com

# Test CORS from frontend
curl -H "Origin: https://coparentliaizen.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://demo-production-6dcd.up.railway.app/api/auth/login
```

---

## Common Deployment Errors and Fixes

### Error: "Cannot find module './src/services/threads/ThreadServiceFactory'"

**Cause**: Working directory is not `chat-server` when node starts

**Fix**:

1. Ensure Railway Root Directory is set to `chat-server`
2. Verify `startCommand` doesn't use `cd` (should just be `node server.js`)
3. Check that all files are committed and pushed

**Verify**:

```bash
# In chat-server directory, test module resolution
node -e "console.log(require.resolve('./src/services/threads/ThreadServiceFactory'))"
# Should print: /path/to/chat-server/src/services/threads/ThreadServiceFactory.js
```

### Error: "DATABASE_URL not set"

**Cause**: Railway PostgreSQL plugin not added or variable not set

**Fix**:

1. Railway dashboard → Add PostgreSQL plugin
2. Wait for plugin to provision (creates DATABASE_URL automatically)
3. Or manually set via `railway variables set DATABASE_URL="..."`

**Verify**:

```bash
railway variables
# Should show DATABASE_URL=postgresql://...
```

### Error: "CORS blocked"

**Cause**: `FRONTEND_URL` not set or incorrect

**Fix**:

```bash
railway variables set FRONTEND_URL="https://coparentliaizen.com,https://www.coparentliaizen.com"
```

**Verify** in `chat-server/middleware/corsMiddleware.js`:

```javascript
const allowedOrigins = process.env.FRONTEND_URL?.split(',') || [];
```

### Error: "Health check timeout"

**Cause**: Server takes too long to start (database connection)

**Fix** in `railway.toml`:

```toml
[deploy]
healthcheckTimeout = 10000  # Increase to 10 seconds
```

### Error: Vercel build fails "npm ci failed"

**Cause**: Package-lock.json out of sync or missing

**Fix**:

```bash
cd chat-client-vite
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix: Regenerate package-lock.json"
git push
```

---

## Monitoring and Debugging

### View Railway Logs

```bash
railway logs --tail          # Live logs
railway logs -n 100          # Last 100 lines
railway logs --deployment <id>  # Specific deployment
```

### View Vercel Logs

```bash
vercel logs https://coparentliaizen.com --follow
vercel logs --output=raw
```

### Health Check Monitoring

Create a simple monitoring script:

```bash
#!/bin/bash
# monitor-deployments.sh

echo "Checking Railway backend..."
curl -f https://demo-production-6dcd.up.railway.app/health || echo "❌ Backend down"

echo "Checking Vercel frontend..."
curl -f https://coparentliaizen.com || echo "❌ Frontend down"

echo "✅ All services operational"
```

---

## Recommended Configuration (Final State)

### Repository Structure

```
/Users/athenasees/Desktop/chat/
├── vercel.json                    # Root Vercel config
├── chat-server/
│   ├── nixpacks.toml             # Nixpacks build config
│   ├── package.json
│   ├── server.js
│   └── ...
└── chat-client-vite/
    ├── package.json
    ├── vite.config.js
    └── ...
```

### Railway Dashboard Settings

- **Root Directory**: `chat-server`
- **Build Command**: (empty - uses nixpacks.toml)
- **Start Command**: `node server.js`
- **Health Check Path**: `/health`
- **Health Check Timeout**: 10000ms

### Required Environment Variables

#### Railway

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=<auto-set-by-railway-postgresql>
JWT_SECRET=<secure-random-string-32-chars>
FRONTEND_URL=https://coparentliaizen.com,https://www.coparentliaizen.com
OPENAI_API_KEY=sk-...
GMAIL_USER=info@liaizen.com
GMAIL_APP_PASSWORD=<app-password>
```

#### Vercel

```env
VITE_API_URL=https://demo-production-6dcd.up.railway.app
```

---

## Next Steps

1. **Immediate**: Set all Railway environment variables
2. **Immediate**: Verify Railway Root Directory setting
3. **Test**: Run local build simulation
4. **Deploy**: Push to trigger Railway redeploy
5. **Verify**: Check health endpoint and logs
6. **Frontend**: Set Vercel VITE_API_URL and deploy
7. **Monitor**: Watch both deployments for 24 hours

---

## Rollback Plan

If deployment fails:

1. **Revert to previous commit**:

   ```bash
   git log --oneline -5  # Find last working commit
   git revert HEAD --no-commit
   git commit -m "Revert: rollback to stable deployment"
   git push
   ```

2. **Use Railway deployment history**:
   - Railway dashboard → Deployments
   - Click on last successful deployment
   - Click "Redeploy"

3. **Emergency: Use local server**:
   ```bash
   cd chat-server
   npm run start
   # Use ngrok or similar to expose temporarily
   ```

---

## Success Criteria

Deployment is successful when:

- [ ] Railway health check returns 200 OK
- [ ] Railway logs show no errors for 5 minutes
- [ ] Vercel build completes successfully
- [ ] Frontend loads at https://coparentliaizen.com
- [ ] Frontend can connect to backend (test login)
- [ ] CORS allows frontend-backend communication
- [ ] WebSocket connection establishes (Socket.io)
- [ ] Database queries work (test user creation)
- [ ] AI mediation endpoint responds (if OpenAI key set)

---

## Contact and Support

If issues persist:

- Railway support: https://railway.app/help
- Vercel support: https://vercel.com/support
- Check Railway status: https://status.railway.app
- Check Vercel status: https://www.vercel-status.com
