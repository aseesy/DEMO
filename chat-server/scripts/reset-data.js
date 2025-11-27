#!/usr/bin/env node
/**
 * Safe Data Reset Script
 * 
 * Deletes ONLY user-generated data (conversations, messages, preferences).
 * Keeps schema + system tables intact.
 * 
 * Usage: npm run reset:data
 * 
 * WARNING: This will delete all user data. Use only in development!
 */

const readline = require('readline');
const db = require('../dbPostgres');

// Tables that contain user data (will be cleared)
const USER_DATA_TABLES = [
  'messages',
  'user_context',
  'invitations',
  'notifications',
  // Note: 'users' table is NOT included - you may want to keep test users
];

// Tables that should NEVER be touched (system tables)
const SYSTEM_TABLES = [
  'schema_migrations', // If you use migrations
];

async function confirmReset() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('⚠️  This will DELETE ALL USER DATA. Are you sure? (type "yes" to confirm): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function resetData() {
  console.log('🔄 Safe Data Reset Script\n');
  console.log('This will delete data from:');
  USER_DATA_TABLES.forEach(table => console.log(`   - ${table}`));
  console.log('\nSystem tables will be preserved.\n');

  // Safety check
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: Cannot reset data in production environment!');
    process.exit(1);
  }

  const confirmed = await confirmReset();
  if (!confirmed) {
    console.log('❌ Reset cancelled.');
    process.exit(0);
  }

  try {
    // Test connection
    await db.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Disable foreign key checks temporarily (PostgreSQL doesn't need this, but good practice)
    console.log('🗑️  Deleting user data...\n');

    for (const table of USER_DATA_TABLES) {
      try {
        // Check if table exists
        const tableCheck = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table]);

        if (!tableCheck.rows[0].exists) {
          console.log(`⚠️  Table ${table} does not exist, skipping...`);
          continue;
        }

        // Get row count before deletion
        const countResult = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(countResult.rows[0].count);

        // Delete all rows
        await db.query(`DELETE FROM ${table}`);
        console.log(`✅ Deleted ${count} rows from ${table}`);
      } catch (error) {
        console.error(`❌ Error deleting from ${table}:`, error.message);
        // Continue with other tables
      }
    }

    console.log('\n✅ Data reset complete!');
    console.log('💡 Schema and system tables are intact.');
    console.log('💡 You may want to run: npm run seed');

  } catch (error) {
    console.error('❌ Reset error:', error.message);
    console.error('\n💡 Check your DATABASE_URL environment variable');
    process.exit(1);
  } finally {
    // Close database connection
    if (db.end) {
      await db.end();
    }
  }
}

// Run reset
resetData();

