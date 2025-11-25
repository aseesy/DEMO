/**
 * Safe Database Query Builder for PostgreSQL
 * 
 * This module provides safe methods for building SQL queries that prevent SQL injection
 * using PostgreSQL parameterized queries.
 */

const dbPostgres = require('./dbPostgres');

// Check if we're using PostgreSQL
const usePostgres = !!process.env.DATABASE_URL;

if (!usePostgres) {
  console.error('❌ ERROR: DATABASE_URL not set. PostgreSQL is required.');
  console.error('❌ This application now requires PostgreSQL in all environments.');
  throw new Error('DATABASE_URL must be set. PostgreSQL is required.');
}

/**
 * Escape SQL identifier (table/column names) - PostgreSQL uses double quotes
 */
function escapeIdentifier(identifier) {
  if (typeof identifier !== 'string') {
    throw new Error('Identifier must be a string');
  }
  // Only allow alphanumeric, underscore, dollar sign
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(identifier)) {
    throw new Error(`Invalid identifier: ${identifier}`);
  }
  // PostgreSQL uses double quotes for identifiers
  return `"${identifier}"`;
}

/**
 * Build a safe SELECT query using PostgreSQL parameterized queries
 * @param {string} table - Table name (will be validated)
 * @param {Object} conditions - WHERE conditions object {column: value}
 * @param {Object} options - Query options {limit, orderBy, orderDirection}
 */
