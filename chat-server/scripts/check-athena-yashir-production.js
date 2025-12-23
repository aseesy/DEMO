#!/usr/bin/env node
/**
 * Check for athena-yashir relationship in production via Railway
 */

const { Pool } = require('pg');
require('dotenv').config();

// Use DATABASE_URL as-is - Railway run should provide the correct URL
// If running locally with Railway shell, the internal URL won't work
// In that case, you need to run this script directly on Railway infrastructure
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
});

async function check() {
  try {
    console.log('\n🔍 Checking production database for athena and yashir...\n');
    
    // Find athena
    const athena = await pool.query(
      "SELECT id, username, email, first_name, display_name FROM users WHERE email = 'athenasees@gmail.com'"
    );
    
    // Find yashir
    const yashir = await pool.query(
      "SELECT id, username, email, first_name, display_name FROM users WHERE email = 'yashir91lora@gmail.com'"
    );
    
    if (athena.rows.length === 0) {
      console.log('❌ athenasees@gmail.com not found in production');
    } else {
      const a = athena.rows[0];
      const name = [a.first_name, a.display_name].filter(Boolean).join(' ') || 'N/A';
      console.log(`✅ Athena found:`);
      console.log(`   ID: ${a.id}`);
      console.log(`   Username: ${a.username}`);
      console.log(`   Email: ${a.email}`);
      console.log(`   Name: ${name}`);
    }
    
    if (yashir.rows.length === 0) {
      console.log('\n❌ yashir91lora@gmail.com not found in production');
    } else {
      const y = yashir.rows[0];
      const name = [y.first_name, y.display_name].filter(Boolean).join(' ') || 'N/A';
      console.log(`\n✅ Yashir found:`);
      console.log(`   ID: ${y.id}`);
      console.log(`   Username: ${y.username}`);
      console.log(`   Email: ${y.email}`);
      console.log(`   Name: ${name}`);
    }
    
    if (athena.rows.length > 0 && yashir.rows.length > 0) {
      const aId = athena.rows[0].id;
      const yId = yashir.rows[0].id;
      
      console.log(`\n🔗 Checking for co-parent room between user IDs ${aId} and ${yId}...`);
      
      const room = await pool.query(
        `SELECT r.id, r.name, r.created_at, 
                array_agg(DISTINCT u.username) as usernames,
                array_agg(DISTINCT u.id) as user_ids
         FROM rooms r
         JOIN room_members rm ON r.id = rm.room_id
         JOIN users u ON rm.user_id = u.id
         WHERE rm.user_id IN ($1, $2)
         GROUP BY r.id, r.name, r.created_at
         HAVING COUNT(DISTINCT rm.user_id) = 2`,
        [aId, yId]
      );
      
      if (room.rows.length === 0) {
        console.log('❌ No co-parent room found between athena and yashir');
        console.log(`   Need to create room for user IDs: ${aId} and ${yId}`);
      } else {
        const r = room.rows[0];
        console.log(`✅ Co-parent room found!`);
        console.log(`   Room ID: ${r.id}`);
        console.log(`   Room Name: ${r.name || 'N/A'}`);
        console.log(`   Created: ${r.created_at}`);
        console.log(`   Members: ${r.usernames.join(' <-> ')}`);
        console.log(`   Member IDs: ${r.user_ids.join(' <-> ')}`);
      }
    } else {
      console.log('\n⚠️  Cannot check relationship - one or both users not found');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await pool.end();
  }
}

check();

