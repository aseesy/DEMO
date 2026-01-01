/**
 * Database Schema Validation Utility
 *
 * Validates that database schema matches expected structure.
 * Can be called on startup to catch schema drift early.
 */

const dbPostgres = require('../../../dbPostgres');

// Expected core tables and their required columns
const EXPECTED_CORE_TABLES = {
  users: ['id', 'email', 'created_at'],
  messages: ['id', 'room_id', 'text', 'timestamp'],
  rooms: ['id', 'name', 'created_at'],
  user_context: ['user_email', 'updated_at'],
  migrations: ['id', 'filename', 'executed_at', 'success'],
};

/**
 * Validate that core tables exist and have required columns
 * @returns {Promise<{valid: boolean, errors: Array, warnings: Array}>}
 */
async function validateCoreSchema() {
  const errors = [];
  const warnings = [];

  try {
    // Test connection
    await dbPostgres.query('SELECT 1');

    // Get all tables
    const tablesResult = await dbPostgres.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const existingTables = tablesResult.rows.map(row => row.table_name);

    // Check each expected table
    for (const [tableName, requiredColumns] of Object.entries(EXPECTED_CORE_TABLES)) {
      if (!existingTables.includes(tableName)) {
        errors.push(`Missing table: ${tableName}`);
        continue;
      }

      // Get columns for this table
      const columnsResult = await dbPostgres.query(
        `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
      `,
        [tableName]
      );

      const existingColumns = columnsResult.rows.map(row => row.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        errors.push(`Table ${tableName} missing columns: ${missingColumns.join(', ')}`);
      }
    }

    // Check for migrations table (critical for migration tracking)
    if (!existingTables.includes('migrations')) {
      warnings.push(
        'Migrations table not found. Migration tracking will be created on first migration.'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      tableCount: existingTables.length,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Schema validation failed: ${error.message}`],
      warnings: [],
      tableCount: 0,
    };
  }
}

/**
 * Validate that migrations table exists and is properly structured
 * @returns {Promise<boolean>}
 */
async function validateMigrationsTable() {
  try {
    const result = await dbPostgres.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      )
    `);

    if (!result.rows[0].exists) {
      return false;
    }

    // Check for required columns
    const columnsResult = await dbPostgres.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'migrations'
    `);

    const columns = columnsResult.rows.map(row => row.column_name);
    const required = ['id', 'filename', 'executed_at', 'success'];
    const missing = required.filter(col => !columns.includes(col));

    return missing.length === 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get migration status summary
 * @returns {Promise<{total: number, executed: number, pending: number, failed: number}>}
 */
async function getMigrationStatus() {
  try {
    const tableExists = await validateMigrationsTable();
    if (!tableExists) {
      return { total: 0, executed: 0, pending: 0, failed: 0 };
    }

    const result = await dbPostgres.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE success = true) as executed,
        COUNT(*) FILTER (WHERE success = false) as failed
      FROM migrations
    `);

    const row = result.rows[0];
    return {
      total: parseInt(row.total, 10),
      executed: parseInt(row.executed, 10),
      failed: parseInt(row.failed, 10),
      pending: 0, // Will be calculated by migration runner
    };
  } catch (error) {
    return { total: 0, executed: 0, pending: 0, failed: 0 };
  }
}

module.exports = {
  validateCoreSchema,
  validateMigrationsTable,
  getMigrationStatus,
};
