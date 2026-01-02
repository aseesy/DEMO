/**
 * Room Service
 *
 * Actor: Product/UX (room management flows)
 * Responsibility: Room lifecycle management and invite handling
 *
 * Wraps the roomManager with unified business logic and error handling.
 */

const { BaseService } = require('../BaseService');
const { NotFoundError, ValidationError, ConflictError } = require('../errors');
const { PostgresRoomRepository } = require('../../repositories');
const pairingManager = require('../../../libs/pairing-manager');
// Note: db is required here for passing to external library (pairingManager)
const db = require('../../../dbPostgres');
const {
  validateUserInput,
  getUserByEmail,
} = require('../../../socketHandlers/connectionOperations/userLookup');
const {
  resolveOrCreateUserRoom,
} = require('../../../socketHandlers/connectionOperations/roomResolution');
const {
  getMessageHistory,
} = require('../../../socketHandlers/connectionOperations/messageHistory');

class RoomService extends BaseService {
  constructor() {
    super(null, new PostgresRoomRepository());
    this.roomRepository = this.repository; // Alias for clarity
    this.roomManager = null; // Injected via setRoomManager
    this.auth = null; // Injected via setAuth
    this.userSessionService = null; // Injected via setUserSessionService
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

    const sharedRooms = await this.roomRepository.findSharedRooms(parseInt(user.id));
    return { isShared: sharedRooms.length > 0 };
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

    let roomId = null;

    // First check if user has an active pairing with shared_room_id
    // Uses user_pairing_status VIEW internally for consistent pairing-based room lookup
    try {
      const activePairing = await pairingManager.getActivePairing(userId, this.db);
      if (activePairing && activePairing.shared_room_id) {
        roomId = activePairing.shared_room_id;
        console.log(
          `[roomService.checkRoomMembers] User ${username} has active pairing, using shared room: ${roomId}`
        );
      }
    } catch (pairingError) {
      console.error(
        `[roomService.checkRoomMembers] Error checking pairing for ${userId}:`,
        pairingError
      );
    }

    // Fallback: get user's room the traditional way
    if (!roomId) {
      try {
        const room = await this.roomManager.getUserRoom(userId);
        roomId = room?.roomId;
      } catch (roomError) {
        console.error(
          `[roomService.checkRoomMembers] Error getting user room for ${userId}:`,
          roomError
        );
        return { hasMultipleMembers: false, memberCount: 0 };
      }
    }

    if (!roomId) {
      return { hasMultipleMembers: false, memberCount: 0 };
    }

    // Get room members
    let members = [];
    try {
      members = await this.roomManager.getRoomMembers(roomId);
    } catch (membersError) {
      console.error(
        `[roomService.checkRoomMembers] Error getting room members for ${roomId}:`,
        membersError
      );
      return { hasMultipleMembers: false, memberCount: 0 };
    }

    return {
      hasMultipleMembers: members && members.length >= 2,
      memberCount: members ? members.length : 0,
    };
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
      console.log(`RoomService: Returning existing invite code: ${invite.inviteCode}`);
    } else {
      invite = await this.roomManager.createInvite(room.roomId, userId);
      console.log(`RoomService: Created new invite code: ${invite.inviteCode}`);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

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
        console.error('Error auto-completing onboarding tasks after using invite:', error);
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

    console.log(`🔄 Backfilling contacts for room ${room.roomId}`);
    await this.roomManager.ensureContactsForRoomMembers(room.roomId);

    return {
      success: true,
      message: 'Contacts backfilled for shared room',
    };
  }

  /**
   * Join socket room - orchestrates complete socket join flow
   *
   * This method encapsulates all the business logic for joining a room via socket:
   * - Validates user input
   * - Looks up user
   * - Resolves room
   * - Handles duplicate connections
   * - Registers session
   * - Ensures contacts
   * - Loads message history
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

    // Step 1: Validate input
    const validation = validateUserInput(userIdentifier);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    const { cleanEmail } = validation;

    // Step 2: Get user
    let user;
    try {
      user = await getUserByEmail(cleanEmail, this.auth);
    } catch (error) {
      console.error('[RoomService.joinSocketRoom] getUserByEmail failed:', error.message);
      return { success: false, error: 'Failed to verify user.', errorContext: 'getUserByEmail' };
    }

    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    // Step 3: Resolve room
    let room;
    try {
      room = await resolveOrCreateUserRoom(user, cleanEmail, this.db, this.roomManager);
    } catch (error) {
      console.error('[RoomService.joinSocketRoom] resolveOrCreateUserRoom failed:', error.message);
      return { success: false, error: 'Failed to join chat room.', errorContext: 'resolveRoom' };
    }

    if (!room?.roomId || typeof room.roomId !== 'string' || !room.roomId.trim()) {
      console.warn('[RoomService.joinSocketRoom] No valid room for user:', {
        email: cleanEmail,
        userId: user?.id,
      });
      return { success: false, error: 'No room available. You must be connected to a co-parent.' };
    }

    const { roomId, roomName } = room;
    user.room = { roomId, roomName };
    user.roomId = roomId;

    // Step 4: Handle duplicates and register session
    const disconnectedSocketIds = this.userSessionService.disconnectDuplicates(
      socketId,
      cleanEmail,
      roomId
    );

    // Disconnect the old sockets via io
    for (const oldSocketId of disconnectedSocketIds) {
      const oldSocket = io.sockets.sockets.get(oldSocketId);
      if (oldSocket) {
        oldSocket.emit('replaced_by_new_connection', {
          message: 'Disconnected by another login.',
        });
        oldSocket.disconnect(true);
      }
    }

    // Register new session
    this.userSessionService.registerUser(socketId, cleanEmail, roomId);

    // Step 5: Ensure contacts (non-fatal)
    let roomMembers = [];
    try {
      roomMembers = await this.roomManager.getRoomMembers(roomId);
      if (roomMembers.length > 1) {
        await this.roomManager.ensureContactsForRoomMembers(roomId);
      }
    } catch (error) {
      console.error(
        '[RoomService.joinSocketRoom] ensureContacts failed (non-fatal):',
        error.message
      );
    }

    // Step 6: Load message history
    let messages = [];
    let hasMore = false;
    try {
      const history = await getMessageHistory(roomId, this.db);
      messages = history.messages;
      hasMore = history.hasMore;
    } catch (error) {
      console.error('[RoomService.joinSocketRoom] getMessageHistory failed:', error.message);
      return {
        success: false,
        error: 'Failed to load message history.',
        errorContext: 'getMessageHistory',
      };
    }

    // Step 7: Get current room users
    const roomUsers = this.userSessionService.getUsersInRoom(roomId).map(u => ({
      email: u.email,
      joinedAt: u.joinedAt,
    }));

    return {
      success: true,
      user,
      email: cleanEmail,
      roomId,
      roomName: roomName || `${user.displayName || user.firstName || cleanEmail}'s Room`,
      messages,
      hasMore,
      roomUsers,
      roomMembers,
    };
  }
}

// Export singleton instance
const roomService = new RoomService();

module.exports = { roomService, RoomService };
