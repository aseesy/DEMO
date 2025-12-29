#!/usr/bin/env node
/**
 * Investigate Athena/Yashir message issue
 */

require('dotenv').config();
const { Pool } = require('pg');

const requiresSSL = process.env.DATABASE_URL.includes('railway.app') || 
                    process.env.DATABASE_URL.includes('heroku.com') ||
                    process.env.DATABASE_URL.includes('amazonaws.com');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
});

async function investigate() {
  try {
    console.log('\n🔍 Investigating Athena/Yashir message issue...\n');
    
    // Find yashir's user record
    const yashirUser = await pool.query(`
      SELECT id, email, first_name, last_name
      FROM users
      WHERE LOWER(email) LIKE '%yashir%'
    `);
    
    console.log('👤 Yashir user:', yashirUser.rows.length > 0 ? yashirUser.rows[0] : 'NOT FOUND');
    
    // Find all messages with yashir or athena in user_email
    const allMessages = await pool.query(`
      SELECT 
        m.id,
        m.user_email,
        m.room_id,
        m.text,
        m.timestamp,
        r.name as room_name,
        u.id as user_id,
        u.email as user_table_email
      FROM messages m
      LEFT JOIN rooms r ON m.room_id = r.id
      LEFT JOIN users u ON m.user_email IS NOT NULL AND LOWER(TRIM(m.user_email)) = LOWER(TRIM(u.email))
      WHERE (LOWER(m.user_email) LIKE '%yashir%' OR LOWER(m.user_email) LIKE '%athena%')
        AND (m.type IS NULL OR m.type != 'system')
        AND m.text NOT LIKE '%joined the chat%'
        AND m.text NOT LIKE '%left the chat%'
      ORDER BY m.timestamp DESC
      LIMIT 100
    `);
    
    console.log(`\n📧 Messages with yashir/athena in user_email: ${allMessages.rows.length}\n`);
    
    if (allMessages.rows.length > 0) {
      // Group by room
      const byRoom = {};
      for (const msg of allMessages.rows) {
        const roomKey = msg.room_id || 'NULL';
        if (!byRoom[roomKey]) {
          byRoom[roomKey] = {
            room_id: msg.room_id,
            room_name: msg.room_name,
            messages: []
          };
        }
        byRoom[roomKey].messages.push(msg);
      }
      
      for (const [roomKey, data] of Object.entries(byRoom)) {
        console.log(`\n🏠 Room: ${data.room_name || data.room_id || 'NULL'}`);
        
        // Count by user_email
        const byEmail = {};
        for (const msg of data.messages) {
          const email = msg.user_email || 'NULL';
          if (!byEmail[email]) {
            byEmail[email] = {
              count: 0,
              has_user: false,
              user_id: null
            };
          }
          byEmail[email].count++;
          if (msg.user_id) {
            byEmail[email].has_user = true;
            byEmail[email].user_id = msg.user_id;
          }
        }
        
        console.log('  Message counts by user_email:');
        for (const [email, stats] of Object.entries(byEmail)) {
          const status = stats.has_user ? '✅' : '❌';
          console.log(`    ${status} ${email}: ${stats.count} messages (User ID: ${stats.user_id || 'NULL'})`);
        }
        
        // Check room members
        if (data.room_id) {
          const members = await pool.query(`
            SELECT rm.user_id, u.email, u.first_name, u.last_name
            FROM room_members rm
            JOIN users u ON rm.user_id = u.id
            WHERE rm.room_id = $1
          `, [data.room_id]);
          
          console.log(`\n  👥 Room members: ${members.rows.length}`);
          for (const m of members.rows) {
            console.log(`     - ${m.email} (ID: ${m.user_id}, Name: ${m.first_name || ''} ${m.last_name || ''})`);
          }
        }
      }
      
      // Show sample messages
      console.log('\n📋 Sample messages (last 10):');
      for (let idx = 0; idx < Math.min(10, allMessages.rows.length); idx++) {
        const msg = allMessages.rows[idx];
        const hasUser = msg.user_id ? '✅' : '❌';
        const isYashir = msg.user_email && msg.user_email.toLowerCase().includes('yashir');
        const isAthena = msg.user_email && msg.user_email.toLowerCase().includes('athena');
        console.log(`\n  ${idx + 1}. [${hasUser}] From: ${msg.user_email || 'NULL'}`);
        console.log(`      Room: ${msg.room_name || msg.room_id || 'NULL'}`);
        console.log(`      User ID: ${msg.user_id || 'NULL'} | User table: ${msg.user_table_email || 'NULL'}`);
        console.log(`      Text: ${msg.text.substring(0, 80)}...`);
        console.log(`      Time: ${msg.timestamp}`);
        console.log(`      Is Yashir: ${isYashir ? 'YES' : 'NO'} | Is Athena: ${isAthena ? 'YES' : 'NO'}`);
      }
    } else {
      console.log('❌ No messages found with yashir/athena in user_email');
      
      // Check if there are ANY messages
      const totalMessages = await pool.query(`SELECT COUNT(*) as count FROM messages WHERE (type IS NULL OR type != 'system')`);
      console.log(`\n📊 Total non-system messages in database: ${totalMessages.rows[0].count}`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
}

investigate();

