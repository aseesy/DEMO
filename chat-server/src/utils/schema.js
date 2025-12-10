/**
 * Schema Utilities
 * 
 * Provides runtime schema validation and column creation for database tables.
 * Used as a safety net to ensure required columns exist even if migrations haven't run.
 */

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
    console.error(`Error checking column existence for ${tableName}.${columnName}:`, error);
    // On error, assume column doesn't exist (safer to create than skip)
    return false;
  }
}

/**
 * Create a column in a table if it doesn't exist
 * @param {string} tableName - Table name
 * @param {string} columnName - Column name
 * @param {string} columnType - PostgreSQL column type (e.g., 'TEXT', 'TIMESTAMP WITH TIME ZONE')
 * @returns {Promise<boolean>} True if column was created, false if it already existed
 */
async function createColumnIfNotExists(tableName, columnName, columnType = 'TEXT') {
  const exists = await columnExists(tableName, columnName);
  
  if (exists) {
    return false; // Column already exists
  }
  
  try {
    const dbPostgres = getDb();
    // Escape identifiers to prevent SQL injection
    const safeTableName = `"${tableName}"`;
    const safeColumnName = `"${columnName}"`;
    
    const query = `ALTER TABLE ${safeTableName} ADD COLUMN ${safeColumnName} ${columnType}`;
    await dbPostgres.query(query);
    
    console.log(`✅ Created missing column: ${tableName}.${columnName}`);
    
    // Update cache
    columnCache.set(`${tableName}.${columnName}`, true);
    
    return true; // Column was created
  } catch (error) {
    console.error(`Error creating column ${tableName}.${columnName}:`, error);
    throw error;
  }
}

/**
 * Ensure all required profile columns exist in the users table
 * Creates missing columns automatically as a safety net
 * @returns {Promise<Object>} Object with created columns and status
 */
async function ensureProfileColumnsExist() {
  const requiredColumns = [
    { name: 'first_name', type: 'TEXT' },
    { name: 'last_name', type: 'TEXT' },
    { name: 'display_name', type: 'TEXT' },
    { name: 'address', type: 'TEXT' },
    { name: 'additional_context', type: 'TEXT' },
    { name: 'profile_picture', type: 'TEXT' },
    { name: 'household_members', type: 'TEXT' },
    { name: 'occupation', type: 'TEXT' },
    { name: 'communication_style', type: 'TEXT' },
    { name: 'communication_triggers', type: 'TEXT' },
    { name: 'communication_goals', type: 'TEXT' },
    { name: 'last_login', type: 'TIMESTAMP WITH TIME ZONE' },
  ];
  
  const results = {
    created: [],
    existing: [],
    errors: [],
  };
  
  for (const column of requiredColumns) {
    try {
      const created = await createColumnIfNotExists('users', column.name, column.type);
      if (created) {
        results.created.push(column.name);
      } else {
        results.existing.push(column.name);
      }
    } catch (error) {
      console.error(`Failed to ensure column ${column.name}:`, error);
      results.errors.push({ column: column.name, error: error.message });
    }
  }
  
  if (results.created.length > 0) {
    console.log(`✅ Created ${results.created.length} missing profile columns:`, results.created.join(', '));
  }
  
  return results;
}

/**
 * Clear the column existence cache
 * Useful for testing or when schema changes are made
 */
function clearColumnCache() {
  columnCache.clear();
}

/**
 * Get schema health status for the users table
 * @returns {Promise<Object>} Object with missing columns and status
 */
// Note: getSchemaHealth removed - unused

module.exports = {
  columnExists,
  createColumnIfNotExists,
  ensureProfileColumnsExist,
  clearColumnCache,
  // Note: getSchemaHealth removed - unused
};

