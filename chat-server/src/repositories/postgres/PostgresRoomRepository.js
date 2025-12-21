/**
 * PostgreSQL Room Repository Implementation
 *
 * Implements IRoomRepository using PostgreSQL database.
 * Moves room-specific SQL queries from services to repository layer.
 *
 * @module repositories/postgres/PostgresRoomRepository
 */

const { IRoomRepository } = require('../interfaces/IRoomRepository');
const { PostgresGenericRepository } = require('./PostgresGenericRepository');

/**
 * PostgreSQL implementation of room repository
 */
class PostgresRoomRepository extends PostgresGenericRepository {
  constructor() {
    super('rooms');
  }

  /**
   * Get room members count
   */
  async getMemberCount(roomId) {
    const result = await this.queryOne(
      'SELECT COUNT(*) as count FROM room_members WHERE room_id = $1',
      [roomId]
    );
    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Get rooms for a user
   */
  async findByUserId(userId) {
    return this.query(
      `SELECT r.id, r.name, r.created_by, rm.user_id, rm.role, u.username
       FROM rooms r
       JOIN room_members rm ON r.id = rm.room_id
       JOIN users u ON rm.user_id = u.id
       WHERE r.id IN (SELECT room_id FROM room_members WHERE user_id = $1)`,
      [userId]
    );
  }

  /**
   * Get shared rooms (rooms with multiple members)
   */
  async findSharedRooms(userId) {
    return this.query(
      `SELECT COUNT(rm2.user_id) as member_count
       FROM rooms r
       JOIN room_members rm ON r.id = rm.room_id
       JOIN room_members rm2 ON r.id = rm2.room_id
       WHERE rm.user_id = $1
       GROUP BY r.id
       HAVING COUNT(rm2.user_id) > 1
       LIMIT 1`,
      [userId]
    );
  }
}

module.exports = { PostgresRoomRepository };

