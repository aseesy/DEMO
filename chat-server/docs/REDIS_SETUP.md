# Redis Setup Guide

## Overview

Redis is used for distributed locking and rate limiting in the threading system. It prevents the "split brain" problem when running multiple server instances and ensures rate limits persist across server restarts.

## Installation

Redis is already installed as a dependency (`ioredis`). You just need to set up a Redis instance.

## Configuration

### Option 1: Redis URL (Recommended)

Set the `REDIS_URL` environment variable:

```bash
REDIS_URL=redis://localhost:6379
# Or with password:
REDIS_URL=redis://:password@localhost:6379
# Or with username and password:
REDIS_URL=redis://username:password@localhost:6379
```

### Option 2: Individual Settings

Alternatively, set individual configuration:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # Optional
```

## Local Development

### Using Docker

```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

### Using Homebrew (macOS)

```bash
brew install redis
brew services start redis
```

### Using apt (Ubuntu/Debian)

```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

## Production Setup

### Railway

1. Add Redis service in Railway dashboard
2. Railway automatically provides `REDIS_URL` environment variable
3. No additional configuration needed

### Vercel / Serverless

For serverless environments, use a managed Redis service:

- **Upstash Redis** (recommended for serverless)
- **Redis Cloud**
- **AWS ElastiCache**
- **Google Cloud Memorystore**

Set `REDIS_URL` to your Redis instance connection string.

## Verification

The application will log Redis connection status:

- `✅ Redis: Connected and ready` - Redis is working
- `⚠️  Redis unavailable` - Redis is not available (graceful fallback)

## Graceful Degradation

If Redis is unavailable:
- **Distributed locks**: Operations proceed (fail-open)
- **Rate limiting**: Operations proceed (fail-open)
- **Logs**: Warnings are logged for monitoring

The application continues to function without Redis, but without distributed coordination.

## Testing

To test Redis connection:

```javascript
const { isRedisAvailable, acquireLock, releaseLock } = require('./src/infrastructure/database/redisClient');

// Check if Redis is available
console.log('Redis available:', isRedisAvailable());

// Test lock
const acquired = await acquireLock('test:lock', 10);
console.log('Lock acquired:', acquired);

// Release lock
await releaseLock('test:lock');
```

## Troubleshooting

### Connection Refused

- Check if Redis is running: `redis-cli ping` (should return `PONG`)
- Verify `REDIS_HOST` and `REDIS_PORT` are correct
- Check firewall settings

### Authentication Failed

- Verify `REDIS_PASSWORD` is correct
- Check Redis configuration for password requirements

### Timeout Errors

- Check network connectivity to Redis
- Verify Redis is not overloaded
- Check Redis connection pool settings

## Performance

Redis operations are fast:
- Lock acquisition: ~1-2ms
- Rate limit check: ~1-2ms
- Minimal impact on request latency

## Security

- Use password authentication in production
- Use TLS/SSL for Redis connections in production
- Restrict Redis access to application servers only
- Use Redis ACLs for fine-grained access control

