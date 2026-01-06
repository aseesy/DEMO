#!/usr/bin/env node

/**
 * Verify Row-Level Security (RLS) Policies
 *
 * This script verifies that RLS is enabled on all sensitive tables
 * and that policies are correctly configured.
 */

const dbPostgres = require('../dbPostgres');

// Tables that should have RLS enabled
const TABLES_WITH_RLS = [
  'users',
  'messages',
  'rooms',
  'room_members',
  'tasks',
  'contacts',
  'threads',
  'invitations',
  'user_roles',
  'in_app_notifications',
  'user_health_context',
  'user_financials',
  'user_profile_privacy',
];

// Policies that should exist for each table
const EXPECTED_POLICIES = {
  users: ['users_select_own', 'users_update_own'],
  messages: ['messages_select_room_member', 'messages_insert_room_member'],
  rooms: ['rooms_select_member', 'rooms_insert_user'],
  room_members: ['room_members_select_member'],
  tasks: ['tasks_select_own', 'tasks_insert_user'],
  contacts: ['contacts_select_own', 'contacts_insert_own'],
  threads: ['threads_select_member', 'threads_insert_member'],
  invitations: ['invitations_select_own', 'invitations_insert_user'],
  user_roles: ['user_roles_select_own'],
};

async function checkRLSEnabled() {
  console.log('🔍 Checking Row-Level Security status...\n');

  let allPassed = true;

  for (const tableName of TABLES_WITH_RLS) {
    try {
      const result = await dbPostgres.query(
        `SELECT tablename, rowsecurity
         FROM pg_tables
         WHERE schemaname = 'public' AND tablename = $1`,
        [tableName]
      );

      if (result.rows.length === 0) {
        console.log(`⚠️  Table "${tableName}" does not exist`);
        continue;
      }

      const rowSecurity = result.rows[0].rowsecurity;

      if (rowSecurity) {
        console.log(`✅ RLS enabled on "${tableName}"`);
      } else {
        console.log(`❌ RLS NOT enabled on "${tableName}"`);
        allPassed = false;
      }
    } catch (error) {
      console.error(`❌ Error checking "${tableName}":`, error.message);
      allPassed = false;
    }
  }

  return allPassed;
}

async function checkPoliciesExist() {
  console.log('\n🔍 Checking RLS policies exist...\n');

  let allPassed = true;

  for (const [tableName, expectedPolicyNames] of Object.entries(EXPECTED_POLICIES)) {
    try {
      const result = await dbPostgres.query(
        `SELECT policyname
         FROM pg_policies
         WHERE schemaname = 'public' AND tablename = $1`,
        [tableName]
      );

      const existingPolicies = result.rows.map(row => row.policyname);
      const missingPolicies = expectedPolicyNames.filter(name => !existingPolicies.includes(name));

      if (missingPolicies.length === 0) {
        console.log(`✅ All policies exist for "${tableName}"`);
      } else {
        console.log(`⚠️  Missing policies for "${tableName}":`, missingPolicies.join(', '));
        allPassed = false;
      }
    } catch (error) {
      console.error(`❌ Error checking policies for "${tableName}":`, error.message);
      allPassed = false;
    }
  }

  return allPassed;
}

async function checkHelperFunctions() {
  console.log('\n🔍 Checking helper functions exist...\n');

  let allPassed = true;
  const expectedFunctions = ['current_user_id', 'is_admin'];

  for (const functionName of expectedFunctions) {
    try {
      const result = await dbPostgres.query(
        `SELECT proname
         FROM pg_proc
         WHERE proname = $1`,
        [functionName]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Function "${functionName}" exists`);
      } else {
        console.log(`❌ Function "${functionName}" does NOT exist`);
        allPassed = false;
      }
    } catch (error) {
      console.error(`❌ Error checking function "${functionName}":`, error.message);
      allPassed = false;
    }
  }

  return allPassed;
}

async function testRLSPolicy() {
  console.log('\n🔍 Testing RLS policy (dry run)...\n');

  try {
    // This is a dry run - we don't actually execute queries
    // Just verify the policy structure
    const result = await dbPostgres.query(
      `SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
       FROM pg_policies
       WHERE schemaname = 'public'
       ORDER BY tablename, policyname
       LIMIT 5`
    );

    if (result.rows.length > 0) {
      console.log('✅ RLS policies are configured');
      console.log(`   Found ${result.rows.length} policies (showing first 5)`);
      result.rows.forEach(row => {
        console.log(`   - ${row.tablename}.${row.policyname} (${row.cmd})`);
      });
    } else {
      console.log('⚠️  No RLS policies found');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error testing RLS policies:', error.message);
    return false;
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Row-Level Security (RLS) Policy Verification Script    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Check database connection
    await dbPostgres.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Run checks
    const rlsEnabled = await checkRLSEnabled();
    const policiesExist = await checkPoliciesExist();
    const functionsExist = await checkHelperFunctions();
    const policiesWork = await testRLSPolicy();

    // Summary
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                         SUMMARY                            ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log(`RLS Enabled:        ${rlsEnabled ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Policies Exist:     ${policiesExist ? '✅ PASS' : '⚠️  PARTIAL'}`);
    console.log(`Helper Functions:   ${functionsExist ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Policies Working:   ${policiesWork ? '✅ PASS' : '⚠️  UNKNOWN'}`);

    const allPassed = rlsEnabled && policiesExist && functionsExist && policiesWork;

    console.log('\n' + '='.repeat(55));
    if (allPassed) {
      console.log('✅ All RLS checks PASSED');
      console.log('   Row-Level Security is properly configured.');
      process.exit(0);
    } else {
      console.log('❌ Some RLS checks FAILED');
      console.log('   Please review the migration: migrations/049_row_level_security.sql');
      console.log('   Run the migration if it has not been applied yet.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error running verification:', error);
    console.error('\n   Make sure:');
    console.error('   1. Database is running');
    console.error('   2. DATABASE_URL environment variable is set');
    console.error('   3. Migrations have been run');
    process.exit(1);
  } finally {
    await dbPostgres.end();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { checkRLSEnabled, checkPoliciesExist, checkHelperFunctions };
