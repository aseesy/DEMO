# Fixing Redis Errors on Railway

## Problem

Redis connection errors appear in Railway logs:

- `❌ Redis: Connection error: ...`
- `⚠️  Redis: Connection closed`
- `🔄 Redis: Reconnecting...`
- `missing 'error' handler on this Redis client`

## Root Cause

**Redis environment variables are not linked from the Redis service to your application service.**

Railway provides Redis variables on the **Redis service itself**, but your application service (DEMO) needs to **reference** them.

## Solution: Link Redis Variables

### Step 1: Check Current Variables

```bash
railway variables | grep -i redis
```

If you see no Redis variables, they need to be linked.

### Step 2: Link Variables via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard:**
   - https://railway.app
   - Select project: `positive-recreation`
   - Select your **application service**: `DEMO`

2. **Go to Variables Tab:**
   - Click on **Variables** tab
   - Click **"New Variable"** or **"Reference Variable"**

3. **Reference Redis Variables:**
   - Select your **Redis service** from the dropdown
   - Reference these variables:
     - `REDISHOST` → Reference from Redis service
     - `REDISPORT` → Reference from Redis service
     - `REDISPASSWORD` → Reference from Redis service
     - `REDISUSER` → Reference from Redis service (if exists)
   - Or if available, reference `REDIS_URL` directly

### Step 3: Link Variables via CLI (Alternative)

```bash
# First, find your Redis service name
railway status

# Reference variables from Redis service
# Replace 'Redis' with your actual Redis service name
railway variables set REDISHOST='${{Redis.REDISHOST}}'
railway variables set REDISPORT='${{Redis.REDISPORT}}'
railway variables set REDISPASSWORD='${{Redis.REDISPASSWORD}}'

# Or if REDIS_URL exists on Redis service:
railway variables set REDIS_URL='${{Redis.REDIS_URL}}'
```

### Step 4: Verify Variables Are Set

```bash
railway variables | grep -i redis
```

You should see:

- `REDISHOST` (or `REDIS_HOST`)
- `REDISPORT` (or `REDIS_PORT`)
- `REDISPASSWORD` (or `REDIS_PASSWORD`)
- `REDIS_URL` (optional, but preferred)

### Step 5: Redeploy

Railway should auto-redeploy, but you can trigger manually:

```bash
railway redeploy
```

### Step 6: Check Logs

After redeployment, check logs:

```bash
railway logs | grep -i redis
```

**Look for:**

- ✅ `✅ Redis: Connected and ready` - **Success!**
- ⚠️ `⚠️  Redis unavailable` - Check variable values
- ℹ️ `ℹ️  Redis: Not configured` - Variables not set

## Why This Happens

Railway's architecture:

1. **Redis service** has its own environment variables
2. **Application service** (DEMO) needs to explicitly reference them
3. Variables are NOT automatically shared between services
4. You must use Railway's variable referencing feature

## Important Notes

### Redis is Optional

The application has **graceful fallback** - if Redis is unavailable:

- ✅ App continues to work
- ✅ Messages still process
- ⚠️ Some features disabled (distributed locking, rate limiting persistence)
- ⚠️ Errors logged but don't crash the app

### Error Messages Are Expected (Until Fixed)

Until Redis variables are linked:

- You'll see connection errors in logs
- This is **normal** and **non-fatal**
- The app continues to function
- Once variables are linked, errors will stop

## Troubleshooting

### Variables Still Not Working

1. **Check service names:**

   ```bash
   railway status
   ```

   Make sure you're using the correct Redis service name in variable references.

2. **Check variable names:**
   Railway might use different names:
   - `REDISHOST` vs `REDIS_HOST`
   - `REDISPORT` vs `REDIS_PORT`
   - `REDISPASSWORD` vs `REDIS_PASSWORD`

3. **Manual construction:**
   If referencing doesn't work, manually construct `REDIS_URL`:

   ```bash
   # Get values from Redis service
   railway variables --service Redis

   # Then set in your app service:
   railway variables set REDIS_URL='redis://:PASSWORD@HOST:PORT'
   ```

### Still Seeing Errors After Linking

1. **Verify variables are set:**

   ```bash
   railway variables | grep -i redis
   ```

2. **Check Redis service is running:**
   - Go to Railway Dashboard
   - Check Redis service status
   - Ensure it's deployed and running

3. **Check network connectivity:**
   - Redis service must be in same project
   - Use internal Railway hostname (e.g., `demo.railway.internal`)

## Related Documentation

- `docs/deployment/RAILWAY_REDIS_VARIABLES.md` - Variable setup guide
- `docs/deployment/RAILWAY_REDIS_LINK_VARIABLES.md` - Linking instructions
- `chat-server/src/infrastructure/database/redisClient.js` - Redis client code
