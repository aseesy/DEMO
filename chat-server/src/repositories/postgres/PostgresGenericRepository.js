/**
 * PostgreSQL Generic Repository Implementation
 *
 * Implements IGenericRepository using PostgreSQL database.
 * Moves database-specific code from services to repository layer.
 *
 * @module repositories/postgres/PostgresGenericRepository
 */

const { IGenericRepository } = require('../interfaces/IGenericRepository');
const db = require('../../../dbPostgres');
const {
  safeSelect,
  safeInsert,
  safeUpdate,
  safeDelete,
  withTransaction,
} = require('../../../dbSafe');

/**
 * PostgreSQL implementation of generic repository
 * Provides CRUD operations using PostgreSQL database
 */
class PostgresGenericRepository extends IGenericRepository {
  /**
   * @param {string} tableName - Database table name
   */
  constructor(tableName) {
    super();
    if (!tableName) {
      throw new Error('tableName is required for PostgresGenericRepository');
    }
    this.tableName = tableName;
  }

  /**
   * Find multiple records by conditions
   */
  async find(conditions = {}, options = {}) {
    return safeSelect(this.tableName, conditions, options);
  }

  /**
   * Find single record by conditions
   */
  async findOne(conditions = {}) {
    const results = await this.find(conditions, { limit: 1 });
    return results[0] || null;
  }

  /**
   * Find single record by ID
   */
  async findById(id) {
    return this.findOne({ id });
  }

  /**
   * Create a new record
   */
  async create(data) {
    return safeInsert(this.tableName, data);
  }

  /**
   * Update records matching conditions
   */
  async update(conditions, data) {
    // safeUpdate expects (table, data, conditions) - note the order!
    return safeUpdate(this.tableName, data, conditions);
  }

  /**
   * Update single record by ID
   */
  async updateById(id, data) {
    const results = await this.update({ id }, data);
    return results[0] || null;
  }

  /**
   * Delete records matching conditions
   */
  async delete(conditions = {}) {
    return safeDelete(this.tableName, conditions);
  }

  /**
   * Delete single record by ID
   */
  async deleteById(id) {
    const results = await this.delete({ id });
    return results[0] || null;
  }

  /**
   * Check if record exists
   */
  async exists(conditions) {
    const record = await this.findOne(conditions);
    return !!record;
  }

  /**
   * Count records matching conditions
   */
  async count(conditions = {}) {
    let sql = `SELECT COUNT(*) as count FROM "${this.tableName}"`;
    const params = [];
    const whereClauses = [];
    let paramIndex = 1;

    for (const [column, value] of Object.entries(conditions)) {
      whereClauses.push(`"${column}" = $${paramIndex++}`);
      params.push(value);
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const result = await this.queryOne(sql, params);
    return parseInt(result.count, 10);
  }

  /**
   * Execute raw query
   */
  async query(sql, params = []) {
    const result = await db.query(sql, params);
    return result.rows;
  }

  /**
   * Execute raw query and return single row
   */
  async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  /**
   * Execute callback within a transaction
   */
  async transaction(callback) {
    return withTransaction(callback);
  }
}

module.exports = { PostgresGenericRepository };

