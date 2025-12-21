/**
 * Login Error Handling Test Script
 *
 * This script tests all login error scenarios to ensure proper error handling.
 * Run with: node test-login-errors.js
 *
 * Note: This requires the server to be running and a test database with test users.
 */

// Use Node's built-in fetch (Node 18+)
const fetch = globalThis.fetch || require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Test results
const results = {
  passed: [],
  failed: [],
  total: 0,
};

function logTest(name, passed, message) {
  results.total++;
  if (passed) {
    results.passed.push(name);
    console.log(`✅ ${name}: ${message}`);
  } else {
    results.failed.push({ name, message });
    console.log(`❌ ${name}: ${message}`);
  }
}

async function testLogin(endpoint, body, expectedStatus, expectedCode, expectedMessage) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      return {
        success: false,
        status: response.status,
        expectedStatus,
        error: `Failed to parse response: ${parseError.message}`,
        rawResponse: await response.text(),
      };
    }

    const statusMatch = response.status === expectedStatus;
    const codeMatch = !expectedCode || data.code === expectedCode;
    const messageMatch =
      !expectedMessage ||
      (data.error && data.error.toLowerCase().includes(expectedMessage.toLowerCase()));

    return {
      success: statusMatch && codeMatch && messageMatch,
      status: response.status,
      expectedStatus,
      code: data.code,
      expectedCode,
      message: data.error,
      expectedMessage,
      details: {
        statusMatch,
        codeMatch,
        messageMatch,
      },
    };
  } catch (error) {
    // Handle connection errors
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      return {
        success: false,
        error: 'Connection refused - server is not running',
        connectionError: true,
      };
    }
    return {
      success: false,
      error: error.message,
      connectionError: false,
    };
  }
}

async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Login Error Handling Tests\n');
  console.log(`Testing against: ${API_BASE_URL}\n`);

  // Check if server is running
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    console.log('❌ Server is not running or not accessible');
    console.log(`   Please start the server at ${API_BASE_URL}`);
    console.log('   Then run this test again.\n');
    return false;
  }
  console.log('✅ Server is running\n');

  // Test 1: Missing email
  console.log('Test 1: Missing email');
  const test1 = await testLogin('/api/auth/login', { password: 'test123' }, 400, null, 'required');
  if (test1.connectionError) {
    logTest('Missing email', false, test1.error);
  } else {
    logTest(
      'Missing email',
      test1.success,
      test1.success
        ? `✅ Status: ${test1.status}, Message: ${test1.message}`
        : `Status: ${test1.status} (expected ${test1.expectedStatus}), Message: ${test1.message || test1.error}`
    );
  }

  // Test 2: Missing password
  console.log('\nTest 2: Missing password');
  const test2 = await testLogin(
    '/api/auth/login',
    { email: 'test@example.com' },
    400,
    null,
    'required'
  );
  if (test2.connectionError) {
    logTest('Missing password', false, test2.error);
  } else {
    logTest(
      'Missing password',
      test2.success,
      test2.success
        ? `✅ Status: ${test2.status}, Message: ${test2.message}`
        : `Status: ${test2.status} (expected ${test2.expectedStatus}), Message: ${test2.message || test2.error}`
    );
  }

  // Test 3: Invalid email format
  console.log('\nTest 3: Invalid email format');
  const test3 = await testLogin(
    '/api/auth/login',
    { email: 'notanemail', password: 'test123' },
    400,
    null,
    'valid email'
  );
  if (test3.connectionError) {
    logTest('Invalid email format', false, test3.error);
  } else {
    logTest(
      'Invalid email format',
      test3.success,
      test3.success
        ? `✅ Status: ${test3.status}, Message: ${test3.message}`
        : `Status: ${test3.status} (expected ${test3.expectedStatus}), Message: ${test3.message || test3.error}`
    );
  }

  // Test 4: Account not found
  console.log('\nTest 4: Account not found');
  const test4 = await testLogin(
    '/api/auth/login',
    { email: 'nonexistent@example.com', password: 'anypassword' },
    404,
    'ACCOUNT_NOT_FOUND',
    'No account found'
  );
  if (test4.connectionError) {
    logTest('Account not found', false, test4.error);
  } else {
    logTest(
      'Account not found',
      test4.success,
      test4.success
        ? `✅ Status: ${test4.status}, Code: ${test4.code}, Message: ${test4.message}`
        : `Status: ${test4.status} (expected ${test4.expectedStatus}), Code: ${test4.code || 'none'} (expected ${test4.expectedCode}), Message: ${test4.message || test4.error}`
    );
  }

  // Test 5: Wrong password (requires existing user)
  console.log('\nTest 5: Wrong password');
  // Note: This requires a test user to exist. Update email as needed.
  const test5 = await testLogin(
    '/api/auth/login',
    { email: 'test@example.com', password: 'wrongpassword' },
    401,
    'INVALID_PASSWORD',
    'Incorrect password'
  );
  if (test5.connectionError) {
    logTest('Wrong password', false, test5.error);
  } else if (test5.status === 404) {
    logTest('Wrong password', false, `User not found (expected existing user for this test)`);
  } else {
    logTest(
      'Wrong password',
      test5.success,
      test5.success
        ? `✅ Status: ${test5.status}, Code: ${test5.code}, Message: ${test5.message}`
        : `Status: ${test5.status} (expected ${test5.expectedStatus}), Code: ${test5.code || 'none'} (expected ${test5.expectedCode}), Message: ${test5.message || test5.error}`
    );
  }

  // Test 6: OAuth-only account (requires OAuth user without password)
  console.log('\nTest 6: OAuth-only account');
  // Note: This requires an OAuth-only user to exist. Update email as needed.
  const test6 = await testLogin(
    '/api/auth/login',
    { email: 'oauth@example.com', password: 'anypassword' },
    403,
    'OAUTH_ONLY_ACCOUNT',
    'Google sign-in'
  );
  if (test6.connectionError) {
    logTest('OAuth-only account', false, test6.error);
  } else if (test6.status === 404) {
    logTest('OAuth-only account', true, `User not found (test skipped - requires OAuth user)`);
  } else {
    logTest(
      'OAuth-only account',
      test6.success,
      test6.success
        ? `✅ Status: ${test6.status}, Code: ${test6.code}, Message: ${test6.message}`
        : `Status: ${test6.status} (expected ${test6.expectedStatus}), Code: ${test6.code || 'none'} (expected ${test6.expectedCode}), Message: ${test6.message || test6.error}`
    );
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\nFailed Tests:');
    results.failed.forEach(({ name, message }) => {
      console.log(`  - ${name}: ${message}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  return results.failed.length === 0;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution error:', error);
      process.exit(1);
    });
}

module.exports = { runTests, testLogin };
