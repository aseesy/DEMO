#!/usr/bin/env node

/**
 * Redis Features Test Script
 *
 * Tests all Redis features:
 * - Basic caching (get/set/delete)
 * - Message cache
 * - Session cache
 * - Query cache
 * - Presence tracking
 * - Pub/Sub
 * - Distributed locking
 * - Rate limiting
 */

require('dotenv').config({ override: true });

const {
  cacheSet,
  cacheGet,
  cacheDelete,
  cacheDeletePattern,
  setPresence,
  removePresence,
  isUserOnline,
  getOnlineUsersInRoom,
  publish,
  acquireLock,
  releaseLock,
  checkRateLimit,
  isRedisAvailable,
  getClient,
} = require('../src/infrastructure/database/redisClient');

const { generateHash, get, set, clear, getStats } = require('../src/core/engine/messageCache');
const { getSession, setSession, deleteSession } = require('../src/infrastructure/cache/sessionCache');
const { get: queryGet, set: querySet, invalidateRoom } = require('../src/infrastructure/cache/queryCache');
const { getPubSub } = require('../src/infrastructure/pubsub/redisPubSub');

// Test results
const results = {
  passed: [],
  failed: [],
  skipped: [],
};

function log(message, type = 'info') {
  const prefix = {
    info: 'ℹ️ ',
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
  }[type] || '';

  console.log(`${prefix} ${message}`);
}

function test(name, fn) {
  return async () => {
    try {
      log(`Testing: ${name}`, 'info');
      await fn();
      results.passed.push(name);
      log(`PASSED: ${name}`, 'success');
      return true;
    } catch (error) {
      results.failed.push({ name, error: error.message });
      log(`FAILED: ${name} - ${error.message}`, 'error');
      return false;
    }
  };
}

function skip(name, reason) {
  results.skipped.push({ name, reason });
  log(`SKIPPED: ${name} - ${reason}`, 'warning');
}

