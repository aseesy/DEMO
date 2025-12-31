#!/usr/bin/env node
/**
 * Debug script to check message structure in production
 * This helps diagnose why message ownership checks are failing
 */

require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

// Determine if SSL is required (Railway, Heroku, AWS RDS)
const requiresSSL = DATABASE_URL.includes('railway.app') || 
                    DATABASE_URL.includes('heroku.com') ||
                    DATABASE_URL.includes('amazonaws.com') ||
                    DATABASE_URL.includes('rds.amazonaws.com');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
});

async function debugMessageStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking message structure for Yashir/Athena room...\n');
    
    // Find room with both users
    const roomQuery = `
      SELECT DISTINCT r.id, r.name, COUNT(DISTINCT rm.user_id) as member_count
      FROM rooms r
      JOIN room_members rm ON r.id = rm.room_id
      JOIN users u ON rm.user_id = u.id
      WHERE LOWER(u.email) IN ('yashir91lora@gmail.com', 'athenasees@gmail.com')
      GROUP BY r.id, r.name
      HAVING COUNT(DISTINCT rm.user_id) = 2
      LIMIT 1
    `;
    
    const roomResult = await client.query(roomQuery);
    
    if (roomResult.rows.length === 0) {
      console.log('❌ No room found with both Yashir and Athena');
      return;
    }
    
    const roomId = roomResult.rows[0].id;
    console.log(`✅ Found room: ${roomId}\n`);
    
    // Get sample messages with their structure
    const messageQuery = `
      SELECT 
        m.id,
        m.user_email,
        m.text,
        m.timestamp,
        u.id as user_id,
        u.email as user_email_from_join,
        u.first_name,
        u.last_name
      FROM messages m
      LEFT JOIN users u ON m.user_email IS NOT NULL AND LOWER(m.user_email) = LOWER(u.email)
      WHERE m.room_id = $1
        AND (m.type IS NULL OR m.type != 'system')
        AND m.text NOT LIKE '%joined the chat%'
        AND m.text NOT LIKE '%left the chat%'
      ORDER BY m.timestamp DESC
      LIMIT 10
    `;
    
    const messagesResult = await client.query(messageQuery, [roomId]);
    
    console.log(`📨 Sample messages (${messagesResult.rows.length}):\n`);
    
    messagesResult.rows.forEach((msg, idx) => {
      console.log(`Message ${idx + 1}:`);
      console.log(`  ID: ${msg.id}`);
      console.log(`  Text: ${msg.text?.substring(0, 50)}...`);
      console.log(`  user_email (from messages table): ${msg.user_email}`);
      console.log(`  user_id (from JOIN): ${msg.user_id || 'NULL'}`);
      console.log(`  user_email_from_join: ${msg.user_email_from_join || 'NULL'}`);
      console.log(`  first_name: ${msg.first_name || 'NULL'}`);
      console.log(`  last_name: ${msg.last_name || 'NULL'}`);
      console.log(`  Expected sender.email: ${msg.user_email || msg.user_email_from_join || 'MISSING'}`);
      console.log('');
    });
    
    // Check what buildUserObject would return
    console.log('🔧 Simulating buildUserObject output:\n');
    
    const { buildUserObject } = require('../socketHandlers/utils');
    
    messagesResult.rows.forEach((msg, idx) => {
      const senderData = {
        id: msg.user_id || null,
        email: msg.user_email || null,
        first_name: msg.first_name || null,
        last_name: msg.last_name || null,
      };
      
      const sender = buildUserObject(senderData);
      
      console.log(`Message ${idx + 1} sender object:`);
      console.log(`  Input:`, senderData);
      console.log(`  Output:`, sender);
      console.log(`  sender.email: ${sender?.email || 'NULL'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugMessageStructure().catch(console.error);

