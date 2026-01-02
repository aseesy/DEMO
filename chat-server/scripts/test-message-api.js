/**
 * Test Message API Endpoints
 * 
 * Tests the new REST API endpoints for messages
 */

require('dotenv').config();
const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';

// Test configuration
const TEST_CONFIG = {
  // You'll need to provide these for full testing
  authToken: process.env.TEST_AUTH_TOKEN || null,
  roomId: process.env.TEST_ROOM_ID || null,
  messageId: process.env.TEST_MESSAGE_ID || null,
};

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
            parseError: err.message,
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Test health endpoint first
 */
async function testHealth() {
  console.log('\n📋 Testing Health Endpoint...');
  try {
    const response = await makeRequest('GET', '/health');
    if (response.status === 200) {
      console.log('✅ Health check passed');
      console.log('   Status:', response.body.status);
      console.log('   Database:', response.body.database?.status || 'unknown');
      return true;
    } else {
      console.log('❌ Health check failed:', response.status);
      return false;
    }
  } catch (err) {
    console.log('❌ Health check error:', err.message);
    return false;
  }
}

/**
 * Test message endpoints (requires auth)
 */
async function testMessageEndpoints() {
  console.log('\n📋 Testing Message API Endpoints...\n');

  if (!TEST_CONFIG.authToken) {
    console.log('⚠️  No auth token provided - testing without auth (will get 401)');
  }

  if (!TEST_CONFIG.roomId) {
    console.log('⚠️  No room ID provided - some tests will be skipped');
  }

  // Test 1: GET /api/messages/room/:roomId
  if (TEST_CONFIG.roomId) {
    console.log('1. Testing GET /api/messages/room/:roomId');
    try {
      const response = await makeRequest(
        'GET',
        `/api/messages/room/${TEST_CONFIG.roomId}?limit=10&offset=0`,
        null,
        TEST_CONFIG.authToken
      );
      console.log(`   Status: ${response.status}`);
      if (response.status === 200) {
        console.log('   ✅ Success');
        console.log(`   Messages: ${response.body.data?.messages?.length || 0}`);
        console.log(`   Total: ${response.body.data?.total || 0}`);
        console.log(`   HasMore: ${response.body.data?.hasMore || false}`);
      } else if (response.status === 401) {
        console.log('   ⚠️  Unauthorized (expected without valid token)');
      } else {
        console.log('   ❌ Failed:', response.body.error || response.body);
      }
    } catch (err) {
      console.log('   ❌ Error:', err.message);
    }
  } else {
    console.log('1. Skipping GET /api/messages/room/:roomId (no roomId)');
  }

  // Test 2: GET /api/messages/:messageId
  if (TEST_CONFIG.messageId) {
    console.log('\n2. Testing GET /api/messages/:messageId');
    try {
      const response = await makeRequest(
        'GET',
        `/api/messages/${TEST_CONFIG.messageId}`,
        null,
        TEST_CONFIG.authToken
      );
      console.log(`   Status: ${response.status}`);
      if (response.status === 200) {
        console.log('   ✅ Success');
        console.log(`   Message ID: ${response.body.data?.id || 'N/A'}`);
      } else if (response.status === 401) {
        console.log('   ⚠️  Unauthorized (expected without valid token)');
      } else if (response.status === 404) {
        console.log('   ⚠️  Not found (message may not exist)');
      } else {
        console.log('   ❌ Failed:', response.body.error || response.body);
      }
    } catch (err) {
      console.log('   ❌ Error:', err.message);
    }
  } else {
    console.log('\n2. Skipping GET /api/messages/:messageId (no messageId)');
  }

  // Test 3: Test endpoint structure (without auth - should get 401)
  console.log('\n3. Testing endpoint structure (expecting 401 without auth)');
  try {
    const response = await makeRequest('GET', '/api/messages/room/test-room');
    if (response.status === 401) {
      console.log('   ✅ Correctly requires authentication');
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
}

/**
 * Test service layer directly
 */
async function testServiceLayer() {
  console.log('\n📋 Testing MessageService Directly...\n');

  try {
    const MessageService = require('../src/services/messages/messageService');
    const messageService = new MessageService();

    console.log('✅ MessageService instantiated successfully');

    // Test with a sample room ID (will fail if room doesn't exist, but tests the code path)
    if (TEST_CONFIG.roomId) {
      try {
        const result = await messageService.getRoomMessages(TEST_CONFIG.roomId, {
          limit: 5,
          offset: 0,
        }, 'test@example.com');
        console.log('✅ getRoomMessages() works');
        console.log(`   Retrieved ${result.messages?.length || 0} messages`);
      } catch (err) {
        if (err.message.includes('Invalid roomId')) {
          console.log('   ⚠️  Room validation works (room may not exist)');
        } else {
          console.log('   ⚠️  Error (may be expected):', err.message);
        }
      }
    }
  } catch (err) {
    console.log('❌ Error testing service layer:', err.message);
    console.log('   Stack:', err.stack);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Message API Test Suite\n');
  console.log('='.repeat(50));

  // Test 1: Health check
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('\n❌ Server health check failed - stopping tests');
    console.log('   Make sure the server is running: npm run dev');
    process.exit(1);
  }

  // Test 2: Service layer
  await testServiceLayer();

  // Test 3: API endpoints
  await testMessageEndpoints();

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Test suite complete!');
  console.log('\n💡 To test with real data:');
  console.log('   Set TEST_AUTH_TOKEN, TEST_ROOM_ID, TEST_MESSAGE_ID in .env');
  console.log('   Or pass them as environment variables');
}

// Run tests
runTests().catch(err => {
  console.error('❌ Test suite error:', err);
  process.exit(1);
});

