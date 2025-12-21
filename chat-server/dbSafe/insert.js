/**
 * Safe INSERT Queries
 */
const dbPostgres = require('../dbPostgres');
const { escapeIdentifier } = require('./utils');

async function safeInsert(table, data) {
  const safeTable = escapeIdentifier(table);
  const columns = Object.keys(data).map(escapeIdentifier);
  const params = Object.values(data);
  const placeholders = params.map((_, i) => `$${i + 1}`);

  // Some tables don't have 'id' column (e.g., user_context uses user_id)
  const query = `INSERT INTO ${safeTable} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;

  try {
    const result = await dbPostgres.query(query, params);
    // Return id if exists, otherwise return first column value or true
    return result.rows[0]?.id || result.rows[0]?.[Object.keys(data)[0]] || true;
  } catch (error) {
    console.error('Safe insert error:', error.message);
    throw error;
  }
}

async function safeInsertTx(client, table, data) {
  const safeTable = escapeIdentifier(table);
  const columns = Object.keys(data).map(escapeIdentifier);
  const params = Object.values(data);
  const placeholders = params.map((_, i) => `$${i + 1}`);

  // Some tables don't have 'id' column (e.g., user_context uses user_id)
  const query = `INSERT INTO ${safeTable} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
  const result = await client.query(query, params);
  return result.rows[0]?.id || result.rows[0]?.[Object.keys(data)[0]] || true;
}

module.exports = { safeInsert, safeInsertTx };
