#!/usr/bin/env node

/**
 * End-to-end test for message persistence and duplicate handling
 * 
 * This test simulates:
 * 1. User joining a room
 * 2. Sending a message
 * 3. Verifying message is saved to database
 * 4. Simulating a "refresh" by requesting message_history
 * 5. Verifying message persists
 */

require('dotenv').config();
const { io } = require('socket.io-client');
const dbPostgres = require('../dbPostgres');

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3001';
const TEST_USERNAME = 'mom1';
const TEST_MESSAGE = `Test message ${Date.now()}`;

let socket;
let receivedMessages = [];
let messageHistoryReceived = false;
let testRoomId = null;

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testMessagePersistence() {
  console.log('\n🧪 Starting End-to-End Message Persistence Test\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Connect to server
    console.log('\n📡 Step 1: Connecting to server...');
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: false,
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Connected to server');
        resolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // Step 2: Join room
    console.log('\n👤 Step 2: Joining room...');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('❌ Join timeout - server may not be responding');
        console.error('   Make sure the server is running on', SOCKET_URL);
        reject(new Error('Join timeout'));
      }, 10000); // Increased timeout

      const successHandler = (data) => {
        clearTimeout(timeout);
        testRoomId = data.roomId;
        console.log('✅ Joined room:', testRoomId);
        socket.off('join_success', successHandler);
        socket.off('message_history', historyHandler);
        socket.off('error', errorHandler);
        resolve();
      };
      
      // Also listen for message_history as a sign that join succeeded
      const historyHandler = (data) => {
        if (!testRoomId) {
          // Extract roomId from history if we don't have it yet
          const messages = Array.isArray(data) ? data : data.messages || [];
          console.log('✅ Received message_history (join succeeded):', messages.length, 'messages');
          clearTimeout(timeout);
          socket.off('join_success', successHandler);
          socket.off('message_history', historyHandler);
          socket.off('error', errorHandler);
          resolve();
        }
      };
      
      socket.on('message_history', historyHandler);

      const errorHandler = (err) => {
        clearTimeout(timeout);
        console.error('❌ Join error:', err);
        socket.off('join_success', successHandler);
        socket.off('message_history', historyHandler);
        socket.off('error', errorHandler);
        reject(new Error(err.message || 'Join error'));
      };

      socket.on('join_success', successHandler);
      socket.on('error', errorHandler);

      console.log('   Emitting join event...');
      socket.emit('join', { username: TEST_USERNAME });
    });

    // Step 3: Wait for message history
    console.log('\n📜 Step 3: Waiting for initial message history...');
    await new Promise((resolve) => {
      socket.on('message_history', (data) => {
        const messages = Array.isArray(data) ? data : data.messages || [];
        console.log(`✅ Received ${messages.length} messages in history`);
        messageHistoryReceived = true;
        resolve();
      });
      
      // Timeout after 3 seconds
      setTimeout(() => {
        if (!messageHistoryReceived) {
          console.log('⚠️  No message_history received (might be empty room)');
        }
        resolve();
      }, 3000);
    });

    // Step 4: Send test message
    console.log('\n💬 Step 4: Sending test message...');
    const messageId = `test_${Date.now()}`;
    let serverMessageReceived = false;
    let serverMessageId = null;

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!serverMessageReceived) {
          console.error('❌ Server message not received. This might indicate:');
          console.error('   1. Message is being filtered (private/flagged)');
          console.error('   2. AI mediation is blocking the message');
          console.error('   3. Server error processing the message');
          reject(new Error('Server message not received within 15 seconds'));
        } else {
          resolve();
        }
      }, 15000); // Increased timeout for AI mediation

      socket.on('new_message', (message) => {
        if (message.username === TEST_USERNAME && message.text === TEST_MESSAGE) {
          serverMessageReceived = true;
          serverMessageId = message.id;
          console.log('✅ Server message received:', {
            id: message.id,
            text: message.text?.substring(0, 40),
            roomId: message.roomId || testRoomId,
          });
          clearTimeout(timeout);
          resolve();
        }
      });

      socket.emit('send_message', {
        text: TEST_MESSAGE,
        isPreApprovedRewrite: false,
        originalRewrite: null,
      });
    });

    // Step 5: Wait a bit for message to be saved
    console.log('\n⏳ Step 5: Waiting for message to be saved to database...');
    await wait(2000);

    // Step 6: Verify message in database
    console.log('\n💾 Step 6: Verifying message in database...');
    console.log('   Searching for:', {
      username: TEST_USERNAME,
      text: TEST_MESSAGE,
      roomId: testRoomId,
      serverMessageId: serverMessageId,
    });
    
    // Try multiple queries to find the message
    let dbResult = await dbPostgres.query(
      `SELECT id, username, text, timestamp, room_id, type, private, flagged
       FROM messages 
       WHERE username = $1 
         AND text = $2 
         AND room_id = $3
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [TEST_USERNAME, TEST_MESSAGE, testRoomId]
    );

    // If not found, try by ID
    if (dbResult.rows.length === 0 && serverMessageId) {
      console.log('   Trying to find by server message ID...');
      dbResult = await dbPostgres.query(
        `SELECT id, username, text, timestamp, room_id, type, private, flagged
         FROM messages 
         WHERE id = $1
         LIMIT 1`,
        [serverMessageId]
      );
    }

    // If still not found, check recent messages
    if (dbResult.rows.length === 0) {
      console.log('   Checking recent messages for this user...');
      const recentResult = await dbPostgres.query(
        `SELECT id, username, text, timestamp, room_id, type, private, flagged
         FROM messages 
         WHERE username = $1 
           AND room_id = $2
         ORDER BY timestamp DESC 
         LIMIT 5`,
        [TEST_USERNAME, testRoomId]
      );
      
      console.log(`   Found ${recentResult.rows.length} recent messages:`);
      recentResult.rows.forEach((msg, i) => {
        console.log(`     ${i + 1}. [${msg.type || 'user_message'}] "${msg.text?.substring(0, 40)}..." (private: ${msg.private}, flagged: ${msg.flagged})`);
      });
      
      throw new Error('❌ Message not found in database!');
    }

    const dbMessage = dbResult.rows[0];
    console.log('✅ Message found in database:', {
      id: dbMessage.id,
      text: dbMessage.text?.substring(0, 40),
      roomId: dbMessage.room_id,
      timestamp: new Date(dbMessage.timestamp).toLocaleString(),
    });

    // Step 7: Simulate refresh - disconnect and reconnect
    console.log('\n🔄 Step 7: Simulating refresh (disconnect/reconnect)...');
    socket.disconnect();
    await wait(1000);

    // Reconnect
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: false,
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Reconnection timeout'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Reconnected to server');
        resolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // Step 8: Rejoin and get message history
    console.log('\n📜 Step 8: Rejoining and requesting message history...');
    let refreshMessageFound = false;

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!refreshMessageFound) {
          reject(new Error('Message not found in history after refresh'));
        } else {
          resolve();
        }
      }, 5000);

      socket.on('join_success', (data) => {
        console.log('✅ Rejoined room:', data.roomId);
        if (!testRoomId) testRoomId = data.roomId;
      });

      socket.on('message_history', (data) => {
        const messages = Array.isArray(data) ? data : data.messages || [];
        console.log(`✅ Received ${messages.length} messages in history after refresh`);
        console.log(`   Has more: ${data.hasMore || false}`);

        // Check if our test message is in the history
        const foundMessage = messages.find(
          msg => msg.text === TEST_MESSAGE && msg.username === TEST_USERNAME
        );

        // Also check by ID
        const foundById = messages.find(
          msg => msg.id === serverMessageId
        );

        if (foundMessage || foundById) {
          refreshMessageFound = true;
          const msg = foundMessage || foundById;
          console.log('✅ Test message found in history after refresh:', {
            id: msg.id,
            text: msg.text?.substring(0, 40),
            foundBy: foundMessage ? 'text' : 'id',
          });
          clearTimeout(timeout);
          resolve();
        } else {
          console.log('⚠️  Test message not found in history.');
          console.log(`   Looking for: "${TEST_MESSAGE}" (ID: ${serverMessageId})`);
          console.log('   Recent messages in history:');
          messages.slice(-10).forEach((msg, i) => {
            console.log(`     ${i + 1}. [${msg.username}] "${msg.text?.substring(0, 40)}..." (ID: ${msg.id?.substring(0, 30)}...)`);
          });
          
          // Check if message might be beyond the limit
          if (data.hasMore) {
            console.log('   ⚠️  WARNING: There are more messages (hasMore=true)');
            console.log('      The test message might be beyond the 500 message limit');
          }
        }
      });

      socket.emit('join', { username: TEST_USERNAME });
    });

    // Step 9: Verify no duplicates in database
    console.log('\n🔍 Step 9: Checking for duplicate messages...');
    const duplicateCheck = await dbPostgres.query(
      `SELECT COUNT(*) as count 
       FROM messages 
       WHERE username = $1 
         AND text = $2 
         AND room_id = $3`,
      [TEST_USERNAME, TEST_MESSAGE, testRoomId]
    );

    const duplicateCount = parseInt(duplicateCheck.rows[0].count, 10);
    if (duplicateCount > 1) {
      console.warn(`⚠️  WARNING: Found ${duplicateCount} duplicate messages in database`);
    } else {
      console.log('✅ No duplicates found in database');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test message...');
    await dbPostgres.query(
      `DELETE FROM messages 
       WHERE username = $1 
         AND text = $2 
         AND room_id = $3`,
      [TEST_USERNAME, TEST_MESSAGE, testRoomId]
    );
    console.log('✅ Test message deleted');

    socket.disconnect();
    await dbPostgres.end();

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    console.error(err.stack);
    
    if (socket) {
      socket.disconnect();
    }
    
    // Cleanup on error
    try {
      if (testRoomId) {
        await dbPostgres.query(
          `DELETE FROM messages 
           WHERE username = $1 
             AND text = $2 
             AND room_id = $3`,
          [TEST_USERNAME, TEST_MESSAGE, testRoomId]
        );
      }
      await dbPostgres.end();
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr);
    }
    
    process.exit(1);
  }
}

testMessagePersistence();

