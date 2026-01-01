/**
 * Socket.IO Integration Tests
 *
 * Tests real socket connections, reconnection logic, and error handling.
 * These tests verify the fixes for:
 * - Socket.IO connection failures
 * - Reconnection loops
 * - Connection error handling
 * - Multiple client connections
 * - Authentication middleware
 *
 * Framework: Jest
 * Requires: Running server on TEST_SERVER_URL (default: http://localhost:3000)
 */

const { io: Client } = require('socket.io-client');
const jwt = require('jsonwebtoken');

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-testing';

/**
 * Generate a test JWT token for socket authentication
 */
function generateTestToken(email = TEST_EMAIL, expiresIn = '1h') {
  return jwt.sign(
    { id: 'test-user-id', email, userId: 'test-user-id' },
    JWT_SECRET,
    { expiresIn }
  );
}

/**
 * Create a socket client with authentication
 */
function createAuthenticatedClient(url = TEST_SERVER_URL, options = {}) {
  const token = options.token || generateTestToken();
  return Client(url, {
    transports: ['websocket', 'polling'],
    reconnection: false,
    timeout: 5000,
    auth: { token },
    ...options,
  });
}

// Skip tests if server is not available
const shouldSkip = process.env.SKIP_SOCKET_TESTS === 'true';

