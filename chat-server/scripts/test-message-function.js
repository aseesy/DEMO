#!/usr/bin/env node

/**
 * Test Message Function Directly
 * 
 * Tests the message saving function without requiring the full server.
 * This tests the core message persistence logic.
 */

require('dotenv').config();
const messageStore = require('../messageStore');
const dbPostgres = require('../dbPostgres');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testMessageFunction() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 MESSAGE FUNCTION TEST');
  console.log('='.repeat(60) + '\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Get an existing room or use null (which should work)
  let testRoomId = null;
  try {
    const roomResult = await dbPostgres.query(
      'SELECT room_id FROM messages WHERE room_id IS NOT NULL LIMIT 1'
    );
    if (roomResult.rows.length > 0) {
      testRoomId = roomResult.rows[0].room_id;
      log(colors.cyan, `Using existing room: ${testRoomId}`);
    } else {
      log(colors.yellow, 'No existing rooms found, using null room_id for testing');
    }
  } catch (err) {
    log(colors.yellow, `Could not find existing room: ${err.message}`);
  }

  // Test 1: Test messageStore.saveMessage function
  log(colors.cyan, 'Test 1: Testing messageStore.saveMessage()...');
  try {
    const testMessage = {
      id: `test_msg_${Date.now()}`,
      type: 'user',
      username: 'test_user',
      text: 'Test message from automated test',
      timestamp: new Date().toISOString(),
      roomId: testRoomId, // Use existing room or null
      socketId: 'test_socket_123',
    };

    await messageStore.saveMessage(testMessage);
    log(colors.green, '✅ Message saved successfully');
    testsPassed++;

    // Verify message was saved
    const result = await dbPostgres.query(
      'SELECT * FROM messages WHERE id = $1',
      [testMessage.id]
    );

    if (result.rows.length > 0) {
      const saved = result.rows[0];
      log(colors.green, '✅ Message found in database');
      log(colors.cyan, `   ID: ${saved.id}`);
      log(colors.cyan, `   Text: "${saved.text}"`);
      log(colors.cyan, `   Username: ${saved.username}`);
      log(colors.cyan, `   Room ID: ${saved.room_id}`);
      log(colors.cyan, `   Type: ${saved.type}`);
      testsPassed++;

      // Cleanup
      await dbPostgres.query('DELETE FROM messages WHERE id = $1', [testMessage.id]);
      log(colors.cyan, '✅ Test message cleaned up');
    } else {
      log(colors.red, '❌ Message not found in database after save');
      testsFailed++;
    }
  } catch (err) {
    log(colors.red, `❌ Test 1 failed: ${err.message}`);
    console.error(err);
    testsFailed++;
  }

  // Test 2: Test message validation (should skip private/flagged messages)
  log(colors.cyan, '\nTest 2: Testing message validation (private/flagged)...');
  try {
    const privateMessage = {
      id: `test_private_${Date.now()}`,
      type: 'user',
      username: 'test_user',
      text: 'Private message',
      timestamp: new Date().toISOString(),
      private: true,
      roomId: testRoomId,
    };

    await messageStore.saveMessage(privateMessage);
    
    // Check that private message was NOT saved
    const result = await dbPostgres.query(
      'SELECT * FROM messages WHERE id = $1',
      [privateMessage.id]
    );

    if (result.rows.length === 0) {
      log(colors.green, '✅ Private message correctly skipped (not saved)');
      testsPassed++;
    } else {
      log(colors.red, '❌ Private message was saved (should be skipped)');
      testsFailed++;
      // Cleanup
      await dbPostgres.query('DELETE FROM messages WHERE id = $1', [privateMessage.id]);
    }
  } catch (err) {
    log(colors.red, `❌ Test 2 failed: ${err.message}`);
    testsFailed++;
  }

  // Test 3: Test message with all fields
  log(colors.cyan, '\nTest 3: Testing message with extended fields...');
  try {
    const fullMessage = {
      id: `test_full_${Date.now()}`,
      type: 'user',
      username: 'test_user',
      text: 'Full message test',
      timestamp: new Date().toISOString(),
      roomId: testRoomId,
      socketId: 'test_socket_123',
      private: false,
      flagged: false,
      validation: 'approved',
      tip1: 'Test tip 1',
      tip2: 'Test tip 2',
      reactions: { thumbsUp: 1 },
      user_flagged_by: [],
    };

    await messageStore.saveMessage(fullMessage);
    
    const result = await dbPostgres.query(
      'SELECT * FROM messages WHERE id = $1',
      [fullMessage.id]
    );

    if (result.rows.length > 0) {
      const saved = result.rows[0];
      log(colors.green, '✅ Full message saved with all fields');
      log(colors.cyan, `   Validation: ${saved.validation || 'null'}`);
      log(colors.cyan, `   Tip1: ${saved.tip1 || 'null'}`);
      log(colors.cyan, `   Tip2: ${saved.tip2 || 'null'}`);
      testsPassed++;

      // Cleanup
      await dbPostgres.query('DELETE FROM messages WHERE id = $1', [fullMessage.id]);
    } else {
      log(colors.red, '❌ Full message not saved');
      testsFailed++;
    }
  } catch (err) {
    log(colors.red, `❌ Test 3 failed: ${err.message}`);
    testsFailed++;
  }

  // Test 4: Test message retrieval (simulate message_history)
  log(colors.cyan, '\nTest 4: Testing message retrieval (message_history simulation)...');
  try {
    // Create a few test messages
    const testMessages = [];
    for (let i = 0; i < 3; i++) {
      const msg = {
        id: `test_retrieve_${Date.now()}_${i}`,
        type: 'user',
        username: 'test_user',
        text: `Test message ${i + 1}`,
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
        roomId: testRoomId,
      };
      testMessages.push(msg);
      await messageStore.saveMessage(msg);
    }

    // Retrieve messages
    const query = testRoomId 
      ? 'SELECT * FROM messages WHERE room_id = $1 ORDER BY timestamp ASC'
      : 'SELECT * FROM messages WHERE id = ANY($1) ORDER BY timestamp ASC';
    const params = testRoomId 
      ? [testRoomId]
      : [testMessages.map(m => m.id)];
    
    const result = await dbPostgres.query(query, params);

    const foundMessages = result.rows.filter(m => 
      testMessages.some(tm => tm.id === m.id)
    );

    if (foundMessages.length === testMessages.length) {
      log(colors.green, `✅ Retrieved ${foundMessages.length} messages correctly`);
      testsPassed++;
    } else {
      log(colors.red, `❌ Expected ${testMessages.length} messages, found ${foundMessages.length}`);
      testsFailed++;
    }

    // Cleanup
    for (const msg of testMessages) {
      await dbPostgres.query('DELETE FROM messages WHERE id = $1', [msg.id]);
    }
    log(colors.cyan, '✅ Test messages cleaned up');
  } catch (err) {
    log(colors.red, `❌ Test 4 failed: ${err.message}`);
    testsFailed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  log(colors.green, `✅ Passed: ${testsPassed}`);
  log(colors.red, `❌ Failed: ${testsFailed}`);

  if (testsFailed === 0) {
    console.log(`\n${colors.green}🎉 All message function tests passed!${colors.reset}`);
    console.log(`\n${colors.cyan}The message saving function is working correctly.${colors.reset}`);
  } else {
    console.log(`\n${colors.red}⚠️  Some tests failed. Check the errors above.${colors.reset}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Close database connection
  try {
    await dbPostgres.end();
  } catch (err) {
    // Ignore
  }

  process.exit(testsFailed === 0 ? 0 : 1);
}

if (require.main === module) {
  testMessageFunction().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { testMessageFunction };

