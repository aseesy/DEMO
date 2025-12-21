/**
 * Safe SELECT Queries
 */
const dbPostgres = require('../dbPostgres');
const { escapeIdentifier } = require('./utils');

async function safeSelect(table, conditions = {}, options = {}) {
  const safeTable = escapeIdentifier(table);
  let query = `SELECT * FROM ${safeTable}`;
  const params = [];
  const whereClauses = [];
  let paramIndex = 1;

  if (Object.keys(conditions).length > 0) {
    for (const [column, value] of Object.entries(conditions)) {
      const safeColumn = escapeIdentifier(column);
      if (Array.isArray(value)) {
        const valuePlaceholders = value.map(() => `$${paramIndex++}`);
        whereClauses.push(`${safeColumn} IN (${valuePlaceholders.join(', ')})`);
        params.push(...value);
      } else if (value === null || value === undefined) {
        whereClauses.push(`${safeColumn} IS NULL`);
      } else {
        whereClauses.push(`${safeColumn} = $${paramIndex++}`);
        params.push(value);
      }
    }
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  if (options.orderBy) {
    query += ` ORDER BY ${escapeIdentifier(options.orderBy)} ${options.orderDirection?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
  }

  if (options.limit) {
    query += ` LIMIT $${paramIndex++}`;
    params.push(options.limit);
  }

  try {
    const result = await dbPostgres.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Safe select error:', error.message);
    throw error;
  }
}

module.exports = { safeSelect };
