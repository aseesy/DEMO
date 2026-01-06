d# AutoAssignMessageUseCase Refactoring: Removing Global State

## Problem

The `AutoAssignMessageUseCase` had a critical architectural flaw: **in-memory global state** at the module level:

```javascript
// ❌ BAD: Global state
const processingMessages = new Set();
const recentAssignments = new Map();
```

### Issues with Global State

1. **Lost on Server Restart**: State is cleared when the server restarts
2. **Not Shared Across Instances**: Multiple server instances don't share state
3. **Serverless Incompatible**: Each function invocation gets a fresh module, losing state
4. **Silent Failures**: Returns `null` without proper error context
5. **Race Conditions**: In-memory checks don't prevent concurrent processing across instances

## Solution

Refactored to **stateless, database-backed design**:

### Changes Made

1. **Removed Global State**:
   - Removed `processingMessages` Set
   - Removed `recentAssignments` Map
   - Removed in-memory rate limiting

2. **Redis-Based Distributed Locking**:
   - Uses `acquireLock()` with Redis SET NX EX (only if not exists, with expiration)
   - Prevents "split brain" problem across multiple server instances
   - Lock auto-expires after 30 seconds (prevents deadlocks)
   - Graceful fallback if Redis is unavailable (fail-open)

3. **Redis-Based Rate Limiting**:
   - Uses `checkRateLimit()` with Redis counters and TTL
   - Persists across server restarts (unlike in-memory state)
   - Configurable window (60 seconds) and max requests (10 per room)
   - Graceful fallback if Redis is unavailable (fail-open)

4. **Database-Backed Assignment Check**:
   - Still uses `isMessageAlreadyAssigned()` for final verification
   - Works across server restarts and multiple instances
   - Database transactions ensure atomicity

5. **Improved Error Handling**:
   - Changed from returning `null` to throwing `Error` objects
   - Added proper error context and logging
   - Callers can now handle errors appropriately

6. **Idempotent Behavior**:
   - Returns success result if message is already assigned (idempotent)
   - Prevents duplicate processing without failing

### Architecture

**Before (In-Memory State)**:
```
Module-level Set/Map → In-memory state → Lost on restart
                      → Not shared across instances
                      → "Split brain" problem
```

**After (Redis-Based Distributed State)**:
```
Redis SET NX EX → Distributed lock → Works across instances
Redis INCR + EX → Rate limit counter → Persists across restarts
Database query → Final verification → Atomic assignment
```

### Redis Implementation

**Distributed Locking**:
```javascript
// Acquire lock (only if not exists, expires in 30 seconds)
await redis.set('lock:message:123', '1', 'EX', 30, 'NX');

// Release lock
await redis.del('lock:message:123');
```

**Rate Limiting**:
```javascript
// Increment counter with TTL
await redis.incr('rate_limit:room:456');
await redis.expire('rate_limit:room:456', 60);
```

## Code Changes

### Removed
- `processingMessages` Set
- `recentAssignments` Map
- `checkRateLimit()` method (was using in-memory state)
- `RATE_LIMIT_WINDOW_MS` constant
- `MAX_ASSIGNMENTS_PER_WINDOW` constant

### Added
- `isMessageBeingProcessed()` method (database-backed check)
- Proper error throwing instead of silent `null` returns
- Error context in exception messages

### Updated
- `execute()` method now throws errors instead of returning `null`
- Error handling in `threadManager.js` and `autoThreading.js`
- Return values are now structured with `success`, `alreadyAssigned`, etc.

## Benefits

1. ✅ **Prevents "Split Brain"**: Distributed locks prevent duplicate processing across instances
2. ✅ **Persistent Rate Limiting**: Redis TTL ensures rate limits survive restarts
3. ✅ **Scalable**: Works with multiple server instances seamlessly
4. ✅ **Serverless-Ready**: Redis state persists across function invocations
5. ✅ **Graceful Degradation**: Falls back to allowing operations if Redis is unavailable
6. ✅ **Debuggable**: Proper error messages instead of silent failures
7. ✅ **Idempotent**: Safe to retry
8. ✅ **Deadlock Prevention**: Locks auto-expire after 30 seconds

## Configuration

### Environment Variables

Redis can be configured via:
- `REDIS_URL` (recommended): Full Redis connection string (e.g., `redis://localhost:6379`)
- OR individual settings:
  - `REDIS_HOST` (default: `localhost`)
  - `REDIS_PORT` (default: `6379`)
  - `REDIS_PASSWORD` (optional)

### Graceful Fallback

If Redis is unavailable:
- Distributed locks: Operations proceed (fail-open)
- Rate limiting: Operations proceed (fail-open)
- Logs warnings for monitoring

This ensures the application continues to function even if Redis is down, though without distributed coordination.

## Migration Notes

### For Callers

**Before**:
```javascript
const result = await autoAssignMessageUseCase.execute({ message });
if (!result) {
  // Silent failure - no context
}
```

**After**:
```javascript
try {
  const result = await autoAssignMessageUseCase.execute({ message });
  // result.success === true (always, even if already assigned)
  if (result.alreadyAssigned) {
    // Message was already assigned (idempotent)
  }
} catch (error) {
  // Proper error handling with context
  console.error('Auto-assignment failed:', error.message);
}
```

### Error Handling

Errors are now thrown with context:
- Invalid message: `Error: [AutoAssignMessageUseCase] Invalid message object: missing id or roomId`
- Processing failure: `Error: [AutoAssignMessageUseCase] Failed to auto-assign message {id}: {reason}`

## Testing

- ✅ Works across server restarts
- ✅ Works with multiple server instances
- ✅ Proper error handling and logging
- ✅ Idempotent behavior (safe to retry)

## Related Files

- `chat-server/src/services/threads/useCases/AutoAssignMessageUseCase.js` - Main refactoring with Redis
- `chat-server/src/infrastructure/database/redisClient.js` - Redis client singleton
- `chat-server/threadManager.js` - Added error handling
- `chat-server/services/autoThreading.js` - Added error handling

## Future Enhancements

### Job Queue (BullMQ)

For heavy operations like conversation analysis, consider moving to a job queue:

```javascript
// Instead of processing immediately:
await autoAssignMessageUseCase.execute({ message });

// Queue for background processing:
await jobQueue.add('auto-assign-message', { message });
```

This keeps chat responses fast while heavy AI processing happens in the background.

