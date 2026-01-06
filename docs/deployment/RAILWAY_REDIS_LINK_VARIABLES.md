# Linking Redis Variables to Your Application Service

## Current Status

✅ Redis service has been added to Railway  
❌ Redis variables not yet visible in your application service (DEMO)

## Why Variables Aren't Visible

Railway provides Redis environment variables on the **Redis service itself**, not automatically on your application service. You need to **reference** them.

## Solution: Reference Redis Variables

### Option 1: Railway Dashboard (Easiest)

1. **Go to Railway Dashboard:**
   - https://railway.app
   - Select your project: `positive-recreation`
   - Select your **application service**: `DEMO`

2. **Go to Variables Tab:**
   - Click on **Variables** tab
   - Look for **"Reference Variable"** or **"New Variable"** button

3. **Reference Redis Variables:**
   - Click **"New Variable"** or **"Reference Variable"**
   - Select your **Redis service** from the dropdown
   - Reference these variables:
     - `REDISHOST` → Reference from Redis service
     - `REDISPORT` → Reference from Redis service
     - `REDISPASSWORD` → Reference from Redis service
     - `REDISUSER` → Reference from Redis service (if exists)

4. **Or Create REDIS_URL:**
   - If Railway provides `REDIS_URL` on the Redis service, reference that instead
   - Or manually create `REDIS_URL` by combining the individual variables

### Option 2: Railway CLI

```bash
# First, find your Redis service name
railway status

# Reference variables from Redis service
# Format: railway variables set VARIABLE_NAME=${{ServiceName.VARIABLE_NAME}}

railway variables set REDISHOST='${{Redis.REDISHOST}}'
railway variables set REDISPORT='${{Redis.REDISPORT}}'
railway variables set REDISPASSWORD='${{Redis.REDISPASSWORD}}'

# Or if REDIS_URL exists on Redis service:
railway variables set REDIS_URL='${{Redis.REDIS_URL}}'
```

**Note:** Replace `Redis` with your actual Redis service name if different.

### Option 3: Manual Construction

If referencing doesn't work, you can manually construct `REDIS_URL`:

1. **Get Redis values from Redis service:**
   - Go to Redis service in Railway dashboard
   - Copy the values from Variables tab

2. **Create REDIS_URL in your app service:**
   ```bash
   railway variables set REDIS_URL='redis://:PASSWORD@HOST:PORT'
   ```
   
   Replace:
   - `PASSWORD` with `REDISPASSWORD` value
   - `HOST` with `REDISHOST` value  
   - `PORT` with `REDISPORT` value

## Verify Variables Are Linked

After referencing variables:

```bash
railway variables | grep -i redis
```

Should show:
- `REDISHOST` (or `REDIS_URL`)
- `REDISPORT`
- `REDISPASSWORD`

## Our Code Already Supports This

The updated `redisClient.js` supports:
- ✅ `REDIS_URL` (full connection string)
- ✅ `REDISHOST` + `REDISPORT` + `REDISPASSWORD` (Railway pattern)
- ✅ Automatically constructs connection if individual variables are provided

## After Linking Variables

1. **Redeploy your service:**
   ```bash
   railway redeploy
   ```

2. **Check logs:**
   ```bash
   railway logs | grep -i redis
   ```

3. **Look for:**
   - `✅ Redis: Connected and ready` - Success!
   - `⚠️  Redis unavailable` - Check variable values

## Quick Check: Find Redis Service Name

```bash
# List all services in your project
railway status

# Or check Railway dashboard for Redis service name
```

The Redis service name is what you'll use in the reference syntax: `${{ServiceName.VARIABLE_NAME}}`

