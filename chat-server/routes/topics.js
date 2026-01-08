/**
 * Topics API Routes
 *
 * REST endpoints for AI Thread Summaries feature.
 *
 * Endpoints:
 * Topics (legacy):
 * - GET  /api/rooms/:roomId/topics     - Get all topics for room
 * - GET  /api/topics/:topicId          - Get topic with citations
 * - POST /api/topics/:topicId/regenerate - Force regenerate summary
 * - POST /api/rooms/:roomId/topics/detect - Run topic detection
 * - POST /api/topics/:topicId/report   - Report inaccurate summary
 *
 * Threads (conversation-based):
 * - GET  /api/rooms/:roomId/threads         - Get threads grouped by category
 * - GET  /api/threads/:threadId             - Get thread with full details
 * - POST /api/rooms/:roomId/threads/process - Trigger thread processing
 * - POST /api/rooms/:roomId/threads/backfill - Backfill historical threads
 */

const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');
const { getTopicService } = require('../src/services/topics');
const { getThreadService } = require('../src/services/threads');

const { defaultLogger: defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'topics',
});

/**
 * GET /api/rooms/:roomId/topics
 * Get all topics for a room with summary previews
 */
router.get('/rooms/:roomId/topics', verifyAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { includeArchived, limit } = req.query;

    const topicService = getTopicService();
    const topics = await topicService.getTopicsForRoom(roomId, {
      includeArchived: includeArchived === 'true',
      limit: limit ? parseInt(limit, 10) : 20,
    });

    res.json({
      success: true,
      topics,
      count: topics.length,
    });
  } catch (error) {
    logger.error('[Topics API] Error getting topics', {
      error: error,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get topics',
    });
  }
});

/**
 * GET /api/topics/:topicId
 * Get a single topic with full citations
 */
router.get('/topics/:topicId', verifyAuth, async (req, res) => {
  try {
    const { topicId } = req.params;

    const topicService = getTopicService();
    const topic = await topicService.getTopicWithCitations(topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'Topic not found',
      });
    }

    res.json({
      success: true,
      topic,
    });
  } catch (error) {
    logger.error('[Topics API] Error getting topic', {
      error: error,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get topic',
    });
  }
});

/**
 * POST /api/topics/:topicId/regenerate
 * Force regenerate summary for a topic
 */
router.post('/topics/:topicId/regenerate', verifyAuth, async (req, res) => {
  try {
    const { topicId } = req.params;

    const topicService = getTopicService();
    const result = await topicService.regenerateSummary(topicId);

    res.json({
      success: true,
      summary: result.summary,
      citations: result.citations,
    });
  } catch (error) {
    logger.error('[Topics API] Error regenerating summary', {
      error: error,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate summary',
    });
  }
});

/**
 * POST /api/rooms/:roomId/topics/detect
 * Run topic detection on a room
 */
router.post('/rooms/:roomId/topics/detect', verifyAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { since, limit } = req.body;

    const topicService = getTopicService();
    const topics = await topicService.detectAndCreateTopics(roomId, {
      since: since ? new Date(since) : undefined,
      limit: limit || 200,
    });

    res.json({
      success: true,
      topics,
      count: topics.length,
      message: `Detected ${topics.length} topic(s)`,
    });
  } catch (error) {
    logger.error('[Topics API] Error detecting topics', {
      error: error,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to detect topics',
    });
  }
});

/**
 * POST /api/topics/:topicId/report
 * Report an inaccurate summary
 */
router.post('/topics/:topicId/report', verifyAuth, async (req, res) => {
  try {
    const { topicId } = req.params;
    const { reason } = req.body;
    const userEmail = req.user?.email || req.user?.username;

    const topicService = getTopicService();
    await topicService.reportInaccurate(topicId, userEmail, reason || 'User reported inaccuracy');

    res.json({
      success: true,
      message: 'Report received, summary will be regenerated',
    });
  } catch (error) {
    logger.error('[Topics API] Error reporting summary', {
      error: error,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to report summary',
    });
  }
});

/**
 * GET /api/topics/:topicId/messages/:messageId/context
 * Get message context for citation jump
 */
router.get('/topics/:topicId/messages/:messageId/context', verifyAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { contextSize } = req.query;

    const topicService = getTopicService();
    const context = await topicService.getMessageContext(
      messageId,
      contextSize ? parseInt(contextSize, 10) : 5
    );

    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    res.json({
      success: true,
      ...context,
    });
  } catch (error) {
    logger.error('[Topics API] Error getting message context', {
      error: error,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get message context',
    });
  }
});

// ============================================================================
// Thread Routes (Conversation-based threading)
// ============================================================================

/**
 * GET /api/rooms/:roomId/threads
 * Get threads for a room, grouped by category
 */
router.get('/rooms/:roomId/threads', verifyAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limitPerCategory, includeDetails } = req.query;

    const threadService = getThreadService();
    const threads = await threadService.getThreadsByCategory(roomId, {
      limitPerCategory: limitPerCategory ? parseInt(limitPerCategory, 10) : 5,
      includeDetails: includeDetails === 'true',
    });

    // Count total threads
    const totalCount = Object.values(threads).reduce(
      (sum, categoryThreads) => sum + categoryThreads.length,
      0
    );

    res.json({
      success: true,
      threads,
      categories: Object.keys(threads),
      totalCount,
    });
  } catch (error) {
    logger.error('[Topics API] Error getting threads', {
      error: error,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get threads',
    });
  }
});

/**
 * GET /api/threads/:threadId
 * Get a single thread with full details (messages, decisions, open items)
 */
router.get('/threads/:threadId', verifyAuth, async (req, res) => {
  try {
    const { threadId } = req.params;

    const threadService = getThreadService();
    const thread = await threadService.getThreadWithDetails(threadId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found',
      });
    }

    res.json({
      success: true,
      thread,
    });
  } catch (error) {
    logger.error('[Topics API] Error getting thread', {
      error: error,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get thread',
    });
  }
});

/**
 * POST /api/rooms/:roomId/threads/process
 * Trigger thread processing for a room (processes unthreaded messages)
 */
router.post('/rooms/:roomId/threads/process', verifyAuth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const threadService = getThreadService();
    const result = await threadService.processRoom(roomId);

    res.json({
      success: true,
      ...result,
      message: result.skipped
        ? 'AI not available, processing skipped'
        : `Processed: ${result.created} created, ${result.updated} updated`,
    });
  } catch (error) {
    logger.error('[Topics API] Error processing threads', {
      error: error,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to process threads',
    });
  }
});

/**
 * POST /api/rooms/:roomId/threads/backfill
 * Backfill threads for all historical messages in a room
 */
router.post('/rooms/:roomId/threads/backfill', verifyAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit, batchSize } = req.body;

    const threadService = getThreadService();
    const result = await threadService.backfillRoom(roomId, {
      limit: limit || 500,
      batchSize: batchSize || 10,
    });

    res.json({
      success: true,
      ...result,
      message: `Backfill complete: ${result.created} threads created from ${result.processed} windows`,
    });
  } catch (error) {
    logger.error('[Topics API] Error backfilling threads', {
      error: error,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to backfill threads',
    });
  }
});

module.exports = router;
