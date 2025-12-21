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

class RoomService extends BaseService {
  constructor() {
    super(null, new PostgresRoomRepository());
    this.roomRepository = this.repository; // Alias for clarity
    this.roomManager = null; // Injected via setRoomManager
    this.auth = null; // Injected via setAuth
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

    // Get or create user's room
    let room = await this.roomManager.getUserRoom(userId);
    if (!room) {
      console.log('RoomService: No room found, creating one for user:', userId);
      try {
        room = await this.roomManager.createPrivateRoom(userId, username);
        console.log('RoomService: Created new room:', room.roomId);
      } catch (roomError) {
        console.error('RoomService: Failed to create room:', roomError);
        throw new Error('Failed to create room. Please try again.');
      }
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
}

// Export singleton instance
const roomService = new RoomService();

module.exports = { roomService, RoomService };
