#!/usr/bin/env node
/**
 * Database Integrity Validation Script
 * 
 * Validates database integrity by checking:
 * - Foreign key integrity
 * - Orphaned records
 * - Email format validation
 * - Constraint violations
 * - Data consistency
 * 
 * Usage: node scripts/validate-database-integrity.js
 */

const dbPostgres = require('../dbPostgres');

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

async function checkForeignKeyIntegrity() {
  console.log('\n🔍 Checking foreign key integrity...');
  
  const checks = [
    {
      name: 'Messages with invalid room_id',
      query: `SELECT COUNT(*) as count FROM messages m 
              LEFT JOIN rooms r ON m.room_id = r.id 
              WHERE m.room_id IS NOT NULL AND r.id IS NULL`,
    },
    {
      name: 'Messages with invalid thread_id',
      query: `SELECT COUNT(*) as count FROM messages m 
              LEFT JOIN threads t ON m.thread_id = t.id 
              WHERE m.thread_id IS NOT NULL AND t.id IS NULL`,
    },
    {
      name: 'Threads with invalid room_id',
      query: `SELECT COUNT(*) as count FROM threads t 
              LEFT JOIN rooms r ON t.room_id = r.id 
              WHERE t.room_id IS NOT NULL AND r.id IS NULL`,
    },
    {
      name: 'Room members with invalid user_id',
      query: `SELECT COUNT(*) as count FROM room_members rm 
              LEFT JOIN users u ON rm.user_id = u.id 
              WHERE rm.user_id IS NOT NULL AND u.id IS NULL`,
    },
    {
      name: 'Room members with invalid room_id',
      query: `SELECT COUNT(*) as count FROM room_members rm 
              LEFT JOIN rooms r ON rm.room_id = r.id 
              WHERE rm.room_id IS NOT NULL AND r.id IS NULL`,
    },
    {
      name: 'Pairing sessions with invalid parent_a_id',
      query: `SELECT COUNT(*) as count FROM pairing_sessions ps 
              LEFT JOIN users u ON ps.parent_a_id = u.id 
              WHERE ps.parent_a_id IS NOT NULL AND u.id IS NULL`,
    },
    {
      name: 'Pairing sessions with invalid parent_b_id',
      query: `SELECT COUNT(*) as count FROM pairing_sessions ps 
              LEFT JOIN users u ON ps.parent_b_id = u.id 
              WHERE ps.parent_b_id IS NOT NULL AND u.id IS NULL`,
    },
  ];

  for (const check of checks) {
    try {
      const result = await dbPostgres.query(check.query);
      const count = parseInt(result.rows[0]?.count || 0, 10);
      
      if (count > 0) {
        results.failed.push({
          check: check.name,
          count,
          severity: 'error',
        });
        console.log(`  ❌ ${check.name}: ${count} violations found`);
      } else {
        results.passed.push(check.name);
        console.log(`  ✅ ${check.name}: No violations`);
      }
    } catch (error) {
      results.warnings.push({
        check: check.name,
        error: error.message,
      });
      console.log(`  ⚠️  ${check.name}: Error - ${error.message}`);
    }
  }
}

async function checkOrphanedRecords() {
  console.log('\n🔍 Checking for orphaned records...');
  
  const checks = [
    {
      name: 'Messages without room_id',
      query: `SELECT COUNT(*) as count FROM messages WHERE room_id IS NULL`,
      severity: 'error',
    },
    {
      name: 'Threads without room_id',
      query: `SELECT COUNT(*) as count FROM threads WHERE room_id IS NULL`,
      severity: 'error',
    },
    {
      name: 'Threads without title',
      query: `SELECT COUNT(*) as count FROM threads WHERE title IS NULL OR title = ''`,
      severity: 'error',
    },
    {
      name: 'Messages without timestamp',
      query: `SELECT COUNT(*) as count FROM messages WHERE timestamp IS NULL`,
      severity: 'error',
    },
    {
      name: 'Users without email',
      query: `SELECT COUNT(*) as count FROM users WHERE email IS NULL OR email = ''`,
      severity: 'error',
    },
  ];

  for (const check of checks) {
    try {
      const result = await dbPostgres.query(check.query);
      const count = parseInt(result.rows[0]?.count || 0, 10);
      
      if (count > 0) {
        results.failed.push({
          check: check.name,
          count,
          severity: check.severity,
        });
        console.log(`  ❌ ${check.name}: ${count} orphaned records found`);
      } else {
        results.passed.push(check.name);
        console.log(`  ✅ ${check.name}: No orphaned records`);
      }
    } catch (error) {
      results.warnings.push({
        check: check.name,
        error: error.message,
      });
      console.log(`  ⚠️  ${check.name}: Error - ${error.message}`);
    }
  }
}

