#!/usr/bin/env node
/**
 * Query Performance Monitoring Script
 * 
 * Monitors database query performance by:
 * - Analyzing slow queries from query_performance_log table
 * - Collecting database health metrics
 * - Reporting on index usage
 * - Identifying performance bottlenecks
 * 
 * Usage: 
 *   node scripts/monitor-query-performance.js
 *   node scripts/monitor-query-performance.js --collect-metrics
 *   node scripts/monitor-query-performance.js --analyze-indexes
 */

const dbPostgres = require('../dbPostgres');

const args = process.argv.slice(2);
const collectMetrics = args.includes('--collect-metrics');
const analyzeIndexes = args.includes('--analyze-indexes');

async function analyzeSlowQueries() {
  console.log('\n📊 Analyzing Slow Queries (last 24 hours)...');
  
  try {
    // Check if query_performance_log table exists
    const tableExists = await dbPostgres.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'query_performance_log'
      )
    `);
    
    if (!tableExists.rows[0]?.exists) {
      console.log('  ⚠️  query_performance_log table does not exist. Run migration 037 first.');
      return;
    }
    
    // Get slow queries summary
    const summary = await dbPostgres.query(`
      SELECT 
        table_name,
        operation_type,
        COUNT(*) as query_count,
        ROUND(AVG(execution_time_ms)::numeric, 2) as avg_ms,
        ROUND(MAX(execution_time_ms)::numeric, 2) as max_ms,
        ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms)::numeric, 2) as p95_ms
      FROM query_performance_log
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
      GROUP BY table_name, operation_type
      ORDER BY avg_ms DESC
      LIMIT 10
    `);
    
    if (summary.rows.length === 0) {
      console.log('  ✅ No slow queries logged in the last 24 hours');
      return;
    }
    
    console.log('\n  Top Slow Queries:');
    console.log('  ' + '-'.repeat(80));
    console.log('  ' + [
      'Table'.padEnd(20),
      'Operation'.padEnd(12),
      'Count'.padEnd(8),
      'Avg (ms)'.padEnd(12),
      'Max (ms)'.padEnd(12),
      'P95 (ms)'.padEnd(12),
    ].join(' | '));
    console.log('  ' + '-'.repeat(80));
    
    summary.rows.forEach(row => {
      console.log('  ' + [
        (row.table_name || 'N/A').padEnd(20),
        (row.operation_type || 'N/A').padEnd(12),
        String(row.query_count).padEnd(8),
        String(row.avg_ms).padEnd(12),
        String(row.max_ms).padEnd(12),
        String(row.p95_ms).padEnd(12),
      ].join(' | '));
    });
    
    // Get most frequent slow queries
    const frequent = await dbPostgres.query(`
      SELECT 
        LEFT(query_text, 100) as query_preview,
        COUNT(*) as frequency,
        ROUND(AVG(execution_time_ms)::numeric, 2) as avg_ms
      FROM query_performance_log
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
      GROUP BY LEFT(query_text, 100)
      ORDER BY frequency DESC
      LIMIT 5
    `);
    
    if (frequent.rows.length > 0) {
      console.log('\n  Most Frequent Slow Queries:');
      frequent.rows.forEach((row, idx) => {
        console.log(`  ${idx + 1}. [${row.frequency}x] ${row.query_preview}... (avg: ${row.avg_ms}ms)`);
      });
    }
  } catch (error) {
    console.error('  ❌ Error analyzing slow queries:', error.message);
  }
}

async function collectHealthMetrics() {
  console.log('\n📈 Collecting Database Health Metrics...');
  
  try {
    // Check if database_health_metrics table exists
    const tableExists = await dbPostgres.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'database_health_metrics'
      )
    `);
    
    if (!tableExists.rows[0]?.exists) {
      console.log('  ⚠️  database_health_metrics table does not exist. Run migration 037 first.');
      return;
    }
    
    // Call the stored function to collect metrics
    const metricsInserted = await dbPostgres.query('SELECT store_database_health_metrics()');
    console.log(`  ✅ Collected ${metricsInserted.rows[0]?.store_database_health_metrics || 0} metrics`);
    
    // Show latest table sizes
    const tableSizes = await dbPostgres.query(`
      SELECT 
        metric_name as table_name,
        pg_size_pretty(metric_value::BIGINT) as size,
        collected_at
      FROM database_health_metrics
      WHERE metric_type = 'table_size'
      AND collected_at >= CURRENT_TIMESTAMP - INTERVAL '1 day'
      ORDER BY metric_value DESC
      LIMIT 10
    `);
    
    if (tableSizes.rows.length > 0) {
      console.log('\n  Largest Tables:');
      tableSizes.rows.forEach(row => {
        console.log(`    - ${row.table_name}: ${row.size}`);
      });
    }
    
    // Show connection count
    const connections = await dbPostgres.query(`
      SELECT metric_value as connection_count
      FROM database_health_metrics
      WHERE metric_type = 'connection_count'
      ORDER BY collected_at DESC
      LIMIT 1
    `);
    
    if (connections.rows.length > 0) {
      console.log(`\n  Active Connections: ${connections.rows[0].connection_count}`);
    }
  } catch (error) {
    console.error('  ❌ Error collecting health metrics:', error.message);
  }
}

async function analyzeIndexUsage() {
  console.log('\n🔍 Analyzing Index Usage...');
  
  try {
    // Get index usage statistics
    const indexStats = await dbPostgres.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan ASC
      LIMIT 20
    `);
    
    if (indexStats.rows.length === 0) {
      console.log('  ⚠️  No index statistics available');
      return;
    }
    
    const unusedIndexes = indexStats.rows.filter(idx => idx.scans === '0');
    
    if (unusedIndexes.length > 0) {
      console.log(`\n  ⚠️  Found ${unusedIndexes.length} potentially unused indexes:`);
      unusedIndexes.slice(0, 10).forEach(idx => {
        console.log(`    - ${idx.indexname} on ${idx.tablename} (${idx.size})`);
      });
      if (unusedIndexes.length > 10) {
        console.log(`    ... and ${unusedIndexes.length - 10} more`);
      }
    } else {
      console.log('  ✅ All indexes have been used');
    }
    
    // Get most used indexes
    const mostUsed = await dbPostgres.query(`
      SELECT 
        tablename,
        indexname,
        idx_scan as scans,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 10
    `);
    
    if (mostUsed.rows.length > 0) {
      console.log('\n  Most Used Indexes:');
      mostUsed.rows.forEach((idx, i) => {
        console.log(`    ${i + 1}. ${idx.indexname} on ${idx.tablename}: ${idx.scans} scans (${idx.size})`);
      });
    }
  } catch (error) {
    console.error('  ❌ Error analyzing index usage:', error.message);
  }
}

async function checkTableSizes() {
  console.log('\n💾 Table Sizes:');
  
  try {
    const sizes = await dbPostgres.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `);
    
    sizes.rows.forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.tablename}: ${row.size}`);
    });
  } catch (error) {
    console.error('  ❌ Error checking table sizes:', error.message);
  }
}

async function main() {
  console.log('Query Performance Monitoring');
  console.log('='.repeat(60));
  
  try {
    await analyzeSlowQueries();
    
    if (collectMetrics) {
      await collectHealthMetrics();
    }
    
    if (analyzeIndexes) {
      await analyzeIndexUsage();
    }
    
    await checkTableSizes();
    
    console.log('\n' + '='.repeat(60));
    console.log('Monitoring complete');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Fatal error during monitoring:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeSlowQueries,
  collectHealthMetrics,
  analyzeIndexUsage,
  checkTableSizes,
};

