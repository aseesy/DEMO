# Redis Setup: Local vs Production

## Two Redis Instances (This is Correct!)

You have **two separate Redis instances** for different environments:

### 1. Local Redis (Development)
- **Location**: Your Mac (`localhost:6379`)
- **Installed via**: Homebrew (`brew install redis`)
- **Status**: ✅ Running (verified with `redis-cli ping`)
- **Used when**: Running server locally (`npm start` in `chat-server/`)
- **Configuration**: Uses `.env` file or defaults to `localhost:6379`

### 2. Railway Redis (Production)
- **Location**: Railway cloud (`demo.railway.internal:6379`)
- **Installed via**: Railway dashboard/CLI
- **Status**: ✅ Configured in Railway DEMO service
- **Used when**: Server runs on Railway
- **Configuration**: Uses Railway environment variables

## How It Works

The code automatically selects the right Redis based on environment variables:

```javascript
// In redisClient.js
const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDISHOST || process.env.REDIS_HOST || 'localhost';
```

### Local Development
- If no `REDISHOST` or `REDIS_URL` is set → Uses `localhost:6379` (your local Redis)
- Your local `.env` may not have Redis variables → Falls back to localhost

### Production (Railway)
- Railway provides `REDISHOST=demo.railway.internal` → Uses Railway Redis
- Railway provides `REDIS_URL` → Uses Railway Redis

## This is the Correct Setup! ✅

Having separate Redis instances is **best practice**:
- ✅ **Local Redis**: Fast, no network latency, free
- ✅ **Railway Redis**: Shared across instances, persistent, production-ready
- ✅ **No conflicts**: Each environment uses its own Redis
- ✅ **No data mixing**: Development data stays local, production data stays in Railway

## When Each Is Used

### Local Development
```bash
cd chat-server
npm start
# → Connects to localhost:6379 (your Homebrew Redis)
```

### Production (Railway)
```bash
# Railway automatically uses Railway Redis
# → Connects to demo.railway.internal:6379
```

## Verifying Which Redis Is Used

### Local Development
Check server logs when starting locally:
```bash
cd chat-server
npm start
# Look for: "✅ Redis: Connected and ready"
# Should connect to: localhost:6379
```

### Production (Railway)
Check Railway logs:
```bash
railway logs | grep -i redis
# Look for: "✅ Redis: Connected and ready"
# Should connect to: demo.railway.internal:6379
```

## Managing Local Redis

### Start/Stop Local Redis
```bash
# Start
brew services start redis

# Stop
brew services stop redis

# Restart
brew services restart redis

# Check status
brew services list | grep redis
```

### Test Local Redis
```bash
redis-cli ping
# Should return: PONG
```

## Managing Railway Redis

### Check Railway Redis Status
```bash
railway variables | grep -i redis
```

### View Railway Redis Logs
- Go to Railway dashboard
- Select Redis service
- View logs

## Summary

✅ **You have 2 Redis instances - this is correct!**
- Local Redis for development (localhost)
- Railway Redis for production (Railway cloud)

✅ **Code automatically uses the right one**
- Based on environment variables
- No configuration needed

✅ **No conflicts or issues**
- Each environment uses its own Redis
- Data is properly separated

## Optional: Local .env Configuration

If you want to explicitly configure local Redis in your `.env`:

```bash
# chat-server/.env (for local development)
REDIS_HOST=localhost
REDIS_PORT=6379
# No password needed for local Redis (default)
```

But this is **optional** - the code defaults to `localhost:6379` if not set.

