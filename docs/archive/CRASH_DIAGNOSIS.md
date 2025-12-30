# 🚨 Railway Crash Diagnosis

## What We Know

- ✅ `FRONTEND_URL` is set correctly
- ✅ `NODE_ENV=production` is set
- ❌ `DATABASE_URL` was removed (using SQLite now)
- ❌ Server crashes on Railway

## Most Likely Causes

### 1. SQLite Initialization Taking Too Long ⚠️

**Problem:** `initSqlJs()` loads a WASM file which can take 1-3 seconds. If this happens during startup, Railway's health check (1000ms timeout) might fail.

**Fix Applied:** Made database initialization non-blocking so server can start immediately.

### 2. Missing JWT_SECRET

**Problem:** While there's a fallback (`'your-secret-key'`), in production you should set a proper secret.

**Check:** Railway Variables → `JWT_SECRET` should be set (32+ characters)

### 3. Database File Path Issue

**Problem:** SQLite needs to write to a file. If the path isn't writable, it could crash.

**Check:**

- Is `DB_PATH` set? (optional, defaults to `./chat.db`)
- If set, is the directory writable?

### 4. Health Check Still Timing Out

**Problem:** Even with 1000ms timeout, if SQLite init takes longer, Railway kills the process.

**Current:** Health check timeout is 1000ms (updated)

## What to Check in Railway Logs

Go to Railway Dashboard → Your Service → Deployments → Latest → Logs

Look for:

- `❌ Failed to start server`
- `❌ Database initialization failed`
- `❌ SQL.js initialization failed`
- `SIGTERM` (Railway killing the process)
- `Error:` followed by stack trace
- `❌ Port X is already in use`

## Quick Tests

### Test 1: Check if backend is responding

```bash
curl https://demo-production-6dcd.up.railway.app/health
```

### Test 2: Check Railway variables

In Railway Dashboard → Variables, verify:

- `NODE_ENV=production` ✅
- `FRONTEND_URL=...` ✅ (you confirmed this)
- `JWT_SECRET=<32+ chars>` ❓
- `DATABASE_URL` (removed) ✅
- `DB_PATH` (optional) ❓

## Code Changes Made

1. ✅ Made database initialization non-blocking
2. ✅ Added error handling for SQL.js loading
3. ✅ Health check timeout increased to 1000ms
4. ✅ Health endpoint simplified (no database queries)

## Next Steps

1. **Check Railway logs** for the exact error message
2. **Verify JWT_SECRET** is set in Railway variables
3. **Test the health endpoint** to see if server is starting
4. **Share the error message** from Railway logs so we can fix it specifically

## If Server Still Crashes

Try this temporary workaround - add to Railway variables:

```
DB_PATH=/tmp/chat.db
```

This uses `/tmp` which should always be writable on Railway.
