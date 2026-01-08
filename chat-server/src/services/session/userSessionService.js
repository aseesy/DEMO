/**
 * User Session Service
 *
 * Actor: Socket Connection Management
 * Responsibility: Manage active user sessions for WebSocket connections
 *
 * Phase 1 Reliability Improvement: Database-backed session persistence
 * - Persists sessions to database for recovery on restart
 * - Maintains in-memory cache for fast lookups
 * - Syncs on startup to recover active sessions
 *
 * Encapsulates active user state management:
 * - Register/disconnect users
 * - Query users by socket ID, room ID, email
 * - Prevent direct mutation of internal state
 * - Thread-safe operations
 */

const { BaseService } = require('../BaseService');
const { NotFoundError, ValidationError } = require('../errors');
const dbPostgres = require('../../../dbPostgres');
const {
  getSession,
  setSession,
  deleteSession,
} = require('../../infrastructure/cache/sessionCache');

const { defaultLogger: defaultLogger } = require('../../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'userSessionService',
});

class UserSessionService extends BaseService {
  constructor() {
    super(); // No default table - manages custom state
    // Private: Use Map for O(1) lookups (in-memory cache)
    this._activeUsers = new Map(); // socketId -> user data
    this._initialized = false;
    this._dbAvailable = false;
  }