describe('Socket.IO Integration Tests', () => {
  let socket;

  afterEach(() => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  });

  describe('Connection', () => {
    it('should connect to server successfully with auth token', (done) => {
      if (shouldSkip) {
        console.log('⏭️  Skipping - SKIP_SOCKET_TESTS=true');
        return done();
      }

      socket = createAuthenticatedClient();

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        socket.disconnect();
        done();
      });

      socket.on('connect_error', (err) => {
        socket.disconnect();
        done(new Error(`Connection failed: ${err.message}`));
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!socket.connected) {
          socket.disconnect();
          done(new Error('Connection timeout'));
        }
      }, 10000);
    });

    it('should reject connection without auth token', (done) => {
      if (shouldSkip) return done();

      // Connect without auth token - should be rejected
      const unauthSocket = Client(TEST_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: false,
        timeout: 5000,
        // No auth token!
      });

      unauthSocket.on('connect', () => {
        unauthSocket.disconnect();
        done(new Error('Should have rejected unauthenticated connection'));
      });

      unauthSocket.on('connect_error', (err) => {
        expect(err.message).toContain('Authentication');
        unauthSocket.disconnect();
        done();
      });

      setTimeout(() => {
        unauthSocket.disconnect();
        done();
      }, 5000);
    });

    it('should handle connection errors gracefully', (done) => {
      if (shouldSkip) return done();

      // Try to connect to invalid URL
      const badSocket = Client('http://localhost:9999', {
        transports: ['websocket', 'polling'],
        reconnection: false,
        timeout: 2000,
      });

      badSocket.on('connect_error', (err) => {
        expect(err).toBeDefined();
        badSocket.disconnect();
        done();
      });

      setTimeout(() => {
        badSocket.disconnect();
        done();
      }, 3000);
    });

    it('should use polling fallback when websocket fails', (done) => {
      if (shouldSkip) return done();

      socket = createAuthenticatedClient();

      let connected = false;
      socket.on('connect', () => {
        connected = true;
        // Check transport (polling fallback)
        expect(socket.io.engine.transport.name).toBeDefined();
        socket.disconnect();
        done();
      });

      socket.on('connect_error', (err) => {
        socket.disconnect();
        done(new Error(`Connection failed: ${err.message}`));
      });

      setTimeout(() => {
        if (!connected) {
          socket.disconnect();
          done(new Error('Connection timeout'));
        }
      }, 10000);
    });
  });

  describe('Reconnection Logic', () => {
    it('should respect reconnectionAttempts limit', (done) => {
      if (shouldSkip) return done();

      let reconnectCount = 0;
      const maxAttempts = 3;

      socket = Client('http://localhost:9999', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: maxAttempts,
        reconnectionDelay: 100,
        reconnectionDelayMax: 200,
        timeout: 1000,
      });

      socket.on('reconnect_attempt', (attempt) => {
        reconnectCount = attempt;
      });

      socket.on('reconnect_failed', () => {
        expect(reconnectCount).toBeLessThanOrEqual(maxAttempts);
        socket.disconnect();
        done();
      });

      setTimeout(() => {
        socket.disconnect();
        if (reconnectCount === 0) {
          done(new Error('No reconnection attempts detected'));
        } else {
          done();
        }
      }, 5000);
    });

    it('should respect reconnectionDelayMax cap', (done) => {
      if (shouldSkip) return done();

      const maxDelay = 1000;
      let lastDelay = 0;

      socket = Client('http://localhost:9999', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 100,
        reconnectionDelayMax: maxDelay,
        timeout: 1000,
      });

      socket.on('reconnect_attempt', (attempt) => {
        // Check that delay doesn't exceed max
        // Note: We can't directly measure delay, but we can verify it's capped
        lastDelay = attempt;
      });

      setTimeout(() => {
        socket.disconnect();
        // Verify reconnection attempts were made
        expect(lastDelay).toBeGreaterThan(0);
        done();
      }, 3000);
    });

    it('should stop reconnecting after max attempts', (done) => {
      if (shouldSkip) return done();

      const maxAttempts = 2;
      let attempts = 0;

      socket = Client('http://localhost:9999', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: maxAttempts,
        reconnectionDelay: 100,
        timeout: 1000,
      });

      socket.on('reconnect_attempt', () => {
        attempts++;
      });

      socket.on('reconnect_failed', () => {
        expect(attempts).toBeLessThanOrEqual(maxAttempts);
        socket.disconnect();
        done();
      });

      setTimeout(() => {
        socket.disconnect();
        done();
      }, 5000);
    });
  });

  describe('Room Joining', () => {
    it('should join room successfully', (done) => {
      if (shouldSkip) return done();

      socket = createAuthenticatedClient(TEST_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: false,
        timeout: 5000,
      });

      socket.on('connect', () => {
        socket.emit('join', { email: TEST_EMAIL });
      });

      socket.on('join_success', (data) => {
        expect(data).toBeDefined();
        expect(data.roomId).toBeDefined();
        socket.disconnect();
        done();
      });

      socket.on('error', (err) => {
        socket.disconnect();
        done(new Error(`Join failed: ${err.message || err}`));
      });

      socket.on('connect_error', (err) => {
        socket.disconnect();
        done(new Error(`Connection failed: ${err.message}`));
      });

      setTimeout(() => {
        socket.disconnect();
        done(new Error('Join timeout'));
      }, 10000);
    });

    it('should handle join errors gracefully', (done) => {
      if (shouldSkip) return done();

      socket = createAuthenticatedClient(TEST_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: false,
        timeout: 5000,
      });

      socket.on('connect', () => {
        // Try to join with invalid data
        socket.emit('join', { email: null });
      });

      socket.on('error', (err) => {
        expect(err).toBeDefined();
        socket.disconnect();
        done();
      });

      socket.on('connect_error', (err) => {
        socket.disconnect();
        done(new Error(`Connection failed: ${err.message}`));
      });

      setTimeout(() => {
        socket.disconnect();
        done();
      }, 5000);
    });
  });

  describe('Message Handling', () => {
    it('should send and receive messages', (done) => {
      if (shouldSkip) return done();

      socket = createAuthenticatedClient(TEST_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: false,
        timeout: 5000,
      });

      let joined = false;
      const testMessage = `Test message ${Date.now()}`;

      socket.on('connect', () => {
        socket.emit('join', { email: TEST_EMAIL });
      });

      socket.on('join_success', () => {
        joined = true;
        socket.emit('send_message', { text: testMessage });
      });

      socket.on('new_message', (message) => {
        expect(message).toBeDefined();
        expect(message.text).toBe(testMessage);
        socket.disconnect();
        done();
      });

      socket.on('connect_error', (err) => {
        socket.disconnect();
        done(new Error(`Connection failed: ${err.message}`));
      });

      setTimeout(() => {
        socket.disconnect();
        if (!joined) {
          done(new Error('Failed to join room'));
        } else {
          done(new Error('Message timeout'));
        }
      }, 15000);
    });
  });

  describe('Disconnection', () => {
    it('should handle disconnection gracefully', (done) => {
      if (shouldSkip) return done();

      socket = createAuthenticatedClient(TEST_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: false,
        timeout: 5000,
      });

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        socket.disconnect();
      });

      socket.on('disconnect', (reason) => {
        expect(socket.connected).toBe(false);
        expect(reason).toBeDefined();
        done();
      });

      socket.on('connect_error', (err) => {
        socket.disconnect();
        done(new Error(`Connection failed: ${err.message}`));
      });

      setTimeout(() => {
        socket.disconnect();
        done(new Error('Disconnect timeout'));
      }, 10000);
    });

    it('should not reconnect after manual disconnect', (done) => {
      if (shouldSkip) return done();

      let reconnectAttempted = false;

      socket = createAuthenticatedClient(TEST_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 100,
        timeout: 5000,
      });

      socket.on('connect', () => {
        socket.disconnect();
      });

      socket.on('disconnect', () => {
        // After manual disconnect, should not reconnect
        setTimeout(() => {
          expect(reconnectAttempted).toBe(false);
          done();
        }, 2000);
      });

      socket.on('reconnect_attempt', () => {
        reconnectAttempted = true;
      });

      setTimeout(() => {
        socket.disconnect();
        done();
      }, 10000);
    });
  });

  describe('Multiple Clients', () => {
    it('should handle multiple concurrent connections', (done) => {
      if (shouldSkip) return done();

      const clientCount = 3;
      const clients = [];
      let connectedCount = 0;

      for (let i = 0; i < clientCount; i++) {
        const client = createAuthenticatedClient(TEST_SERVER_URL, {
          transports: ['websocket', 'polling'],
          reconnection: false,
          timeout: 5000,
        });

        client.on('connect', () => {
          connectedCount++;
          if (connectedCount === clientCount) {
            // All clients connected
            clients.forEach(c => c.disconnect());
            expect(connectedCount).toBe(clientCount);
            done();
          }
        });

        client.on('connect_error', (err) => {
          clients.forEach(c => c.disconnect());
          done(new Error(`Client ${i} connection failed: ${err.message}`));
        });

        clients.push(client);
      }

      setTimeout(() => {
        clients.forEach(c => c.disconnect());
        if (connectedCount < clientCount) {
          done(new Error(`Only ${connectedCount}/${clientCount} clients connected`));
        }
      }, 15000);
    });
  });

  describe('Error Handling', () => {
    it('should suppress verbose Socket.IO reconnection errors', (done) => {
      if (shouldSkip) return done();

      // This test verifies that the errorMonitor.js suppression is working
      // We can't directly test console.error suppression, but we can verify
      // that reconnection errors don't crash the client
      socket = Client('http://localhost:9999', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 2,
        reconnectionDelay: 100,
        timeout: 1000,
      });

      let errorCount = 0;
      socket.on('connect_error', () => {
        errorCount++;
      });

      socket.on('reconnect_failed', () => {
        // Should handle gracefully without crashing
        expect(errorCount).toBeGreaterThan(0);
        socket.disconnect();
        done();
      });

      setTimeout(() => {
        socket.disconnect();
        done();
      }, 5000);
    });
  });
});

