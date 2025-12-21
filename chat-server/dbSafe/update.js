/**
 * Safe UPDATE and DELETE Queries
 */
const dbPostgres = require('../dbPostgres');
const { escapeIdentifier } = require('./utils');

async function safeUpdate(table, data, conditions) {
  const safeTable = escapeIdentifier(table);
  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  for (const [col, val] of Object.entries(data)) {
    setClauses.push(`${escapeIdentifier(col)} = $${paramIndex++}`);
    params.push(val);
  }

  const whereClauses = [];
  for (const [col, val] of Object.entries(conditions)) {
    whereClauses.push(`${escapeIdentifier(col)} = $${paramIndex++}`);
    params.push(val);
  }

  const query = `UPDATE ${safeTable} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`;

  try {
    const result = await dbPostgres.query(query, params);
    return result.rowCount;
  } catch (error) {
    console.error('Safe update error:', error.message);
    throw error;
  }
}

async function safeDelete(table, conditions) {
  const safeTable = escapeIdentifier(table);
  const whereClauses = [];
  const params = [];
  let paramIndex = 1;

  for (const [col, val] of Object.entries(conditions)) {
    whereClauses.push(`${escapeIdentifier(col)} = $${paramIndex++}`);
    params.push(val);
  }

  const query = `DELETE FROM ${safeTable} WHERE ${whereClauses.join(' AND ')}`;

  try {
    const result = await dbPostgres.query(query, params);
    return result.rowCount;
  } catch (error) {
    console.error('Safe delete error:', error.message);
    throw error;
  }
}

module.exports = { safeUpdate, safeDelete };
