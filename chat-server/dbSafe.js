/**
 * Safe Database Query Builder
 * 
 * This module provides safe methods for building SQL queries that prevent SQL injection.
 * Since sql.js doesn't support traditional prepared statements, we use a safe parameter
 * substitution approach with proper validation and escaping.
 */

const dbModule = require('./db');

/**
 * Escape SQL string safely
 * This replaces single quotes with double single quotes (SQL standard)
 */
function escapeSQL(str) {
  if (str === null || str === undefined) {
    return 'NULL';
  }
  if (typeof str !== 'string') {
    // Convert to string for non-string values
    str = String(str);
  }
  // Replace single quotes with double single quotes (SQL standard)
  // Also handle other potentially dangerous characters
  return `'${str.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

/**
 * Escape SQL identifier (table/column names)
 * Only allows alphanumeric, underscore, and dollar sign
 */
function escapeIdentifier(identifier) {
  if (typeof identifier !== 'string') {
    throw new Error('Identifier must be a string');
  }
  // Only allow alphanumeric, underscore, dollar sign
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(identifier)) {
    throw new Error(`Invalid identifier: ${identifier}`);
  }
  return identifier;
}

/**
 * Validate and escape a value for SQL
 */
function escapeValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    // Validate number is finite
    if (!isFinite(value)) {
      throw new Error('Invalid number value');
    }
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  if (typeof value === 'string') {
    return escapeSQL(value);
  }
  // For objects/arrays, stringify and escape
  if (typeof value === 'object') {
    return escapeSQL(JSON.stringify(value));
  }
  return escapeSQL(String(value));
}

/**
 * Build a safe SELECT query
 * @param {string} table - Table name (will be validated)
 * @param {Object} conditions - WHERE conditions object {column: value}
 * @param {Object} options - Query options {limit, orderBy, orderDirection}
 */
async function safeSelect(table, conditions = {}, options = {}) {
  const db = await dbModule.getDb();
  const safeTable = escapeIdentifier(table);
  
  let query = `SELECT * FROM ${safeTable}`;
  const whereClauses = [];
  
  // Build WHERE clause
  if (Object.keys(conditions).length > 0) {
    for (const [column, value] of Object.entries(conditions)) {
      const safeColumn = escapeIdentifier(column);
      if (value === null || value === undefined) {
        whereClauses.push(`${safeColumn} IS NULL`);
      } else {
        whereClauses.push(`${safeColumn} = ${escapeValue(value)}`);
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
    query += ` LIMIT ${options.limit}`;
  }
  
  try {
    const result = db.exec(query);
    return result;
  } catch (error) {
    console.error('Safe query error:', error);
    console.error('Query:', query);
    throw error;
  }
}

/**
 * Build a safe INSERT query
 * @param {string} table - Table name
 * @param {Object} data - Data object {column: value}
 */
async function safeInsert(table, data) {
  const db = await dbModule.getDb();
  const safeTable = escapeIdentifier(table);
  
  const columns = Object.keys(data).map(escapeIdentifier);
  const values = Object.values(data).map(escapeValue);
  
  const query = `INSERT INTO ${safeTable} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
  
  try {
    db.run(query);
    
    // Get the inserted ID BEFORE saving (to ensure we get the correct ID)
    const idResult = db.exec('SELECT last_insert_rowid() as id');
    let insertedId = null;
    if (idResult.length > 0 && idResult[0].values.length > 0) {
      insertedId = idResult[0].values[0][0];
    }
    
    // Save database after insert
    dbModule.saveDatabase();
    
    // Validate that we got a valid ID (for tables with AUTOINCREMENT)
    if (insertedId === null || insertedId === 0) {
      // Check if this table has an AUTOINCREMENT primary key
      // For now, we'll return the ID even if it's 0, but log a warning
      console.warn(`Warning: last_insert_rowid() returned ${insertedId} for table ${table}`);
    }
    
    return insertedId;
  } catch (error) {
    console.error('Safe insert error:', error);
    console.error('Query:', query);
    throw error;
  }
}

/**
 * Build a safe UPDATE query
 * @param {string} table - Table name
 * @param {Object} data - Data to update {column: value}
 * @param {Object} conditions - WHERE conditions {column: value}
 */
async function safeUpdate(table, data, conditions) {
  const db = await dbModule.getDb();
  const safeTable = escapeIdentifier(table);
  
  const setClauses = [];
  for (const [column, value] of Object.entries(data)) {
    const safeColumn = escapeIdentifier(column);
    setClauses.push(`${safeColumn} = ${escapeValue(value)}`);
  }
  
  const whereClauses = [];
  for (const [column, value] of Object.entries(conditions)) {
    const safeColumn = escapeIdentifier(column);
    if (value === null || value === undefined) {
      whereClauses.push(`${safeColumn} IS NULL`);
    } else {
      whereClauses.push(`${safeColumn} = ${escapeValue(value)}`);
    }
  }
  
  const query = `UPDATE ${safeTable} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`;
  
  try {
    db.run(query);
    dbModule.saveDatabase();
  } catch (error) {
    console.error('Safe update error:', error);
    console.error('Query:', query);
    throw error;
  }
}

/**
 * Build a safe DELETE query
 * @param {string} table - Table name
 * @param {Object} conditions - WHERE conditions {column: value}
 */
async function safeDelete(table, conditions) {
  const db = await dbModule.getDb();
  const safeTable = escapeIdentifier(table);
  
  const whereClauses = [];
  for (const [column, value] of Object.entries(conditions)) {
    const safeColumn = escapeIdentifier(column);
    if (value === null || value === undefined) {
      whereClauses.push(`${safeColumn} IS NULL`);
    } else {
      whereClauses.push(`${safeColumn} = ${escapeValue(value)}`);
    }
  }
  
  const query = `DELETE FROM ${safeTable} WHERE ${whereClauses.join(' AND ')}`;
  
  try {
    db.run(query);
    dbModule.saveDatabase();
  } catch (error) {
    console.error('Safe delete error:', error);
    console.error('Query:', query);
    throw error;
  }
}

/**
 * Execute a raw query safely (use with caution - only for complex queries)
 * This should only be used for queries that don't involve user input
 */
async function safeExec(query) {
  const db = await dbModule.getDb();
  
  // Validate query doesn't contain dangerous patterns
  const dangerousPatterns = [
    /;\s*drop\s+table/i,
    /;\s*delete\s+from/i,
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
    return db.exec(query);
  } catch (error) {
    console.error('Safe exec error:', error);
    throw error;
  }
}

/**
 * Helper to parse result rows into objects
 */
function parseResult(result) {
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
  escapeSQL,
  escapeIdentifier,
  escapeValue,
  safeSelect,
  safeInsert,
  safeUpdate,
  safeDelete,
  safeExec,
  parseResult
};