async function safeSelect(table, conditions = {}, options = {}) {
  const safeTable = escapeIdentifier(table);
  
  let query = `SELECT * FROM ${safeTable}`;
  const params = [];
  const whereClauses = [];
  let paramIndex = 1;
  
  // Build WHERE clause with parameterized queries
  if (Object.keys(conditions).length > 0) {
    for (const [column, value] of Object.entries(conditions)) {
      const safeColumn = escapeIdentifier(column);
      if (value === null || value === undefined) {
        whereClauses.push(`${safeColumn} IS NULL`);
      } else {
        whereClauses.push(`${safeColumn} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }
  
  // Add ORDER BY
  if (options.orderBy) {
    query += ` ORDER BY ${escapeIdentifier(options.orderBy)}`;
    if (options.orderDirection && (options.orderDirection.toUpperCase() === 'ASC' || options.orderDirection.toUpperCase() === 'DESC')) {
      query += ` ${options.orderDirection.toUpperCase()}`;
    }
  }
  
  // Add LIMIT
  if (options.limit && Number.isInteger(options.limit) && options.limit > 0) {
    query += ` LIMIT $${paramIndex}`;
    params.push(options.limit);
  }
  
  try {
    const result = await dbPostgres.query(query, params);
    // Return in format compatible with parseResult
    return result.rows;
  } catch (error) {
    console.error('Safe query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Build a safe INSERT query using PostgreSQL parameterized queries
 * @param {string} table - Table name
 * @param {Object} data - Data object {column: value}
 * @returns {Promise<number|string|null>} - The inserted row ID or primary key value
 */
async function safeInsert(table, data) {
  const safeTable = escapeIdentifier(table);
  
  const columns = Object.keys(data).map(escapeIdentifier);
  const params = Object.values(data);
  const placeholders = params.map((_, index) => `$${index + 1}`);
  
  // Determine primary key column name based on table
  // Some tables use 'id' (SERIAL), others use different primary keys
  let primaryKeyColumn = 'id';
  if (table === 'user_context') {
    primaryKeyColumn = 'user_id'; // user_context uses user_id (TEXT) as primary key
  } else if (table === 'rooms') {
    primaryKeyColumn = 'id'; // rooms uses id (TEXT)
  } else if (table === 'room_invites') {
    primaryKeyColumn = 'id'; // room_invites uses id (TEXT)
  }
  
  // Use RETURNING to get the inserted primary key
  const query = `INSERT INTO ${safeTable} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING ${escapeIdentifier(primaryKeyColumn)}`;
  
  try {
    const result = await dbPostgres.query(query, params);
    
    if (result.rows.length === 0) {
      // Some tables might not have a primary key to return, that's okay
      console.warn(`Warning: INSERT did not return a primary key for table ${table}`);
      return null;
    }
    
    const insertedId = result.rows[0][primaryKeyColumn];
    
    if (insertedId === null || insertedId === undefined) {
      console.warn(`Warning: INSERT did not return a valid primary key for table ${table}`);
    }
    
    return insertedId;
  } catch (error) {
    // If RETURNING fails (e.g., column doesn't exist), try without RETURNING
    if (error.message && error.message.includes('does not exist')) {
      console.warn(`Warning: Primary key column '${primaryKeyColumn}' does not exist for table ${table}, inserting without RETURNING`);
      const queryWithoutReturning = `INSERT INTO ${safeTable} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
      await dbPostgres.query(queryWithoutReturning, params);
      return null;
    }
    console.error('Safe insert error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Build a safe UPDATE query using PostgreSQL parameterized queries
 * @param {string} table - Table name
 * @param {Object} data - Data to update {column: value}
 * @param {Object} conditions - WHERE conditions {column: value}
 */
async function safeUpdate(table, data, conditions) {
  const safeTable = escapeIdentifier(table);
  
  const setClauses = [];
  const params = [];
  let paramIndex = 1;
  
  // Build SET clause
  for (const [column, value] of Object.entries(data)) {
    const safeColumn = escapeIdentifier(column);
    setClauses.push(`${safeColumn} = $${paramIndex}`);
    params.push(value);
    paramIndex++;
  }
  
  // Build WHERE clause
  const whereClauses = [];
  for (const [column, value] of Object.entries(conditions)) {
    const safeColumn = escapeIdentifier(column);
    if (value === null || value === undefined) {
      whereClauses.push(`${safeColumn} IS NULL`);
    } else {
      whereClauses.push(`${safeColumn} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }
  
  const query = `UPDATE ${safeTable} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`;
  
  try {
    await dbPostgres.query(query, params);
  } catch (error) {
    console.error('Safe update error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Build a safe DELETE query using PostgreSQL parameterized queries
 * @param {string} table - Table name
 * @param {Object} conditions - WHERE conditions {column: value}
 */
async function safeDelete(table, conditions) {
  const safeTable = escapeIdentifier(table);
  
  const whereClauses = [];
  const params = [];
  let paramIndex = 1;
  
  for (const [column, value] of Object.entries(conditions)) {
    const safeColumn = escapeIdentifier(column);
    if (value === null || value === undefined) {
      whereClauses.push(`${safeColumn} IS NULL`);
    } else {
      whereClauses.push(`${safeColumn} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }
  
  const query = `DELETE FROM ${safeTable} WHERE ${whereClauses.join(' AND ')}`;
  
  try {
    await dbPostgres.query(query, params);
  } catch (error) {
    console.error('Safe delete error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Execute a raw query safely using PostgreSQL parameterized queries
 * @param {string} query - SQL query with $1, $2, etc. placeholders
 * @param {Array} params - Array of parameter values
 */
async function safeExec(query, params = []) {
  // Validate query doesn't contain dangerous patterns
  const dangerousPatterns = [
    /;\s*drop\s+table/i,
    /;\s*truncate/i,
    /;\s*exec/i,
    /;\s*execute/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      throw new Error('Potentially dangerous query detected');
    }
  }
  
  try {
    const result = await dbPostgres.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Safe exec error:', error);
    throw error;
  }
}

/**
 * Helper to parse result rows into objects
 * For PostgreSQL, results are already in the correct format (array of objects)
 */
function parseResult(result) {
  // If result is already an array of objects (PostgreSQL format), return as-is
  if (Array.isArray(result)) {
    return result;
  }
  
  // Legacy SQLite format support (should not be needed, but kept for compatibility)
  if (!result || result.length === 0 || result[0].values.length === 0) {
    return [];
  }
  
  const row = result[0];
  const columns = row.columns;
  
  return row.values.map(values => {
    const obj = {};
    values.forEach((value, index) => {
      obj[columns[index]] = value;
    });
    return obj;
  });
}

module.exports = {
  escapeIdentifier,
  safeSelect,
  safeInsert,
  safeUpdate,
  safeDelete,
  safeExec,
  parseResult
};
