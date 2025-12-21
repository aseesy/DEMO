#!/usr/bin/env node
/**
 * Verification script for message persistence
 * Tests if messages are being saved to PostgreSQL with all columns
 */

const { Pool } = require('pg');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:sUFZaVbVBfcmYnrPdSlVAiXhYtopCbvO@autorack.proxy.rlwy.net:45464/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function verifyMessagePersistence() {
  console.log('🔍 Verifying Message Persistence\n');
  console.log('='.repeat(60));

  try {
    // 1. Test connection
    console.log('\n1️⃣  Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');

    // 2. Check if messages table exists
    console.log('\n2️⃣  Checking messages table...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'messages'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Messages table does not exist!');
      return;
    }
    console.log('✅ Messages table exists');

    // 3. Check table schema - verify all columns exist
    console.log('\n3️⃣  Verifying table schema...');
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'messages'
      ORDER BY ordinal_position;
    `);

    const expectedColumns = [
      'id',
      'type',
      'username',
      'text',
      'timestamp',
      'room_id',
      'thread_id',
      'socket_id',
      'private',
      'flagged',
      'validation',
      'tip1',
      'tip2',
      'rewrite',
      'original_message',
      'edited',
      'edited_at',
      'reactions',
      'user_flagged_by',
    ];

    const actualColumns = columnsCheck.rows.map(r => r.column_name);

    console.log('\n📋 Table columns:');
    columnsCheck.rows.forEach(col => {
      const marker = expectedColumns.includes(col.column_name) ? '✓' : '?';
      console.log(`   ${marker} ${col.column_name} (${col.data_type})`);
    });

    const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
    if (missingColumns.length > 0) {
      console.log('\n⚠️  Missing columns (migration 006 may not have run):');
      missingColumns.forEach(col => console.log(`   ❌ ${col}`));
    } else {
      console.log('\n✅ All expected columns present (migration 006 applied)');
    }

    // 4. Check indexes
    console.log('\n4️⃣  Verifying indexes...');
    const indexCheck = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'messages'
      ORDER BY indexname;
    `);

    console.log('\n📋 Indexes:');
    indexCheck.rows.forEach(idx => {
      console.log(`   ✓ ${idx.indexname}`);
    });

    // 5. Check recent messages
    console.log('\n5️⃣  Checking recent messages...');
    const messagesCheck = await pool.query(`
      SELECT
        id,
        username,
        LEFT(text, 50) as text_preview,
        timestamp,
        room_id,
        socket_id,
        private,
        flagged,
        validation IS NOT NULL as has_validation,
        tip1 IS NOT NULL as has_tip1,
        tip2 IS NOT NULL as has_tip2,
        rewrite IS NOT NULL as has_rewrite
      FROM messages
      ORDER BY timestamp DESC
      LIMIT 10;
    `);

    if (messagesCheck.rows.length === 0) {
      console.log('ℹ️  No messages in database yet');
    } else {
      console.log(`\n📨 Found ${messagesCheck.rows.length} recent messages:`);
      messagesCheck.rows.forEach((msg, i) => {
        console.log(`\n   Message ${i + 1}:`);
        console.log(`      ID: ${msg.id}`);
        console.log(`      User: ${msg.username}`);
        console.log(
          `      Text: ${msg.text_preview}${msg.text_preview.length === 50 ? '...' : ''}`
        );
        console.log(`      Room: ${msg.room_id || 'none'}`);
        console.log(`      Time: ${msg.timestamp}`);
        console.log(`      Socket: ${msg.socket_id || 'none'}`);
        console.log(`      Private: ${msg.private === 1 ? 'yes' : 'no'}`);
        console.log(`      Flagged: ${msg.flagged === 1 ? 'yes' : 'no'}`);
        console.log(
          `      AI Data: validation=${msg.has_validation}, tip1=${msg.has_tip1}, tip2=${msg.has_tip2}, rewrite=${msg.has_rewrite}`
        );
      });
    }

    // 6. Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 SUMMARY:');
    console.log(`   ✅ Database: Connected`);
    console.log(
      `   ${missingColumns.length === 0 ? '✅' : '⚠️ '} Schema: ${missingColumns.length === 0 ? 'Complete' : `Missing ${missingColumns.length} columns`}`
    );
    console.log(`   ✅ Indexes: ${indexCheck.rows.length} present`);
    console.log(`   ℹ️  Messages: ${messagesCheck.rows.length} recent`);

    if (missingColumns.length === 0) {
      console.log('\n🎉 Message persistence is properly configured!');
      console.log('   Messages should now persist with full AI intervention data.');
    } else {
      console.log('\n⚠️  Migration 006 needs to run!');
      console.log('   To fix: Restart the Railway service or run migration manually.');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run verification
verifyMessagePersistence()
  .then(() => {
    console.log('\n✅ Verification complete\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Verification failed:', err);
    process.exit(1);
  });
