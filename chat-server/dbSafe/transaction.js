/**
 * Database Transaction Management
 */
const dbPostgres = require('../dbPostgres');

async function withTransaction(callback) {
  const client = await dbPostgres.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { withTransaction };
