#!/usr/bin/env node
/**
 * Find rooms by user emails or names
 * Usage: node scripts/find-room-by-users.js <email1> <email2> [production|local]
 */

require('dotenv').config();
const { Pool } = require('pg');

const args = process.argv.slice(2);
const isProduction = args.includes('--production') || args.includes('production');
const environment = isProduction ? 'production' : 'local';

// Get user emails from args (excluding environment flags)
const userEmails = args
  .filter(arg => !arg.startsWith('--') && arg !== 'production' && arg !== 'local')
  .map(email => email.toLowerCase());

if (userEmails.length === 0) {
  console.error('❌ Please provide at least one user email');
  console.error('Usage: node scripts/find-room-by-users.js <email1> [email2] [production|local]');
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error(`❌ DATABASE_URL is not set for ${environment} environment`);
  process.exit(1);
}

// Determine SSL requirement from DATABASE_URL (Railway/Heroku use SSL)
const requiresSSL = DATABASE_URL.includes('railway.app') || 
                    DATABASE_URL.includes('heroku.com') ||
                    DATABASE_URL.includes('amazonaws.com');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
});

async function findRooms() {
  try {
    console.log(`\n🔍 Searching for rooms with users: ${userEmails.join(', ')} (${environment.toUpperCase()})\n`);

    // First, check user_pairing_status VIEW to find rooms via pairings
    const placeholders = userEmails.map((_, i) => `$${i + 1}`).join(', ');
    
    // Method 1: Use user_pairing_status VIEW (preferred - uses pairing system)
    const pairingQuery = `
      SELECT DISTINCT
        ups.shared_room_id as room_id,
        r.name as room_name,
        r.created_at,
        ups.status as pairing_status,
        ups.user_role,
        u1.email as user1_email,
        u2.email as user2_email,
        COUNT(DISTINCT m.id) as message_count
      FROM user_pairing_status ups
      INNER JOIN users u1 ON ups.user_id = u1.id
      LEFT JOIN users u2 ON ups.partner_id = u2.id
      LEFT JOIN rooms r ON ups.shared_room_id = r.id
      LEFT JOIN messages m ON ups.shared_room_id = m.room_id AND (m.type IS NULL OR m.type != 'system')
      WHERE LOWER(u1.email) IN (${placeholders})
        AND ups.shared_room_id IS NOT NULL
        AND ups.status = 'active'
      GROUP BY ups.shared_room_id, r.name, r.created_at, ups.status, ups.user_role, u1.email, u2.email
      HAVING COUNT(DISTINCT CASE 
        WHEN LOWER(u1.email) IN (${placeholders}) OR LOWER(u2.email) IN (${placeholders}) 
        THEN COALESCE(u1.email, u2.email) 
      END) >= $${userEmails.length + 1}
      ORDER BY r.created_at DESC
    `;

    const pairingParams = [...userEmails, userEmails.length];
    const pairingResult = await pool.query(pairingQuery, pairingParams);

    // Method 2: Fallback to direct room_members lookup (for non-paired rooms)
    const directQuery = `
      SELECT 
        r.id,
        r.name,
        r.created_at,
        COUNT(DISTINCT rm.user_id) as total_members,
        STRING_AGG(DISTINCT u.email, ', ') as member_emails,
        STRING_AGG(DISTINCT u.first_name || ' ' || COALESCE(u.last_name, ''), ', ') as member_names,
        COUNT(DISTINCT m.id) as message_count
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
      INNER JOIN users u ON rm.user_id = u.id
      LEFT JOIN messages m ON r.id = m.room_id AND (m.type IS NULL OR m.type != 'system')
      WHERE LOWER(u.email) IN (${placeholders})
        AND r.id NOT IN (
          SELECT DISTINCT shared_room_id 
          FROM user_pairing_status 
          WHERE shared_room_id IS NOT NULL
        )
      GROUP BY r.id, r.name, r.created_at
      HAVING COUNT(DISTINCT CASE WHEN LOWER(u.email) IN (${placeholders}) THEN u.email END) = $${userEmails.length + 1}
      ORDER BY r.created_at DESC
    `;

    const directParams = [...userEmails, userEmails.length];
    const directResult = await pool.query(directQuery, directParams);
    
    // Combine results
    const result = {
      rows: [
        ...pairingResult.rows.map(row => ({
          id: row.room_id,
          name: row.room_name,
          created_at: row.created_at,
          total_members: 2, // Pairings are always 2 users
          member_emails: [row.user1_email, row.user2_email].filter(Boolean).join(', '),
          member_names: null,
          message_count: row.message_count,
          source: 'pairing',
          pairing_status: row.pairing_status,
        })),
        ...directResult.rows.map(row => ({
          ...row,
          source: 'direct',
        })),
      ],
    };

    if (result.rows.length === 0) {
      console.log('❌ No rooms found with all specified users as members.\n');
      
      // Check if any of the users exist and their pairing status
      const userCheckQuery = `
        SELECT 
          u.email, 
          u.first_name, 
          u.last_name,
          u.id,
          ups.status as pairing_status,
          ups.shared_room_id,
          ups.partner_id
        FROM users u
        LEFT JOIN user_pairing_status ups ON u.id = ups.user_id
        WHERE LOWER(u.email) IN (${placeholders})
      `;
      const userCheck = await pool.query(userCheckQuery, userEmails);
      
      if (userCheck.rows.length === 0) {
        console.log('⚠️  None of the specified users exist in the database.');
      } else {
        console.log('✅ Found users:');
        userCheck.rows.forEach(user => {
          console.log(`   - ${user.email} (${user.first_name || ''} ${user.last_name || ''}) ID: ${user.id}`);
          if (user.pairing_status) {
            console.log(`     Pairing status: ${user.pairing_status}`);
            console.log(`     Shared room: ${user.shared_room_id || 'none'}`);
          } else {
            console.log(`     Pairing status: not paired`);
          }
        });
        
        // Check for rooms via pairing_status
        const pairingCheckQuery = `
          SELECT DISTINCT
            ups.shared_room_id,
            r.name,
            ups.status,
            u1.email as user1,
            u2.email as user2
          FROM user_pairing_status ups
          LEFT JOIN users u1 ON ups.user_id = u1.id
          LEFT JOIN users u2 ON ups.partner_id = u2.id
          LEFT JOIN rooms r ON ups.shared_room_id = r.id
          WHERE (LOWER(u1.email) IN (${placeholders}) OR LOWER(u2.email) IN (${placeholders}))
            AND ups.shared_room_id IS NOT NULL
        `;
        const pairingCheck = await pool.query(pairingCheckQuery, userEmails);
        
        if (pairingCheck.rows.length > 0) {
          console.log(`\n📋 Rooms found via pairing_status (${pairingCheck.rows.length}):\n`);
          pairingCheck.rows.forEach((room, index) => {
            console.log(
              `${index + 1}. ${room.name || room.shared_room_id} | Status: ${room.status} | Users: ${room.user1}, ${room.user2}`
            );
          });
        }
        
        // Find rooms where at least one of the users is a member (direct lookup)
        const partialQuery = `
          SELECT DISTINCT
            r.id,
            r.name,
            r.created_at,
            COUNT(DISTINCT rm.user_id) as total_members,
            STRING_AGG(DISTINCT u.email, ', ') as member_emails
          FROM rooms r
          INNER JOIN room_members rm ON r.id = rm.room_id
          INNER JOIN users u ON rm.user_id = u.id
          WHERE LOWER(u.email) IN (${placeholders})
          GROUP BY r.id, r.name, r.created_at
          ORDER BY r.created_at DESC
        `;
        const partialResult = await pool.query(partialQuery, userEmails);
        
        if (partialResult.rows.length > 0) {
          console.log(`\n📋 Rooms where at least one user is a member (direct lookup) (${partialResult.rows.length}):\n`);
          partialResult.rows.forEach((room, index) => {
            console.log(
              `${index + 1}. ${room.name || room.id} | Members: ${room.total_members} | Emails: ${room.member_emails} | Created: ${room.created_at}`
            );
          });
        }
      }
    } else {
      console.log(`✅ Found ${result.rows.length} room(s) with all specified users:\n`);
      result.rows.forEach((room, index) => {
        console.log(`${index + 1}. ${room.name || room.id}`);
        console.log(`   ID: ${room.id}`);
        console.log(`   Source: ${room.source} (${room.source === 'pairing' ? 'via user_pairing_status' : 'via room_members'})`);
        if (room.pairing_status) {
          console.log(`   Pairing status: ${room.pairing_status}`);
        }
        console.log(`   Members: ${room.total_members}`);
        console.log(`   Member emails: ${room.member_emails}`);
        console.log(`   Member names: ${room.member_names || 'N/A'}`);
        console.log(`   Messages: ${room.message_count}`);
        console.log(`   Created: ${room.created_at}`);
        console.log('');
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

findRooms();

