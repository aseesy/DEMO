#!/usr/bin/env node
/**
 * Count total chat rooms in the database
 * Usage: node scripts/count-rooms.js [production|local]
 */

require('dotenv').config();
const { Pool } = require('pg');

const environment = process.argv[2] || 'local';
const isProduction = environment === 'production';

// For production, use DATABASE_URL from environment
// For local, use DATABASE_URL from .env
const DATABASE_URL = isProduction 
  ? process.env.DATABASE_URL 
  : process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error(`❌ DATABASE_URL is not set for ${environment} environment`);
  if (isProduction) {
    console.error('💡 Set DATABASE_URL environment variable for production');
  } else {
    console.error('💡 Set DATABASE_URL in .env file for local');
  }
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function countRooms() {
  try {
    console.log(`\n📊 Chat Rooms Statistics (${environment.toUpperCase()})\n`);

    // Count total rooms
    const totalRooms = await pool.query('SELECT COUNT(*) as count FROM rooms');
    const totalCount = parseInt(totalRooms.rows[0].count, 10);

    // Count rooms with members
    const roomsWithMembers = await pool.query(`
      SELECT COUNT(DISTINCT r.id) as count
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
    `);
    const withMembersCount = parseInt(roomsWithMembers.rows[0].count, 10);

    // Count rooms with messages
    const roomsWithMessages = await pool.query(`
      SELECT COUNT(DISTINCT r.id) as count
      FROM rooms r
      INNER JOIN messages m ON r.id = m.room_id
      WHERE m.type IS NULL OR m.type != 'system'
    `);
    const withMessagesCount = parseInt(roomsWithMessages.rows[0].count, 10);

    // Count single-member rooms
    const singleMemberRooms = await pool.query(`
      SELECT r.id, r.name, COUNT(rm.user_id) as member_count
      FROM rooms r
      LEFT JOIN room_members rm ON r.id = rm.room_id
      GROUP BY r.id, r.name
      HAVING COUNT(rm.user_id) = 1
    `);
    const singleMemberCount = singleMemberRooms.rows.length;

    // Count multi-member rooms
    const multiMemberRooms = await pool.query(`
      SELECT r.id, r.name, COUNT(rm.user_id) as member_count
      FROM rooms r
      LEFT JOIN room_members rm ON r.id = rm.room_id
      GROUP BY r.id, r.name
      HAVING COUNT(rm.user_id) > 1
    `);
    const multiMemberCount = multiMemberRooms.rows.length;

    // Get room details
    const roomDetails = await pool.query(`
      SELECT 
        r.id,
        r.name,
        r.created_at,
        COUNT(DISTINCT rm.user_id) as member_count,
        COUNT(DISTINCT m.id) as message_count
      FROM rooms r
      LEFT JOIN room_members rm ON r.id = rm.room_id
      LEFT JOIN messages m ON r.id = m.room_id AND (m.type IS NULL OR m.type != 'system')
      GROUP BY r.id, r.name, r.created_at
      ORDER BY r.created_at DESC
      LIMIT 50
    `);

    console.log(`Total rooms: ${totalCount}`);
    console.log(`Rooms with members: ${withMembersCount}`);
    console.log(`Rooms with messages: ${withMessagesCount}`);
    console.log(`Single-member rooms: ${singleMemberCount}`);
    console.log(`Multi-member rooms: ${multiMemberCount}`);
    console.log(`Empty rooms: ${totalCount - withMembersCount}`);

    if (singleMemberRooms.rows.length > 0) {
      console.log('\n⚠️  Single-Member Rooms:\n');
      singleMemberRooms.rows.forEach((room, index) => {
        console.log(`  ${index + 1}. ${room.name || room.id} (ID: ${room.id})`);
      });
    }

    if (roomDetails.rows.length > 0) {
      console.log('\n📋 All Rooms:\n');
      roomDetails.rows.forEach((room, index) => {
        const isSingle = parseInt(room.member_count) === 1;
        const marker = isSingle ? '⚠️ ' : '✅ ';
        console.log(
          `${marker}${index + 1}. ${room.name || room.id} | Members: ${room.member_count} | Messages: ${room.message_count} | Created: ${room.created_at}`
        );
      });
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    await pool.end();
    process.exit(1);
  }
}

countRooms();
