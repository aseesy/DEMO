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

  /**
   * Get room members with user details
   */
  async getMembersWithDetails(roomId) {
    const rows = await this.query(
      `SELECT rm.user_id, u.username, u.display_name, u.first_name, u.email, rm.role, rm.joined_at
       FROM room_members rm
       JOIN users u ON rm.user_id = u.id
       WHERE rm.room_id = $1`,
      [roomId]
    );
    return rows.map(row => ({
      userId: row.user_id,
      username: row.username,
      displayName: row.first_name || row.display_name || row.username,
      email: row.email,
      role: row.role,
      joinedAt: row.joined_at,
    }));
  }

  /**
   * Get user's primary room (room with most members, or first joined)
   */
  async getUserPrimaryRoom(userId) {
    const rows = await this.query(
      `SELECT rm.room_id, r.name as room_name, 
              (SELECT COUNT(*) FROM room_members rm2 WHERE rm2.room_id = rm.room_id) as member_count
       FROM room_members rm
       JOIN rooms r ON rm.room_id = r.id
       WHERE rm.user_id = $1
       ORDER BY member_count DESC, rm.joined_at ASC
       LIMIT 1`,
      [userId]
    );
    if (rows.length === 0) return null;
    return {
      roomId: rows[0].room_id,
      roomName: rows[0].room_name,
      memberCount: parseInt(rows[0].member_count, 10),
    };
  }

  /**
   * Add member to room
   */
  async addMember(roomId, userId, role) {
    try {
      await this.query(
        'INSERT INTO room_members (room_id, user_id, role, joined_at) VALUES ($1, $2, $3, $4)',
        [roomId, userId, role, new Date().toISOString()]
      );
      return true;
    } catch (error) {
      // Unique constraint violation means member already exists
      if (error?.code === '23505') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Remove member from room
   */
  async removeMember(roomId, userId) {
    const result = await this.query(
      'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );
    return result.length > 0;
  }

  /**
   * Check if member exists in room
   */
  async memberExists(roomId, userId) {
    const result = await this.queryOne(
      'SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2 LIMIT 1',
      [roomId, userId]
    );
    return !!result;
  }
}

module.exports = { PostgresRoomRepository };
