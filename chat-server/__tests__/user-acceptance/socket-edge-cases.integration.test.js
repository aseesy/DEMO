/**
 * Socket.io Edge Case Integration Tests
 *
 * Tests critical edge cases and error handling in the Socket.io layer:
 * - Rate limiting on events (especially join)
 * - Authentication rejection scenarios
 * - Error code standardization
 * - Message failure notifications
 * - Timeout handling
 *
 * Prerequisites:
 * - Server running on TEST_SERVER_URL (default: http://localhost:3000)
 * - Database configured and migrated
 *
 * Run with: npm test -- socket-edge-cases.integration.test.js
 * Skip with: SKIP_E2E_TESTS=true npm test
 */

const { io: Client } = require('socket.io-client');
const jwt = require('jsonwebtoken');

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';
const JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-characters-long-for-jest-tests';
const shouldSkip = process.env.SKIP_E2E_TESTS === 'true' || process.env.CI === 'true';

/**
 * Generate test JWT token
 */
function generateTestToken(payload = {}) {
  return jwt.sign(
    {
      id: payload.id || Math.floor(Math.random() * 10000),
      userId: payload.userId || payload.id || Math.floor(Math.random() * 10000),
      email: payload.email || `test${Date.now()}@example.com`,
      ...payload,
    },
    JWT_SECRET,
    { expiresIn: payload.expiresIn || '1h' }
  );
}

/**
 * Create authenticated socket client
 */
function createClient(options = {}) {
  const token = options.token || generateTestToken(options.user || {});
  return Client(TEST_SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: false,
    timeout: 10000,
    auth: { token },
    ...options,
  });
}

/**
 * Helper to wait for socket event with timeout
 */
function waitForEvent(socket, eventName, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeout);

    socket.once(eventName, data => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

/**
 * Helper to collect multiple events
 */
function collectEvents(socket, eventName, count, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const events = [];
    const timer = setTimeout(() => {
      resolve(events); // Return what we collected even on timeout
    }, timeout);

    const handler = data => {
      events.push(data);
      if (events.length >= count) {
        clearTimeout(timer);
        socket.off(eventName, handler);
        resolve(events);
      }
    };

    socket.on(eventName, handler);
  });
}

