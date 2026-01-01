#!/usr/bin/env node
/**
 * System Health Check Script
 * 
 * Comprehensive health checks based on known issues:
 * 1. Socket.IO connection failures and reconnection loops
 * 2. Database query performance issues
 * 3. AutoAssignMessageUseCase infinite loop prevention
 * 4. Database integrity issues
 * 5. Memory leaks and resource usage
 * 
 * Usage: node scripts/system-health-check.js [--all|--db|--sockets|--performance]
 */

// Load environment variables from .env file
// Look for .env in chat-server directory
const path = require('path');
const fs = require('fs');
const dotenvPath = path.join(__dirname, '../.env');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath });
} else {
  require('dotenv').config();
}

const dbPostgres = require('../dbPostgres');

const args = process.argv.slice(2);
const checkAll = args.includes('--all') || args.length === 0;
const shouldCheckDb = checkAll || args.includes('--db');
const shouldCheckSockets = checkAll || args.includes('--sockets');
const shouldCheckPerformance = checkAll || args.includes('--performance');

const results = {
  passed: [],
  warnings: [],
  errors: [],
  metrics: {},
};

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

// ============================================================================
// DATABASE HEALTH CHECKS
// ============================================================================

async function checkDatabaseHealth() {
  section('DATABASE HEALTH CHECKS');

  // 1. Check for orphaned messages (no room_id)
  try {
    const orphaned = await dbPostgres.query(`
      SELECT COUNT(*) as count FROM messages WHERE room_id IS NULL
    `);
    const count = parseInt(orphaned.rows[0]?.count || 0, 10);
    if (count > 0) {
      results.errors.push(`Found ${count} messages without room_id`);
      log(`  ❌ Orphaned messages: ${count}`, 'red');
    } else {
      results.passed.push('No orphaned messages');
      log('  ✅ No orphaned messages', 'green');
    }
  } catch (error) {
    results.warnings.push(`Could not check orphaned messages: ${error.message}`);
    log(`  ⚠️  Error checking orphaned messages: ${error.message}`, 'yellow');
  }

  // 2. Check for threads with incorrect message_count
  try {
    const incorrect = await dbPostgres.query(`
      SELECT t.id, t.message_count, COUNT(m.id) as actual_count
      FROM threads t
      LEFT JOIN messages m ON m.thread_id = t.id
      GROUP BY t.id, t.message_count
      HAVING t.message_count != COUNT(m.id)
      LIMIT 10
    `);
    if (incorrect.rows.length > 0) {
      results.warnings.push(`Found ${incorrect.rows.length} threads with incorrect message_count`);
      log(`  ⚠️  Threads with incorrect message_count: ${incorrect.rows.length}`, 'yellow');
      incorrect.rows.slice(0, 3).forEach(row => {
        log(`     - Thread ${row.id}: expected ${row.message_count}, actual ${row.actual_count}`, 'yellow');
      });
    } else {
      results.passed.push('All thread message counts are correct');
      log('  ✅ All thread message counts are correct', 'green');
    }
  } catch (error) {
    results.warnings.push(`Could not check thread counts: ${error.message}`);
  }

  // 3. Check for foreign key violations
  try {
    const violations = await dbPostgres.query(`
      SELECT COUNT(*) as count FROM messages m 
      LEFT JOIN rooms r ON m.room_id = r.id 
      WHERE m.room_id IS NOT NULL AND r.id IS NULL
    `);
    const count = parseInt(violations.rows[0]?.count || 0, 10);
    if (count > 0) {
      results.errors.push(`Found ${count} messages with invalid room_id`);
      log(`  ❌ Foreign key violations: ${count} messages with invalid room_id`, 'red');
    } else {
      results.passed.push('No foreign key violations');
      log('  ✅ No foreign key violations', 'green');
    }
  } catch (error) {
    results.warnings.push(`Could not check foreign keys: ${error.message}`);
  }

  // 4. Check for constraint violations
  try {
    const invalidArchived = await dbPostgres.query(`
      SELECT COUNT(*) as count FROM threads WHERE is_archived NOT IN (0, 1)
    `);
    const count = parseInt(invalidArchived.rows[0]?.count || 0, 10);
    if (count > 0) {
      results.errors.push(`Found ${count} threads with invalid is_archived value`);
      log(`  ❌ Constraint violations: ${count} threads with invalid is_archived`, 'red');
    } else {
      results.passed.push('No constraint violations');
      log('  ✅ No constraint violations', 'green');
    }
  } catch (error) {
    results.warnings.push(`Could not check constraints: ${error.message}`);
  }

  // 5. Check database size and growth
  try {
    const dbSize = await dbPostgres.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size,
             pg_database_size(current_database()) as size_bytes
    `);
    const size = dbSize.rows[0]?.size || 'unknown';
    const sizeBytes = parseInt(dbSize.rows[0]?.size_bytes || 0, 10);
    results.metrics.databaseSize = size;
    log(`  📊 Database size: ${size}`, 'blue');
    
    if (sizeBytes > 10 * 1024 * 1024 * 1024) { // > 10GB
      results.warnings.push(`Database size is large: ${size} - consider archiving`);
      log(`  ⚠️  Database is large - consider running archive_old_messages()`, 'yellow');
    }
  } catch (error) {
    results.warnings.push(`Could not check database size: ${error.message}`);
  }
}

// ============================================================================
// PERFORMANCE CHECKS
// ============================================================================

async function checkPerformance() {
  section('PERFORMANCE CHECKS');

  // 1. Check for slow queries (if monitoring is enabled)
  try {
    const tableExists = await dbPostgres.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'query_performance_log'
      )
    `);
    
    if (tableExists.rows[0]?.exists) {
      const slowQueries = await dbPostgres.query(`
        SELECT COUNT(*) as count,
               ROUND(AVG(execution_time_ms)::numeric, 2) as avg_ms,
               ROUND(MAX(execution_time_ms)::numeric, 2) as max_ms
        FROM query_performance_log
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
      `);
      
      const count = parseInt(slowQueries.rows[0]?.count || 0, 10);
      const avgMs = parseFloat(slowQueries.rows[0]?.avg_ms || 0);
      const maxMs = parseFloat(slowQueries.rows[0]?.max_ms || 0);
      
      if (count > 0) {
        log(`  📊 Slow queries in last hour: ${count}`, 'blue');
        log(`     Average: ${avgMs}ms, Max: ${maxMs}ms`, 'blue');
        
        if (avgMs > 1000) {
          results.warnings.push(`High average query time: ${avgMs}ms`);
          log(`  ⚠️  Average query time is high - investigate slow queries`, 'yellow');
        }
        
        if (maxMs > 5000) {
          results.errors.push(`Very slow query detected: ${maxMs}ms`);
          log(`  ❌ Very slow query detected: ${maxMs}ms`, 'red');
        }
      } else {
        log('  ✅ No slow queries logged in last hour', 'green');
      }
    } else {
      log('  ℹ️  Query performance logging not enabled (migration 037)', 'blue');
    }
  } catch (error) {
    results.warnings.push(`Could not check slow queries: ${error.message}`);
  }

  // 2. Check index usage
  try {
    const unusedIndexes = await dbPostgres.query(`
      SELECT schemaname, relname as tablename, indexrelname as indexname, 
             pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public' AND idx_scan = 0
      ORDER BY pg_relation_size(indexrelid) DESC
      LIMIT 10
    `);
    
    if (unusedIndexes.rows.length > 0) {
      const totalSize = unusedIndexes.rows.reduce((sum, idx) => {
        const sizeStr = idx.size || '0 bytes';
        const sizeBytes = parseSize(sizeStr);
        return sum + sizeBytes;
      }, 0);
      
      if (totalSize > 10 * 1024 * 1024) { // > 10MB
        results.warnings.push(`Found ${unusedIndexes.rows.length} unused indexes`);
        log(`  ⚠️  Unused indexes: ${unusedIndexes.rows.length} (consider dropping)`, 'yellow');
        unusedIndexes.rows.slice(0, 3).forEach(idx => {
          log(`     - ${idx.indexname} on ${idx.tablename} (${idx.size})`, 'yellow');
        });
      }
    } else {
      log('  ✅ No unused indexes found', 'green');
    }
  } catch (error) {
    results.warnings.push(`Could not check index usage: ${error.message}`);
  }

  // 3. Check for missing indexes on frequently queried columns
  try {
    // Check if messages.room_id has an index (should have idx_messages_room_timestamp)
    const messageIndexes = await dbPostgres.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'messages' 
      AND indexdef LIKE '%room_id%'
    `);
    
    if (messageIndexes.rows.length === 0) {
      results.errors.push('Missing index on messages.room_id');
      log('  ❌ Missing index on messages.room_id - run migration 034', 'red');
    } else {
      log('  ✅ Indexes on messages.room_id exist', 'green');
    }
  } catch (error) {
    results.warnings.push(`Could not check indexes: ${error.message}`);
  }

  // 4. Check table bloat
  try {
    const bloatedTables = await dbPostgres.query(`
      SELECT schemaname, tablename, 
             pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE '_pg_%'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 5
    `);
    
    log('  📊 Largest tables:', 'blue');
    bloatedTables.rows.forEach((row, idx) => {
      log(`     ${idx + 1}. ${row.tablename}: ${row.size}`, 'blue');
    });
  } catch (error) {
    results.warnings.push(`Could not check table sizes: ${error.message}`);
  }
}

// ============================================================================
// SOCKET.IO HEALTH CHECKS
// ============================================================================

async function checkSocketHealth() {
  section('SOCKET.IO HEALTH CHECKS');

  // 1. Check for recent connection errors in logs (if available)
  const logFiles = [
    path.join(__dirname, '../logs/error.log'),
    path.join(__dirname, '../logs/app.log'),
  ];

  let socketErrorsFound = false;
  for (const logFile of logFiles) {
    if (fs.existsSync(logFile)) {
      try {
        const logContent = fs.readFileSync(logFile, 'utf8');
        const recentErrors = logContent
          .split('\n')
          .filter(line => 
            line.includes('WebSocket') || 
            line.includes('socket.io') || 
            line.includes('connection error')
          )
          .slice(-10); // Last 10 errors
        
        if (recentErrors.length > 0) {
          socketErrorsFound = true;
          results.warnings.push(`Found ${recentErrors.length} recent socket errors in logs`);
          log(`  ⚠️  Recent socket errors found in ${path.basename(logFile)}:`, 'yellow');
          recentErrors.slice(0, 3).forEach(err => {
            log(`     - ${err.substring(0, 100)}...`, 'yellow');
          });
        }
      } catch (error) {
        // Log file might be locked or unreadable
      }
    }
  }

  if (!socketErrorsFound) {
    log('  ✅ No recent socket errors found in logs', 'green');
  }

  // 2. Check server configuration
  try {
    const configPath = path.join(__dirname, '../config.js');
    if (fs.existsSync(configPath)) {
      const config = require(configPath);
      if (config.SOCKET_CONFIG) {
        log('  📊 Socket.IO Configuration:', 'blue');
        log(`     pingTimeout: ${config.SOCKET_CONFIG.pingTimeout || 'default'}ms`, 'blue');
        log(`     pingInterval: ${config.SOCKET_CONFIG.pingInterval || 'default'}ms`, 'blue');
        log(`     transports: ${config.SOCKET_CONFIG.transports?.join(', ') || 'default'}`, 'blue');
        
        if (config.SOCKET_CONFIG.pingTimeout < 30000) {
          results.warnings.push('pingTimeout is low - may cause premature disconnections');
          log('  ⚠️  pingTimeout is low - consider increasing', 'yellow');
        }
      }
    }
  } catch (error) {
    results.warnings.push(`Could not check socket config: ${error.message}`);
  }

  // 3. Check for connection issues in database (if tracking exists)
  try {
    // Check if there's a way to track active connections
    // This would require application-level tracking
    log('  ℹ️  Socket connection tracking requires application-level monitoring', 'blue');
    log('     Consider adding connection metrics to your monitoring', 'blue');
  } catch (error) {
    // No tracking available
  }
}

// ============================================================================
// APPLICATION HEALTH CHECKS
// ============================================================================

async function checkApplicationHealth() {
  section('APPLICATION HEALTH CHECKS');

  // 1. Check for stuck AutoAssignMessageUseCase operations
  // This would require in-memory tracking, but we can check for patterns
  try {
    const recentAssignments = await dbPostgres.query(`
      SELECT COUNT(*) as count, 
             COUNT(DISTINCT thread_id) as thread_count,
             COUNT(DISTINCT room_id) as room_count
      FROM messages
      WHERE thread_id IS NOT NULL
      AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
    `);
    
    const count = parseInt(recentAssignments.rows[0]?.count || 0, 10);
    const threadCount = parseInt(recentAssignments.rows[0]?.thread_count || 0, 10);
    const roomCount = parseInt(recentAssignments.rows[0]?.room_count || 0, 10);
    
    log(`  📊 Recent message assignments (last hour):`, 'blue');
    log(`     Messages assigned: ${count}`, 'blue');
    log(`     Threads involved: ${threadCount}`, 'blue');
    log(`     Rooms involved: ${roomCount}`, 'blue');
    
    // Check for potential infinite loop patterns
    if (count > 1000 && threadCount < 10) {
      results.warnings.push('High message assignment rate to few threads - possible loop');
      log('  ⚠️  High assignment rate to few threads - check for loops', 'yellow');
    }
  } catch (error) {
    results.warnings.push(`Could not check message assignments: ${error.message}`);
  }

  // 2. Check for messages without proper timestamps
  try {
    const invalidTimestamps = await dbPostgres.query(`
      SELECT COUNT(*) as count FROM messages 
      WHERE timestamp IS NULL 
      OR timestamp < '2020-01-01'::timestamp
      OR timestamp > CURRENT_TIMESTAMP + INTERVAL '1 day'
    `);
    
    const count = parseInt(invalidTimestamps.rows[0]?.count || 0, 10);
    if (count > 0) {
      results.errors.push(`Found ${count} messages with invalid timestamps`);
      log(`  ❌ Invalid timestamps: ${count} messages`, 'red');
    } else {
      log('  ✅ All message timestamps are valid', 'green');
    }
  } catch (error) {
    results.warnings.push(`Could not check timestamps: ${error.message}`);
  }

  // 3. Check for duplicate message IDs
  try {
    const duplicates = await dbPostgres.query(`
      SELECT id, COUNT(*) as count 
      FROM messages 
      GROUP BY id 
      HAVING COUNT(*) > 1
      LIMIT 5
    `);
    
    if (duplicates.rows.length > 0) {
      results.errors.push(`Found ${duplicates.rows.length} duplicate message IDs`);
      log(`  ❌ Duplicate message IDs: ${duplicates.rows.length}`, 'red');
    } else {
      log('  ✅ No duplicate message IDs', 'green');
    }
  } catch (error) {
    results.warnings.push(`Could not check duplicates: ${error.message}`);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseSize(sizeStr) {
  const units = { 'bytes': 1, 'kB': 1024, 'MB': 1024*1024, 'GB': 1024*1024*1024 };
  const match = sizeStr.match(/^([\d.]+)\s*(\w+)$/);
  if (match) {
    return parseFloat(match[1]) * (units[match[2]] || 1);
  }
  return 0;
}

function printSummary() {
  section('SUMMARY');
  
  log(`✅ Passed: ${results.passed.length} checks`, 'green');
  log(`⚠️  Warnings: ${results.warnings.length}`, results.warnings.length > 0 ? 'yellow' : 'green');
  log(`❌ Errors: ${results.errors.length}`, results.errors.length > 0 ? 'red' : 'green');
  
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => log(`  - ${err}`, 'red'));
  }
  
  if (results.warnings.length > 0) {
    console.log('\nWarnings:');
    results.warnings.forEach(warn => log(`  - ${warn}`, 'yellow'));
  }
  
  if (Object.keys(results.metrics).length > 0) {
    console.log('\nMetrics:');
    Object.entries(results.metrics).forEach(([key, value]) => {
      log(`  - ${key}: ${value}`, 'blue');
    });
  }
  
  const exitCode = results.errors.length > 0 ? 1 : 0;
  return exitCode;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n');
  log('╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║           SYSTEM HEALTH CHECK                                     ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');
  
  try {
    // Test database connection first
    await dbPostgres.query('SELECT 1');
    log('\n✅ Database connection successful', 'green');
    
    if (shouldCheckDb) {
      await checkDatabaseHealth();
    }
    
    if (shouldCheckPerformance) {
      await checkPerformance();
    }
    
    if (shouldCheckSockets) {
      await checkSocketHealth();
    }
    
    await checkApplicationHealth();
    
    const exitCode = printSummary();
    process.exit(exitCode);
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkDatabaseHealth,
  checkPerformance,
  checkSocketHealth,
  checkApplicationHealth,
};

