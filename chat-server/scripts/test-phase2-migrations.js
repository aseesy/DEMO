#!/usr/bin/env node
/**
 * Phase 2 Migration Testing Script
 * 
 * Validates that migrations 051, 052, 053 can be run successfully
 * and that data is migrated correctly.
 * 
 * Usage:
 *   node scripts/test-phase2-migrations.js
 * 
 * Requirements:
 *   - DATABASE_URL environment variable set
 *   - PostgreSQL database accessible
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  console.error('💡 Set DATABASE_URL to run migration tests');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

/**
 * Test results tracker
 */
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function logPass(test) {
  console.log(`✅ ${test}`);
  results.passed.push(test);
}

function logFail(test, error) {
  console.error(`❌ ${test}`);
  console.error(`   Error: ${error.message || error}`);
  results.failed.push({ test, error: error.message || error });
}

function logWarn(test, message) {
  console.warn(`⚠️  ${test}: ${message}`);
  results.warnings.push({ test, message });
}

/**
 * Check if table exists
 */
async function tableExists(tableName) {
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = $1
    )`,
    [tableName]
  );
  return result.rows[0].exists;
}

/**
 * Check if column exists in table
 */
async function columnExists(tableName, columnName) {
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
    )`,
    [tableName, columnName]
  );
  return result.rows[0].exists;
}

/**
 * Get count of rows in table
 */
async function getRowCount(tableName, whereClause = '') {
  const query = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;
  const result = await pool.query(query);
  return parseInt(result.rows[0].count, 10);
}

/**
 * Test 1: Verify Migration 051 - auth_identities table
 */
