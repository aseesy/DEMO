/**
 * Messages API Routes
 *
 * REST API endpoints for message operations
 */

const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandlers');
const { verifyRoomMembership } = require('../socketHandlers/socketMiddleware/roomMembership');
const MessageService = require('../src/services/messages/messageService');
const dbSafe = require('../dbSafe');

const { defaultLogger: defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'messages',
});

const messageService = new MessageService();

/**
 * GET /api/messages/room/:roomId
 * Get messages for a room with pagination
 *
 * Verifies user is a member of the room before returning messages.
 */
router.get(
  '/room/:roomId',
  verifyAuth,
  asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { limit = 50, offset = 0, before, after, threadId } = req.query;
    const userEmail = req.user.email;
    const userId = req.user.id || req.user.userId;

    // Validate roomId
    if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid roomId: roomId is required and must be a non-empty string',
      });
    }

    // Verify room membership
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in authentication token',
        code: 'AUTH_ERROR',
      });
    }

    const isMember = await verifyRoomMembership(userId, roomId, dbSafe);
    if (!isMember) {
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('[messages] Room membership check failed', {
          ...{
            userId,
            roomId,
            userEmail,
          },
        });
      }
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this room',
        code: 'ROOM_ACCESS_DENIED',
      });
    }

    // Validate limit
    const limitInt = Math.min(parseInt(limit) || 50, 500);
    const offsetInt = Math.max(parseInt(offset) || 0, 0);

    const options = {
      limit: limitInt,
      offset: offsetInt,
      before: before || null,
      after: after || null,
      threadId: threadId || null,
    };

    const result = await messageService.getRoomMessages(roomId, options, userEmail);

    // Return empty array if no messages found (instead of error)
    if (!result.messages || result.messages.length === 0) {
      return res.json({
        success: true,
        data: {
          messages: [],
          total: 0,
          hasMore: false,
          limit: limitInt,
          offset: offsetInt,
        },
      });
    }

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/messages/thread/:threadId
 * Get messages for a thread with pagination
 */
router.get(
  '/thread/:threadId',
  verifyAuth,
  asyncHandler(async (req, res) => {
    const { threadId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userEmail = req.user.email;

    // Validate limit
    const limitInt = Math.min(parseInt(limit) || 50, 500);
    const offsetInt = Math.max(parseInt(offset) || 0, 0);

    const options = {
      limit: limitInt,
      offset: offsetInt,
    };

    const result = await messageService.getThreadMessages(threadId, options, userEmail);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/messages/:messageId
 * Get a single message by ID
 */
router.get(
  '/:messageId',
  verifyAuth,
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userEmail = req.user.email;

    const message = await messageService.getMessage(messageId, userEmail);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    res.json({
      success: true,
      data: message,
    });
  })
);

/**
 * POST /api/messages
 * Create a new message
 */
router.post(
  '/',
  verifyAuth,
  express.json(),
  asyncHandler(async (req, res) => {
    const userEmail = req.user.email;
    const messageData = req.body;

    const message = await messageService.createMessage(messageData, userEmail);

    res.status(201).json({
      success: true,
      data: message,
    });
  })
);

/**
 * PUT /api/messages/:messageId
 * Update a message (edit)
 */
router.put(
  '/:messageId',
  verifyAuth,
  express.json(),
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userEmail = req.user.email;
    const updates = req.body;

    const message = await messageService.updateMessage(messageId, updates, userEmail);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    res.json({
      success: true,
      data: message,
    });
  })
);

/**
 * DELETE /api/messages/:messageId
 * Delete a message (soft delete)
 */
router.delete(
  '/:messageId',
  verifyAuth,
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userEmail = req.user.email;

    const success = await messageService.deleteMessage(messageId, userEmail);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    res.json({
      success: true,
      message: 'Message deleted',
    });
  })
);

/**
 * POST /api/messages/:messageId/reactions
 * Add a reaction to a message
 */
router.post(
  '/:messageId/reactions',
  verifyAuth,
  express.json(),
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userEmail = req.user.email;

    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'emoji is required',
      });
    }

    const message = await messageService.addReaction(messageId, emoji, userEmail);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    res.json({
      success: true,
      data: message,
    });
  })
);

/**
 * DELETE /api/messages/:messageId/reactions/:emoji
 * Remove a reaction from a message
 */
router.delete(
  '/:messageId/reactions/:emoji',
  verifyAuth,
  asyncHandler(async (req, res) => {
    const { messageId, emoji } = req.params;
    const userEmail = req.user.email;

    const message = await messageService.removeReaction(messageId, emoji, userEmail);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    res.json({
      success: true,
      data: message,
    });
  })
);

module.exports = router;
