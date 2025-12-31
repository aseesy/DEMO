#!/usr/bin/env node
/**
 * Check Migration Status
 * 
 * Verifies that all migrations have been executed on the database.
 * Useful for diagnosing SQLite-to-PostgreSQL migration issues.
 */

require('dotenv').config();
const dbPostgres = require('../dbPostgres');
const fs = require('fs');
const path = require('path');

async function checkMigrationStatus() {
  console.log('🔍 Checking Migration Status...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  try {
    // Test connection
    await dbPostgres.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Get executed migrations
    let executedMigrations = [];
    try {
      const result = await dbPostgres.query(
        'SELECT filename, executed_at, success FROM migrations ORDER BY executed_at'
      );
      executedMigrations = result.rows;
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️  Migrations table does not exist - no migrations have run yet\n');
      } else {
        throw error;
      }
    }

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📋 Found ${migrationFiles.length} migration files\n`);

    // Compare
    const executedFilenames = executedMigrations.map(m => m.filename);
    const pendingMigrations = migrationFiles.filter(f => !executedFilenames.includes(f));
    const failedMigrations = executedMigrations.filter(m => !m.success);

    console.log(`✅ Executed: ${executedMigrations.length}`);
    console.log(`⏳ Pending: ${pendingMigrations.length}`);
    console.log(`❌ Failed: ${failedMigrations.length}\n`);

    if (pendingMigrations.length > 0) {
      console.log('⚠️  PENDING MIGRATIONS:');
      pendingMigrations.forEach(f => console.log(`   - ${f}`));
      console.log('');
    }

    if (failedMigrations.length > 0) {
      console.log('❌ FAILED MIGRATIONS:');
      failedMigrations.forEach(m => {
        console.log(`   - ${m.filename} (executed: ${m.executed_at})`);
      });
      console.log('');
    }

    // Check for critical schema issues
    console.log('🔍 Checking for schema issues...\n');

    // Check user_context.user_id type
    try {
      const userContextCheck = await dbPostgres.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_context' AND column_name = 'user_id'
      `);
      
      if (userContextCheck.rows.length > 0) {
        const type = userContextCheck.rows[0].data_type;
        if (type === 'text') {
          console.log('⚠️  user_context.user_id is TEXT (should be INTEGER)');
          console.log('   This is a known issue from SQLite migration');
          console.log('   Recommendation: Migrate to INTEGER or use user_email\n');
        } else {
          console.log(`✅ user_context.user_id is ${type.toUpperCase()}\n`);
        }
      } else {
        console.log('ℹ️  user_context table does not exist (may not be used)\n');
      }
    } catch (error) {
      console.log(`⚠️  Could not check user_context: ${error.message}\n`);
    }

    // Check users table ID type
    try {
      const usersCheck = await dbPostgres.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'id'
      `);
      
      if (usersCheck.rows.length > 0) {
        const type = usersCheck.rows[0].data_type;
        console.log(`✅ users.id is ${type.toUpperCase()} (expected: integer)\n`);
      }
    } catch (error) {
      console.log(`⚠️  Could not check users table: ${error.message}\n`);
    }

    // Check pairing_sessions table exists
    try {
      const pairingCheck = await dbPostgres.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'pairing_sessions'
        )
      `);
      
      if (pairingCheck.rows[0].exists) {
        console.log('✅ pairing_sessions table exists\n');
      } else {
        console.log('⚠️  pairing_sessions table does not exist');
        console.log('   Migration 008_pairing_sessions.sql may not have run\n');
      }
    } catch (error) {
      console.log(`⚠️  Could not check pairing_sessions: ${error.message}\n`);
    }

    // Summary
    console.log('📊 Summary:');
    if (pendingMigrations.length === 0 && failedMigrations.length === 0) {
      console.log('✅ All migrations are up to date');
    } else {
      console.log('⚠️  Action required:');
      if (pendingMigrations.length > 0) {
        console.log(`   - Run pending migrations: npm run migrate`);
      }
      if (failedMigrations.length > 0) {
        console.log(`   - Fix failed migrations: Check logs for details`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);
    process.exit(1);
  }
}

checkMigrationStatus();

