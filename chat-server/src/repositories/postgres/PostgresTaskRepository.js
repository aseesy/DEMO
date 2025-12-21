/**
 * PostgreSQL Task Repository Implementation
 *
 * Implements ITaskRepository using PostgreSQL database.
 * Moves task-specific SQL queries from services to repository layer.
 *
 * @module repositories/postgres/PostgresTaskRepository
 */

const { ITaskRepository } = require('../interfaces/ITaskRepository');
const { PostgresGenericRepository } = require('./PostgresGenericRepository');

/**
 * PostgreSQL implementation of task repository
 */
class PostgresTaskRepository extends PostgresGenericRepository {
  constructor() {
    super('tasks');
  }

  /**
   * Find tasks for a user
   */
  async findByUserId(userId, options = {}) {
    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (options.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(options.status);
    }

    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
      if (options.orderDirection) {
        query += ` ${options.orderDirection}`;
      }
    } else {
      query += ' ORDER BY created_at DESC';
    }

    if (options.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }

    return this.query(query, params);
  }

  /**
   * Find tasks assigned to a user
   */
  async findAssignedTo(userId) {
    return this.findOne({ assigned_to: userId });
  }
}

module.exports = { PostgresTaskRepository };

