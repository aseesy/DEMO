# Adding Redis to Railway via CLI - Step by Step

## Current Status

✅ You're logged into Railway as: `athenasees@gmail.com`  
✅ Project linked: `positive-recreation` (DEMO service)  
❌ Redis not yet added (no REDIS_URL variable found)

## Steps to Add Redis

### Option 1: Interactive CLI (Recommended)

Run this command and follow the prompts:

```bash
cd /Users/athenasees/Desktop/chat
railway add --database redis
```

**When prompted:**
1. It will ask "What do you need?" → Type: `Database` (or just press Enter if it's the default)
2. It will show database options → Select: `redis`
3. Railway will provision Redis and add `REDIS_URL` automatically

### Option 2: Use the Helper Script

I've created a helper script that checks and guides you:

```bash
cd /Users/athenasees/Desktop/chat
./scripts/add-redis-railway.sh
```

## After Adding Redis

### 1. Verify Redis Was Added

```bash
railway variables | grep -i redis
```

You should see:
- `REDIS_URL` (or `REDISHOST`, `REDISPORT`, `REDISPASSWORD`)

### 2. Check Railway Dashboard

1. Go to https://railway.app
2. Select your project: `positive-recreation`
3. You should see a new Redis service in your project
4. Check the **Variables** tab - `REDIS_URL` should be listed

### 3. Verify Connection

Railway will automatically redeploy your service. Check logs:

```bash
railway logs
```

Look for:
- `✅ Redis: Connected and ready` - Success!
- `⚠️  Redis unavailable` - Check `REDIS_URL` variable
- `ℹ️  Redis: Not configured` - Redis not added yet

## Troubleshooting

### If Redis Variables Don't Appear

1. **Wait a moment**: Railway may take 10-30 seconds to provision Redis
2. **Check service status**: In Railway dashboard, verify Redis service shows as "Active"
3. **Redeploy**: Try redeploying your service:
   ```bash
   railway redeploy
   ```

### If Command Fails

If `railway add --database redis` doesn't work:

1. **Use Railway Dashboard** (Option 1 from main guide):
   - Go to https://railway.app
   - Click "+ New" → "Database" → "Add Redis"

2. **Check Railway CLI version**:
   ```bash
   railway --version
   ```
   Update if needed: `npm install -g @railway/cli`

## What Happens Next

Once Redis is added:
- ✅ `REDIS_URL` environment variable is automatically set
- ✅ Your code automatically detects and uses Redis
- ✅ Distributed locking prevents duplicate processing
- ✅ Rate limiting persists across restarts
- ✅ No code changes needed!

## Quick Reference

```bash
# Check if Redis is configured
railway variables | grep -i redis

# View all variables
railway variables

# Check logs for Redis connection
railway logs | grep -i redis

# Redeploy if needed
railway redeploy
```