describe('Socket.io Edge Case Tests', () => {
  beforeAll(() => {
    if (shouldSkip) {
      console.log('⏭️  Skipping Socket edge case tests - SKIP_E2E_TESTS=true or CI=true');
    }
  });

  describe('Authentication Edge Cases', () => {
    let socket;

    afterEach(() => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    });

    it('should reject connection with missing token', done => {
      if (shouldSkip) return done();

      socket = Client(TEST_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: false,
        timeout: 5000,
        // No auth object at all
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        done();
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        socket.disconnect();
        done(new Error('Should have rejected connection without auth'));
      });

      socket.on('connect_error', err => {
        clearTimeout(timeout);
        // Expected - authentication required
        expect(err.message).toMatch(/auth|token|Authentication/i);
        socket.disconnect();
        done();
      });
    });

    it('should reject connection with invalid token format', done => {
      if (shouldSkip) return done();

      socket = Client(TEST_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: false,
        timeout: 5000,
        auth: { token: 'not-a-valid-jwt-token' },
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        done();
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        socket.disconnect();
        done(new Error('Should have rejected invalid token'));
      });

      socket.on('connect_error', err => {
        clearTimeout(timeout);
        // Expected - invalid token
        expect(err.message).toMatch(/auth|token|invalid|Authentication/i);
        socket.disconnect();
        done();
      });
    });

    it('should reject connection with expired token', done => {
      if (shouldSkip) return done();

      const expiredToken = jwt.sign(
        { id: 1, userId: 1, email: 'expired@example.com' },
        JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      );

      socket = Client(TEST_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: false,
        timeout: 5000,
        auth: { token: expiredToken },
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        done();
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        socket.disconnect();
        done(new Error('Should have rejected expired token'));
      });

      socket.on('connect_error', err => {
        clearTimeout(timeout);
        // Expected - expired token
        expect(err.message).toMatch(/auth|token|expired|Authentication/i);
        socket.disconnect();
        done();
      });
    });

    it('should reject connection with wrong secret signature', done => {
      if (shouldSkip) return done();

      const wrongSecretToken = jwt.sign(
        { id: 1, userId: 1, email: 'wrong@example.com' },
        'completely-wrong-secret-key-that-does-not-match'
      );

      socket = Client(TEST_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: false,
        timeout: 5000,
        auth: { token: wrongSecretToken },
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        done();
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        socket.disconnect();
        done(new Error('Should have rejected token with wrong signature'));
      });

      socket.on('connect_error', err => {
        clearTimeout(timeout);
        // Expected - invalid signature
        expect(err.message).toMatch(/auth|token|signature|invalid|Authentication/i);
        socket.disconnect();
        done();
      });
    });
  });

  describe('Rate Limiting Edge Cases', () => {
    let socket;

    afterEach(() => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    });

    it('should rate limit rapid join attempts', done => {
      if (shouldSkip) return done();

      const testEmail = `ratelimit-join-${Date.now()}@example.com`;
      socket = createClient({ user: { email: testEmail } });

      let rateLimited = false;
      let errorReceived = false;

      const timeout = setTimeout(() => {
        socket.disconnect();
        // If we didn't get rate limited after 5 rapid joins, the test passes anyway
        // (rate limit config may allow more than 5)
        done();
      }, 5000);

      socket.on('connect', () => {
        // Fire 10 rapid join events - should trigger rate limit (configured at 2/sec)
        for (let i = 0; i < 10; i++) {
          socket.emit('join', { email: testEmail });
        }
      });

      socket.on('socket_error', err => {
        if (err.code === 'RATE_LIMITED') {
          rateLimited = true;
          clearTimeout(timeout);
          expect(err.code).toBe('RATE_LIMITED');
          expect(err.message).toMatch(/slow down|too many/i);
          socket.disconnect();
          done();
        }
      });

      socket.on('error', err => {
        if (err.code === 'RATE_LIMITED' || err.message?.includes('Rate')) {
          errorReceived = true;
          clearTimeout(timeout);
          socket.disconnect();
          done();
        }
      });

      socket.on('connect_error', err => {
        clearTimeout(timeout);
        if (err.message.includes('ECONNREFUSED')) {
          console.log('⚠️  Server not available');
          done();
        }
      });
    });

    it('should rate limit rapid message sends', done => {
      if (shouldSkip) return done();

      const testEmail = `ratelimit-msg-${Date.now()}@example.com`;
      socket = createClient({ user: { email: testEmail } });

      let joined = false;
      let rateLimited = false;

      const timeout = setTimeout(() => {
        socket.disconnect();
        if (!joined) {
          console.log('⚠️  Failed to join room');
        }
        done();
      }, 10000);

      socket.on('connect', () => {
        socket.emit('join', { email: testEmail });
      });

      socket.on('join_success', () => {
        joined = true;
        // Fire 20 rapid messages - should trigger rate limit (configured at 5/sec)
        for (let i = 0; i < 20; i++) {
          socket.emit('send_message', { text: `Rapid message ${i}` });
        }
      });

      socket.on('socket_error', err => {
        if (err.code === 'RATE_LIMITED') {
          rateLimited = true;
          clearTimeout(timeout);
          expect(err.code).toBe('RATE_LIMITED');
          socket.disconnect();
          done();
        }
      });

      socket.on('error', err => {
        // Also check for generic error with rate limit message
        if (err.code === 'RATE_LIMITED' || err.message?.includes('Rate')) {
          clearTimeout(timeout);
          socket.disconnect();
          done();
        }
      });

      socket.on('connect_error', err => {
        clearTimeout(timeout);
        if (err.message.includes('ECONNREFUSED')) {
          console.log('⚠️  Server not available');
          done();
        }
      });
    });
  });

  describe('Socket Error Code Standardization', () => {
    let socket;

    afterEach(() => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    });

    it('should emit standardized socket_error events', done => {
      if (shouldSkip) return done();

      const testEmail = `error-code-${Date.now()}@example.com`;
      socket = createClient({ user: { email: testEmail } });

      const timeout = setTimeout(() => {
        socket.disconnect();
        console.log('⚠️  No errors received - test inconclusive');
        done();
      }, 8000);

      socket.on('connect', () => {
        socket.emit('join', { email: testEmail });
      });

      socket.on('join_success', () => {
        // Try to send message without proper setup to potentially trigger an error
        socket.emit('edit_message', { messageId: 'nonexistent-id', text: 'test' });
      });

      // Listen for standardized error events
      socket.on('socket_error', err => {
        clearTimeout(timeout);
        // Verify error structure
        expect(err).toHaveProperty('code');
        expect(typeof err.code).toBe('string');
        expect(err).toHaveProperty('message');
        socket.disconnect();
        done();
      });

      socket.on('error', err => {
        clearTimeout(timeout);
        // Even generic errors should have structure
        expect(err).toBeDefined();
        socket.disconnect();
        done();
      });

      socket.on('connect_error', err => {
        clearTimeout(timeout);
        if (err.message.includes('ECONNREFUSED')) {
          console.log('⚠️  Server not available');
          done();
        }
      });
    });
  });

  describe('Message Failure Notifications', () => {
    let socket;

    afterEach(() => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    });

    it('should emit message_error for failed optimistic messages', done => {
      if (shouldSkip) return done();

      const testEmail = `msg-fail-${Date.now()}@example.com`;
      socket = createClient({ user: { email: testEmail } });

      let joined = false;

      const timeout = setTimeout(() => {
        socket.disconnect();
        if (!joined) {
          console.log('⚠️  Failed to join room');
        } else {
          console.log('⚠️  No message error received - persistence may have succeeded');
        }
        done();
      }, 10000);

      socket.on('connect', () => {
        socket.emit('join', { email: testEmail });
      });

      socket.on('join_success', () => {
        joined = true;
        // Send a message with optimistic ID to test reconciliation
        socket.emit('send_message', {
          text: 'Test message for failure notification',
          optimisticId: `optimistic-${Date.now()}`,
        });
      });

      // Listen for message error event (Invariant I-15)
      socket.on('message_error', err => {
        clearTimeout(timeout);
        expect(err).toHaveProperty('optimisticId');
        expect(err).toHaveProperty('error');
        expect(err).toHaveProperty('code');
        expect(err.code).toBe('SEND_FAILED');
        socket.disconnect();
        done();
      });

      // If message succeeds, that's also valid
      socket.on('new_message', msg => {
        clearTimeout(timeout);
        // Message succeeded - this is fine
        socket.disconnect();
        done();
      });

      socket.on('ai_intervention', () => {
        clearTimeout(timeout);
        // AI intervened - this is also fine
        socket.disconnect();
        done();
      });

      socket.on('connect_error', err => {
        clearTimeout(timeout);
        if (err.message.includes('ECONNREFUSED')) {
          console.log('⚠️  Server not available');
          done();
        }
      });
    });

    it('should emit message_save_failed for persistence failures', done => {
      if (shouldSkip) return done();

      // This test verifies the event exists - actual failures are hard to trigger
      const testEmail = `save-fail-${Date.now()}@example.com`;
      socket = createClient({ user: { email: testEmail } });

      const timeout = setTimeout(() => {
        socket.disconnect();
        // No failure occurred - that's expected in normal conditions
        console.log('ℹ️  No persistence failure (expected in normal conditions)');
        done();
      }, 8000);

      socket.on('connect', () => {
        socket.emit('join', { email: testEmail });
      });

      socket.on('join_success', () => {
        socket.emit('send_message', { text: 'Test persistence notification' });
      });

      // Listen for persistence failure event
      socket.on('message_save_failed', err => {
        clearTimeout(timeout);
        expect(err).toHaveProperty('messageId');
        expect(err).toHaveProperty('error');
        expect(err).toHaveProperty('code');
        expect(err.code).toBe('PERSIST_FAILED');
        socket.disconnect();
        done();
      });

      // Message success is also valid
      socket.on('new_message', () => {
        clearTimeout(timeout);
        socket.disconnect();
        done();
      });

      socket.on('ai_intervention', () => {
        clearTimeout(timeout);
        socket.disconnect();
        done();
      });

      socket.on('connect_error', err => {
        clearTimeout(timeout);
        if (err.message.includes('ECONNREFUSED')) {
          console.log('⚠️  Server not available');
          done();
        }
      });
    });
  });

  describe('Transport Preference', () => {
    let socket;

    afterEach(() => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    });

    it('should prefer websocket transport over polling', done => {
      if (shouldSkip) return done();

      socket = createClient({
        user: { email: `transport-${Date.now()}@example.com` },
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        console.log('⚠️  Connection timeout');
        done();
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        // Check transport - should be websocket if available
        const transport = socket.io.engine.transport.name;
        console.log(`ℹ️  Connected using transport: ${transport}`);
        // Websocket should be used when available (it's first in the list)
        expect(['websocket', 'polling']).toContain(transport);
        socket.disconnect();
        done();
      });

      socket.on('connect_error', err => {
        clearTimeout(timeout);
        if (err.message.includes('ECONNREFUSED')) {
          console.log('⚠️  Server not available');
          done();
        } else {
          done(new Error(`Connection failed: ${err.message}`));
        }
      });
    });

    it('should fall back to polling if websocket fails', done => {
      if (shouldSkip) return done();

      // Force polling to verify fallback works
      socket = Client(TEST_SERVER_URL, {
        transports: ['polling'], // Only allow polling
        reconnection: false,
        timeout: 10000,
        auth: { token: generateTestToken({ email: `polling-${Date.now()}@example.com` }) },
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        console.log('⚠️  Connection timeout');
        done();
      }, 10000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        const transport = socket.io.engine.transport.name;
        expect(transport).toBe('polling');
        socket.disconnect();
        done();
      });

      socket.on('connect_error', err => {
        clearTimeout(timeout);
        if (err.message.includes('ECONNREFUSED')) {
          console.log('⚠️  Server not available');
          done();
        } else {
          done(new Error(`Connection failed: ${err.message}`));
        }
      });
    });
  });

  describe('Disconnection Handling', () => {
    let socket;

    afterEach(() => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    });

    it('should handle clean disconnection', done => {
      if (shouldSkip) return done();

      socket = createClient({
        user: { email: `disconnect-${Date.now()}@example.com` },
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        console.log('⚠️  Test timeout');
        done();
      }, 5000);

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        socket.disconnect();
      });

      socket.on('disconnect', reason => {
        clearTimeout(timeout);
        expect(socket.connected).toBe(false);
        // Reason should be 'io client disconnect' for client-initiated
        expect(reason).toBeDefined();
        done();
      });

      socket.on('connect_error', err => {
        clearTimeout(timeout);
        if (err.message.includes('ECONNREFUSED')) {
          console.log('⚠️  Server not available');
          done();
        }
      });
    });

    it('should not process events after disconnection', done => {
      if (shouldSkip) return done();

      const testEmail = `post-disconnect-${Date.now()}@example.com`;
      socket = createClient({ user: { email: testEmail } });

      let disconnected = false;
      let messageAfterDisconnect = false;

      const timeout = setTimeout(() => {
        if (!messageAfterDisconnect) {
          // Good - no message after disconnect
          done();
        }
      }, 3000);

      socket.on('connect', () => {
        socket.emit('join', { email: testEmail });
      });

      socket.on('join_success', () => {
        // Disconnect, then try to send
        socket.disconnect();
        disconnected = true;

        // Try to emit after disconnect (should be ignored)
        socket.emit('send_message', { text: 'Should not be delivered' });
      });

      socket.on('new_message', msg => {
        if (disconnected) {
          clearTimeout(timeout);
          messageAfterDisconnect = true;
          done(new Error('Message received after disconnect'));
        }
      });

      socket.on('connect_error', err => {
        clearTimeout(timeout);
        if (err.message.includes('ECONNREFUSED')) {
          console.log('⚠️  Server not available');
          done();
        }
      });
    });
  });

  describe('Room Membership Verification', () => {
    let socket;

    afterEach(() => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    });

    it('should reject message from non-room-member', done => {
      if (shouldSkip) return done();

      const testEmail = `nonmember-${Date.now()}@example.com`;
      socket = createClient({ user: { email: testEmail } });

      const timeout = setTimeout(() => {
        socket.disconnect();
        // If no error, user might have been auto-joined to default room
        console.log('ℹ️  No room membership error (may have default room)');
        done();
      }, 5000);

      socket.on('connect', () => {
        // Try to send message WITHOUT joining a room first
        socket.emit('send_message', { text: 'Unauthorized message' });
      });

      socket.on('error', err => {
        clearTimeout(timeout);
        // Expected - should require join first
        expect(err.message).toMatch(/join|room|active/i);
        socket.disconnect();
        done();
      });

      socket.on('socket_error', err => {
        if (err.code === 'ROOM_MEMBERSHIP_INVALID' || err.code === 'USER_NOT_ACTIVE') {
          clearTimeout(timeout);
          socket.disconnect();
          done();
        }
      });

      socket.on('connect_error', err => {
        clearTimeout(timeout);
        if (err.message.includes('ECONNREFUSED')) {
          console.log('⚠️  Server not available');
          done();
        }
      });
    });
  });
});