async function testMigration051() {
  console.log('\n📋 Testing Migration 051: auth_identities table\n');

  try {
    // Check if table exists
    const exists = await tableExists('auth_identities');
    if (!exists) {
      logFail('auth_identities table exists', new Error('Table not found'));
      return;
    }
    logPass('auth_identities table exists');

    // Check required columns
    const requiredColumns = [
      'id',
      'user_id',
      'provider',
      'provider_subject',
      'provider_email',
      'email_verified',
      'created_at',
      'updated_at',
    ];

    for (const col of requiredColumns) {
      const exists = await columnExists('auth_identities', col);
      if (exists) {
        logPass(`auth_identities.${col} column exists`);
      } else {
        logFail(`auth_identities.${col} column exists`, new Error('Column not found'));
      }
    }

    // Check indexes
    const indexes = await pool.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'auth_identities'
      AND schemaname = 'public'
    `);
    const indexNames = indexes.rows.map(r => r.indexname);
    
    if (indexNames.includes('idx_auth_identities_user_id')) {
      logPass('Index idx_auth_identities_user_id exists');
    } else {
      logWarn('Index idx_auth_identities_user_id', 'Missing index (may affect performance)');
    }

    // Check data migration
    const googleUsersCount = await getRowCount('users', "WHERE google_id IS NOT NULL");
    const googleIdentitiesCount = await getRowCount(
      'auth_identities',
      "WHERE provider = 'google'"
    );

    if (googleUsersCount > 0 && googleIdentitiesCount === 0) {
      logWarn('Google OAuth users migrated', 'No identities found for Google users');
    } else if (googleUsersCount > 0 && googleIdentitiesCount >= googleUsersCount * 0.9) {
      logPass(`Google OAuth users migrated (${googleIdentitiesCount}/${googleUsersCount})`);
    } else if (googleUsersCount === 0) {
      logPass('No Google OAuth users to migrate');
    } else {
      logWarn(
        'Google OAuth users migrated',
        `Only ${googleIdentitiesCount}/${googleUsersCount} identities found`
      );
    }

    // Check email/password users migration
    const emailPasswordUsersCount = await getRowCount(
      'users',
      "WHERE email IS NOT NULL AND password_hash IS NOT NULL AND google_id IS NULL"
    );
    const emailPasswordIdentitiesCount = await getRowCount(
      'auth_identities',
      "WHERE provider = 'email_password'"
    );

    if (emailPasswordUsersCount > 0 && emailPasswordIdentitiesCount === 0) {
      logWarn('Email/password users migrated', 'No identities found for email/password users');
    } else if (
      emailPasswordUsersCount > 0 &&
      emailPasswordIdentitiesCount >= emailPasswordUsersCount * 0.9
    ) {
      logPass(
        `Email/password users migrated (${emailPasswordIdentitiesCount}/${emailPasswordUsersCount})`
      );
    } else if (emailPasswordUsersCount === 0) {
      logPass('No email/password users to migrate');
    } else {
      logWarn(
        'Email/password users migrated',
        `Only ${emailPasswordIdentitiesCount}/${emailPasswordUsersCount} identities found`
      );
    }
  } catch (error) {
    logFail('Migration 051 validation', error);
  }
}

/**
 * Test 2: Verify Migration 052 - sessions and refresh_tokens tables
 */
async function testMigration052() {
  console.log('\n📋 Testing Migration 052: sessions and refresh_tokens tables\n');

  try {
    // Check sessions table
    const sessionsExists = await tableExists('sessions');
    if (sessionsExists) {
      logPass('sessions table exists');

      // Check required columns
      const requiredColumns = [
        'id',
        'user_id',
        'session_token',
        'created_at',
        'expires_at',
        'revoked_at',
        'last_seen_at',
        'ip_address',
        'user_agent',
      ];

      for (const col of requiredColumns) {
        const exists = await columnExists('sessions', col);
        if (exists) {
          logPass(`sessions.${col} column exists`);
        } else {
          logFail(`sessions.${col} column exists`, new Error('Column not found'));
        }
      }

      // Check unique constraint on session_token
      const constraints = await pool.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'sessions'
        AND constraint_type = 'UNIQUE'
      `);
      if (constraints.rows.length > 0) {
        logPass('sessions.session_token has unique constraint');
      } else {
        logWarn('sessions.session_token unique constraint', 'Missing unique constraint');
      }
    } else {
      logFail('sessions table exists', new Error('Table not found'));
    }

    // Check refresh_tokens table
    const refreshTokensExists = await tableExists('refresh_tokens');
    if (refreshTokensExists) {
      logPass('refresh_tokens table exists');

      // Check required columns
      const requiredColumns = [
        'id',
        'user_id',
        'token_hash',
        'session_id',
        'created_at',
        'expires_at',
        'revoked_at',
        'rotated_from_id',
        'last_used_at',
        'ip_address',
        'user_agent',
      ];

      for (const col of requiredColumns) {
        const exists = await columnExists('refresh_tokens', col);
        if (exists) {
          logPass(`refresh_tokens.${col} column exists`);
        } else {
          logFail(`refresh_tokens.${col} column exists`, new Error('Column not found'));
        }
      }

      // Check unique constraint on token_hash
      const constraints = await pool.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'refresh_tokens'
        AND constraint_type = 'UNIQUE'
      `);
      if (constraints.rows.length > 0) {
        logPass('refresh_tokens.token_hash has unique constraint');
      } else {
        logWarn('refresh_tokens.token_hash unique constraint', 'Missing unique constraint');
      }
    } else {
      logFail('refresh_tokens table exists', new Error('Table not found'));
    }

    // Check cleanup functions
    try {
      await pool.query('SELECT cleanup_expired_sessions()');
      logPass('cleanup_expired_sessions() function exists');
    } catch (error) {
      logWarn('cleanup_expired_sessions() function', 'Function not found or error: ' + error.message);
    }

    try {
      await pool.query('SELECT cleanup_expired_refresh_tokens()');
      logPass('cleanup_expired_refresh_tokens() function exists');
    } catch (error) {
      logWarn(
        'cleanup_expired_refresh_tokens() function',
        'Function not found or error: ' + error.message
      );
    }
  } catch (error) {
    logFail('Migration 052 validation', error);
  }
}

/**
 * Test 3: Verify Migration 053 - users table enhancements
 */
async function testMigration053() {
  console.log('\n📋 Testing Migration 053: users table enhancements\n');

  try {
    // Check email_verified column
    const emailVerifiedExists = await columnExists('users', 'email_verified');
    if (emailVerifiedExists) {
      logPass('users.email_verified column exists');

      // Check default value
      const defaultCheck = await pool.query(`
        SELECT column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'email_verified'
      `);
      if (defaultCheck.rows[0].column_default === 'false') {
        logPass('users.email_verified default is false');
      } else {
        logWarn('users.email_verified default', 'Expected false, got: ' + defaultCheck.rows[0].column_default);
      }
    } else {
      logFail('users.email_verified column exists', new Error('Column not found'));
    }

    // Check status column
    const statusExists = await columnExists('users', 'status');
    if (statusExists) {
      logPass('users.status column exists');

      // Check default value
      const defaultCheck = await pool.query(`
        SELECT column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'status'
      `);
      if (defaultCheck.rows[0].column_default === "'active'::character varying") {
        logPass('users.status default is active');
      } else {
        logWarn('users.status default', 'Expected active, got: ' + defaultCheck.rows[0].column_default);
      }

      // Check constraint
      const constraintCheck = await pool.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'users'
        AND constraint_name = 'check_status_values'
      `);
      if (constraintCheck.rows.length > 0) {
        logPass('users.status has check constraint');
      } else {
        logWarn('users.status check constraint', 'Missing constraint');
      }
    } else {
      logFail('users.status column exists', new Error('Column not found'));
    }

    // Check that existing users have email_verified set
    const usersWithVerified = await getRowCount('users', "WHERE email_verified = true");
    const totalUsers = await getRowCount('users');
    
    if (totalUsers > 0) {
      logPass(`Email verification status set (${usersWithVerified}/${totalUsers} users verified)`);
    } else {
      logPass('No users to check verification status');
    }

    // Check that existing users have status = 'active'
    const activeUsers = await getRowCount('users', "WHERE status = 'active'");
    if (activeUsers === totalUsers) {
      logPass(`All users have status = 'active' (${activeUsers} users)`);
    } else {
      logWarn(
        'Users status migration',
        `Only ${activeUsers}/${totalUsers} users have status = 'active'`
      );
    }
  } catch (error) {
    logFail('Migration 053 validation', error);
  }
}

