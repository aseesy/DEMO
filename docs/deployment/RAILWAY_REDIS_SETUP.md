# Adding Redis to Railway

## Quick Steps

1. **Open Railway Dashboard**
   - Go to https://railway.app
   - Select your project

2. **Add Redis Service**
   - Click **"+ New"** button (top right)
   - Select **"Database"**
   - Choose **"Add Redis"**

3. **Verify Environment Variable**
   - Railway automatically adds `REDIS_URL` environment variable
   - Check in **Variables** tab - you should see `REDIS_URL` with a value like:
     ```
     redis://default:password@redis.railway.internal:6379
     ```

4. **Redeploy (if needed)**
   - Railway will automatically redeploy when you add a service
   - Or manually trigger: Click **"Deploy"** → **"Redeploy"**

5. **Verify Connection**
   - Check server logs after deployment
   - Look for: `✅ Redis: Connected and ready`
   - If you see `⚠️  Redis unavailable`, check the `REDIS_URL` variable

## Using Railway CLI

Alternatively, you can add Redis via CLI:

```bash
# Make sure you're in your project directory
cd /path/to/your/project

# Login to Railway (if not already)
railway login

# Link to your project (if not already linked)
railway link

# Add Redis service
railway add redis

# Verify it was added
railway variables
```

## Verification

After adding Redis, verify it's working:

1. **Check Environment Variables:**
   ```bash
   railway variables
   ```
   Should show `REDIS_URL` with a Redis connection string.

2. **Check Server Logs:**
   ```bash
   railway logs
   ```
   Look for:
   - `✅ Redis: Connected and ready` - Success!
   - `⚠️  Redis unavailable` - Connection issue
   - `ℹ️  Redis: Not configured` - Redis not added yet

3. **Test Health Endpoint:**
   ```bash
   curl https://your-app.railway.app/health
   ```

## Troubleshooting

### Redis URL Not Appearing

- **Wait a moment**: Railway may take a few seconds to inject the variable
- **Check service status**: Make sure Redis service shows as "Active" in dashboard
- **Redeploy**: Try redeploying your service after adding Redis

### Connection Errors

- **Check format**: `REDIS_URL` should start with `redis://` or `rediss://`
- **Verify service**: Make sure Redis service is running (green status in dashboard)
- **Check logs**: Look for specific error messages in Railway logs

### Multiple Redis Instances

If you have multiple services that need Redis:
- Each service gets its own `REDIS_URL` variable
- They all connect to the same Redis instance
- This is the correct behavior for distributed locking

## Cost

- **Railway Redis**: Typically $5-10/month (check Railway pricing)
- **Free tier**: May include limited Redis usage
- **Alternative**: Use external Redis service (Upstash, Redis Cloud) and set `REDIS_URL` manually

## Benefits

Once Redis is added:
- ✅ **Distributed locking** prevents duplicate message processing
- ✅ **Rate limiting** persists across server restarts
- ✅ **Works across multiple instances** seamlessly
- ✅ **No code changes needed** - automatically detected and used

## Next Steps

After adding Redis:
1. Monitor logs to ensure connection is successful
2. Test with multiple server instances to verify distributed locking
3. Check rate limiting works across restarts

