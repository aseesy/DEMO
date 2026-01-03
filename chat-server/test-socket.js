/**
 * Socket.io Connection Test
 * Tests if socket.io connections work with proper auth
 */

const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';

// Use a test JWT (this should be replaced with a valid token)
// For testing, we'll just see if the connection flow works
const TEST_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjQsInVzZXJJZCI6MjQsImVtYWlsIjoibW9tMUB0ZXN0LmNvbSIsImlhdCI6MTczNjcwMDAwMCwiZXhwIjoxNzQwMDAwMDAwfQ.test';

console.log('=== Socket.io Connection Test ===');
console.log('Connecting to:', SERVER_URL);
console.log('');

// Test 1: Connect with polling only
function testPolling() {
  return new Promise(resolve => {
    console.log('Test 1: Polling-only connection');

    const socket = io(SERVER_URL, {
      transports: ['polling'],
      auth: { token: TEST_TOKEN },
      autoConnect: false,
      timeout: 5000,
    });

    // Log EVERYTHING
    socket.io.on('open', () => console.log('  [io] Engine.io OPEN'));
    socket.io.on('close', reason => console.log('  [io] Engine.io CLOSE:', reason));
    socket.io.on('error', err => console.log('  [io] Engine.io ERROR:', err.message));
    socket.io.on('packet', packet =>
      console.log('  [io] Packet:', packet.type, packet.data?.substring?.(0, 50))
    );

    socket.on('connect', () => {
      console.log('  ✅ CONNECTED! Socket ID:', socket.id);
      socket.disconnect();
      resolve('success');
    });

    socket.on('connect_error', err => {
      console.log('  ❌ Connect error:', err.message);
      console.log('     Error data:', err.data || 'none');
      socket.disconnect();
      resolve('error');
    });

    socket.on('disconnect', reason => {
      console.log('  Disconnected:', reason);
    });

    socket.connect();

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!socket.connected) {
        console.log('  ⏱️  Timeout - no connection');
        socket.disconnect();
        resolve('timeout');
      }
    }, 5000);
  });
}

// Test 2: Connect with websocket only
function testWebsocket() {
  return new Promise(resolve => {
    console.log('\nTest 2: WebSocket-only connection');

    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      auth: { token: TEST_TOKEN },
      autoConnect: false,
      timeout: 5000,
    });

    socket.io.on('open', () => console.log('  [io] Engine.io OPEN'));
    socket.io.on('close', reason => console.log('  [io] Engine.io CLOSE:', reason));
    socket.io.on('error', err => console.log('  [io] Engine.io ERROR:', err.message));

    socket.on('connect', () => {
      console.log('  ✅ CONNECTED! Socket ID:', socket.id);
      socket.disconnect();
      resolve('success');
    });

    socket.on('connect_error', err => {
      console.log('  ❌ Connect error:', err.message);
      console.log('     Error data:', err.data || 'none');
      socket.disconnect();
      resolve('error');
    });

    socket.connect();

    setTimeout(() => {
      if (!socket.connected) {
        console.log('  ⏱️  Timeout - no connection');
        socket.disconnect();
        resolve('timeout');
      }
    }, 5000);
  });
}

// Test 3: Connect with auth in query (backwards compatibility)
function testQueryAuth() {
  return new Promise(resolve => {
    console.log('\nTest 3: Auth in query params (legacy style)');

    const socket = io(SERVER_URL, {
      transports: ['polling'],
      query: { token: TEST_TOKEN },
      autoConnect: false,
      timeout: 5000,
    });

    socket.on('connect', () => {
      console.log('  ✅ CONNECTED! Socket ID:', socket.id);
      socket.disconnect();
      resolve('success');
    });

    socket.on('connect_error', err => {
      console.log('  ❌ Connect error:', err.message);
      socket.disconnect();
      resolve('error');
    });

    socket.connect();

    setTimeout(() => {
      if (!socket.connected) {
        console.log('  ⏱️  Timeout - no connection');
        socket.disconnect();
        resolve('timeout');
      }
    }, 5000);
  });
}

// Test 4: Connect WITHOUT any auth (should fail)
function testNoAuth() {
  return new Promise(resolve => {
    console.log('\nTest 4: No auth (should fail with AUTH_REQUIRED)');

    const socket = io(SERVER_URL, {
      transports: ['polling'],
      autoConnect: false,
      timeout: 5000,
    });

    socket.on('connect', () => {
      console.log('  ⚠️  CONNECTED without auth (unexpected!)');
      socket.disconnect();
      resolve('unexpected_success');
    });

    socket.on('connect_error', err => {
      console.log('  ✅ Expected error:', err.message);
      console.log('     Error code:', err.data?.code || 'none');
      socket.disconnect();
      resolve('expected_error');
    });

    socket.connect();

    setTimeout(() => {
      if (!socket.connected) {
        console.log('  ⏱️  Timeout - no connection');
        socket.disconnect();
        resolve('timeout');
      }
    }, 5000);
  });
}

async function runTests() {
  const results = {};

  results.polling = await testPolling();
  results.websocket = await testWebsocket();
  results.queryAuth = await testQueryAuth();
  results.noAuth = await testNoAuth();

  console.log('\n=== Results ===');
  console.log(JSON.stringify(results, null, 2));

  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
