/**
 * Room Routes
 *
 * Handles room management including invites, joining, and member management.
 * Extracted from server.js for better maintainability.
 */

const express = require('express');
const router = express.Router();

const dbSafe = require('../dbSafe');
const db = require('../dbPostgres');
const { verifyAuth } = require('../middleware/auth');

// Helper references - set from server.js
let auth;
let roomManager;
let autoCompleteOnboardingTasks;

router.setHelpers = function(helpers) {
  auth = helpers.auth;
  roomManager = helpers.roomManager;
  autoCompleteOnboardingTasks = helpers.autoCompleteOnboardingTasks;
};

/**
 * POST /api/room/backfill-contacts
 * Backfill contacts for current user's shared room
 */
router.post('/backfill-contacts', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = await auth.getUser(username);
    if (!user || !user.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    const room = await roomManager.getUserRoom(user.id);
    if (!room) {
      return res.status(404).json({ error: 'User has no room' });
    }

    console.log(`🔄 Backfilling contacts for room ${room.roomId}`);
    await roomManager.ensureContactsForRoomMembers(room.roomId);

    res.json({ success: true, message: 'Contacts backfilled for shared room' });
  } catch (error) {
    console.error('Error backfilling contacts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/room/shared-check/:username
 * Check if user is in a shared room (has more than one member)
 */
router.get('/shared-check/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await auth.getUser(username);
    if (!user || !user.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is in a room with more than one member
    const query = `
      SELECT COUNT(rm2.user_id) as member_count
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
      LEFT JOIN room_members rm2 ON r.id = rm2.room_id
      WHERE rm.user_id = ${parseInt(user.id)}
      GROUP BY r.id
      HAVING member_count > 1
      LIMIT 1
    `;

    const result = db.exec(query);
    const isShared = result.length > 0 && result[0].values.length > 0;

    res.json({ isShared });
  } catch (error) {
    console.error('Error checking shared room:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/room/:username
 * Get user's room
 */
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await auth.getUser(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let room = user.room;
    if (!room && user.id) {
      room = await roomManager.getUserRoom(user.id);
    }
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/room/invite
 * Get or create invite for room (optimized - returns existing active invite if available)
 */
router.get('/invite', verifyAuth, async (req, res) => {
  try {
    // Get username from authenticated session
    const username = req.user?.username;
    if (!username) {
      console.error('Invite API: No username in JWT token', req.user);
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log('Invite API: Looking up user:', username);
    const user = await auth.getUser(username);
    if (!user) {
      console.error('Invite API: User not found in database:', username);
      return res.status(404).json({ error: 'User not found. Please try logging out and back in.' });
    }

    if (!user.id) {
      console.error('Invite API: User found but missing ID:', user);
      return res.status(404).json({ error: 'User not found. Please try logging out and back in.' });
    }

    console.log('Invite API: User found, ID:', user.id);
    let room = user.room;
    if (!room) {
      console.log('Invite API: No room in user object, checking getUserRoom...');
      room = await roomManager.getUserRoom(user.id);
    }
    if (!room) {
      console.log('Invite API: No room found, creating one for user:', user.id);
      // Auto-create a room if one doesn't exist
      try {
        room = await roomManager.createPrivateRoom(user.id, user.username);
        console.log('Invite API: Created new room:', room.roomId);
      } catch (roomError) {
        console.error('Invite API: Failed to create room:', roomError);
        return res.status(500).json({ error: 'Failed to create room. Please try again.' });
      }
    }
    console.log('Invite API: Room found:', room.roomId);

    // Check for existing active invite first
    const existingInvites = await roomManager.getRoomInvites(room.roomId);
    const activeInvite = existingInvites.find(
      (inv) => !inv.used_by && (!inv.expires_at || new Date(inv.expires_at) > new Date())
    );

    let invite;
    if (activeInvite) {
      // Reuse existing invite
      invite = {
        inviteCode: activeInvite.invite_code,
        inviteId: activeInvite.id,
        roomId: room.roomId,
        expiresAt: activeInvite.expires_at,
      };
      console.log(`API: Returning existing invite code: ${invite.inviteCode}`);
    } else {
      // Create new invite
      invite = await roomManager.createInvite(room.roomId, user.id);
      console.log(`API: Created new invite code: ${invite.inviteCode} (length: ${invite.inviteCode.length})`);
    }

    res.json({
      success: true,
      inviteCode: invite.inviteCode,
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?invite=${invite.inviteCode}`,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error('Error getting/creating invite:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/room/invite
 * Create invite for room (POST - kept for backward compatibility)
 */
router.post('/invite', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = await auth.getUser(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    let room = user.room;
    if (!room) {
      room = await roomManager.getUserRoom(user.id);
    }
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Create invite
    const invite = await roomManager.createInvite(room.roomId, user.id);

    console.log(`API: Returning invite code: ${invite.inviteCode} (length: ${invite.inviteCode.length})`);

    res.json({
      success: true,
      inviteCode: invite.inviteCode,
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?invite=${invite.inviteCode}`,
      expiresAt: invite.expiresAt
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/room/invite/:inviteCode
 * Validate invite code
 */
router.get('/invite/:inviteCode', async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const invite = await roomManager.validateInvite(inviteCode);

    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invite code' });
    }

    res.json({
      valid: true,
      roomId: invite.roomId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/room/join
 * Accept invite (join room)
 */
router.post('/join', async (req, res) => {
  try {
    const { inviteCode, username } = req.body;

    if (!inviteCode || !username) {
      return res.status(400).json({ error: 'Invite code and username are required' });
    }

    const user = await auth.getUser(username);
    if (!user || !user.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Use invite
    const result = await roomManager.useInvite(inviteCode, user.id);

    // Auto-complete onboarding tasks after using invite (contacts may have been created)
    if (autoCompleteOnboardingTasks) {
      try {
        await autoCompleteOnboardingTasks(user.id);
        // Also complete tasks for other room members if contacts were created
        if (result.roomId) {
          const roomMembers = await roomManager.getRoomMembers(result.roomId);
          for (const member of roomMembers) {
            if (member.user_id !== user.id) {
              await autoCompleteOnboardingTasks(member.user_id);
            }
          }
        }
      } catch (error) {
        console.error('Error auto-completing onboarding tasks after using invite:', error);
        // Don't fail the request if this fails
      }
    }

    res.json({
      success: true,
      roomId: result.roomId
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/room/:roomId/members
 * Get room members
 */
router.get('/:roomId/members', async (req, res) => {
  try {
    const { roomId } = req.params;
    const members = await roomManager.getRoomMembers(roomId);
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/room/members/check
 * Check if current user's room has multiple members (for hiding invite button)
 */
router.get('/members/check', verifyAuth, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await auth.getUser(username);
    if (!user || !user.id) {
      console.log(`[room/members/check] User not found: ${username}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Try to get user's room
    let room = null;
    try {
      room = user.room || await roomManager.getUserRoom(user.id);
    } catch (roomError) {
      console.error(`[room/members/check] Error getting user room for ${user.id}:`, roomError);
      // If user has no room, that's okay - return default response
      return res.json({ hasMultipleMembers: false, memberCount: 0 });
    }

    if (!room || !room.roomId) {
      // User has no room - this is normal for new users
      return res.json({ hasMultipleMembers: false, memberCount: 0 });
    }

    // Get room members
    let members = [];
    try {
      members = await roomManager.getRoomMembers(room.roomId);
    } catch (membersError) {
      console.error(`[room/members/check] Error getting room members for room ${room.roomId}:`, membersError);
      // If we can't get members, assume no multiple members
      return res.json({ hasMultipleMembers: false, memberCount: 0 });
    }

    const hasMultipleMembers = members && members.length >= 2;

    res.json({
      hasMultipleMembers,
      memberCount: members ? members.length : 0,
    });
  } catch (error) {
    console.error('[room/members/check] Unexpected error:', error);
    console.error('[room/members/check] Error stack:', error.stack);
    // Return safe default instead of 500 error
    res.json({ hasMultipleMembers: false, memberCount: 0 });
  }
});

/**
 * GET /api/room/:roomId/invites
 * Get active invites for room
 */
router.get('/:roomId/invites', async (req, res) => {
  try {
    const { roomId } = req.params;
    const invites = await roomManager.getRoomInvites(roomId);
    res.json(invites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
