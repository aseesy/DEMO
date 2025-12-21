/**
 * Room Routes
 *
 * Handles room management including invites, joining, and member management.
 * Business logic delegated to services layer.
 *
 * Actor: Product/UX
 */

const express = require('express');
const router = express.Router();

const { verifyAuth } = require('../middleware/auth');
const { handleServiceError } = require('../middleware/errorHandlers');
const { roomService } = require('../src/services');

// Helper references - set from server.js
let autoCompleteOnboardingTasks;

router.setHelpers = function (helpers) {
  roomService.setAuth(helpers.auth);
  roomService.setRoomManager(helpers.roomManager);
  autoCompleteOnboardingTasks = helpers.autoCompleteOnboardingTasks;
};

// ============================================
// Room Endpoints
// ============================================

/**
 * GET /api/room/:username
 * Get user's room
 */
router.get('/:username', async (req, res) => {
  try {
    const room = await roomService.getUserRoom(req.params.username);
    res.json(room);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * GET /api/room/shared-check/:username
 * Check if user is in a shared room
 */
router.get('/shared-check/:username', async (req, res) => {
  try {
    const result = await roomService.checkSharedRoom(req.params.username);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * POST /api/room/backfill-contacts
 * Backfill contacts for current user's shared room
 */
router.post('/backfill-contacts', async (req, res) => {
  try {
    const { username } = req.body;
    const result = await roomService.backfillContacts(username);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// ============================================
// Invite Endpoints
// ============================================

/**
 * GET /api/room/invite
 * Get or create invite for room (optimized - returns existing active invite if available)
 */
router.get('/invite', verifyAuth, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await roomService.getOrCreateInvite(userId, username);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * POST /api/room/invite
 * Create invite for room (POST - kept for backward compatibility)
 */
router.post('/invite', async (req, res) => {
  try {
    const { username } = req.body;
    const result = await roomService.createInvite(username);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * GET /api/room/invite/:inviteCode
 * Validate invite code
 */
router.get('/invite/:inviteCode', async (req, res) => {
  try {
    const result = await roomService.validateInvite(req.params.inviteCode);
    res.json(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: 'Invalid or expired invite code' });
    }
    handleServiceError(error, res);
  }
});

/**
 * POST /api/room/join
 * Accept invite (join room)
 */
router.post('/join', async (req, res) => {
  try {
    const { inviteCode, username } = req.body;
    const result = await roomService.joinRoom(inviteCode, username, autoCompleteOnboardingTasks);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// ============================================
// Member Endpoints
// ============================================

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

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.json({ hasMultipleMembers: false, memberCount: 0 });
    }

    const result = await roomService.checkRoomMembers(userId, username);
    res.json(result);
  } catch (error) {
    console.error('[room/members/check] Unexpected error:', error);
    // Return safe default instead of 500 error
    res.json({ hasMultipleMembers: false, memberCount: 0 });
  }
});

/**
 * GET /api/room/:roomId/members
 * Get room members
 */
router.get('/:roomId/members', async (req, res) => {
  try {
    const members = await roomService.getRoomMembers(req.params.roomId);
    res.json(members);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * GET /api/room/:roomId/invites
 * Get active invites for room
 */
router.get('/:roomId/invites', async (req, res) => {
  try {
    const invites = await roomService.getRoomInvites(req.params.roomId);
    res.json(invites);
  } catch (error) {
    handleServiceError(error, res);
  }
});

module.exports = router;
