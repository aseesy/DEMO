# Railway Redis Variables Setup

## How Railway Provides Redis Variables

When you add Redis to Railway, Railway provides environment variables on the **Redis service itself**, not automatically on your application service. You need to reference them.

## Railway Redis Variable Names

Railway typically provides these variables on the Redis service:
- `REDIS_URL` - Full connection string (if available)
- `REDISHOST` - Redis hostname
- `REDISPORT` - Redis port
- `REDISUSER` - Redis username (if auth enabled)
- `REDISPASSWORD` - Redis password

## Two Ways to Access Redis Variables

### Option 1: Railway Automatically Links (Recommended)

If Railway automatically linked the Redis service to your application:
- Variables should appear in your application service automatically
- Check: `railway variables` should show Redis variables

### Option 2: Manual Reference (If Not Auto-Linked)

If variables don't appear automatically:

1. **In Railway Dashboard:**
   - Go to your **application service** (DEMO)
   - Go to **Variables** tab
   - Click **"New Variable"** or **"Reference Variable"**
   - Select your **Redis service**
   - Reference these variables:
     - `REDISHOST` → Reference from Redis service
     - `REDISPORT` → Reference from Redis service  
     - `REDISPASSWORD` → Reference from Redis service
     - `REDISUSER` → Reference from Redis service (if exists)

2. **Or Construct REDIS_URL manually:**
   - Get values from Redis service variables
   - Create `REDIS_URL` in your app service:
     ```
     redis://:REDISPASSWORD@REDISHOST:REDISPORT
     ```
   - Or if username exists:
     ```
     redis://REDISUSER:REDISPASSWORD@REDISHOST:REDISPORT
     ```

## Verify Redis Variables Are Available

```bash
# Check all variables
railway variables

# Look for Redis-related variables
railway variables | grep -i redis
```

## Our Code Supports Both Patterns

The updated `redisClient.js` now supports:
- ✅ `REDIS_URL` (full connection string)
- ✅ `REDISHOST` + `REDISPORT` + `REDISPASSWORD` (Railway pattern)
- ✅ `REDIS_HOST` + `REDIS_PORT` + `REDIS_PASSWORD` (standard pattern)
- ✅ Automatically constructs `REDIS_URL` from individual variables if needed

## Next Steps

1. **Check if Redis variables are in your app service:**
   ```bash
   railway variables | grep -i redis
   ```

2. **If not found, reference them from Redis service** (see Option 2 above)

3. **Redeploy your service:**
   ```bash
   railway redeploy
   ```

4. **Check logs for Redis connection:**
   ```bash
   railway logs | grep -i redis
   ```
   Should see: `✅ Redis: Connected and ready`