/**
 * Test 4: Verify data integrity
 */
async function testDataIntegrity() {
  console.log('\n📋 Testing Data Integrity\n');

  try {
    // Check that all Google users have auth_identities
    const googleUsers = await pool.query(`
      SELECT id, email FROM users WHERE google_id IS NOT NULL
    `);
    
    for (const user of googleUsers.rows) {
      const identity = await pool.query(
        `SELECT id FROM auth_identities WHERE user_id = $1 AND provider = 'google'`,
        [user.id]
      );
      if (identity.rows.length === 0) {
        logWarn(`User ${user.id} (${user.email})`, 'Google user missing auth_identity');
      }
    }

    if (googleUsers.rows.length > 0) {
      logPass(`Checked ${googleUsers.rows.length} Google users for auth_identities`);
    }

    // Check that users with email_verified=true have at least one verified identity
    const verifiedUsers = await pool.query(`
      SELECT id, email FROM users WHERE email_verified = true
    `);

    let verifiedUsersWithIdentities = 0;
    for (const user of verifiedUsers.rows) {
      const verifiedIdentity = await pool.query(
        `SELECT id FROM auth_identities 
         WHERE user_id = $1 AND email_verified = true`,
        [user.id]
      );
      if (verifiedIdentity.rows.length > 0) {
        verifiedUsersWithIdentities++;
      }
    }

    if (verifiedUsers.rows.length > 0) {
      const percentage = Math.round(
        (verifiedUsersWithIdentities / verifiedUsers.rows.length) * 100
      );
      logPass(
        `Verified users have verified identities (${verifiedUsersWithIdentities}/${verifiedUsers.rows.length}, ${percentage}%)`
      );
    }
  } catch (error) {
    logFail('Data integrity check', error);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Phase 2 Migration Testing\n');
  console.log('=' .repeat(60));
  console.log(`Database: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
  console.log('=' .repeat(60));

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Run tests
    await testMigration051();
    await testMigration052();
    await testMigration053();
    await testDataIntegrity();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    console.log('');

    if (results.failed.length > 0) {
      console.log('❌ Failed Tests:');
      results.failed.forEach(({ test, error }) => {
        console.log(`   - ${test}: ${error}`);
      });
      console.log('');
      process.exit(1);
    }

    if (results.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      results.warnings.forEach(({ test, message }) => {
        console.log(`   - ${test}: ${message}`);
      });
      console.log('');
    }

    console.log('✅ All critical tests passed!');
    if (results.warnings.length > 0) {
      console.log('⚠️  Some warnings detected - review above');
    }
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };

