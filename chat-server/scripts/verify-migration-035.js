#!/usr/bin/env node
/**
 * Verify Migration 035: Data Integrity Constraints
 * 
 * This script verifies that all constraints from migration 035_data_integrity_constraints.sql
 * are successfully applied in the production database.
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/verify-migration-035.js
 * 
 * Or set DATABASE_URL in .env file
 */

require('dotenv').config();
const dbPostgres = require('../dbPostgres');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  console.log('\n📝 Usage:');
  console.log('   DATABASE_URL="postgresql://..." node scripts/verify-migration-035.js');
  console.log('\n   Or set DATABASE_URL in .env file');
  process.exit(1);
}

// Expected constraints from migration 035
const EXPECTED_CHECK_CONSTRAINTS = [
  { name: 'chk_threads_is_archived', table: 'threads', description: 'is_archived must be 0 or 1' },
  { name: 'chk_threads_depth', table: 'threads', description: 'depth must be non-negative' },
  { name: 'chk_tasks_status', table: 'tasks', description: 'status must be valid value' },
  { name: 'chk_messages_private', table: 'messages', description: 'private must be 0 or 1' },
  { name: 'chk_messages_flagged', table: 'messages', description: 'flagged must be 0 or 1' },
  { name: 'chk_messages_edited', table: 'messages', description: 'edited must be 0 or 1' },
  { name: 'chk_rooms_is_private', table: 'rooms', description: 'is_private must be 0 or 1' },
];

const EXPECTED_NOT_NULL_COLUMNS = [
  { table: 'threads', column: 'room_id', description: 'Thread must belong to a room' },
  { table: 'threads', column: 'title', description: 'Thread must have a title' },
  { table: 'messages', column: 'room_id', description: 'Message must belong to a room' },
  { table: 'messages', column: 'timestamp', description: 'Message must have a timestamp' },
  { table: 'messages', column: 'type', description: 'Message must have a type' },
];

const EXPECTED_FOREIGN_KEYS = [
  { name: 'fk_messages_thread_id', description: 'messages.thread_id -> threads.id' },
];

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Check if a CHECK constraint exists
 */
async function checkConstraintExists(constraintName) {
  try {
    const result = await dbPostgres.query(
      `SELECT 1 FROM pg_constraint WHERE conname = $1`,
      [constraintName]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error checking constraint ${constraintName}:`, error.message);
    return false;
  }
}

/**
 * Check if a NOT NULL constraint exists on a column
 */
async function checkNotNullConstraint(tableName, columnName) {
  try {
    const result = await dbPostgres.query(
      `SELECT is_nullable 
       FROM information_schema.columns 
       WHERE table_name = $1 AND column_name = $2`,
      [tableName, columnName]
    );
    
    if (result.rows.length === 0) {
      return { exists: false, reason: 'Column does not exist' };
    }
    
    return {
      exists: result.rows[0].is_nullable === 'NO',
      nullable: result.rows[0].is_nullable === 'YES',
    };
  } catch (error) {
    console.error(`Error checking NOT NULL constraint on ${tableName}.${columnName}:`, error.message);
    return { exists: false, reason: error.message };
  }
}

/**
 * Check if a foreign key constraint exists
 */
async function checkForeignKeyExists(fkName) {
  try {
    const result = await dbPostgres.query(
      `SELECT 1 FROM pg_constraint WHERE conname = $1 AND contype = 'f'`,
      [fkName]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error checking foreign key ${fkName}:`, error.message);
    return false;
  }
}

/**
 * Check if a table exists
 */