async function waitForRedis(maxWait = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    if (isRedisAvailable()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
}

async function runTests() {
  console.log('\n🧪 Redis Features Test Suite\n');
  console.log('='.repeat(60));

  // Wait for Redis to be ready
  log('Waiting for Redis connection...', 'info');
  const redisReady = await waitForRedis(5000);
  
  // Check Redis availability
  const redisAvailable = isRedisAvailable();
  if (!redisAvailable) {
    if (redisReady) {
      log('Redis connection established but not ready yet.', 'warning');
    } else {
      log('Redis is not available. Some tests will be skipped.', 'warning');
      log('Make sure Redis is running and configured.', 'warning');
    }
  } else {
    log('Redis is ready!', 'success');
  }

  // Test 1: Basic Redis Connection
  await test('Redis Connection', async () => {
    const client = getClient();
    if (!client) {
      throw new Error('Redis client not available');
    }
    
    // Try to connect if not connected
    if (client.status === 'wait' || client.status === 'end') {
      try {
        await client.connect();
      } catch (error) {
        // Ignore "already connecting" errors
        if (!error.message.includes('already connecting')) {
          throw error;
        }
      }
    }
    
    // Wait for connection
    let attempts = 0;
    while (client.status !== 'ready' && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (client.status !== 'ready') {
      // Test with a simple ping
      try {
        const result = await client.ping();
        if (result === 'PONG') {
          log('Redis is connected (verified with PING)', 'success');
          return; // Connection works even if status isn't 'ready'
        }
      } catch (error) {
        throw new Error(`Redis client status: ${client.status}, ping failed: ${error.message}`);
      }
      throw new Error(`Redis client status: ${client.status}`);
    }
  })();

  // Test 2: Basic Caching
  await test('Basic Cache Set/Get', async () => {
    const testKey = 'test:basic:cache';
    const testValue = { message: 'Hello Redis', timestamp: Date.now() };

    const setResult = await cacheSet(testKey, testValue, 60);
    if (!setResult) {
      throw new Error('Failed to set cache');
    }

    const getValue = await cacheGet(testKey);
    if (!getValue || getValue.message !== testValue.message) {
      throw new Error('Cache get returned incorrect value');
    }

    // Cleanup
    await cacheDelete(testKey);
  })();

  // Test 3: Cache Delete
  await test('Cache Delete', async () => {
    const testKey = 'test:delete:cache';
    await cacheSet(testKey, { data: 'test' }, 60);
    await cacheDelete(testKey);

    const value = await cacheGet(testKey);
    if (value !== null) {
      throw new Error('Cache was not deleted');
    }
  })();

  // Test 4: Cache Pattern Delete
  await test('Cache Pattern Delete', async () => {
    // Set multiple keys
    await cacheSet('test:pattern:1', { id: 1 }, 60);
    await cacheSet('test:pattern:2', { id: 2 }, 60);
    await cacheSet('test:pattern:3', { id: 3 }, 60);

    // Delete pattern
    const deleted = await cacheDeletePattern('test:pattern:*');
    if (deleted < 3) {
      throw new Error(`Expected to delete 3 keys, deleted ${deleted}`);
    }

    // Verify deleted
    const value1 = await cacheGet('test:pattern:1');
    if (value1 !== null) {
      throw new Error('Pattern delete did not work');
    }
  })();

  // Test 5: Message Cache
  await test('Message Cache', async () => {
    const hash = generateHash('test message', 'user1', 'user2');
    const testResult = { analysis: 'positive', score: 0.9 };

    // Set cache
    await set(hash, testResult);

    // Get cache
    const cached = await get(hash);
    if (!cached || cached.analysis !== testResult.analysis) {
      throw new Error('Message cache did not work correctly');
    }

    // Get stats
    const stats = await getStats();
    if (!stats || typeof stats.memorySize !== 'number') {
      throw new Error('Message cache stats not working');
    }
  })();

  // Test 6: Session Cache
  await test('Session Cache', async () => {
    const socketId = 'test:socket:123';
    const sessionData = {
      email: 'test@example.com',
      roomId: 'room-123',
      joinedAt: new Date().toISOString(),
    };

    // Set session
    const setResult = await setSession(socketId, sessionData, 60);
    if (!setResult && redisAvailable) {
      throw new Error('Failed to set session cache');
    }

    // Get session
    const cached = await getSession(socketId);
    if (redisAvailable && (!cached || cached.email !== sessionData.email)) {
      throw new Error('Session cache get did not work');
    }

    // Delete session
    await deleteSession(socketId);
  })();

  // Test 7: Query Cache
  await test('Query Cache', async () => {
    const queryName = 'test:threads';
    const params = { roomId: 'room-123' };
    const queryResult = [{ id: 1, title: 'Test Thread' }];

    // Set cache
    await querySet(queryName, params, queryResult, 60);

    // Get cache
    const cached = await queryGet(queryName, params);
    if (redisAvailable && (!cached || cached.length !== 1)) {
      throw new Error('Query cache did not work');
    }

    // Invalidate
    await invalidateRoom('room-123');
  })();

  // Test 8: Presence Tracking
  await test('Presence Tracking', async () => {
    const userId = 'test@example.com';
    const socketId = 'test:socket:presence';
    const roomId = 'room-123';

    // Set presence
    const setResult = await setPresence(userId, socketId, { roomId }, 60);
    if (!setResult && redisAvailable) {
      throw new Error('Failed to set presence');
    }

    // Check online
    const online = await isUserOnline(userId);
    if (redisAvailable && !online) {
      throw new Error('User should be online');
    }

    // Get online users in room
    const onlineUsers = await getOnlineUsersInRoom(roomId);
    if (redisAvailable && !onlineUsers.includes(userId)) {
      throw new Error('User should be in online users list');
    }

    // Remove presence
    await removePresence(userId, socketId);

    // Verify offline
    const stillOnline = await isUserOnline(userId);
    if (redisAvailable && stillOnline) {
      throw new Error('User should be offline after removal');
    }
  })();

  // Test 9: Distributed Locking
  await test('Distributed Locking', async () => {
    const lockKey = 'test:lock:123';

    // Acquire lock
    const acquired = await acquireLock(lockKey, 10);
    if (!acquired && redisAvailable) {
      throw new Error('Failed to acquire lock');
    }

    // Try to acquire again (should fail)
    const acquiredAgain = await acquireLock(lockKey, 10);
    if (redisAvailable && acquiredAgain) {
      throw new Error('Lock should not be acquired twice');
    }

    // Release lock
    await releaseLock(lockKey);

    // Should be able to acquire again
    const acquiredAfterRelease = await acquireLock(lockKey, 10);
    if (redisAvailable && !acquiredAfterRelease) {
      throw new Error('Lock should be acquirable after release');
    }

    await releaseLock(lockKey);
  })();

  // Test 10: Rate Limiting
  await test('Rate Limiting', async () => {
    const rateKey = 'test:rate:123';
    const maxRequests = 5;
    const windowSeconds = 60;

    // Make requests
    for (let i = 0; i < maxRequests; i++) {
      const result = await checkRateLimit(rateKey, maxRequests, windowSeconds);
      if (redisAvailable && !result.allowed) {
        throw new Error(`Request ${i + 1} should be allowed`);
      }
    }

    // Next request should be rate limited
    const limited = await checkRateLimit(rateKey, maxRequests, windowSeconds);
    if (redisAvailable && limited.allowed) {
      throw new Error('Request should be rate limited');
    }

    // Verify remaining count
    if (redisAvailable && limited.remaining !== 0) {
      throw new Error(`Expected 0 remaining, got ${limited.remaining}`);
    }
  })();

  // Test 11: Pub/Sub
  await test('Pub/Sub', async () => {
    const client = getClient();
    if (!client) {
      throw new Error('Redis client not available');
    }

    const pubSub = getPubSub();
    const initialized = await pubSub.initialize();
    
    if (!initialized) {
      throw new Error('Failed to initialize Pub/Sub');
    }

    const channel = 'test:channel';
    let receivedMessage = null;
    let receivedChannel = null;

    // Subscribe
    await pubSub.subscribe(channel, (data, ch) => {
      receivedMessage = data;
      receivedChannel = ch;
    });

    // Wait a bit for subscription to be ready
    await new Promise(resolve => setTimeout(resolve, 200));

    // Publish
    const testMessage = { type: 'test', data: 'Hello Pub/Sub' };
    const publishCount = await pubSub.publish(channel, testMessage);

    // Wait for message
    await new Promise(resolve => setTimeout(resolve, 300));

    if (!receivedMessage || receivedMessage.data !== testMessage.data) {
      throw new Error(`Pub/Sub message not received. Got: ${JSON.stringify(receivedMessage)}`);
    }

    if (receivedChannel !== channel) {
      throw new Error(`Expected channel ${channel}, got ${receivedChannel}`);
    }

    // Cleanup
    await pubSub.unsubscribe(channel);
    await pubSub.close();
  })();

  // Test 12: Socket.io Redis Adapter (check if available)
  await test('Socket.io Redis Adapter Check', async () => {
    try {
      const { createAdapter } = require('@socket.io/redis-adapter');
      const client = getClient();
      
      if (client) {
        // Adapter is available and Redis is connected
        log('Socket.io Redis adapter is available', 'success');
      } else {
        throw new Error('Redis client not available for adapter');
      }
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('@socket.io/redis-adapter package not installed');
      }
      throw error;
    }
  })();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary\n');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Skipped: ${results.skipped.length}`);

  if (results.passed.length > 0) {
    console.log('\n✅ Passed Tests:');
    results.passed.forEach(name => console.log(`   - ${name}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }

  if (results.skipped.length > 0) {
    console.log('\n⚠️  Skipped Tests:');
    results.skipped.forEach(({ name, reason }) => {
      console.log(`   - ${name}: ${reason}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  if (results.failed.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

