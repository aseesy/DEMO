# Railway 502 Error Diagnostic

## Status
Server is returning 502 "Application failed to respond" errors.

**Latest**: Container is starting (`Starting Container` message seen in logs), but application not responding yet.

## Fixes Applied
1. ✅ **Database Import Path** (commit `34d6605`)
   - Fixed: `require('../../dbPostgres')` → `require('../../../dbPostgres')`
   - Verified locally: Import works correctly
   - Path is correct: `src/infrastructure/initialization/databaseInit.js` → `../../../dbPostgres.js`

2. ✅ **CORS Debug Logging** (commit `8b211f3`)
   - Added production logging to diagnose CORS issues
   - Will show FRONTEND_URL and allowed origins when server starts

## Possible Causes

### 1. Railway Deployment Still In Progress
- **Check**: Railway dashboard → Deployments tab
- **Look for**: Active deployment with "Building" or "Deploying" status
- **Wait**: Can take 3-5 minutes for full deployment

### 2. Server Crashing on Startup
- **Check**: Railway dashboard → Logs tab
- **Look for**:
  - `❌ Database initialization error:`
  - `Cannot find module`
  - `Error: Cannot find module`
  - Any stack traces or error messages

### 3. Missing Environment Variables
- **Check**: Railway dashboard → Variables tab
- **Required**:
  - `DATABASE_URL` - PostgreSQL connection string
  - `FRONTEND_URL` - Should include `https://www.coparentliaizen.com,https://*.vercel.app`
  - `JWT_SECRET` - For authentication
  - `PORT` - Railway sets this automatically

### 4. Database Connection Issues
- **Check**: Railway dashboard → PostgreSQL service
- **Verify**: Database is running and accessible
- **Check**: `DATABASE_URL` format is correct

## Diagnostic Steps

### Step 1: Check Railway Logs
```bash
# In Railway dashboard, go to Logs tab
# Look for:
- Server startup messages
- Database connection messages
- Error messages or stack traces
```

### Step 2: Verify Environment Variables
```bash
# In Railway dashboard, go to Variables tab
# Verify these are set:
DATABASE_URL=postgresql://...
FRONTEND_URL=https://www.coparentliaizen.com,https://*.vercel.app
JWT_SECRET=...
```

### Step 3: Check Deployment Status
```bash
# In Railway dashboard, go to Deployments tab
# Check if latest deployment:
- Shows "Active" status
- Completed successfully (green checkmark)
- Or shows errors (red X)
```

### Step 4: Test Health Endpoint
```bash
curl https://demo-production-6dcd.up.railway.app/health
# Should return: {"status":"ok","database":"connected"} or similar
```

## Expected Startup Logs

When server starts successfully, you should see:
```
🐘 PostgreSQL mode: DATABASE_URL detected
📊 Using PostgreSQL database (connection testing in background)
[CORS] Configuration loaded:
[CORS] FRONTEND_URL env var: https://www.coparentliaizen.com,https://*.vercel.app
[CORS] Allowed origins: https://www.coparentliaizen.com, https://*.vercel.app, ...
Server listening on port 3001
```

## Next Steps

1. **Check Railway Logs** - Most important step
   - Go to Railway dashboard → Your service → Logs
   - Look for error messages or stack traces
   - Share any errors found

2. **Verify Environment Variables**
   - Ensure `DATABASE_URL` is set
   - Ensure `FRONTEND_URL` includes `https://www.coparentliaizen.com`

3. **Check Database Service**
   - Verify PostgreSQL service is running
   - Check if `DATABASE_URL` is correct

4. **Manual Redeploy** (if needed)
   ```bash
   cd /Users/athenasees/Desktop/chat
   railway up --detach
   ```

## Files Changed
- `chat-server/src/infrastructure/initialization/databaseInit.js` - Fixed import path
- `chat-server/middleware.js` - Added CORS debug logging

Both changes are committed and pushed to GitHub.

