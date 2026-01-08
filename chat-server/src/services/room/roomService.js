/**
 * Room Service
 *
 * Actor: Product/UX (room management flows)
 * Responsibility: Room lifecycle management and invite handling
 *
 * Wraps the roomManager with unified business logic and error handling.
 */

const { BaseService } = require('../BaseService');
const { NotFoundError, ValidationError } = require('../errors');
const { PostgresRoomRepository } = require('../../repositories');
// Note: db is required here for passing to external library (pairingManager)
const db = require('../../../dbPostgres');
const {
  joinSocketRoom: joinSocketRoomUseCase,
  checkRoomMembers: checkRoomMembersUseCase,
  checkSharedRoom: checkSharedRoomUseCase,
} = require('./useCases');

const { defaultLogger: defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'roomService',
});

class RoomService extends BaseService {
  constructor() {
    super(null, new PostgresRoomRepository());
    this.roomRepository = this.repository; // Alias for clarity
    this.roomManager = null; // Injected via setRoomManager
    this.auth = null; // Injected via setAuth
    this.userSessionService = null; // Injected via setUserSessionService
    this.threadManager = null; // Injected via setThreadManager
    this.db = db; // Cache db reference for external library calls
  }

  /**
   * Set the room manager instance (injected from server.js)
   */
  setRoomManager(roomManager) {
    this.roomManager = roomManager;
  }

  /**
   * Set the auth instance (injected from server.js)
   */
  setAuth(auth) {
    this.auth = auth;
  }

  /**
   * Set the user session service instance (injected from server.js)
   */
  setUserSessionService(userSessionService) {
    this.userSessionService = userSessionService;
  }

  /**
   * Set the thread manager instance (injected from server.js)
   */
  setThreadManager(threadManager) {
    this.threadManager = threadManager;
  }

  /**
   * Get user's room
   * @param {string} username - Username
   * @returns {Promise<Object>} Room info
   */
  async getUserRoom(username) {
    if (!username) {
      throw new ValidationError('Username is required', 'username');
    }

    const user = await this.auth.getUser(username);
    if (!user) {
      throw new NotFoundError('User', username);
    }

    let room = user.room;
    if (!room && user.id) {
      room = await this.roomManager.getUserRoom(user.id);
    }

    if (!room) {
      throw new NotFoundError('Room');
    }

    return room;
  }

  /**
   * Check if user is in a shared room
   * @param {string} username - Username
   * @returns {Promise<Object>} { isShared: boolean }
   */
  async checkSharedRoom(username) {
    if (!username) {
      throw new ValidationError('Username is required', 'username');
    }

    const user = await this.auth.getUser(username);
    if (!user || !user.id) {
      throw new NotFoundError('User', username);
    }

    // Delegate to use case
    return checkSharedRoomUseCase({
      userId: user.id,
      roomRepository: this.roomRepository,
    });
  }

  /**
   * Check if room has multiple members
   * @param {number} userId - User ID
   * @param {string} username - Username for logging
   * @returns {Promise<Object>} { hasMultipleMembers, memberCount }
   */
  async checkRoomMembers(userId, username) {
    if (!userId) {
      throw new ValidationError('User ID is required', 'userId');
    }

    // Delegate to use case
    return checkRoomMembersUseCase({
      userId,
      username,
      roomManager: this.roomManager,
      db: this.db,
    });
  }

  /**
   * Get or create invite for user's room
   * @param {number} userId - User ID
   * @param {string} username - Username
   * @returns {Promise<Object>} Invite info
   */
  async getOrCreateInvite(userId, username) {
    if (!userId) {
      throw new ValidationError('User ID is required', 'userId');
    }

    // Get user's room (users should only have shared rooms with co-parents, not personal rooms)
    const room = await this.roomManager.getUserRoom(userId);
    if (!room) {
      throw new Error('No room found. Users must be connected to a co-parent to have a room.');
    }

    // Check for existing active invite
    const existingInvites = await this.roomManager.getRoomInvites(room.roomId);
    const activeInvite = existingInvites.find(
      inv => !inv.used_by && (!inv.expires_at || new Date(inv.expires_at) > new Date())
    );

    let invite;
    if (activeInvite) {
      invite = {
        inviteCode: activeInvite.invite_code,
        inviteId: activeInvite.id,
        roomId: room.roomId,
        expiresAt: activeInvite.expires_at,
      };
      logger.debug('Log message', {
        value: `RoomService: Returning existing invite code: ${invite.inviteCode}`,
      });
    } else {
      invite = await this.roomManager.createInvite(room.roomId, userId);
      logger.debug('Log message', {
        value: `RoomService: Created new invite code: ${invite.inviteCode}`,
      });
    }

    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.VITE_API_URL?.replace('/api', '') ||
      'http://localhost:5173';

    return {
      success: true,
      inviteCode: invite.inviteCode,
      inviteLink: `${frontendUrl}?invite=${invite.inviteCode}`,
      expiresAt: invite.expiresAt,
    };
  }

