/**
 * Admin & Debug Routes
 *
 * Handles admin operations and debug endpoints.
 * Business logic delegated to services layer.
 *
 * Actor: Operations
 */

const express = require('express');
const router = express.Router();

const { verifyAuth } = require('../middleware/auth');
const { handleServiceError } = require('../middleware/errorHandlers');
const { debugService, statisticsService, cleanupService } = require('../src/services');

// Helper references - set from server.js
let roomManager;

router.setHelpers = function (helpers) {
  roomManager = helpers.roomManager;
};

// ============================================
// Debug Endpoints
// ============================================

/**
 * GET /api/debug/users
 * List all users (for development/debugging)
 */
router.get('/debug/users', async (req, res) => {
  try {
    const result = await debugService.getUsers();
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * GET /api/stats/user-count
 * Get total user count (for beta spots calculation)
 */
router.get('/stats/user-count', async (req, res) => {
  try {
    const count = await statisticsService.getUserCount();
    res.json({ count });
  } catch (error) {
    console.error('Error getting user count:', error);
    res.json({ count: 0 });
  }
});

/**
 * GET /api/debug/rooms
 * List all rooms
 */
router.get('/debug/rooms', async (req, res) => {
  try {
    const result = await debugService.getRooms();
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * GET /api/debug/tasks/:userId
 * Diagnostic endpoint to check user's tasks
 */
router.get('/debug/tasks/:userId', verifyAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const requestingUserId = req.user.userId || req.user.id;

    const result = await debugService.getUserTasks(userId, requestingUserId);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * GET /api/debug/messages/:roomId
 * Diagnostic endpoint to check room's messages
 */
router.get('/debug/messages/:roomId', verifyAuth, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const requestingUserId = req.user.userId || req.user.id;

    const result = await debugService.getRoomMessages(
      roomId,
      requestingUserId,
      roomManager.getRoomMembers.bind(roomManager)
    );
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * GET /api/debug/pending-connections
 * List all pending connections
 */
router.get('/debug/pending-connections', async (req, res) => {
  try {
    const result = await debugService.getPendingConnections();
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// ============================================
// Admin Endpoints
// ============================================

/**
 * POST /api/admin/cleanup
 * Clean up orphaned data
 */
router.post('/admin/cleanup', async (req, res) => {
  try {
    const result = await cleanupService.cleanupOrphanedData();
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete a user
 */
router.delete('/admin/users/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const result = await cleanupService.deleteUser(userId);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * POST /api/admin/backfill-contacts
 * Backfill co-parent contacts for existing shared rooms
 */
router.post('/admin/backfill-contacts', async (req, res) => {
  try {
    const result = await cleanupService.backfillContacts();
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * POST /api/admin/cleanup-test-data
 * Cleanup test user and reset pairing sessions
 * Protected by secret key
 */
router.post('/admin/cleanup-test-data', async (req, res) => {
  const { secret } = req.body;
  const ADMIN_SECRET = process.env.ADMIN_CLEANUP_SECRET || 'liaizen-test-cleanup-2024';

  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Invalid secret' });
  }

  try {
    const result = await cleanupService.cleanupTestData();
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * POST /api/admin/force-connect
 * Force connect two users (for testing/repair)
 */
router.post('/admin/force-connect', async (req, res) => {
  const { secret, userAId, userBId } = req.body;

  if (secret !== 'liaizen-test-cleanup-2024') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const result = await cleanupService.forceConnect(
      userAId,
      userBId,
      roomManager.createCoParentRoom.bind(roomManager)
    );
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * POST /api/admin/debug-pairings
 * Debug endpoint to check pairing and room status
 */
router.post('/admin/debug-pairings', async (req, res) => {
  const { secret } = req.body;

  if (secret !== 'liaizen-test-cleanup-2024') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const result = await debugService.debugPairings();
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * POST /api/admin/repair-pairing
 * Repair pairing - create missing room for active pairings
 */
router.post('/admin/repair-pairing', async (req, res) => {
  const { secret } = req.body;

  if (secret !== 'liaizen-test-cleanup-2024') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const result = await cleanupService.repairPairings(
      roomManager.createCoParentRoom.bind(roomManager)
    );
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

module.exports = router;
