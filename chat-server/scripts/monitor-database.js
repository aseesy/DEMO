#!/usr/bin/env node
/**
 * Database Monitoring Script
 *
 * Monitors PostgreSQL database health, performance, and connection pool status.
 *
 * Usage:
 *   node scripts/monitor-database.js [--interval=60] [--json]
 *
 * Options:
 *   --interval=N    Check interval in seconds (default: 60)
 *   --json          Output in JSON format (for logging/monitoring tools)
 *
 * Example:
 *   node scripts/monitor-database.js --interval=30
 */

require('dotenv').config();
const dbPostgres = require('../dbPostgres');

async function getConnectionPoolStats() {
  // Note: pg.Pool doesn't expose all stats directly
  // This is a best-effort implementation
  const pool = dbPostgres;

  return {
    totalCount: pool.totalCount || 0,
    idleCount: pool.idleCount || 0,
    waitingCount: pool.waitingCount || 0,
    // Note: These may not be available depending on pg version
  };
}

async function getDatabaseStats() {
  const stats = {
    timestamp: new Date().toISOString(),
    connection: null,
    size: null,
    tableCounts: {},
    slowQueries: [],
    connectionPool: null,
  };

  try {
    // Test connection
    const startTime = Date.now();
    await dbPostgres.query('SELECT 1');
    stats.connection = {
      status: 'connected',
      latencyMs: Date.now() - startTime,
    };

    // Get database size
    const sizeResult = await dbPostgres.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size,
             pg_database_size(current_database()) as size_bytes
    `);
    stats.size = {
      human: sizeResult.rows[0].size,
      bytes: parseInt(sizeResult.rows[0].size_bytes),
    };

    // Get table row counts
    const tablesResult = await dbPostgres.query(`
      SELECT 
        schemaname,
        tablename,
        n_live_tup as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
      LIMIT 20
    `);

    stats.tableCounts = tablesResult.rows.map(row => ({
      table: row.tablename,
      rows: parseInt(row.row_count),
      size: row.size,
    }));

    // Get slow queries (queries taking > 1 second)
    const slowQueriesResult = await dbPostgres
      .query(
        `
      SELECT 
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        max_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > 1000
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `
      )
      .catch(() => ({ rows: [] })); // pg_stat_statements may not be enabled

    stats.slowQueries = slowQueriesResult.rows.map(row => ({
      query: row.query.substring(0, 100) + '...', // Truncate long queries
      calls: parseInt(row.calls),
      avgTimeMs: parseFloat(row.mean_exec_time),
      maxTimeMs: parseFloat(row.max_exec_time),
    }));

    // Get connection pool stats
    stats.connectionPool = await getConnectionPoolStats();

    // Get active connections
    const connectionsResult = await dbPostgres.query(`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);

    stats.connections = {
      total: parseInt(connectionsResult.rows[0].total),
      active: parseInt(connectionsResult.rows[0].active),
      idle: parseInt(connectionsResult.rows[0].idle),
      idleInTransaction: parseInt(connectionsResult.rows[0].idle_in_transaction),
    };
  } catch (error) {
    stats.connection = {
      status: 'error',
      error: error.message,
    };
  }

  return stats;
}

function formatStats(stats, json = false) {
  if (json) {
    return JSON.stringify(stats, null, 2);
  }

  const output = [];
  output.push('\n📊 Database Monitoring Report');
  output.push('='.repeat(50));
  output.push(`Timestamp: ${stats.timestamp}\n`);

  // Connection Status
  if (stats.connection) {
    if (stats.connection.status === 'connected') {
      output.push(`✅ Connection: ${stats.connection.status} (${stats.connection.latencyMs}ms)`);
    } else {
      output.push(`❌ Connection: ${stats.connection.status}`);
      if (stats.connection.error) {
        output.push(`   Error: ${stats.connection.error}`);
      }
    }
  }

  // Database Size
  if (stats.size) {
    output.push(`💾 Database Size: ${stats.size.human}`);
  }

  // Connections
  if (stats.connections) {
    output.push(`\n🔌 Active Connections:`);
    output.push(`   Total: ${stats.connections.total}`);
    output.push(`   Active: ${stats.connections.active}`);
    output.push(`   Idle: ${stats.connections.idle}`);
    if (stats.connections.idleInTransaction > 0) {
      output.push(`   ⚠️  Idle in Transaction: ${stats.connections.idleInTransaction}`);
    }
  }

  // Table Counts
  if (stats.tableCounts && stats.tableCounts.length > 0) {
    output.push(`\n📋 Top Tables by Row Count:`);
    stats.tableCounts.slice(0, 10).forEach(table => {
      output.push(`   ${table.table}: ${table.rows.toLocaleString()} rows (${table.size})`);
    });
  }

  // Slow Queries
  if (stats.slowQueries && stats.slowQueries.length > 0) {
    output.push(`\n🐌 Slow Queries (>1s avg):`);
    stats.slowQueries.forEach(query => {
      output.push(`   ${query.avgTimeMs.toFixed(2)}ms avg (${query.calls} calls): ${query.query}`);
    });
  } else if (stats.slowQueries) {
    output.push(`\n✅ No slow queries detected`);
  }

  output.push('\n' + '='.repeat(50));
  return output.join('\n');
}

async function monitor(interval = 60, json = false) {
  console.log(`🔄 Starting database monitoring (interval: ${interval}s)`);
  console.log('Press Ctrl+C to stop\n');

  const runCheck = async () => {
    const stats = await getDatabaseStats();
    console.log(formatStats(stats, json));
  };

  // Run immediately
  await runCheck();

  // Then run at interval
  const intervalId = setInterval(runCheck, interval * 1000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping monitoring...');
    clearInterval(intervalId);
    process.exit(0);
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const intervalArg = args.find(arg => arg.startsWith('--interval='));
const interval = intervalArg ? parseInt(intervalArg.split('=')[1]) : 60;
const json = args.includes('--json');

// Run monitoring
if (require.main === module) {
  monitor(interval, json).catch(error => {
    console.error('❌ Monitoring error:', error);
    process.exit(1);
  });
}

module.exports = { getDatabaseStats, monitor };
