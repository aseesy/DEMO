/**
 * Debug Service
 *
 * Actor: Operations
 * Responsibility: Debug data retrieval for development/diagnostics
 *
 * Methods extracted from routes/admin.js debug endpoints.
 */

const { BaseService } = require('../BaseService');
const { NotFoundError, AuthorizationError } = require('../errors');

class DebugService extends BaseService {
  constructor() {
    super(null); // Queries multiple tables
  }

  /**
   * Get all users with basic info
   * @returns {Promise<{users: Array, count: number}>}
   */
  async getUsers() {
    const users = await this.query(`
      SELECT
        id,
        username,
        email,
        created_at,
        last_login
      FROM users
      ORDER BY created_at DESC
    `);

    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email || null,
      created_at: user.created_at,
      last_login: user.last_login || null,
    }));

    return {
      users: formattedUsers,
      count: formattedUsers.length,
    };
  }

  /**
   * Get all rooms with member counts
   * @returns {Promise<{rooms: Array, count: number}>}
   */
  async getRooms() {
    const rows = await this.query(`
      SELECT
        r.id,
        r.name,
        r.created_by,
        u.username as created_by_username,
        r.is_private,
        r.created_at,
        COUNT(CASE WHEN u2.id IS NOT NULL THEN 1 END) as member_count
      FROM rooms r
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN room_members rm ON r.id = rm.room_id
      LEFT JOIN users u2 ON rm.user_id = u2.id
      GROUP BY r.id, r.name, r.created_by, u.username, r.is_private, r.created_at
      ORDER BY r.created_at DESC
    `);

    const rooms = rows.map(room => ({
      id: room.id,
      name: room.name,
      created_by: room.created_by,
      created_by_username: room.created_by_username,
      is_private: room.is_private,
      created_at: room.created_at,
      member_count: parseInt(room.member_count) || 0,
    }));

    return {
      rooms,
      count: rooms.length,
    };
  }

  /**
   * Get tasks for a specific user
   * @param {number} userId - User ID to get tasks for
   * @param {number} requestingUserId - User making the request (for authorization)
   * @returns {Promise<Object>} Task diagnostic info
   */
  async getUserTasks(userId, requestingUserId) {
    // Authorization check
    if (userId !== requestingUserId) {
      throw new AuthorizationError('You can only check your own tasks');
    }

    const tasks = await this.query(
      `SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const user = await this.queryOne(
      `SELECT username FROM users WHERE id = $1`,
      [userId]
    );

    return {
      userId,
      username: user?.username || 'unknown',
      totalTasks: tasks.length,
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        created_at: t.created_at,
        completed_at: t.completed_at,
      })),
      openTasks: tasks.filter(t => t.status === 'open').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      welcomeTaskExists: tasks.some(t => t.title === 'Welcome to LiaiZen'),
      onboardingTasksExist: {
        'Complete Your Profile': tasks.some(t => t.title === 'Complete Your Profile'),
        'Add Your Co-parent': tasks.some(t => t.title === 'Add Your Co-parent'),
        'Add Your Children': tasks.some(t => t.title === 'Add Your Children'),
      },
    };
  }

  /**
   * Get messages for a room with diagnostics
   * @param {string} roomId - Room ID
   * @param {number} requestingUserId - User making request
   * @param {Function} getRoomMembers - Function to get room members (injected)
   * @returns {Promise<Object>} Message diagnostic info
   */
  async getRoomMessages(roomId, requestingUserId, getRoomMembers) {
    // Check membership
    const members = await getRoomMembers(roomId);
    const isMember = members.some(
      m => m.user_id === requestingUserId || m.id === requestingUserId
    );

    if (!isMember) {
      throw new AuthorizationError('You are not a member of this room');
    }

    const messages = await this.query(
      `SELECT * FROM messages WHERE room_id = $1 ORDER BY timestamp ASC`,
      [roomId]
    );

    const welcomeMessages = messages.filter(
      m =>
        m.type === 'ai_comment' &&
        m.username === 'LiaiZen' &&
        (m.id?.startsWith('liaizen_welcome_') || m.text?.includes('LiaiZen'))
    );

    const room = await this.queryOne(
      `SELECT name FROM rooms WHERE id = $1`,
      [roomId]
    );

    return {
      roomId,
      roomName: room?.name || 'unknown',
      totalMessages: messages.length,
      welcomeMessages: welcomeMessages.length,
      messages: messages.map(m => ({
        id: m.id,
        type: m.type,
        username: m.username,
        text: m.text?.substring(0, 100) || '',
        timestamp: m.timestamp,
        isWelcome: m.type === 'ai_comment' && m.username === 'LiaiZen',
      })),
      welcomeMessageDetails: welcomeMessages.map(m => ({
        id: m.id,
        text: m.text,
        timestamp: m.timestamp,
        room_id: m.room_id,
      })),
    };
  }

  /**
   * Get all pending connections
   * @returns {Promise<{connections: Array, count: number}>}
   */
  async getPendingConnections() {
    const rows = await this.query(`
      SELECT
        pc.id,
        pc.inviter_id,
        u1.username as inviter_username,
        pc.invitee_email,
        pc.token,
        pc.status,
        pc.room_id,
        pc.created_at,
        pc.expires_at
      FROM pending_connections pc
      LEFT JOIN users u1 ON pc.inviter_id = u1.id
      ORDER BY pc.created_at DESC
    `);

    const connections = rows.map(conn => ({
      id: conn.id,
      inviter_id: conn.inviter_id,
      inviter_username: conn.inviter_username,
      invitee_email: conn.invitee_email,
      token: conn.token,
      status: conn.status,
      room_id: conn.room_id,
      created_at: conn.created_at,
      expires_at: conn.expires_at,
      is_expired: conn.expires_at ? new Date(conn.expires_at) < new Date() : false,
    }));

    return {
      connections,
      count: connections.length,
    };
  }

  /**
   * Debug pairing status for a specific user
   * @param {number} userId - User to debug
   * @returns {Promise<Object>} Pairing debug info
   */
  async debugPairings(userId = 1) {
    const pairings = await this.query(
      `
      SELECT ps.*,
             ua.username as parent_a_username, ua.email as parent_a_email,
             ub.username as parent_b_username, ub.email as parent_b_email
      FROM pairing_sessions ps
      JOIN users ua ON ps.parent_a_id = ua.id
      LEFT JOIN users ub ON ps.parent_b_id = ub.id
      WHERE ps.parent_a_id = $1 OR ps.parent_b_id = $1
      ORDER BY ps.created_at DESC
      LIMIT 5
    `,
      [userId]
    );

    const rooms = await this.query(
      `
      SELECT r.id, r.name, r.created_by, rm.user_id, rm.role, u.username
      FROM rooms r
      JOIN room_members rm ON r.id = rm.room_id
      JOIN users u ON rm.user_id = u.id
      WHERE r.id IN (SELECT room_id FROM room_members WHERE user_id = $1)
    `,
      [userId]
    );

    const users = await this.query(
      'SELECT id, username, email FROM users ORDER BY id LIMIT 10'
    );

    return {
      pairings,
      rooms,
      users,
    };
  }
}

// Export singleton instance
const debugService = new DebugService();

module.exports = { debugService, DebugService };
