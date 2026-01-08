/**
 * Schema Utilities
 *
 * Provides schema validation functions for database tables.
 *
 * IMPORTANT: Schema changes must be done via migration files in migrations/ directory.
 * This module only provides validation - it does NOT create columns or modify schema.
 *
 * For new features requiring schema changes:
 * 1. Create a .sql file in migrations/ directory
 * 2. Use format: XXX_description.sql (where XXX is next migration number)
 * 3. Use IF NOT EXISTS checks to make migrations idempotent
 * 4. Run migrations via: npm run migrate
 */

const { defaultLogger } = require('../logging/logger');

const logger = defaultLogger.child({
  module: 'schema',
});

// Lazy-load dbPostgres to avoid initialization issues
function getDb() {
  return require('../../dbPostgres');
}

// Cache column existence to avoid repeated database queries
const columnCache = new Map();

/**
 * Check if a column exists in a table
 * @param {string} tableName - Table name
 * @param {string} columnName - Column name
 * @returns {Promise<boolean>} True if column exists
 */
async function columnExists(tableName, columnName) {
  const cacheKey = `${tableName}.${columnName}`;

  // Check cache first
  if (columnCache.has(cacheKey)) {
    return columnCache.get(cacheKey);
  }

  try {
    const dbPostgres = getDb();
    const query = `
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = $2
    `;
    const result = await dbPostgres.query(query, [tableName, columnName]);
    const exists = result.rows.length > 0;

    // Cache the result
    columnCache.set(cacheKey, exists);
    return exists;
  } catch (error) {
    logger.error('Log message', {
      arg0: `Error checking column existence for ${tableName}.${columnName}:`,
      error: error,
    });
    // On error, assume column doesn't exist (safer to create than skip)
    return false;
  }
}

/**
 * @deprecated DO NOT USE FOR NEW FEATURES
 *
 * This function no longer creates columns. It only validates that columns exist.
 * Schema changes must be done via migration files in migrations/ directory.
 *
 * If column is missing, throws an error directing developer to create a migration.
 *
 * @param {string} tableName - Table name
 * @param {string} columnName - Column name
 * @param {string} columnType - PostgreSQL column type (ignored, kept for backward compatibility)
 * @returns {Promise<boolean>} Always returns false (never creates columns)
 * @throws {Error} If column does not exist
 */
async function createColumnIfNotExists(tableName, columnName, columnType = 'TEXT') {
  const exists = await columnExists(tableName, columnName);

  if (!exists) {
    throw new Error(
      `Schema Error: Column ${tableName}.${columnName} does not exist.\n` +
        `ACTION REQUIRED: Create a migration file in migrations/ directory to add this column.\n` +
        `See SCHEMA_STANDARDIZATION_PLAN.md for migration guidelines.\n` +
        `Example: Create migrations/XXX_add_${columnName}_column.sql`
    );
  }

  // Column exists - return false (was never created by this function)
  return false;
}

/**
 * @deprecated DO NOT USE FOR NEW FEATURES
 *
 * This function no longer creates columns. It only validates that required profile columns exist.
 * All profile columns should be added via migration 007_add_profile_columns.sql
 *
 * If columns are missing, throws an error directing developer to run migrations.
 *
 * @returns {Promise<Object>} Object with validation status
 * @throws {Error} If required columns are missing
 */
async function ensureProfileColumnsExist() {
  logger.warn('Log message', {
    value:
      '[DEPRECATED] ensureProfileColumnsExist() - Schema changes must be done via migrations.\n' +
      'If you see this warning, remove the call to ensureProfileColumnsExist() from your code.\n' +
      'Migration 007_add_profile_columns.sql ensures all required columns exist.',
  });

  const requiredColumns = [
    { name: 'first_name', type: 'TEXT' },
    { name: 'last_name', type: 'TEXT' },
    { name: 'display_name', type: 'TEXT' },
    { name: 'address', type: 'TEXT' },
    { name: 'additional_context', type: 'TEXT' },
    { name: 'profile_picture', type: 'TEXT' },
    { name: 'household_members', type: 'TEXT' },
    { name: 'communication_style', type: 'TEXT' },
    { name: 'communication_triggers', type: 'TEXT' },
    { name: 'communication_goals', type: 'TEXT' },
    { name: 'last_login', type: 'TIMESTAMP WITH TIME ZONE' },
  ];

  const missing = [];

  for (const column of requiredColumns) {
    const exists = await columnExists('users', column.name);
    if (!exists) {
      missing.push(column.name);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Schema Error: Missing required profile columns: ${missing.join(', ')}\n` +
        `ACTION REQUIRED: Run migration 007_add_profile_columns.sql\n` +
        `Command: npm run migrate (from chat-server directory)\n` +
        `All schema changes must be done via migration files, not runtime creation.`
    );
  }

  // All columns exist - return validation status (no longer creates anything)
  return {
    created: [],
    existing: requiredColumns.map(c => c.name),
    errors: [],
    validated: true,
  };
}

/**
 * Clear the column existence cache
 * Useful for testing or when schema changes are made
 */
function clearColumnCache() {
  columnCache.clear();
}

/**
 * Verify that required profile columns exist
 * Throws error if columns are missing (forces proper migration usage)
 * @returns {Promise<void>}
 * @throws {Error} If required columns are missing
 */
async function verifyProfileColumnsExist() {
  const requiredColumns = [
    'first_name',
    'last_name',
    'display_name',
    'address',
    'additional_context',
    'profile_picture',
    'household_members',
    'communication_style',
    'communication_triggers',
    'communication_goals',
    'last_login',
  ];

  const missing = [];

  for (const columnName of requiredColumns) {
    const exists = await columnExists('users', columnName);
    if (!exists) {
      missing.push(columnName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required profile columns: ${missing.join(', ')}\n` +
        `Please run migration 007_add_profile_columns.sql\n` +
        `Command: npm run migrate`
    );
  }
}

module.exports = {
  columnExists,
  createColumnIfNotExists, // @deprecated - only validates, never creates
  ensureProfileColumnsExist, // @deprecated - only validates, never creates
  verifyProfileColumnsExist, // NEW: Validation-only function
  clearColumnCache,
};
