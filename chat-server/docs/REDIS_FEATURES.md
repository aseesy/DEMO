# Redis Features Implementation

## Overview

Redis has been expanded beyond basic distributed locking and rate limiting to provide comprehensive caching, presence tracking, and multi-instance coordination.

## Features Implemented

### 1. Enhanced Redis Client (`src/infrastructure/database/redisClient.js`)

**New Capabilities:**
- ✅ **Caching utilities** (`cacheSet`, `cacheGet`, `cacheDelete`, `cacheDeletePattern`)
- ✅ **User presence tracking** (`setPresence`, `removePresence`, `isUserOnline`, `getOnlineUsersInRoom`)
- ✅ **Pub/Sub support** (`createSubscriber`, `publish`)
- ✅ **Existing features** (distributed locking, rate limiting)

**Usage:**
```javascript
const { cacheSet, cacheGet, setPresence, publish } = require('./src/infrastructure/database/redisClient');

// Cache data
await cacheSet('user:123', userData, 3600); // 1 hour TTL
const cached = await cacheGet('user:123');

// Track presence
await setPresence('user@example.com', 'socket-id', { roomId: 'room-123' }, 300);

// Publish message
await publish('room:room-123', { type: 'message', data: messageData });
```

### 2. Message Cache Migration (`src/core/engine/messageCache.js`)

**Changes:**
- ✅ Migrated from in-memory Map to **hybrid Redis + memory cache**
- ✅ Redis for multi-instance support
- ✅ In-memory fallback when Redis unavailable
- ✅ Automatic TTL management

**Benefits:**
- Cache shared across server instances
- Reduced redundant AI API calls
- Graceful degradation if Redis unavailable

### 3. Session Cache Layer (`src/infrastructure/cache/sessionCache.js`)

**Purpose:** Fast session lookups without hitting database

**Features:**
- Cache user sessions by socket ID
- Invalidate sessions on disconnect
- Invalidate all sessions for a user

**Usage:**
```javascript
const { getSession, setSession, deleteSession } = require('./src/infrastructure/cache/sessionCache');

// Cache session
await setSession(socketId, sessionData, 300);

// Get cached session
const session = await getSession(socketId);

// Delete on disconnect
await deleteSession(socketId);
```

### 4. Query Result Cache (`src/infrastructure/cache/queryCache.js`)

**Purpose:** Cache frequently accessed database queries

**Features:**
- Cache query results with TTL
- Pattern-based invalidation
- Room-based invalidation (when room data changes)

**Usage:**
```javascript
const { get, set, invalidateRoom } = require('./src/infrastructure/cache/queryCache');

// Cache thread list
const threads = await get('threads:room', { roomId: 'room-123' });
if (!threads) {
  threads = await db.query('SELECT * FROM threads WHERE room_id = $1', [roomId]);
  await set('threads:room', { roomId }, threads, 300);
}

// Invalidate when room changes
await invalidateRoom('room-123');
```

### 5. Presence Service (`src/services/presence/presenceService.js`)

**Purpose:** Track user online/offline status

**Features:**
- Set/remove user presence
- Check if user is online
- Get online users in a room
- Automatic TTL (5 minutes)

**Usage:**
```javascript
const { PresenceService } = require('./src/services/presence/presenceService');
const presence = new PresenceService();

// Mark online
await presence.setOnline('user@example.com', socketId, roomId);

// Check status
const isOnline = await presence.isOnline('user@example.com');

// Get online users
const onlineUsers = await presence.getOnlineUsers(roomId);
```

### 6. Redis Pub/Sub (`src/infrastructure/pubsub/redisPubSub.js`)

**Purpose:** Multi-instance coordination via Redis channels

**Features:**
- Subscribe to channels
- Publish messages to channels
- Multiple callbacks per channel
- Graceful fallback if Redis unavailable

**Usage:**
```javascript
const { getPubSub } = require('./src/infrastructure/pubsub/redisPubSub');
const pubSub = getPubSub();

await pubSub.initialize();

// Subscribe
await pubSub.subscribe('room:room-123', (data, channel) => {
  console.log('Received:', data);
});

// Publish
await pubSub.publish('room:room-123', { type: 'message', text: 'Hello' });
```

### 7. Socket.io Redis Adapter (`server.js`)

**Purpose:** Enable Socket.io to work across multiple server instances

**Features:**
- Automatic multi-instance support
- Shared socket rooms across instances
- Broadcast events to all instances
- Graceful fallback to single-instance mode

**Implementation:**
- Uses `@socket.io/redis-adapter` package
- Automatically enabled if Redis available
- Falls back to default adapter if Redis unavailable

**Installation:**
```bash
npm install @socket.io/redis-adapter
```

## Integration Points

### Connection Handlers
- Presence tracking on connect/disconnect
- Session caching for fast lookups

### Message Handlers
- Message cache for AI analysis results
- Query cache for thread lists

### Room Management
- Query cache invalidation on room changes
- Presence updates on room join/leave

## Configuration

### Environment Variables

```bash
# Redis URL (preferred)
REDIS_URL=redis://localhost:6379

# Or individual settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # Optional
```

### Graceful Degradation

All Redis features have graceful fallback:
- **Caching**: Falls back to in-memory or database
- **Presence**: Falls back to in-memory tracking
- **Pub/Sub**: Falls back to single-instance mode
- **Socket.io**: Falls back to default adapter

## Performance Benefits

1. **Reduced Database Load**: Query caching reduces PostgreSQL queries
2. **Faster Response Times**: Session and message caching
3. **Multi-Instance Support**: Socket.io works across multiple servers
4. **Shared State**: Presence and cache shared across instances
5. **Scalability**: Horizontal scaling with Redis coordination

## Monitoring

Check Redis connection status in server logs:
- `✅ Redis: Connected and ready` - Redis working
- `⚠️  Redis unavailable` - Redis not available (graceful fallback)
- `✅ Socket.io Redis adapter enabled` - Multi-instance support active

## Next Steps

1. **Install Socket.io Redis adapter**: `npm install @socket.io/redis-adapter`
2. **Monitor Redis memory usage**: Set up alerts for Redis memory
3. **Tune cache TTLs**: Adjust based on usage patterns
4. **Add metrics**: Track cache hit rates and Redis performance

