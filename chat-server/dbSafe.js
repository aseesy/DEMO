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

// ============================================================================
// TRANSACTION SUPPORT
// ============================================================================

/**
 * Execute a function within a PostgreSQL transaction
 * Automatically commits on success, rolls back on error
 *
 * @param {Function} fn - Async function receiving (client) parameter
 * @returns {Promise<any>} Result of fn
 *
 * @example
 * const result = await withTransaction(async (client) => {
 *   const userId = await safeInsertTx(client, 'users', { email: 'test@test.com' });
 *   await safeInsertTx(client, 'contacts', { user_id: userId, ... });
 *   return userId;
 * });
 */
async function withTransaction(fn) {
  const client = await dbPostgres.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Begin a PostgreSQL transaction manually
 * Remember to call commitTransaction or rollbackTransaction when done
 *
 * @returns {Promise<pg.PoolClient>} Client with active transaction
 */
async function beginTransaction() {
  const client = await dbPostgres.connect();
  await client.query('BEGIN');
  return client;
}

/**
 * Commit a transaction and release the client
 * @param {pg.PoolClient} client - Client with active transaction
 */
async function commitTransaction(client) {
  try {
    await client.query('COMMIT');
  } finally {
    client.release();
  }
}

/**
 * Rollback a transaction and release the client
 * @param {pg.PoolClient} client - Client with active transaction
 */
async function rollbackTransaction(client) {
  try {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
}

// ============================================================================
// TRANSACTION-AWARE SAFE FUNCTIONS
// These accept a client parameter to run within a transaction
// ============================================================================

/**
 * Safe SELECT within a transaction
 * @param {pg.PoolClient} client - Transaction client
 * @param {string} table - Table name
 * @param {Object} conditions - WHERE conditions
 * @param {Object} options - Query options
 */
async function safeSelectTx(client, table, conditions = {}, options = {}) {
  const safeTable = escapeIdentifier(table);

  let query = `SELECT * FROM ${safeTable}`;
  const params = [];
  const whereClauses = [];
  let paramIndex = 1;

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

  if (options.orderBy) {
    query += ` ORDER BY ${escapeIdentifier(options.orderBy)}`;
    if (options.orderDirection && (options.orderDirection.toUpperCase() === 'ASC' || options.orderDirection.toUpperCase() === 'DESC')) {
      query += ` ${options.orderDirection.toUpperCase()}`;
    }
  }

  if (options.limit && Number.isInteger(options.limit) && options.limit > 0) {
    query += ` LIMIT $${paramIndex}`;
    params.push(options.limit);
  }

  const result = await client.query(query, params);
  return result.rows;
}

/**
 * Safe INSERT within a transaction
 * @param {pg.PoolClient} client - Transaction client
 * @param {string} table - Table name
 * @param {Object} data - Data to insert
 * @returns {Promise<number|string|null>} Inserted primary key
 */
async function safeInsertTx(client, table, data) {
  const safeTable = escapeIdentifier(table);

  const columns = Object.keys(data).map(escapeIdentifier);
  const params = Object.values(data);
  const placeholders = params.map((_, index) => `$${index + 1}`);

  let primaryKeyColumn = 'id';
  if (table === 'user_context') {
    primaryKeyColumn = 'user_id';
  } else if (table === 'rooms') {
    primaryKeyColumn = 'id';
  } else if (table === 'room_invites') {
    primaryKeyColumn = 'id';
  }

  const query = `INSERT INTO ${safeTable} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING ${escapeIdentifier(primaryKeyColumn)}`;

  try {
    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0][primaryKeyColumn] ?? null;
  } catch (error) {
    if (error.message && error.message.includes('does not exist')) {
      const queryWithoutReturning = `INSERT INTO ${safeTable} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
      await client.query(queryWithoutReturning, params);
      return null;
    }
    throw error;
  }
}

/**
 * Safe UPDATE within a transaction
 * @param {pg.PoolClient} client - Transaction client
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @param {Object} conditions - WHERE conditions
 */
async function safeUpdateTx(client, table, data, conditions) {
  const safeTable = escapeIdentifier(table);

  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  for (const [column, value] of Object.entries(data)) {
    const safeColumn = escapeIdentifier(column);
    setClauses.push(`${safeColumn} = $${paramIndex}`);
    params.push(value);
    paramIndex++;
  }

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
  await client.query(query, params);
}

/**
 * Safe DELETE within a transaction
 * @param {pg.PoolClient} client - Transaction client
 * @param {string} table - Table name
 * @param {Object} conditions - WHERE conditions
 */
async function safeDeleteTx(client, table, conditions) {
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
  await client.query(query, params);
}

/**
 * Execute a raw query within a transaction
 * @param {pg.PoolClient} client - Transaction client
 * @param {string} query - SQL query with $1, $2, etc. placeholders
 * @param {Array} params - Array of parameter values
 */
async function safeExecTx(client, query, params = []) {
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

  const result = await client.query(query, params);
  return result.rows;
}

module.exports = {
  // Original functions (use pool directly)
  escapeIdentifier,
  safeSelect,
  safeInsert,
  safeUpdate,
  safeDelete,
  safeExec,
  parseResult,

  // Transaction management
  withTransaction,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,

  // Transaction-aware functions
  safeSelectTx,
  safeInsertTx,
  safeUpdateTx,
  safeDeleteTx,
  safeExecTx
};
