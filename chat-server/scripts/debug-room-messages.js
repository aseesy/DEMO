#!/usr/bin/env node

/**
 * Debug script to check if messages are saved with the correct roomId
 * and if they can be retrieved with the same roomId
 */

require('dotenv').config();
const dbPostgres = require('../dbPostgres');

async function debugRoomMessages() {
  try {
    const username = 'mom1';
    
    // Get user's room
    const userResult = await dbPostgres.query(
      `SELECT id FROM users WHERE username = $1`,
      [username]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    const userId = userResult.rows[0].id;
    console.log(`\n👤 User: ${username} (ID: ${userId})`);
    
    // Check room memberships
    let expectedRoomId = null;
    const roomResult = await dbPostgres.query(
      `SELECT room_id FROM room_members WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    
    if (roomResult.rows.length > 0) {
      expectedRoomId = roomResult.rows[0].room_id;
      console.log(`\n🏠 Room membership found - Expected roomId: ${expectedRoomId}`);
    } else {
      console.log(`\n⚠️  No room membership found for user`);
    }
    
    if (expectedRoomId) {
      // Check messages in this room
      const messagesResult = await dbPostgres.query(
        `SELECT id, username, text, timestamp, room_id 
         FROM messages 
         WHERE room_id = $1 
         ORDER BY timestamp DESC 
         LIMIT 10`,
        [expectedRoomId]
      );
      
      console.log(`\n📨 Messages in room ${expectedRoomId}:`);
      console.log(`   Total found: ${messagesResult.rows.length}`);
      
      if (messagesResult.rows.length > 0) {
        messagesResult.rows.forEach((m, i) => {
          console.log(`   ${i + 1}. [${m.username}] "${m.text?.substring(0, 40)}..."`);
          console.log(`      Time: ${new Date(m.timestamp).toLocaleString()}`);
          console.log(`      Room: ${m.room_id}`);
        });
      } else {
        console.log('   ⚠️  No messages found in this room!');
      }
      
      // Check if there are messages with different roomIds
      const otherRoomsResult = await dbPostgres.query(
        `SELECT DISTINCT room_id, COUNT(*) as count 
         FROM messages 
         WHERE username = $1 
         GROUP BY room_id 
         ORDER BY count DESC`,
        [username]
      );
      
      if (otherRoomsResult.rows.length > 1) {
        console.log(`\n⚠️  WARNING: Messages found in multiple rooms:`);
        otherRoomsResult.rows.forEach(r => {
          console.log(`   - Room ${r.room_id}: ${r.count} messages`);
        });
      }
    }
    
    // Check all recent messages for this user regardless of room
    const allMessagesResult = await dbPostgres.query(
      `SELECT id, username, text, timestamp, room_id 
       FROM messages 
       WHERE username = $1 
       ORDER BY timestamp DESC 
       LIMIT 5`,
      [username]
    );
    
    console.log(`\n📋 Most recent messages for ${username} (all rooms):`);
    allMessagesResult.rows.forEach((m, i) => {
      const match = m.room_id === expectedRoomId ? '✅' : '❌';
      console.log(`   ${match} ${i + 1}. Room: ${m.room_id} | "${m.text?.substring(0, 40)}..."`);
    });
    
    await dbPostgres.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

debugRoomMessages();