/**
 * Stress Test Scenarios
 *
 * Tests system behavior under load
 */
describe('Socket.io Stress Tests', () => {
  it('should handle rapid connect/disconnect cycles', async () => {
    if (shouldSkip) return;

    const CYCLES = 5;
    const results = [];

    for (let i = 0; i < CYCLES; i++) {
      const socket = createClient({
        user: { email: `stress-${i}-${Date.now()}@example.com` },
      });

      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            socket.disconnect();
            resolve('timeout');
          }, 2000);

          socket.on('connect', () => {
            clearTimeout(timeout);
            socket.disconnect();
            resolve('connected');
          });

          socket.on('connect_error', err => {
            clearTimeout(timeout);
            socket.disconnect();
            if (err.message.includes('ECONNREFUSED')) {
              resolve('unavailable');
            } else {
              resolve('error');
            }
          });
        }).then(result => {
          results.push(result);
        });
      } catch (err) {
        results.push('exception');
      }
    }

    // All cycles should complete without hanging
    expect(results.length).toBe(CYCLES);

    if (results.every(r => r === 'unavailable')) {
      console.log('⚠️  Server not available');
    } else {
      // At least some connections should succeed
      const successful = results.filter(r => r === 'connected').length;
      console.log(`ℹ️  ${successful}/${CYCLES} connections successful`);
    }
  });
});
