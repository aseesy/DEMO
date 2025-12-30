# Railway Deployment Verification Checklist

**Date:** 2025-01-28  
**Status:** Fixes pushed, awaiting verification

## ✅ Code Changes Applied

1. **Health Check Fix** (`chat-server/utils.js`)
   - Health check now always returns 200 (Railway kills services on non-200)
   - Database status included as informational, not failure condition

2. **Health Check Timeout** (`railway.toml`)
   - Increased from 300ms to 2000ms (2 seconds)
   - Gives server more time to start up

3. **Database Initialization** (`chat-server/database.js`)
   - Made non-blocking (server starts even if DB not ready)
   - Explicit DATABASE_URL check with clear error messages

## 🔍 Railway Dashboard Verification Steps

### 1. Root Directory Configuration

- [ ] Navigate to Railway project → Settings → Service
- [ ] Verify **Root Directory** is set to: `chat-server`
- [ ] If not set, update it and redeploy

### 2. Environment Variables

Navigate to Railway project → Variables tab and verify:

- [ ] **DATABASE_URL** - PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Should be automatically set if PostgreSQL service is linked
  - If missing: Add PostgreSQL service or set manually

- [ ] **JWT_SECRET** - Secret key for JWT tokens
  - Should be a long, random string
  - If missing: Generate with `openssl rand -base64 32`

- [ ] **FRONTEND_URL** - Frontend application URL
  - Format: `https://your-frontend-domain.com`
  - Should match your Vercel deployment URL

- [ ] **NODE_ENV** - Environment mode
  - Should be set to: `production`

### 3. Build Configuration

Navigate to Railway project → Settings → Build:

- [ ] **Builder** should be: `nixpacks`
- [ ] **Build Command** should be: `npm install --legacy-peer-deps`
- [ ] **Start Command** should be: `node server.js`

### 4. Health Check Configuration

Navigate to Railway project → Settings → Deploy:

- [ ] **Healthcheck Path** should be: `/health`
- [ ] **Healthcheck Timeout** should be: `2000` (2 seconds)
- [ ] **Restart Policy** should be: `ON_FAILURE`
- [ ] **Max Retries** should be: `10`

### 5. PostgreSQL Service

- [ ] Verify PostgreSQL service is created and linked
- [ ] Check that `DATABASE_URL` is automatically set from PostgreSQL service
- [ ] Verify PostgreSQL service is running (not paused)

### 6. Deployment Logs

After pushing changes, check deployment logs:

- [ ] Look for: `✅ Server started successfully`
- [ ] Look for: `🐘 PostgreSQL mode: DATABASE_URL detected`
- [ ] Look for: `✅ Health check endpoint ready at /health`
- [ ] **Should NOT see**: `❌ ERROR: DATABASE_URL not set!`
- [ ] **Should NOT see**: Health check returning 503 errors

### 7. Health Endpoint Test

Once deployed, test the health endpoint:

```bash
curl https://your-railway-domain.railway.app/health
```

Expected response:

```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "status": "healthy"
  },
  "timestamp": "2025-01-28T..."
}
```

If database is not connected yet:

```json
{
  "status": "ok",
  "database": {
    "connected": false,
    "status": "connecting"
  },
  "timestamp": "2025-01-28T..."
}
```

**Important:** Health check should return 200 even if database is not connected (this is the fix).

## 🚨 Common Issues and Solutions

### Issue: Service keeps restarting

**Solution:**

- Check health check timeout (should be 2000ms)
- Verify health endpoint returns 200
- Check logs for startup errors

### Issue: DATABASE_URL not found

**Solution:**

- Add PostgreSQL service in Railway
- Link PostgreSQL service to your app
- Verify DATABASE_URL is set in Variables tab

### Issue: Build fails

**Solution:**

- Verify root directory is `chat-server`
- Check build command: `npm install --legacy-peer-deps`
- Review build logs for dependency errors

### Issue: Server starts but crashes

**Solution:**

- Check application logs for runtime errors
- Verify all environment variables are set
- Check database connection (may need to wait for PostgreSQL to be ready)

## 📊 Expected Deployment Timeline

1. **Build Phase** (~2-3 minutes)
   - Installing dependencies
   - Building application

2. **Startup Phase** (~10-30 seconds)
   - Server initializing
   - Database connection attempt
   - Health check becoming available

3. **Health Check** (immediate)
   - Should return 200 within 2 seconds
   - Database connection may still be in progress

4. **Full Readiness** (~30-60 seconds)
   - Database connection established
   - All services initialized
   - Application fully operational

## ✅ Success Criteria

- [ ] Deployment completes without errors
- [ ] Health endpoint returns 200 status
- [ ] Server logs show successful startup
- [ ] Database connection established (may take time)
- [ ] Application responds to requests
- [ ] No service restarts after initial deployment

## 📝 Next Steps After Verification

1. Monitor deployment logs for 5-10 minutes
2. Test health endpoint
3. Test application functionality
4. Verify database connectivity
5. Check for any error patterns in logs

---

**Note:** The health check fix ensures Railway won't kill the service during startup, even if the database connection is slow. The server will start successfully and connect to the database in the background.
