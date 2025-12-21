/**
 * Generic Repository Interface
 *
 * Base interface for all repositories providing common CRUD operations.
 * Implements Dependency Inversion Principle - services depend on this interface.
 *
 * @module repositories/interfaces/IGenericRepository
 */

/**
 * Generic repository interface for CRUD operations
 * All repositories should implement these methods
 */
class IGenericRepository {
  /**
   * Find multiple records by conditions
   * @param {Object} conditions - Column/value pairs for WHERE clause
   * @param {Object} options - { orderBy, orderDirection, limit }
   * @returns {Promise<Array>} Array of records
   */
  async find(conditions = {}, options = {}) {
    throw new Error('find() must be implemented by subclass');
  }

  /**
   * Find single record by conditions
   * @param {Object} conditions - Column/value pairs for WHERE clause
   * @returns {Promise<Object|null>} Record or null
   */
  async findOne(conditions = {}) {
    throw new Error('findOne() must be implemented by subclass');
  }

  /**
   * Find single record by ID
   * @param {number|string} id - Record ID
   * @returns {Promise<Object|null>} Record or null
   */
  async findById(id) {
    throw new Error('findById() must be implemented by subclass');
  }

  /**
   * Create a new record
   * @param {Object} data - Column/value pairs to insert
   * @returns {Promise<Object>} Created record with ID
   */
  async create(data) {
    throw new Error('create() must be implemented by subclass');
  }

  /**
   * Update records matching conditions
   * @param {Object} conditions - WHERE clause conditions
   * @param {Object} data - Column/value pairs to update
   * @returns {Promise<Array>} Updated records
   */
  async update(conditions, data) {
    throw new Error('update() must be implemented by subclass');
  }

  /**
   * Update single record by ID
   * @param {number|string} id - Record ID
   * @param {Object} data - Column/value pairs to update
   * @returns {Promise<Object|null>} Updated record or null
   */
  async updateById(id, data) {
    throw new Error('updateById() must be implemented by subclass');
  }

  /**
   * Delete records matching conditions
   * @param {Object} conditions - WHERE clause conditions
   * @returns {Promise<Array>} Deleted records
   */
  async delete(conditions = {}) {
    throw new Error('delete() must be implemented by subclass');
  }

  /**
   * Delete single record by ID
   * @param {number|string} id - Record ID
   * @returns {Promise<Object|null>} Deleted record or null
   */
  async deleteById(id) {
    throw new Error('deleteById() must be implemented by subclass');
  }

  /**
   * Check if record exists
   * @param {Object} conditions - WHERE clause conditions
   * @returns {Promise<boolean>} True if exists
   */
  async exists(conditions) {
    throw new Error('exists() must be implemented by subclass');
  }

  /**
   * Count records matching conditions
   * @param {Object} conditions - WHERE clause conditions
   * @returns {Promise<number>} Count
   */
  async count(conditions = {}) {
    throw new Error('count() must be implemented by subclass');
  }

  /**
   * Execute raw query (for complex queries that don't fit CRUD pattern)
   * @param {string} sql - SQL query with placeholders
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  async query(sql, params = []) {
    throw new Error('query() must be implemented by subclass');
  }

  /**
   * Execute raw query and return single row
   * @param {string} sql - SQL query with placeholders
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|null>} Single row or null
   */
  async queryOne(sql, params = []) {
    throw new Error('queryOne() must be implemented by subclass');
  }

  /**
   * Execute callback within a transaction
   * @param {Function} callback - Async function receiving transaction client
   * @returns {Promise<any>} Result of callback
   */
  async transaction(callback) {
    throw new Error('transaction() must be implemented by subclass');
  }
}

module.exports = { IGenericRepository };

