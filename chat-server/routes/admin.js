/**
 * Admin & Debug Routes - Business logic delegated to services layer
 * @di-pattern: injected
 * Actor: Operations
 */

const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/routeHandler');
const { verifyAdminSecret } = require('../middleware/adminAuth');
const { debugService, statisticsService, cleanupService } = require('../src/services');

let roomManager;
router.setHelpers = function (helpers) {
  roomManager = helpers.roomManager;
};

router.get('/debug/users', asyncHandler(async (req, res) => {
  const result = await debugService.getUsers();
  res.json(result);
}));

router.get('/stats/user-count', asyncHandler(async (req, res) => {
  const count = await statisticsService.getUserCount();
  res.json({ count });
}));

router.get('/debug/rooms', asyncHandler(async (req, res) => {
  const result = await debugService.getRooms();
  res.json(result);
}));

router.get('/debug/tasks/:userId', verifyAuth, asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const requestingUserId = req.user.userId || req.user.id;
  const result = await debugService.getUserTasks(userId, requestingUserId);
  res.json(result);
}));

router.get('/debug/messages/:roomId', verifyAuth, asyncHandler(async (req, res) => {
  const roomId = req.params.roomId;
  const requestingUserId = req.user.userId || req.user.id;
  const result = await debugService.getRoomMessages(
    roomId,
    requestingUserId,
    roomManager.getRoomMembers.bind(roomManager)
  );
  res.json(result);
}));

router.get('/debug/pending-connections', asyncHandler(async (req, res) => {
  const result = await debugService.getPendingConnections();
  res.json(result);
}));


router.post('/admin/cleanup', asyncHandler(async (req, res) => {
  const result = await cleanupService.cleanupOrphanedData();
  res.json(result);
}));

router.delete('/admin/users/:userId', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const result = await cleanupService.deleteUser(userId);
  res.json(result);
}));

router.post('/admin/backfill-contacts', asyncHandler(async (req, res) => {
  const result = await cleanupService.backfillContacts();
  res.json(result);
}));

router.post('/admin/cleanup-test-data', verifyAdminSecret, asyncHandler(async (req, res) => {
  const result = await cleanupService.cleanupTestData();
  res.json(result);
}));

router.post('/admin/force-connect', verifyAdminSecret, asyncHandler(async (req, res) => {
  const { userAId, userBId } = req.body;
  const result = await cleanupService.forceConnect(
    userAId,
    userBId,
    roomManager.createCoParentRoom.bind(roomManager)
  );
  res.json(result);
}));

router.post('/admin/debug-pairings', verifyAdminSecret, asyncHandler(async (req, res) => {
  const result = await debugService.debugPairings();
  res.json(result);
}));

router.post('/admin/repair-pairing', verifyAdminSecret, asyncHandler(async (req, res) => {
  const result = await cleanupService.repairPairings(
    roomManager.createCoParentRoom.bind(roomManager)
  );
  res.json(result);
}));

module.exports = router;
