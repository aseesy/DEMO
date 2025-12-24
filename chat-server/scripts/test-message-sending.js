#!/usr/bin/env node

/**
 * Test Message Sending
 * 
 * This script tests the message sending flow:
 * 1. Connects to server via socket.io
 * 2. Joins a room
 * 3. Sends a message
 * 4. Verifies message is saved to database
 * 5. Verifies message appears in message_history
 */

require('dotenv').config();
const { io: Client } = require('socket.io-client');
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

async function testMessageSending() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 MESSAGE SENDING TEST');
  console.log('='.repeat(60) + '\n');

  const testUsername = 'test_user_' + Date.now();
  const testMessage = 'Test message ' + Date.now();
  let socket;
  let roomId;
  let messageId;
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Step 1: Create test user
    log(colors.cyan, 'Step 1: Creating test user...');
    try {
      await dbPostgres.query(
        `INSERT INTO users (username, email, password_hash, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (username) DO NOTHING`,
        [testUsername.toLowerCase(), `${testUsername}@test.com`, 'test_hash', new Date().toISOString()]
      );
      log(colors.green, `✅ Test user created: ${testUsername}`);
      testsPassed++;
    } catch (err) {
      log(colors.red, `❌ Failed to create test user: ${err.message}`);
      testsFailed++;
      return;
    }

    // Step 2: Connect to server
    log(colors.cyan, '\nStep 2: Connecting to server...');
    socket = Client('http://localhost:3000', {
      transports: ['websocket'],
      auth: { username: testUsername },
    });

    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        log(colors.green, '✅ Connected to server');
        testsPassed++;
        resolve();
      });

      socket.on('connect_error', (err) => {
        log(colors.red, `❌ Connection failed: ${err.message}`);
        testsFailed++;
        reject(err);
      });

      setTimeout(() => {
        if (!socket.connected) {
          log(colors.red, '❌ Connection timeout');
          testsFailed++;
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });

    // Step 3: Join room
    log(colors.cyan, '\nStep 3: Joining room...');
    await new Promise((resolve, reject) => {
      socket.once('join_success', (data) => {
        roomId = data.roomId;
        log(colors.green, `✅ Joined room: ${roomId}`);
        testsPassed++;
        resolve();
      });

      socket.once('error', (error) => {
        log(colors.red, `❌ Join failed: ${error.message || error}`);
        testsFailed++;
        reject(error);
      });

      socket.emit('join', { username: testUsername });

      setTimeout(() => {
        if (!roomId) {
          log(colors.red, '❌ Join timeout');
          testsFailed++;
          reject(new Error('Join timeout'));
        }
      }, 5000);
    });

    // Step 4: Send message
    log(colors.cyan, '\nStep 4: Sending message...');
    await new Promise((resolve, reject) => {
      socket.once('new_message', async (message) => {
        if (message.text === testMessage && message.username === testUsername) {
          messageId = message.id;
          log(colors.green, `✅ Message received: ${messageId}`);
          log(colors.cyan, `   Text: "${message.text}"`);
          log(colors.cyan, `   Room: ${message.roomId || roomId}`);
          testsPassed++;

          // Step 5: Verify message in database
          log(colors.cyan, '\nStep 5: Verifying message in database...');
          try {
            const result = await dbPostgres.query(
              'SELECT * FROM messages WHERE id = $1 AND room_id = $2',
              [messageId, roomId]
            );

            if (result.rows.length > 0) {
              const savedMessage = result.rows[0];
              log(colors.green, '✅ Message found in database');
              log(colors.cyan, `   ID: ${savedMessage.id}`);
              log(colors.cyan, `   Text: "${savedMessage.text}"`);
              log(colors.cyan, `   Username: ${savedMessage.username}`);
              log(colors.cyan, `   Room ID: ${savedMessage.room_id}`);
              log(colors.cyan, `   Timestamp: ${savedMessage.timestamp}`);
              testsPassed++;
            } else {
              log(colors.red, '❌ Message not found in database');
              testsFailed++;
            }
          } catch (err) {
            log(colors.red, `❌ Database query failed: ${err.message}`);
            testsFailed++;
          }

          resolve();
        }
      });

      socket.once('error', (error) => {
        log(colors.red, `❌ Send message error: ${error.message || error}`);
        testsFailed++;
        reject(error);
      });

      socket.emit('send_message', { text: testMessage });

      setTimeout(() => {
        if (!messageId) {
          log(colors.red, '❌ Message send timeout');
          testsFailed++;
          reject(new Error('Message send timeout'));
        }
      }, 5000);
    });

    // Step 6: Test message_history (simulate refresh)
    log(colors.cyan, '\nStep 6: Testing message_history (simulate refresh)...');
    await new Promise((resolve, reject) => {
      socket.once('message_history', (data) => {
        const messages = Array.isArray(data) ? data : data.messages || [];
        const foundMessage = messages.find(
          (msg) => msg.id === messageId || msg.text === testMessage
        );

        if (foundMessage) {
          log(colors.green, '✅ Message found in message_history');
          log(colors.cyan, `   Found ${messages.length} total messages`);
          testsPassed++;
        } else {
          log(colors.red, '❌ Message not found in message_history');
          log(colors.yellow, `   Total messages: ${messages.length}`);
          testsFailed++;
        }
        resolve();
      });

      // Trigger message_history by re-joining
      socket.emit('join', { username: testUsername });

      setTimeout(() => {
        reject(new Error('message_history timeout'));
      }, 5000);
    });

    // Cleanup
    log(colors.cyan, '\nCleaning up...');
    try {
      await dbPostgres.query('DELETE FROM messages WHERE id = $1', [messageId]);
      await dbPostgres.query('DELETE FROM users WHERE username = $1', [testUsername.toLowerCase()]);
      log(colors.green, '✅ Cleanup complete');
    } catch (err) {
      log(colors.yellow, `⚠️  Cleanup warning: ${err.message}`);
    }

  } catch (err) {
    log(colors.red, `\n❌ Test failed: ${err.message}`);
    testsFailed++;
  } finally {
    if (socket) {
      socket.disconnect();
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  log(colors.green, `✅ Passed: ${testsPassed}`);
  log(colors.red, `❌ Failed: ${testsFailed}`);

  if (testsFailed === 0) {
    console.log(`\n${colors.green}🎉 All tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}⚠️  Some tests failed.${colors.reset}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  process.exit(testsFailed === 0 ? 0 : 1);
}

if (require.main === module) {
  testMessageSending().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { testMessageSending };

