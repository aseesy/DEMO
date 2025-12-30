# 🚨 Railway Crash After Removing DATABASE_URL

## Problem

Railway crashed after:

- Setting `NODE_ENV=production`
- Removing `DATABASE_URL`
- Redeploying

## Most Likely Causes

### 1. Missing Required Environment Variables

Railway **MUST** have these variables set:

#### Critical Variables:

- ✅ `NODE_ENV=production` (you set this)
- ❌ `FRONTEND_URL` - **MUST BE SET**
  - Value: `https://www.coparentliaizen.com,https://coparentliaizen.com,https://*.vercel.app`
  - No spaces after commas!
- ❌ `JWT_SECRET` - **MUST BE SET**
  - Minimum 32 characters
  - Generate with: `openssl rand -base64 32`
  - Currently has weak fallback but should be set properly

### 2. SQLite Database Initialization Issue

When `DATABASE_URL` is removed, the server uses SQLite. Check if:

- Database file path is writable
- `DB_PATH` environment variable is set correctly (if using Railway volume)

### 3. Code Still Trying to Use PostgreSQL

Some code might be checking for PostgreSQL even when `DATABASE_URL` is not set.

## Immediate Fix Steps

### Step 1: Check Railway Logs

```bash
railway logs
```

Look for:

- `❌ DATABASE_URL is not set` (this is OK, just a warning)
- `❌ Failed to start server`
- `❌ Error:`
- Missing variable errors

### Step 2: Verify Required Variables in Railway

Go to Railway Dashboard → Variables and ensure these are set:

**Required:**

```
NODE_ENV=production
FRONTEND_URL=https://www.coparentliaizen.com,https://coparentliaizen.com,https://*.vercel.app
JWT_SECRET=<your-32-char-secret>
```

**Optional (for SQLite persistence):**

```
DB_PATH=/data/chat.db
```

(Only if you have a Railway volume mounted at `/data`)

### Step 3: Check What the Error Actually Is

The crash could be from:

1. **Missing FRONTEND_URL** - Server needs this for CORS
2. **Missing JWT_SECRET** - Auth will fail
3. **SQLite initialization error** - Database file path issue
4. **Port binding issue** - PORT variable conflict

## Quick Diagnostic

Run these commands to check:

```bash
# Check Railway logs
railway logs --tail 50

# Test if backend is responding
curl https://demo-production-6dcd.up.railway.app/health
```

## Most Likely Issue: Missing FRONTEND_URL

The server code requires `FRONTEND_URL` for CORS configuration. If it's not set, the server might crash or fail to start properly.

**Fix:** Add to Railway Variables:

```
FRONTEND_URL=https://www.coparentliaizen.com,https://coparentliaizen.com,https://*.vercel.app
```

## Next Steps

1. Check Railway logs: `railway logs`
2. Verify all required variables are set (see checklist above)
3. Check if there are any other error messages in the logs
4. Share the error message from Railway logs so we can fix it specifically