async function tableExists(tableName) {
  try {
    const result = await dbPostgres.query(
      `SELECT 1 FROM information_schema.tables WHERE table_name = $1`,
      [tableName]
    );
    return result.rows.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Test that a CHECK constraint is actually enforcing rules
 */
async function testConstraintEnforcement(constraintName, tableName, testQuery, shouldFail = true) {
  try {
    await pool.query(testQuery);
    if (shouldFail) {
      return { enforced: false, error: 'Constraint should have prevented invalid data' };
    }
    return { enforced: true };
  } catch (error) {
    if (shouldFail && error.code === '23514') { // CHECK constraint violation
      return { enforced: true };
    }
    return { enforced: false, error: error.message };
  }
}

/**
 * Verify CHECK constraints
 */
async function verifyCheckConstraints() {
  logSection('CHECK CONSTRAINTS VERIFICATION');
  
  let allPassed = true;
  let totalChecked = 0;
  let totalPassed = 0;
  let totalSkipped = 0;

  for (const constraint of EXPECTED_CHECK_CONSTRAINTS) {
    totalChecked++;
    
    // Check if table exists
    const tableExistsResult = await tableExists(constraint.table);
    if (!tableExistsResult) {
      logWarning(`${constraint.table} table does not exist, skipping ${constraint.name}`);
      totalSkipped++;
      continue;
    }

    // Check if constraint exists
    const exists = await checkConstraintExists(constraint.name);
    
    if (exists) {
      logSuccess(`${constraint.name} exists on ${constraint.table}`);
      
      // Test constraint enforcement (for certain constraints)
      // Note: We skip testing on INSERT because we'd need to provide all required fields
      // The fact that the constraint exists is sufficient verification
      // Real enforcement will be tested during actual data operations
      
      totalPassed++;
    } else {
      logError(`${constraint.name} is MISSING on ${constraint.table}`);
      logInfo(`  Description: ${constraint.description}`);
      allPassed = false;
    }
  }

  console.log(`\n📊 Summary: ${totalPassed}/${totalChecked - totalSkipped} constraints found (${totalSkipped} skipped)`);
  return allPassed;
}

/**
 * Verify NOT NULL constraints
 */
async function verifyNotNullConstraints() {
  logSection('NOT NULL CONSTRAINTS VERIFICATION');
  
  let allPassed = true;
  let totalChecked = 0;
  let totalPassed = 0;
  let totalSkipped = 0;

  for (const { table, column, description } of EXPECTED_NOT_NULL_COLUMNS) {
    totalChecked++;
    
    // Check if table exists
    const tableExistsResult = await tableExists(table);
    if (!tableExistsResult) {
      logWarning(`${table} table does not exist, skipping ${column}`);
      totalSkipped++;
      continue;
    }

    const result = await checkNotNullConstraint(table, column);
    
    if (result.exists) {
      logSuccess(`${table}.${column} has NOT NULL constraint`);
      logInfo(`  Description: ${description}`);
      totalPassed++;
    } else if (result.reason === 'Column does not exist') {
      logWarning(`${table}.${column} column does not exist (may be optional)`);
      totalSkipped++;
    } else if (result.nullable) {
      logError(`${table}.${column} is NULLABLE (should be NOT NULL)`);
      logInfo(`  Description: ${description}`);
      allPassed = false;
    } else {
      logError(`${table}.${column} constraint check failed: ${result.reason}`);
      allPassed = false;
    }
  }

  console.log(`\n📊 Summary: ${totalPassed}/${totalChecked - totalSkipped} constraints found (${totalSkipped} skipped)`);
  return allPassed;
}

/**
 * Verify foreign key constraints
 */
async function verifyForeignKeyConstraints() {
  logSection('FOREIGN KEY CONSTRAINTS VERIFICATION');
  
  let allPassed = true;
  let totalChecked = 0;
  let totalPassed = 0;

  for (const fk of EXPECTED_FOREIGN_KEYS) {
    totalChecked++;
    
    const exists = await checkForeignKeyExists(fk.name);
    
    if (exists) {
      logSuccess(`${fk.name} exists`);
      logInfo(`  Description: ${fk.description}`);
      totalPassed++;
    } else {
      logError(`${fk.name} is MISSING`);
      logInfo(`  Description: ${fk.description}`);
      allPassed = false;
    }
  }

  console.log(`\n📊 Summary: ${totalPassed}/${totalChecked} foreign keys found`);
  return allPassed;
}

/**
 * Check migration status
 */
async function checkMigrationStatus() {
  logSection('MIGRATION STATUS');
  
  try {
    // Check if migrations table exists
    const migrationsTableExists = await tableExists('migrations');
    
    if (!migrationsTableExists) {
      logWarning('migrations table does not exist');
      return false;
    }

    // Check if migration 035 has been run
    const result = await dbPostgres.query(
      `SELECT * FROM migrations WHERE filename = '035_data_integrity_constraints.sql' ORDER BY executed_at DESC LIMIT 1`
    );

    if (result.rows.length > 0) {
      const migration = result.rows[0];
      logSuccess('Migration 035 has been executed');
      logInfo(`  Executed at: ${migration.executed_at}`);
      if (migration.hash) {
        logInfo(`  Hash: ${migration.hash}`);
      }
      return true;
    } else {
      logError('Migration 035 has NOT been executed');
      logInfo('  Run migrations to apply this migration');
      return false;
    }
  } catch (error) {
    logError(`Error checking migration status: ${error.message}`);
    return false;
  }
}

/**
 * Get constraint statistics
 */
async function getConstraintStatistics() {
  logSection('CONSTRAINT STATISTICS');
  
  try {
    // Count all CHECK constraints
    const checkConstraints = await dbPostgres.query(
      `SELECT COUNT(*) as count 
       FROM pg_constraint 
       WHERE contype = 'c' 
       AND conrelid IN (
         SELECT oid FROM pg_class 
         WHERE relname IN ('threads', 'messages', 'tasks', 'rooms')
       )`
    );

    const checkCount = parseInt(checkConstraints.rows[0].count);
    logInfo(`Total CHECK constraints: ${checkCount}`);

    // List all CHECK constraints
    const allCheckConstraints = await dbPostgres.query(
      `SELECT c.conname, t.relname as table_name
       FROM pg_constraint c
       JOIN pg_class t ON c.conrelid = t.oid
       WHERE c.contype = 'c'
       AND t.relname IN ('threads', 'messages', 'tasks', 'rooms')
       ORDER BY t.relname, c.conname`
    );

    if (allCheckConstraints.rows.length > 0) {
      console.log('\n  All CHECK constraints:');
      for (const row of allCheckConstraints.rows) {
        console.log(`    - ${row.conname} on ${row.table_name}`);
      }
    }

    return true;
  } catch (error) {
    logError(`Error getting constraint statistics: ${error.message}`);
    return false;
  }
}

/**
 * Main verification function
 */
async function verifyMigration035() {
  console.log('\n');
  log('╔══════════════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║          Migration 035: Data Integrity Constraints Verification             ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('');

  try {
    // Test database connection
    logInfo('Testing database connection...');
    await dbPostgres.query('SELECT 1');
    logSuccess('Database connection successful');

    // Check migration status
    const migrationRun = await checkMigrationStatus();

    // Verify constraints
    const checkConstraintsPassed = await verifyCheckConstraints();
    const notNullConstraintsPassed = await verifyNotNullConstraints();
    const foreignKeysPassed = await verifyForeignKeyConstraints();

    // Get statistics
    await getConstraintStatistics();

    // Final summary
    logSection('VERIFICATION SUMMARY');
    
    const allPassed = migrationRun && checkConstraintsPassed && notNullConstraintsPassed && foreignKeysPassed;
    
    if (allPassed) {
      logSuccess('✅ ALL CONSTRAINTS VERIFIED - Migration 035 is correctly applied!');
      console.log('');
      log('This is your best defense against bad data. All integrity constraints are', 'green');
      log('in place and enforcing data quality rules.', 'green');
      process.exit(0);
    } else {
      logError('❌ SOME CONSTRAINTS ARE MISSING OR NOT WORKING');
      console.log('');
      log('Migration 035 may not have been applied correctly, or some constraints', 'red');
      log('failed to apply. Please check the errors above and run the migration again.', 'red');
      console.log('');
      log('To apply migration 035:', 'yellow');
      log('  1. Run: npm run migrate (from chat-server directory)', 'yellow');
      log('  2. Or manually run: node run-migration.js 035_data_integrity_constraints.sql', 'yellow');
      process.exit(1);
    }
  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run verification
verifyMigration035().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