async function checkEmailFormats() {
  console.log('\n🔍 Validating email formats...');
  
  try {
    // Basic email format validation (simple regex check)
    const result = await dbPostgres.query(`
      SELECT id, email 
      FROM users 
      WHERE email IS NOT NULL 
      AND email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
    `);
    
    if (result.rows.length > 0) {
      results.failed.push({
        check: 'Invalid email formats',
        count: result.rows.length,
        details: result.rows.map(r => ({ id: r.id, email: r.email })),
        severity: 'warning',
      });
      console.log(`  ⚠️  Found ${result.rows.length} users with invalid email formats`);
      result.rows.slice(0, 5).forEach(row => {
        console.log(`     - User ${row.id}: ${row.email}`);
      });
      if (result.rows.length > 5) {
        console.log(`     ... and ${result.rows.length - 5} more`);
      }
    } else {
      results.passed.push('Email format validation');
      console.log(`  ✅ All emails have valid format`);
    }
  } catch (error) {
    results.warnings.push({
      check: 'Email format validation',
      error: error.message,
    });
    console.log(`  ⚠️  Email validation error: ${error.message}`);
  }
}

async function checkConstraintViolations() {
  console.log('\n🔍 Checking constraint violations...');
  
  const checks = [
    {
      name: 'Threads with invalid is_archived value',
      query: `SELECT COUNT(*) as count FROM threads WHERE is_archived NOT IN (0, 1)`,
    },
    {
      name: 'Threads with negative depth',
      query: `SELECT COUNT(*) as count FROM threads WHERE depth < 0`,
    },
    {
      name: 'Rooms with invalid is_private value',
      query: `SELECT COUNT(*) as count FROM rooms WHERE is_private NOT IN (0, 1)`,
    },
    {
      name: 'Tasks with invalid status',
      query: `SELECT COUNT(*) as count FROM tasks 
              WHERE status NOT IN ('open', 'in_progress', 'completed', 'cancelled')`,
    },
    {
      name: 'Pairing sessions with invalid status',
      query: `SELECT COUNT(*) as count FROM pairing_sessions 
              WHERE status NOT IN ('pending', 'active', 'canceled', 'expired')`,
    },
  ];

  for (const check of checks) {
    try {
      const result = await dbPostgres.query(check.query);
      const count = parseInt(result.rows[0]?.count || 0, 10);
      
      if (count > 0) {
        results.failed.push({
          check: check.name,
          count,
          severity: 'error',
        });
        console.log(`  ❌ ${check.name}: ${count} violations found`);
      } else {
        results.passed.push(check.name);
        console.log(`  ✅ ${check.name}: No violations`);
      }
    } catch (error) {
      // Some columns might not exist, skip gracefully
      if (error.message.includes('does not exist')) {
        console.log(`  ⏭️  ${check.name}: Column does not exist, skipping`);
      } else {
        results.warnings.push({
          check: check.name,
          error: error.message,
        });
        console.log(`  ⚠️  ${check.name}: Error - ${error.message}`);
      }
    }
  }
}

async function checkDataConsistency() {
  console.log('\n🔍 Checking data consistency...');
  
  const checks = [
    {
      name: 'Threads with incorrect message_count',
      query: `SELECT t.id, t.message_count, COUNT(m.id) as actual_count
              FROM threads t
              LEFT JOIN messages m ON m.thread_id = t.id
              GROUP BY t.id, t.message_count
              HAVING t.message_count != COUNT(m.id)`,
      severity: 'warning',
    },
    {
      name: 'Pairing sessions active but missing shared_room_id',
      query: `SELECT COUNT(*) as count FROM pairing_sessions 
              WHERE status = 'active' AND shared_room_id IS NULL`,
      severity: 'warning',
    },
  ];

  for (const check of checks) {
    try {
      const result = await dbPostgres.query(check.query);
      const count = result.rows.length;
      
      if (count > 0) {
        results.failed.push({
          check: check.name,
          count,
          severity: check.severity || 'warning',
          details: result.rows.slice(0, 10), // Limit details
        });
        console.log(`  ⚠️  ${check.name}: ${count} inconsistencies found`);
        if (result.rows.length <= 10) {
          result.rows.forEach(row => {
            console.log(`     - ${JSON.stringify(row)}`);
          });
        }
      } else {
        results.passed.push(check.name);
        console.log(`  ✅ ${check.name}: Consistent`);
      }
    } catch (error) {
      results.warnings.push({
        check: check.name,
        error: error.message,
      });
      console.log(`  ⚠️  ${check.name}: Error - ${error.message}`);
    }
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length} checks`);
  console.log(`❌ Failed: ${results.failed.length} checks`);
  console.log(`⚠️  Warnings: ${results.warnings.length} checks`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed Checks:');
    results.failed.forEach(failure => {
      console.log(`  - ${failure.check}: ${failure.count || 'N/A'} violations (${failure.severity})`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\nWarnings:');
    results.warnings.forEach(warning => {
      console.log(`  - ${warning.check}: ${warning.error}`);
    });
  }
  
  const exitCode = results.failed.some(f => f.severity === 'error') ? 1 : 0;
  process.exit(exitCode);
}

async function main() {
  console.log('Database Integrity Validation');
  console.log('='.repeat(60));
  
  try {
    await checkForeignKeyIntegrity();
    await checkOrphanedRecords();
    await checkEmailFormats();
    await checkConstraintViolations();
    await checkDataConsistency();
    await printSummary();
  } catch (error) {
    console.error('\n❌ Fatal error during validation:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkForeignKeyIntegrity,
  checkOrphanedRecords,
  checkEmailFormats,
  checkConstraintViolations,
  checkDataConsistency,
};

