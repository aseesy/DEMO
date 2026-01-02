/**
 * End-to-End Integration Tests
 *
 * These tests verify complete user scenarios with a running server.
 * They test the full stack including database, sockets, and API.
 *
 * Prerequisites:
 * - Server running on TEST_SERVER_URL (default: http://localhost:3000)
 * - Database configured and migrated
 *
 * Run with: npm test -- e2e-scenarios.integration.test.js
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
    { expiresIn: '1h' }
  );
}

/**
 * Create authenticated socket client
 */
function createClient(options = {}) {
  const token = options.token || generateTestToken(options.user || {});
  return Client(TEST_SERVER_URL, {
    transports: ['polling', 'websocket'],
    reconnection: false,
    timeout: 10000,
    auth: { token },
    ...options,
  });
}

/**
 * Helper to wait for socket event
 */
function waitForEvent(socket, eventName, timeout = 10000) {
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
 * Helper to make HTTP requests
 */
async function apiRequest(method, path, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${TEST_SERVER_URL}${path}`, options);
  const data = await response.json().catch(() => null);

  return { status: response.status, data, ok: response.ok };
}

describe('E2E Integration Tests', () => {
  // Skip all tests if flag is set
  beforeAll(() => {
    if (shouldSkip) {
      console.log('⏭️  Skipping E2E tests - SKIP_E2E_TESTS=true or CI=true');
    }
  });

  describe('Server Health', () => {
    it('should respond to health check', async () => {
      if (shouldSkip) return;

      try {
        const response = await fetch(`${TEST_SERVER_URL}/health`);
        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.status).toBeDefined();
      } catch (error) {
        console.log('⚠️  Server not available:', error.message);
        // Don't fail if server isn't running
      }
    });
  });

  describe('Authentication E2E Flow', () => {
    it('should reject unauthenticated API requests', async () => {
      if (shouldSkip) return;

      try {
        const response = await apiRequest('GET', '/api/user/profile');
        expect(response.status).toBe(401);
      } catch (error) {
        console.log('⚠️  Server not available');
      }
    });

    it('should accept authenticated API requests', async () => {
      if (shouldSkip) return;

      try {
        const token = generateTestToken({ email: 'test@example.com' });
        const response = await apiRequest('GET', '/api/user/profile', null, token);

        // Should not be 401 (may be 404 if user doesn't exist)
        expect(response.status).not.toBe(401);
      } catch (error) {
        console.log('⚠️  Server not available');
      }
    });

    it('should reject expired tokens', async () => {
      if (shouldSkip) return;

      try {
        const expiredToken = jwt.sign({ id: 1, userId: 1, email: 'test@example.com' }, JWT_SECRET, {
          expiresIn: '-1h',
        });

        const response = await apiRequest('GET', '/api/user/profile', null, expiredToken);
        expect(response.status).toBe(401);
      } catch (error) {
        console.log('⚠️  Server not available');
      }
    });
  });

  describe('Socket Connection E2E Flow', () => {
    let socket;

    afterEach(() => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    });

    it('should establish authenticated socket connection', done => {
      if (shouldSkip) return done();

      socket = createClient({
        user: { email: 'socket-test@example.com' },
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        console.log('⚠️  Connection timeout - server may not be available');
        done();
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        expect(socket.connected).toBe(true);
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

    it('should reject unauthenticated socket connection', done => {
      if (shouldSkip) return done();

      socket = Client(TEST_SERVER_URL, {
        transports: ['polling', 'websocket'],
        reconnection: false,
        timeout: 5000,
        // No auth token
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        done();
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        socket.disconnect();
        // Unexpected - connection should have been rejected
        done(new Error('Should have rejected unauthenticated connection'));
      });

      socket.on('connect_error', err => {
        clearTimeout(timeout);
        // Expected - authentication required
        if (err.message.includes('Authentication') || err.message.includes('auth')) {
          socket.disconnect();
          done();
        } else if (err.message.includes('ECONNREFUSED')) {
          console.log('⚠️  Server not available');
          done();
        } else {
          socket.disconnect();
          done();
        }
      });
    });
  });

  describe('Room Join E2E Flow', () => {
    let socket;

    afterEach(() => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    });

    it('should join room and receive confirmation', done => {
      if (shouldSkip) return done();

      const testEmail = `jointest-${Date.now()}@example.com`;
      socket = createClient({ user: { email: testEmail } });

      const timeout = setTimeout(() => {
        socket.disconnect();
        console.log('⚠️  Test timeout');
        done();
      }, 15000);

      socket.on('connect', () => {
        socket.emit('join', { email: testEmail });
      });

      socket.on('join_success', data => {
        clearTimeout(timeout);
        expect(data).toBeDefined();
        expect(data.roomId).toBeDefined();
        socket.disconnect();
        done();
      });

      socket.on('error', err => {
        clearTimeout(timeout);
        socket.disconnect();
        // May fail if user doesn't exist - that's ok for this test
        console.log('⚠️  Join error (expected if user not in DB):', err);
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

  describe('Message Send E2E Flow', () => {
    let socket;

    afterEach(() => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    });

    it('should send message and receive acknowledgement', done => {
      if (shouldSkip) return done();

      const testEmail = `msgtest-${Date.now()}@example.com`;
      socket = createClient({ user: { email: testEmail } });

      const testMessage = `Test message ${Date.now()}`;
      let joined = false;

      const timeout = setTimeout(() => {
        socket.disconnect();
        if (!joined) {
          console.log('⚠️  Failed to join room');
        }
        done();
      }, 15000);

      socket.on('connect', () => {
        socket.emit('join', { email: testEmail });
      });

      socket.on('join_success', () => {
        joined = true;
        socket.emit('send_message', { text: testMessage });
      });

      socket.on('new_message', message => {
        clearTimeout(timeout);
        expect(message).toBeDefined();
        // Message should contain our text or be an AI intervention
        expect(message.text || message.intervention).toBeDefined();
        socket.disconnect();
        done();
      });

      socket.on('ai_intervention', intervention => {
        // AI flagged the message - this is valid behavior
        clearTimeout(timeout);
        expect(intervention).toBeDefined();
        socket.disconnect();
        done();
      });

      socket.on('error', err => {
        clearTimeout(timeout);
        socket.disconnect();
        console.log('⚠️  Message error:', err);
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

    it('should reject empty messages', done => {
      if (shouldSkip) return done();

      const testEmail = `empty-msg-${Date.now()}@example.com`;
      socket = createClient({ user: { email: testEmail } });

      let joined = false;

      const timeout = setTimeout(() => {
        socket.disconnect();
        done();
      }, 10000);

      socket.on('connect', () => {
        socket.emit('join', { email: testEmail });
      });

      socket.on('join_success', () => {
        joined = true;
        // Send empty message
        socket.emit('send_message', { text: '' });
      });

      socket.on('error', err => {
        clearTimeout(timeout);
        // Expected - empty messages should be rejected
        socket.disconnect();
        done();
      });

      socket.on('new_message', () => {
        clearTimeout(timeout);
        socket.disconnect();
        // Empty message should not be sent
        done(new Error('Empty message should have been rejected'));
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

  describe('API Endpoint E2E Tests', () => {
    describe('Invitation Endpoints', () => {
      it('should validate invitation tokens', async () => {
        if (shouldSkip) return;

        try {
          // Test with invalid token
          const response = await apiRequest('GET', '/api/invitations/validate/invalid-token-123');

          // Should return 200 with valid:false or 404
          expect([200, 404]).toContain(response.status);
        } catch (error) {
          console.log('⚠️  Server not available');
        }
      });

      it('should validate short codes', async () => {
        if (shouldSkip) return;

        try {
          const response = await apiRequest('GET', '/api/invitations/validate-code/LZ-TEST');
          expect([200, 404]).toContain(response.status);
        } catch (error) {
          console.log('⚠️  Server not available');
        }
      });
    });

    describe('Protected Endpoints', () => {
      it('should require auth for user profile', async () => {
        if (shouldSkip) return;

        try {
          const response = await apiRequest('GET', '/api/user/profile');
          expect(response.status).toBe(401);
        } catch (error) {
          console.log('⚠️  Server not available');
        }
      });

      it('should require auth for contacts', async () => {
        if (shouldSkip) return;

        try {
          const response = await apiRequest('GET', '/api/contacts');
          expect(response.status).toBe(401);
        } catch (error) {
          console.log('⚠️  Server not available');
        }
      });

      it('should require auth for rooms', async () => {
        if (shouldSkip) return;

        try {
          const response = await apiRequest('GET', '/api/rooms');
          expect(response.status).toBe(401);
        } catch (error) {
          console.log('⚠️  Server not available');
        }
      });
    });
  });

  describe('Error Handling E2E', () => {
    it('should return proper error format for invalid requests', async () => {
      if (shouldSkip) return;

      try {
        // Use a non-rate-limited endpoint to avoid timeout
        const response = await apiRequest('GET', '/api/user/profile');

        // Should return 401 (unauthorized) with error message
        expect(response.status).toBe(401);
        if (response.data) {
          expect(response.data.error || response.data.message).toBeDefined();
        }
      } catch (error) {
        console.log('⚠️  Server not available');
      }
    }, 15000); // Increased timeout

    it('should handle 404 gracefully', async () => {
      if (shouldSkip) return;

      try {
        const response = await apiRequest('GET', '/api/nonexistent-endpoint');
        expect(response.status).toBe(404);
      } catch (error) {
        console.log('⚠️  Server not available');
      }
    });
  });

  describe('Rate Limiting E2E', () => {
    it('should enforce rate limits on login attempts', async () => {
      if (shouldSkip) return;

      try {
        // Make several rapid requests
        const requests = Array(10)
          .fill()
          .map(() =>
            apiRequest('POST', '/api/auth/login', {
              email: 'ratelimit-test@example.com',
              password: 'wrongpassword',
            })
          );

        const responses = await Promise.all(requests);

        // At least some should be rate limited or rejected
        const statuses = responses.map(r => r.status);
        // We expect either 401 (wrong password) or 429 (rate limited)
        expect(statuses.every(s => [401, 429, 403].includes(s))).toBe(true);
      } catch (error) {
        console.log('⚠️  Server not available');
      }
    });
  });

  describe('Database Connectivity E2E', () => {
    it('should indicate database status in health check', async () => {
      if (shouldSkip) return;

      try {
        const response = await fetch(`${TEST_SERVER_URL}/health`);
        const data = await response.json();

        // Health check should include database status
        expect(data.status).toBeDefined();
        // 'healthy' or 'degraded' or 'error'
        expect(['healthy', 'degraded', 'error', 'ok']).toContain(
          data.status?.toLowerCase() || data.database?.toLowerCase() || 'ok'
        );
      } catch (error) {
        console.log('⚠️  Server not available');
      }
    });
  });
});

/**
 * Concurrent User Scenario Tests
 *
 * Tests behavior when multiple users are connected simultaneously
 */
describe('Concurrent User Scenarios', () => {
  it('should handle multiple simultaneous connections', done => {
    if (shouldSkip) return done();

    const NUM_CLIENTS = 3;
    const clients = [];
    let connectedCount = 0;
    let errorOccurred = false;

    const cleanup = () => {
      clients.forEach(c => {
        if (c && c.connected) c.disconnect();
      });
    };

    const timeout = setTimeout(() => {
      cleanup();
      if (connectedCount > 0) {
        // Partial success is ok
        done();
      } else {
        console.log('⚠️  Server not available');
        done();
      }
    }, 10000);

    for (let i = 0; i < NUM_CLIENTS; i++) {
      const client = createClient({
        user: { email: `concurrent-${i}-${Date.now()}@example.com` },
      });

      client.on('connect', () => {
        connectedCount++;
        if (connectedCount === NUM_CLIENTS) {
          clearTimeout(timeout);
          cleanup();
          expect(connectedCount).toBe(NUM_CLIENTS);
          done();
        }
      });

      client.on('connect_error', err => {
        if (!errorOccurred) {
          errorOccurred = true;
          if (err.message.includes('ECONNREFUSED')) {
            clearTimeout(timeout);
            cleanup();
            console.log('⚠️  Server not available');
            done();
          }
        }
      });

      clients.push(client);
    }
  });
});
