#!/usr/bin/env node
/**
 * Delete rooms with only a single member
 * Usage: node scripts/delete-single-member-rooms.js [--dry-run] [--production]
 */

require('dotenv').config();
const { Pool } = require('pg');
const readline = require('readline');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isProduction = args.includes('--production');
const skipPrompt = args.includes('--yes');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function deleteSingleMemberRooms() {
  try {
    console.log(`\n${isDryRun ? '🔍 DRY RUN: ' : ''}Deleting Single-Member Rooms\n`);
    console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'LOCAL'}\n`);

    // Find single-member rooms
    const singleMemberRooms = await pool.query(`
      SELECT 
        r.id,
        r.name,
        r.created_at,
        COUNT(DISTINCT rm.user_id) as member_count,
        COUNT(DISTINCT m.id) as message_count,
        STRING_AGG(DISTINCT u.email, ', ') as member_emails
      FROM rooms r
      LEFT JOIN room_members rm ON r.id = rm.room_id
      LEFT JOIN users u ON rm.user_id = u.id
      LEFT JOIN messages m ON r.id = m.room_id AND (m.type IS NULL OR m.type != 'system')
      GROUP BY r.id, r.name, r.created_at
      HAVING COUNT(DISTINCT rm.user_id) = 1
      ORDER BY r.created_at DESC
    `);

    if (singleMemberRooms.rows.length === 0) {
      console.log('✅ No single-member rooms found.');
      await pool.end();
      rl.close();
      return;
    }

    console.log(`Found ${singleMemberRooms.rows.length} single-member room(s):\n`);
    singleMemberRooms.rows.forEach((room, index) => {
      console.log(
        `${index + 1}. ${room.name || room.id} (ID: ${room.id}) | Member: ${room.member_emails || 'unknown'} | Messages: ${room.message_count} | Created: ${room.created_at}`
      );
    });

    if (isDryRun) {
      console.log('\n🔍 DRY RUN: Would delete these rooms (no changes made)');
      await pool.end();
      rl.close();
      return;
    }

    if (skipPrompt) {
      console.log('\n⚠️  Proceeding with deletion (--yes flag provided)...\n');
    } else if (isProduction) {
      const answer = await question(
        '\n⚠️  WARNING: This will DELETE rooms in PRODUCTION. Type "DELETE" to confirm: '
      );
      if (answer !== 'DELETE') {
        console.log('❌ Deletion cancelled.');
        await pool.end();
        rl.close();
        return;
      }
    } else {
      const answer = await question('\n⚠️  Delete these rooms? (yes/no): ');
      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Deletion cancelled.');
        await pool.end();
        rl.close();
        return;
      }
    }

    console.log('\n🗑️  Deleting rooms...\n');

    let deletedCount = 0;
    let errorCount = 0;

    for (const room of singleMemberRooms.rows) {
      try {
        // Delete in order: messages, room_members, then room
        await pool.query('BEGIN');

        // Delete messages
        await pool.query('DELETE FROM messages WHERE room_id = $1', [room.id]);

        // Delete room members
        await pool.query('DELETE FROM room_members WHERE room_id = $1', [room.id]);

        // Delete room
        await pool.query('DELETE FROM rooms WHERE id = $1', [room.id]);

        await pool.query('COMMIT');
        deletedCount++;
        console.log(`✅ Deleted: ${room.name || room.id} (ID: ${room.id})`);
      } catch (error) {
        await pool.query('ROLLBACK');
        errorCount++;
        console.error(`❌ Error deleting ${room.name || room.id}: ${error.message}`);
      }
    }

    console.log(`\n✅ Deletion complete: ${deletedCount} deleted, ${errorCount} errors`);

    await pool.end();
    rl.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    await pool.end();
    rl.close();
    process.exit(1);
  }
}

deleteSingleMemberRooms();

