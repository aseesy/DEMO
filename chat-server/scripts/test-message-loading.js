#!/usr/bin/env node
/**
 * Test Message Loading Script
 * 
 * Tests message loading functionality in both development and production
 * 
 * Usage: node scripts/test-message-loading.js [--production]
 */

require('dotenv').config();
const { Pool } = require('pg');
const io = require('socket.io-client');

const isProduction = process.argv.includes('--production');
const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

// Determine SSL requirement
const requiresSSL = DATABASE_URL.includes('railway.app') || 
                    DATABASE_URL.includes('heroku.com') ||
                    DATABASE_URL.includes('amazonaws.com');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
});

const API_URL = isProduction 
  ? 'https://demo-production-6dcd.up.railway.app'
  : 'http://localhost:3000';

async function testDatabaseMessageLoading() {
  console.log('\n📊 Testing Database Message Loading...\n');
  
  try {
    const client = await pool.connect();
    
    // Get total message count
    const totalResult = await client.query('SELECT COUNT(*) as count FROM messages WHERE room_id IS NOT NULL');
    const totalMessages = parseInt(totalResult.rows[0].count, 10);
    console.log(`✅ Total messages in database: ${totalMessages}`);
    
    // Get rooms with messages
    const roomsResult = await client.query(`
      SELECT room_id, COUNT(*) as msg_count 
      FROM messages 
      WHERE room_id IS NOT NULL 
      GROUP BY room_id 
      ORDER BY msg_count DESC 
      LIMIT 5
    `);
    
    console.log(`\n📋 Top ${roomsResult.rows.length} rooms by message count:`);
    roomsResult.rows.forEach((r, i) => {
      console.log(`  ${i + 1}. Room ${r.room_id}: ${r.msg_count} messages`);
    });
    
    // Test getMessageHistory query for first room
    if (roomsResult.rows.length > 0) {
      const testRoomId = roomsResult.rows[0].room_id;
      console.log(`\n🔍 Testing message history query for room: ${testRoomId}`);
      
      const historyQuery = `
        SELECT m.id, m.type, m.user_email, m.text, m.timestamp, m.room_id,
               u.id as user_id, u.email as user_email_from_join
        FROM messages m
        LEFT JOIN users u ON m.user_email IS NOT NULL AND LOWER(m.user_email) = LOWER(u.email)
        WHERE m.room_id = $1
          AND (m.type IS NULL OR m.type != 'system')
          AND m.text NOT LIKE '%joined the chat%'
          AND m.text NOT LIKE '%left the chat%'
        ORDER BY m.timestamp DESC NULLS LAST, m.id DESC
        LIMIT 10
      `;
      
      const historyResult = await client.query(historyQuery, [testRoomId]);
      console.log(`  ✅ Retrieved ${historyResult.rows.length} messages`);
      
      if (historyResult.rows.length > 0) {
        const sample = historyResult.rows[0];
        console.log(`  📝 Sample message:`, {
          id: sample.id,
          user_email: sample.user_email,
          hasUserFromJoin: !!sample.user_id,
          text: sample.text?.substring(0, 50) + '...',
          timestamp: sample.timestamp,
        });
        
        // Check for messages with missing user_email
        const missingEmail = historyResult.rows.filter(m => !m.user_email);
        if (missingEmail.length > 0) {
          console.warn(`  ⚠️  ${missingEmail.length} messages missing user_email`);
        }
        
        // Check for messages with null user_id (user not found)
        const nullUserId = historyResult.rows.filter(m => !m.user_id && m.user_email);
        if (nullUserId.length > 0) {
          console.warn(`  ⚠️  ${nullUserId.length} messages have user_email but no matching user record`);
        }
      }
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

async function testSocketMessageLoading() {
  console.log('\n🔌 Testing Socket Message Loading...\n');
  
  return new Promise((resolve) => {
    console.log(`Connecting to ${API_URL}...`);
    
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });
    
    let messageHistoryReceived = false;
    let joinSuccessReceived = false;
    const timeout = setTimeout(() => {
      if (!messageHistoryReceived) {
        console.error('❌ Timeout waiting for message_history event');
        socket.disconnect();
        resolve(false);
      }
    }, 15000);
    
    socket.on('connect', () => {
      console.log('✅ Socket connected');
      console.log('📤 Sending join event...');
      
      // Use a test email - adjust based on your test users
      socket.emit('join', { 
        email: 'yashir91lora@gmail.com', // Change to a valid test user email
        username: 'yashir91lora@gmail.com'
      });
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      clearTimeout(timeout);
      socket.disconnect();
      resolve(false);
    });
    
    socket.on('join_success', (data) => {
      console.log('✅ Join success:', {
        roomId: data.roomId,
        email: data.email,
      });
      joinSuccessReceived = true;
    });
    
    socket.on('message_history', (data) => {
      console.log('✅ Message history received:', {
        isArray: Array.isArray(data),
        hasMessages: !!data.messages,
        messageCount: Array.isArray(data) ? data.length : data.messages?.length || 0,
        hasMore: data.hasMore,
      });
      
      const messages = Array.isArray(data) ? data : data.messages || [];
      
      if (messages.length > 0) {
        console.log('📝 Sample messages:');
        messages.slice(0, 3).forEach((msg, i) => {
          console.log(`  ${i + 1}. ID: ${msg.id}, Sender: ${msg.sender?.email || msg.user_email || 'MISSING'}, Text: ${msg.text?.substring(0, 30)}...`);
        });
        
        // Check for messages with missing sender
        const missingSender = messages.filter(m => !m.sender);
        if (missingSender.length > 0) {
          console.warn(`  ⚠️  ${missingSender.length} messages missing sender object`);
        }
      } else {
        console.warn('  ⚠️  No messages in history');
      }
      
      messageHistoryReceived = true;
      clearTimeout(timeout);
      socket.disconnect();
      resolve(true);
    });
    
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      clearTimeout(timeout);
      socket.disconnect();
      resolve(false);
    });
  });
}

async function main() {
  console.log(`\n🧪 Message Loading Test (${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'})\n`);
  console.log(`API URL: ${API_URL}\n`);
  
  // Test 1: Database message loading
  const dbTest = await testDatabaseMessageLoading();
  
  // Test 2: Socket message loading
  const socketTest = await testSocketMessageLoading();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Database Test: ${dbTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Socket Test: ${socketTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('='.repeat(60));
  
  await pool.end();
  process.exit(dbTest && socketTest ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

