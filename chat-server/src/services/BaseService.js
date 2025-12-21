/**
 * Base Service Class
 *
 * Provides common database operations and utilities for all services.
 * Services should extend this class and add domain-specific methods.
 *
 * Uses Repository Pattern for Dependency Inversion Principle compliance.
 * Services depend on repository interface, not concrete database implementation.
 *
 * Example:
 *   class InvitationService extends BaseService {
 *     constructor() {
 *       super('invitations');
 *     }
 *
 *     async getByToken(token) {
 *       return this.findOne({ token, status: 'pending' });
 *     }
 *   }
 *
 * Example with injected repository:
 *   const repository = new PostgresGenericRepository('invitations');
 *   class InvitationService extends BaseService {
 *     constructor() {
 *       super(null, repository);
 *     }
 *   }
 */

const { IGenericRepository } = require('../repositories/interfaces/IGenericRepository');
const { PostgresGenericRepository } = require('../repositories/postgres/PostgresGenericRepository');
const { NotFoundError } = require('./errors');

class BaseService {
  /**
   * @param {string} [tableName] - Primary table this service operates on (for backward compatibility)
   * @param {IGenericRepository} [repository] - Repository instance (if not provided, creates PostgresGenericRepository)
   */
  constructor(tableName = null, repository = null) {
    this.tableName = tableName;
    
    // Use injected repository or create one for backward compatibility
    if (repository) {
      if (!(repository instanceof IGenericRepository)) {
        throw new Error('Repository must implement IGenericRepository interface');
      }
      this.repository = repository;
    } else if (tableName) {
      // Backward compatibility: create repository automatically
      this.repository = new PostgresGenericRepository(tableName);
    } else {
      // No tableName and no repository - repository must be set later
      this.repository = null;
    }
  }

  /**
   * Set repository (for cases where repository is injected after construction)
   * @param {IGenericRepository} repository - Repository instance
   */
  setRepository(repository) {
    if (!(repository instanceof IGenericRepository)) {
      throw new Error('Repository must implement IGenericRepository interface');
    }
    this.repository = repository;
  }

  /**
   * Ensure repository is available
   */
  _ensureRepository() {
    if (!this.repository) {
      throw new Error(
        `${this.constructor.name}: Repository not set. Either provide tableName in constructor or inject repository via setRepository().`
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Raw Query Access (for complex queries)
  // ─────────────────────────────────────────────────────────────

  /**
   * Execute raw parameterized query
   * @param {string} sql - SQL with $1, $2 placeholders
   * @param {Array} params - Parameter values
   * @returns {Promise<Array>} Query results
   */
  async query(sql, params = []) {
    this._ensureRepository();
    return this.repository.query(sql, params);
  }

  /**
   * Execute raw query and return single row or null
   */
  async queryOne(sql, params = []) {
    this._ensureRepository();
    return this.repository.queryOne(sql, params);
  }

  /**
   * Execute raw query and return single row or throw NotFoundError
   */
  async queryOneOrFail(sql, params = [], resourceName = 'Record') {
    const row = await this.queryOne(sql, params);
    if (!row) {
      throw new NotFoundError(resourceName);
    }
    return row;
  }

  // ─────────────────────────────────────────────────────────────
  // Safe CRUD Operations (using dbSafe utilities)
  // ─────────────────────────────────────────────────────────────

  /**
   * Find multiple records by conditions
   * @param {Object} conditions - Column/value pairs for WHERE clause
   * @param {Object} options - { orderBy, orderDirection, limit }
   */
  async find(conditions = {}, options = {}) {
    this._ensureRepository();
    return this.repository.find(conditions, options);
  }

  /**
   * Find single record by conditions
   */
  async findOne(conditions = {}) {
    this._ensureRepository();
    return this.repository.findOne(conditions);
  }

  /**
   * Find single record or throw NotFoundError
   */
  async findOneOrFail(conditions = {}, resourceName = null) {
    const record = await this.findOne(conditions);
    if (!record) {
      throw new NotFoundError(resourceName || this.tableName || 'Record');
    }
    return record;
  }

  /**
   * Find record by ID
   */
  async findById(id) {
    this._ensureRepository();
    return this.repository.findById(id);
  }

  /**
   * Find record by ID or throw NotFoundError
   */
  async findByIdOrFail(id, resourceName = null) {
    return this.findOneOrFail({ id }, resourceName);
  }

  /**
   * Insert new record
   * @param {Object} data - Column/value pairs to insert
   * @returns {Object} Inserted record with ID
   */
  async create(data) {
    this._ensureRepository();
    return this.repository.create(data);
  }

  /**
   * Update records matching conditions
   * @param {Object} conditions - WHERE clause conditions
   * @param {Object} data - Column/value pairs to update
   * @returns {Array} Updated records
   */
  async update(conditions, data) {
    this._ensureRepository();
    return this.repository.update(conditions, data);
  }

  /**
   * Update single record by ID
   */
  async updateById(id, data) {
    this._ensureRepository();
    return this.repository.updateById(id, data);
  }

  /**
   * Delete records matching conditions
   * @param {Object} conditions - WHERE clause conditions
   * @returns {Array} Deleted records
   */
  async delete(conditions) {
    this._ensureRepository();
    return this.repository.delete(conditions);
  }

  /**
   * Delete single record by ID
   */
  async deleteById(id) {
    this._ensureRepository();
    return this.repository.deleteById(id);
  }

  // ─────────────────────────────────────────────────────────────
  // Transaction Support
  // ─────────────────────────────────────────────────────────────

  /**
   * Execute callback within a database transaction
   * @param {Function} callback - Async function receiving transaction client
   * @returns {Promise<any>} Result of callback
   *
   * Example:
   *   await this.transaction(async (client) => {
   *     await client.query('INSERT INTO ...', [...]);
   *     await client.query('UPDATE ...', [...]);
   *   });
   */
  async transaction(callback) {
    this._ensureRepository();
    return this.repository.transaction(callback);
  }

  // ─────────────────────────────────────────────────────────────
  // Utility Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Check if record exists
   */
  async exists(conditions) {
    this._ensureRepository();
    return this.repository.exists(conditions);
  }

  /**
   * Count records matching conditions
   */
  async count(conditions = {}) {
    this._ensureRepository();
    return this.repository.count(conditions);
  }
}

module.exports = { BaseService };