  /**
   * Create invite for room
   * @param {string} username - Username
   * @returns {Promise<Object>} Invite info
   */
  async createInvite(username) {
    if (!username) {
      throw new ValidationError('Username is required', 'username');
    }

    const user = await this.auth.getUser(username);
    if (!user || !user.id) {
      throw new NotFoundError('User', username);
    }

    let room = user.room;
    if (!room) {
      room = await this.roomManager.getUserRoom(user.id);
    }
    if (!room) {
      throw new NotFoundError('Room');
    }

    const invite = await this.roomManager.createInvite(room.roomId, user.id);
    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.VITE_API_URL?.replace('/api', '') ||
      'http://localhost:5173';

    return {
      success: true,
      inviteCode: invite.inviteCode,
      inviteLink: `${frontendUrl}?invite=${invite.inviteCode}`,
      expiresAt: invite.expiresAt,
    };
  }

  /**
   * Validate an invite code
   * @param {string} inviteCode - Invite code
   * @returns {Promise<Object>} Validation result
   */
  async validateInvite(inviteCode) {
    if (!inviteCode) {
      throw new ValidationError('Invite code is required', 'inviteCode');
    }

    const invite = await this.roomManager.validateInvite(inviteCode);

    if (!invite) {
      throw new NotFoundError('Invite', inviteCode);
    }

    return {
      valid: true,
      roomId: invite.roomId,
    };
  }

  /**
   * Join room with invite code
   * @param {string} inviteCode - Invite code
   * @param {string} username - Username
   * @param {Function} autoCompleteOnboardingTasks - Callback to auto-complete tasks
   * @returns {Promise<Object>} Join result
   */
  async joinRoom(inviteCode, username, autoCompleteOnboardingTasks = null) {
    if (!inviteCode) {
      throw new ValidationError('Invite code is required', 'inviteCode');
    }
    if (!username) {
      throw new ValidationError('Username is required', 'username');
    }

    const user = await this.auth.getUser(username);
    if (!user || !user.id) {
      throw new NotFoundError('User', username);
    }

    const result = await this.roomManager.useInvite(inviteCode, user.id);

    // Auto-complete onboarding tasks after using invite
    if (autoCompleteOnboardingTasks) {
      try {
        await autoCompleteOnboardingTasks(user.id);

        // Also complete tasks for other room members
        if (result.roomId) {
          const roomMembers = await this.roomManager.getRoomMembers(result.roomId);
          for (const member of roomMembers) {
            if (member.user_id !== user.id) {
              await autoCompleteOnboardingTasks(member.user_id);
            }
          }
        }
      } catch (error) {
        logger.error('Error auto-completing onboarding tasks after using invite', {
          error: error,
        });
      }
    }

    return {
      success: true,
      roomId: result.roomId,
    };
  }

  /**
   * Get room members
   * @param {string} roomId - Room ID
   * @returns {Promise<Array>} Room members
   */
  async getRoomMembers(roomId) {
    if (!roomId) {
      throw new ValidationError('Room ID is required', 'roomId');
    }

    return this.roomManager.getRoomMembers(roomId);
  }

  /**
   * Get room invites
   * @param {string} roomId - Room ID
   * @returns {Promise<Array>} Room invites
   */
  async getRoomInvites(roomId) {
    if (!roomId) {
      throw new ValidationError('Room ID is required', 'roomId');
    }

    return this.roomManager.getRoomInvites(roomId);
  }

  /**
   * Backfill contacts for a user's shared room
   * @param {string} username - Username
   * @returns {Promise<Object>} Backfill result
   */
  async backfillContacts(username) {
    if (!username) {
      throw new ValidationError('Username is required', 'username');
    }

    const user = await this.auth.getUser(username);
    if (!user || !user.id) {
      throw new NotFoundError('User', username);
    }

    const room = await this.roomManager.getUserRoom(user.id);
    if (!room) {
      throw new NotFoundError('Room');
    }

    logger.debug('Log message', {
      value: `🔄 Backfilling contacts for room ${room.roomId}`,
    });
    await this.roomManager.ensureContactsForRoomMembers(room.roomId);

    return {
      success: true,
      message: 'Contacts backfilled for shared room',
    };
  }

  /**
   * Join socket room - delegates to use case
   *
   * REFACTORED: Orchestration logic moved to JoinSocketRoomUseCase.
   * This method now just validates dependencies and delegates to the use case.
   *
   * @param {string} userIdentifier - Email or username
   * @param {string} socketId - Socket ID
   * @param {Object} io - Socket.io server instance (for disconnecting duplicates)
   * @returns {Promise<Object>} Join result with success, error, or room data
   */
  async joinSocketRoom(userIdentifier, socketId, io) {
    // Validate dependencies
    if (!this.auth) {
      throw new Error('RoomService: auth must be set via setAuth()');
    }
    if (!this.roomManager) {
      throw new Error('RoomService: roomManager must be set via setRoomManager()');
    }
    if (!this.userSessionService) {
      throw new Error('RoomService: userSessionService must be set via setUserSessionService()');
    }

    // Delegate to use case - all orchestration happens there
    // Use threadManager from injected instance (set via setThreadManager in setupSockets)
    return joinSocketRoomUseCase({
      userIdentifier,
      socketId,
      io,
      auth: this.auth,
      roomManager: this.roomManager,
      userSessionService: this.userSessionService,
      db: this.db,
      threadManager: this.threadManager, // Pass threadManager for automatic analysis
    });
  }
}

// Export singleton instance
const roomService = new RoomService();

module.exports = { roomService, RoomService };