  /**
   * Initialize service - load sessions from database on startup
   * Called once during server startup
   */
  async initialize() {
    if (this._initialized) {
      return;
    }

    try {
      // Check if database is available
      this._dbAvailable = await dbPostgres.testConnection();

      if (this._dbAvailable) {
        // Check if active_sessions table exists
        const tableCheck = await dbPostgres.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'active_sessions'
          )
        `);

        if (tableCheck.rows[0].exists) {
          // Load active sessions from database
          const result = await dbPostgres.query(`
            SELECT socket_id, user_email, room_id, joined_at, last_activity
            FROM active_sessions
            WHERE expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP
          `);

          // Populate in-memory cache
          for (const row of result.rows) {
            this._activeUsers.set(row.socket_id, {
              socketId: row.socket_id,
              email: row.user_email,
              roomId: row.room_id,
              joinedAt: row.joined_at,
              lastActivity: row.last_activity,
            });
          }

          logger.debug('Log message', {
            value: `[UserSessionService] Loaded ${result.rows.length} sessions from database`,
          });
        } else {
          logger.warn('[UserSessionService] active_sessions table not found - run migration 040');
        }
      } else {
        logger.warn('[UserSessionService] Database not available - using in-memory only');
      }
    } catch (error) {
      logger.error('[UserSessionService] Error initializing', {
        message: error.message,
      });
      // Continue with in-memory only if database fails
      this._dbAvailable = false;
    }

    this._initialized = true;
  }

  /**
   * Register a user session
   * Persists to database and updates in-memory cache
   * @param {string} socketId - Socket ID
   * @param {string} email - User email (primary identifier)
   * @param {string} roomId - Room ID
   * @param {Object} [userInfo] - Optional additional user info (id, first_name, last_name)
   * @returns {Promise<Object>} User data object
   * @throws {ValidationError} If required parameters missing
   */
  async registerUser(socketId, email, roomId, userInfo = {}) {
    if (!socketId) {
      throw new ValidationError('Socket ID is required', 'socketId');
    }
    if (!email) {
      throw new ValidationError('Email is required', 'email');
    }
    if (!roomId) {
      throw new ValidationError('Room ID is required', 'roomId');
    }

    const now = new Date().toISOString();
    const emailLower = email.toLowerCase().trim();

    const userData = {
      id: userInfo.id || null, // User ID for ownership detection
      email: emailLower,
      roomId: roomId,
      joinedAt: now,
      lastActivity: now,
      socketId: socketId,
      first_name: userInfo.first_name || userInfo.firstName || null,
      last_name: userInfo.last_name || userInfo.lastName || null,
    };

    // Update in-memory cache immediately
    this._activeUsers.set(socketId, userData);

    // Cache in Redis for fast lookups (non-blocking)
    setSession(socketId, userData, 300).catch(err => {
      logger.warn('[UserSessionService] Failed to cache session in Redis', {
        message: err.message,
      });
    });

    // Persist to database (non-blocking, fail-open)
    if (this._dbAvailable) {
      try {
        await dbPostgres.query(
          `INSERT INTO active_sessions (socket_id, user_email, room_id, joined_at, last_activity)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (socket_id) 
           DO UPDATE SET 
             user_email = EXCLUDED.user_email,
             room_id = EXCLUDED.room_id,
             last_activity = EXCLUDED.last_activity`,
          [socketId, emailLower, roomId, now, now]
        );
      } catch (error) {
        // Fail-open: log error but continue with in-memory cache
        logger.error('[UserSessionService] Error persisting session to database', {
          message: error.message,
        });
      }
    }

    logger.debug('[UserSessionService] Registered user', {
      ...{
        socketId: socketId.substring(0, 20) + '...',
        email: email,
        roomId: roomId,
        userId: userData.id,
        first_name: userData.first_name,
      },
    });

    return userData;
  }

  /**
   * Get user by socket ID
   * Checks Redis cache first, then in-memory, then database
   * @param {string} socketId - Socket ID
   * @returns {Promise<Object|null>} User data or null if not found
   */
  async getUserBySocketId(socketId) {
    if (!socketId) {
      return null;
    }

    // Check in-memory cache first (fastest)
    const cached = this._activeUsers.get(socketId);
    if (cached) {
      return cached;
    }

    // Check Redis cache (fast)
    try {
      const redisSession = await getSession(socketId);
      if (redisSession) {
        // Update in-memory cache for faster subsequent access
        this._activeUsers.set(socketId, redisSession);
        return redisSession;
      }
    } catch (error) {
      logger.warn('[UserSessionService] Redis cache lookup failed', {
        message: error.message,
      });
    }

    // Fallback to database if needed (slower, but comprehensive)
    if (this._dbAvailable) {
      try {
        const result = await dbPostgres.query(
          'SELECT * FROM active_sessions WHERE socket_id = $1 LIMIT 1',
          [socketId]
        );
        if (result.rows.length > 0) {
          const session = result.rows[0];
          const userData = {
            email: session.user_email,
            roomId: session.room_id,
            joinedAt: session.joined_at,
            lastActivity: session.last_activity,
            socketId: session.socket_id,
          };
          // Update both caches
          this._activeUsers.set(socketId, userData);
          setSession(socketId, userData, 300).catch(() => {});
          return userData;
        }
      } catch (error) {
        logger.warn('[UserSessionService] Database lookup failed', {
          message: error.message,
        });
      }
    }

    return null;
  }

  /**
   * Check if user is active
   * @param {string} socketId - Socket ID
   * @returns {boolean} True if user is active
   */
  isUserActive(socketId) {
    return this._activeUsers.has(socketId);
  }

  /**
   * Disconnect user (remove from active sessions)
   * Removes from database and in-memory cache
   * @param {string} socketId - Socket ID
   * @returns {Promise<boolean>} True if user was removed, false if not found
   */
  async disconnectUser(socketId) {
    if (!socketId) {
      return false;
    }

    const user = this._activeUsers.get(socketId);
    if (user) {
      // Remove from in-memory cache
      this._activeUsers.delete(socketId);

      // Remove from Redis cache (non-blocking)
      deleteSession(socketId).catch(err => {
        logger.warn('[UserSessionService] Failed to delete session from Redis', {
          message: err.message,
        });
      });

      // Remove from database (non-blocking, fail-open)
      if (this._dbAvailable) {
        try {
          await dbPostgres.query('DELETE FROM active_sessions WHERE socket_id = $1', [socketId]);
        } catch (error) {
          // Fail-open: log error but continue
          logger.error('[UserSessionService] Error removing session from database', {
            message: error.message,
          });
        }
      }

      logger.debug('[UserSessionService] Disconnected user', {
        ...{
          socketId: socketId.substring(0, 20) + '...',
          email: user.email,
          roomId: user.roomId,
        },
      });
      return true;
    }

    return false;
  }

  /**
   * Disconnect duplicate connections for a user
   * Keeps the current socketId, removes others with same email/roomId
   * @param {string} currentSocketId - Socket ID to keep
   * @param {string} email - User email
   * @param {string} roomId - Room ID
   * @returns {Promise<Array<string>>} Array of disconnected socket IDs
   */
  async disconnectDuplicates(currentSocketId, email, roomId) {
    const disconnected = [];
    const emailLower = email.toLowerCase().trim();

    for (const [socketId, userData] of this._activeUsers.entries()) {
      if (
        socketId !== currentSocketId &&
        userData.email === emailLower &&
        userData.roomId === roomId
      ) {
        // Remove from in-memory cache
        this._activeUsers.delete(socketId);
        disconnected.push(socketId);
      }
    }

    // Remove from database (non-blocking, fail-open)
    if (disconnected.length > 0 && this._dbAvailable) {
      try {
        await dbPostgres.query('DELETE FROM active_sessions WHERE socket_id = ANY($1)', [
          disconnected,
        ]);
      } catch (error) {
        logger.error('[UserSessionService] Error removing duplicates from database', {
          message: error.message,
        });
      }
    }

    if (disconnected.length > 0) {
      logger.debug('[UserSessionService] Disconnected duplicate connections', {
        ...{
          email: emailLower,
          roomId,
          count: disconnected.length,
        },
      });
    }

    return disconnected;
  }

  /**
   * Get all users in a room
   * @param {string} roomId - Room ID
   * @returns {Array<Object>} Array of user data objects
   */
  getUsersInRoom(roomId) {
    if (!roomId) {
      return [];
    }

    const users = [];
    for (const userData of this._activeUsers.values()) {
      if (userData.roomId === roomId) {
        users.push(userData);
      }
    }

    return users;
  }

  /**
   * Get all active users (for debugging/admin)
   * @returns {Array<Object>} Array of all user data objects
   */
  getAllUsers() {
    return Array.from(this._activeUsers.values());
  }

  /**
   * Get count of active users
   * @returns {number} Number of active users
   */
  getActiveUserCount() {
    return this._activeUsers.size;
  }

  /**
   * Get count of users in a room
   * @param {string} roomId - Room ID
   * @returns {number} Number of users in room
   */
  getRoomUserCount(roomId) {
    return this.getUsersInRoom(roomId).length;
  }

  /**
   * Clear all active users (use with caution - for testing/cleanup only)
   * @returns {number} Number of users cleared
   */
  clearAll() {
    const count = this._activeUsers.size;
    this._activeUsers.clear();
    logger.warn('[UserSessionService] Cleared all active users', {
      count: count,
    });
    return count;
  }
}

// Export singleton instance
const userSessionService = new UserSessionService();

module.exports = { userSessionService, UserSessionService };
