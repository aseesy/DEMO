#!/usr/bin/env node

/**
 * Check if messages are being saved and can be retrieved
 */

require('dotenv').config();
const dbPostgres = require('../dbPostgres');

async function checkMessages() {
  try {
    // Check recent messages
    const result = await dbPostgres.query(
      `SELECT id, username, text, timestamp, room_id 
       FROM messages 
       WHERE username = $1 
       ORDER BY timestamp DESC 
       LIMIT 10`,
      ['mom1']
    );

    console.log('\n📊 Recent messages for mom1:');
    console.log('='.repeat(60));
    
    if (result.rows.length === 0) {
      console.log('❌ No messages found for mom1');
    } else {
      result.rows.forEach((m, i) => {
        console.log(`${i + 1}. ID: ${m.id.substring(0, 30)}...`);
        console.log(`   Text: "${m.text?.substring(0, 50)}${m.text?.length > 50 ? '...' : ''}"`);
        console.log(`   Room: ${m.room_id || 'NULL'}`);
        console.log(`   Time: ${new Date(m.timestamp).toLocaleString()}`);
        console.log('');
      });
    }

    // Check room messages
    if (result.rows.length > 0) {
      const roomId = result.rows[0].room_id;
      if (roomId) {
        console.log(`\n📋 Checking messages for room: ${roomId}`);
        console.log('='.repeat(60));
        
        const roomResult = await dbPostgres.query(
          `SELECT COUNT(*) as total FROM messages WHERE room_id = $1`,
          [roomId]
        );
        
        console.log(`Total messages in room: ${roomResult.rows[0].total}`);
        
        const roomMessages = await dbPostgres.query(
          `SELECT id, username, text, timestamp 
           FROM messages 
           WHERE room_id = $1 
           ORDER BY timestamp DESC 
           LIMIT 5`,
          [roomId]
        );
        
        console.log('\nRecent messages in room:');
        roomMessages.rows.forEach((m, i) => {
          console.log(`${i + 1}. [${m.username}] "${m.text?.substring(0, 40)}..."`);
          console.log(`   Time: ${new Date(m.timestamp).toLocaleString()}`);
        });
      }
    }

    await dbPostgres.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkMessages();

