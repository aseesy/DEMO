/**
 * Topics Socket Handler
 *
 * Real-time events for AI Thread Summaries feature.
 *
 * Client Events:
 * - topics:subscribe     - Subscribe to topic updates for a room
 * - topics:unsubscribe   - Unsubscribe from topic updates
 * - topics:detect        - Request topic detection for a room
 * - topics:regenerate    - Request summary regeneration
 *
 * Server Events:
 * - topics:list          - Initial list of topics for room
 * - topics:created       - New topic was created
 * - topics:updated       - Topic summary was regenerated
 * - topics:message_added - Message was added to a topic
 * - topics:error         - Error occurred
 */

const { getTopicService } = require('../src/services/topics');

const { defaultLogger: defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'topicsHandler',
});

// Track which sockets are subscribed to which rooms for topics
const topicSubscriptions = new Map(); // roomId -> Set<socketId>

function setupTopicsHandler(socket, io) {
  const userEmail = socket.user?.email;

  /**
   * Subscribe to topic updates for a room
   */
  socket.on('topics:subscribe', async ({ roomId }) => {
    try {
      if (!roomId) {
        return socket.emit('topics:error', { error: 'Room ID required' });
      }

      // Add to subscription map
      if (!topicSubscriptions.has(roomId)) {
        topicSubscriptions.set(roomId, new Set());
      }
      topicSubscriptions.get(roomId).add(socket.id);

      // Join a room-specific channel for topic events
      socket.join(`topics:${roomId}`);

      logger.debug('Log message', {
        value: `[Topics] ${userEmail} subscribed to topics in ${roomId}`,
      });

      // Send initial topics list
      const topicService = getTopicService();
      const topics = await topicService.getTopicsForRoom(roomId);

      socket.emit('topics:list', {
        roomId,
        topics,
        count: topics.length,
      });
    } catch (error) {
      logger.error('[Topics] Subscribe error', {
        error: error,
      });
      socket.emit('topics:error', { error: 'Failed to subscribe to topics' });
    }
  });

  /**
   * Unsubscribe from topic updates
   */
  socket.on('topics:unsubscribe', ({ roomId }) => {
    if (roomId && topicSubscriptions.has(roomId)) {
      topicSubscriptions.get(roomId).delete(socket.id);
      socket.leave(`topics:${roomId}`);
      logger.debug('Log message', {
        value: `[Topics] ${userEmail} unsubscribed from topics in ${roomId}`,
      });
    }
  });

  /**
   * Request topic detection for a room
   */
  socket.on('topics:detect', async ({ roomId, options = {} }) => {
    try {
      if (!roomId) {
        return socket.emit('topics:error', { error: 'Room ID required' });
      }

      logger.debug('Log message', {
        value: `[Topics] ${userEmail} requested topic detection for ${roomId}`,
      });

      const topicService = getTopicService();
      const topics = await topicService.detectAndCreateTopics(roomId, {
        since: options.since ? new Date(options.since) : undefined,
        limit: options.limit || 200,
      });

      // Emit to all subscribers in this room
      io.to(`topics:${roomId}`).emit('topics:detected', {
        roomId,
        topics,
        count: topics.length,
        message: `Detected ${topics.length} topic(s)`,
      });

      // Also emit individual created events for each new topic
      for (const topic of topics) {
        io.to(`topics:${roomId}`).emit('topics:created', {
          roomId,
          topic,
        });
      }
    } catch (error) {
      logger.error('[Topics] Detection error', {
        error: error,
      });
      socket.emit('topics:error', { error: 'Failed to detect topics' });
    }
  });

  /**
   * Request summary regeneration for a topic
   */
  socket.on('topics:regenerate', async ({ topicId }) => {
    try {
      if (!topicId) {
        return socket.emit('topics:error', { error: 'Topic ID required' });
      }

      logger.debug('Log message', {
        value: `[Topics] ${userEmail} requested regeneration for ${topicId}`,
      });

      const topicService = getTopicService();
      const result = await topicService.regenerateSummary(topicId);

      // Get the topic to find its room
      const pool = require('../dbPostgres');
      const topicResult = await pool.query(
        'SELECT room_id, title FROM topic_summaries WHERE id = $1',
        [topicId]
      );

      if (topicResult.rows.length > 0) {
        const { room_id: roomId, title } = topicResult.rows[0];

        // Emit to all subscribers
        io.to(`topics:${roomId}`).emit('topics:updated', {
          roomId,
          topicId,
          title,
          summary: result.summary,
          citations: result.citations,
        });
      }
    } catch (error) {
      logger.error('[Topics] Regeneration error', {
        error: error,
      });
      socket.emit('topics:error', { error: 'Failed to regenerate summary' });
    }
  });

  /**
   * Report inaccurate summary
   */
  socket.on('topics:report', async ({ topicId, reason }) => {
    try {
      if (!topicId) {
        return socket.emit('topics:error', { error: 'Topic ID required' });
      }

      logger.debug('Log message', {
        value: `[Topics] ${userEmail} reported inaccuracy for ${topicId}: ${reason}`,
      });

      const topicService = getTopicService();
      await topicService.reportInaccurate(topicId, userEmail, reason || 'User reported inaccuracy');

      socket.emit('topics:reported', {
        topicId,
        message: 'Report received, summary will be regenerated',
      });
    } catch (error) {
      logger.error('[Topics] Report error', {
        error: error,
      });
      socket.emit('topics:error', { error: 'Failed to report summary' });
    }
  });

  /**
   * Clean up on disconnect
   */
  socket.on('disconnect', () => {
    // Remove from all topic subscriptions
    for (const [roomId, subscribers] of topicSubscriptions.entries()) {
      subscribers.delete(socket.id);
      if (subscribers.size === 0) {
        topicSubscriptions.delete(roomId);
      }
    }
  });
}

/**
 * Broadcast topic created event (called from TopicService)
 */
function broadcastTopicCreated(io, roomId, topic) {
  io.to(`topics:${roomId}`).emit('topics:created', {
    roomId,
    topic,
  });
}

/**
 * Broadcast topic updated event (called from TopicService)
 */
function broadcastTopicUpdated(io, roomId, topicId, summary, citations) {
  io.to(`topics:${roomId}`).emit('topics:updated', {
    roomId,
    topicId,
    summary,
    citations,
  });
}

/**
 * Broadcast message added to topic (called from message handler)
 */
function broadcastMessageAddedToTopic(io, roomId, topicId, messageId) {
  io.to(`topics:${roomId}`).emit('topics:message_added', {
    roomId,
    topicId,
    messageId,
  });
}

module.exports = {
  setupTopicsHandler,
  broadcastTopicCreated,
  broadcastTopicUpdated,
  broadcastMessageAddedToTopic,
};
