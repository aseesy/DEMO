/**
 * Auto Assign Message Use Case
 *
 * Orchestrates automatic message assignment to threads.
 * Depends on abstractions (IConversationAnalyzer, IThreadRepository), not concrete implementations.
 *
 * SAFEGUARDS AGAINST INFINITE LOOPS:
 * - Prevents concurrent execution using Redis distributed locks (prevents "split brain" problem)
 * - Rate limiting using Redis with TTL (persists across restarts)
 * - Limits thread query depth to prevent deep hierarchy traversal
 * - Limits maximum threads queried to prevent performance issues
 * - Checks if message is already assigned before processing (database-backed)
 *
 * ARCHITECTURE: Distributed state using Redis
 * - Distributed locking prevents concurrent processing across multiple server instances
 * - Rate limiting persists across server restarts (Redis TTL)
 * - Graceful fallback if Redis is unavailable (fail-open)
 * - Works across server restarts and multiple server instances
 * - Suitable for serverless environments
 */

const {
  acquireLock,
  releaseLock,
  checkRateLimit,
} = require('../../../infrastructure/database/redisClient');

const { defaultLogger: defaultLogger } = require('../../../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'AutoAssignMessageUseCase',
});

// Configuration constants
const MAX_THREAD_DEPTH = 3; // Maximum depth to query (0 = top-level only, 3 = up to 3 levels deep)
const MAX_THREADS_TO_QUERY = 50; // Maximum number of threads to query (prevents performance issues)
const LOCK_TTL_SECONDS = 30; // Lock expiration time (prevents deadlocks if process crashes)
const RATE_LIMIT_WINDOW_SECONDS = 60; // Rate limit window (1 minute)
const MAX_ASSIGNMENTS_PER_WINDOW = 10; // Maximum assignments per room per window

/**
 * Auto Assign Message Use Case
 * Orchestrates message auto-assignment using analyzer and repository abstractions
 */
class AutoAssignMessageUseCase {
  /**
   * @param {IConversationAnalyzer} conversationAnalyzer - Conversation analyzer
   * @param {IThreadRepository} threadRepository - Thread repository
   */
  constructor(conversationAnalyzer, threadRepository) {
    this.conversationAnalyzer = conversationAnalyzer;
    this.threadRepository = threadRepository;
  }

  /**
   * Check if message is already assigned to a thread
   * @param {string} messageId - Message ID
   * @returns {Promise<boolean>} True if message is already assigned
   */
  async isMessageAlreadyAssigned(messageId) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'AutoAssignMessageUseCase.js:44',
        message: 'isMessageAlreadyAssigned entry',
        data: { messageId },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      }),
    }).catch(() => {});
    // #endregion
    try {
      // Check if message has a thread_id in the messages table
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'AutoAssignMessageUseCase.js:47',
          message: 'Before require dbPostgres',
          data: { path: '../../../../dbPostgres' },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A',
        }),
      }).catch(() => {});
      // #endregion
      const db = require('../../../../dbPostgres');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'AutoAssignMessageUseCase.js:50',
          message: 'After require dbPostgres',
          data: { dbExists: !!db, hasQuery: typeof db?.query === 'function' },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A',
        }),
      }).catch(() => {});
      // #endregion
      const result = await db.query(
        'SELECT thread_id FROM messages WHERE id = $1 AND thread_id IS NOT NULL LIMIT 1',
        [messageId]
      );
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'AutoAssignMessageUseCase.js:54',
          message: 'Query result',
          data: { rowCount: result?.rows?.length || 0 },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B',
        }),
      }).catch(() => {});
      // #endregion
      return result.rows.length > 0;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'AutoAssignMessageUseCase.js:57',
          message: 'Error in isMessageAlreadyAssigned',
          data: { errorMessage: error?.message, errorStack: error?.stack?.substring(0, 200) },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A',
        }),
      }).catch(() => {});
      // #endregion
      logger.error('[AutoAssignMessageUseCase] Error checking message assignment', {
        error: error,
      });
      // Fail-open: if we can't check, proceed (better than blocking)
      return false;
    }
  }

  /**
   * Acquire distributed lock for message processing
   * Prevents "split brain" problem where multiple servers process the same message
   * @param {string} messageId - Message ID
   * @returns {Promise<boolean>} True if lock was acquired, false if already locked
   */
  async acquireProcessingLock(messageId) {
    return acquireLock(`message:${messageId}`, LOCK_TTL_SECONDS);
  }

  /**
   * Release distributed lock for message processing
   * @param {string} messageId - Message ID
   * @returns {Promise<void>}
   */
  async releaseProcessingLock(messageId) {
    return releaseLock(`message:${messageId}`);
  }

  /**
   * Check rate limit for room using Redis
   * Persists across server restarts (unlike in-memory state)
   * @param {string} roomId - Room ID
   * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number}>}
   */
  async checkRoomRateLimit(roomId) {
    return checkRateLimit(`room:${roomId}`, MAX_ASSIGNMENTS_PER_WINDOW, RATE_LIMIT_WINDOW_SECONDS);
  }

  /**
   * Get threads for room with depth and count limits
   * @param {string} roomId - Room ID
   * @param {boolean} includeArchived - Include archived threads
   * @returns {Promise<Array>} Filtered threads array
   */
  async getThreadsForRoomWithLimits(roomId, includeArchived) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'AutoAssignMessageUseCase.js:90',
        message: 'getThreadsForRoomWithLimits entry',
        data: { roomId, includeArchived },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      }),
    }).catch(() => {});
    // #endregion
    try {
      // Query threads with depth limit
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'AutoAssignMessageUseCase.js:93',
          message: 'Before require dbPostgres in getThreadsForRoomWithLimits',
          data: { path: '../../../../dbPostgres' },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A',
        }),
      }).catch(() => {});
      // #endregion
      const db = require('../../../../dbPostgres');
      // PERFORMANCE: Uses idx_threads_room_archived_updated or idx_threads_room_active_updated
      //              (created in migration 034) for optimal filtered query performance
      const whereClause = includeArchived
        ? 'room_id = $1 AND depth <= $2'
        : 'room_id = $1 AND is_archived = 0 AND depth <= $2';

      const result = await db.query(
        `SELECT * FROM threads
         WHERE ${whereClause}
         ORDER BY updated_at DESC
         LIMIT $3`,
        [roomId, MAX_THREAD_DEPTH, MAX_THREADS_TO_QUERY]
      );
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'AutoAssignMessageUseCase.js:106',
          message: 'Query success',
          data: { rowCount: result?.rows?.length || 0 },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B',
        }),
      }).catch(() => {});
      // #endregion

      return result.rows || [];
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'AutoAssignMessageUseCase.js:109',
          message: 'Error in getThreadsForRoomWithLimits',
          data: { errorMessage: error?.message, errorStack: error?.stack?.substring(0, 200) },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A',
        }),
      }).catch(() => {});
      // #endregion
      logger.error('[AutoAssignMessageUseCase] Error querying threads', {
        error: error,
      });
      // Fallback to repository method if depth query fails
      const threads = await this.threadRepository.findByRoomId(roomId, {
        includeArchived,
        limit: MAX_THREADS_TO_QUERY,
      });
      // Filter by depth as fallback
      return threads.filter(t => (t.depth || 0) <= MAX_THREAD_DEPTH);
    }
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {Object} params.message - Message object with id, text, roomId
   * @returns {Promise<Object>} Assignment result
   * @throws {Error} If message is invalid or processing fails
   */
  async execute({ message }) {
    // Validate input
    if (!message || !message.id || !message.roomId) {
      const error = new Error(
        '[AutoAssignMessageUseCase] Invalid message object: missing id or roomId'
      );
      logger.warn('Log message', {
        message: error.message,
        ...{ message: message ? { id: message.id, roomId: message.roomId } : null },
      });
      throw error;
    }

    const messageId = message.id;
    const roomId = message.roomId;

    // SAFEGUARD 1: Acquire distributed lock (prevents "split brain" problem)
    // If another server instance is processing this message, we'll skip it
    const lockAcquired = await this.acquireProcessingLock(messageId);
    if (!lockAcquired) {
      logger.debug('Log message', {
        value: `[AutoAssignMessageUseCase] Message ${messageId} is being processed by another instance, skipping`,
      });
      return {
        success: true,
        alreadyProcessing: true,
        message: `Message ${messageId} is being processed by another instance`,
      };
    }

    // SAFEGUARD 2: Check if message is already assigned (database-backed, works across instances)
    // This prevents recursive calls and duplicate processing
    const alreadyAssigned = await this.isMessageAlreadyAssigned(messageId);
    if (alreadyAssigned) {
      // Release lock before returning
      await this.releaseProcessingLock(messageId);
      // Return success result indicating message was already assigned (idempotent)
      return {
        success: true,
        alreadyAssigned: true,
        message: `Message ${messageId} already assigned to thread`,
      };
    }

    // SAFEGUARD 3: Rate limiting using Redis (persists across restarts)
    const rateLimitResult = await this.checkRoomRateLimit(roomId);
    if (!rateLimitResult.allowed) {
      // Release lock before returning
      await this.releaseProcessingLock(messageId);
      logger.warn('Log message', {
        value: `[AutoAssignMessageUseCase] Rate limit exceeded for room ${roomId} (${rateLimitResult.count}/${MAX_ASSIGNMENTS_PER_WINDOW}), skipping auto-assignment. Resets at ${new Date(rateLimitResult.resetAt).toISOString()}`,
      });
      return {
        success: false,
        rateLimited: true,
        message: `Rate limit exceeded for room ${roomId}`,
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      };
    }

    try {
      // Get threads for room with depth and count limits (used by analyzer)
      const getThreadsForRoom = async (roomIdParam, includeArchived) => {
        return this.getThreadsForRoomWithLimits(roomIdParam, includeArchived);
      };

      // Add message to thread function (used by analyzer)
      // Uses database transaction for atomicity - prevents race conditions
      const addMessageToThread = async (messageIdParam, threadId) => {
        // SAFEGUARD 2: Double-check message isn't already assigned before adding
        // This is a critical check - another instance might have assigned it
        const stillUnassigned = !(await this.isMessageAlreadyAssigned(messageIdParam));
        if (!stillUnassigned) {
          logger.debug('Log message', {
            value: `[AutoAssignMessageUseCase] Message ${messageIdParam} was assigned concurrently by another instance, skipping`,
          });
          // Return success but indicate it was already assigned (idempotent)
          return {
            success: true,
            alreadyAssigned: true,
            message: `Message ${messageIdParam} was assigned concurrently`,
          };
        }

        // Add message atomically - database handles concurrency
        return this.threadRepository.addMessage(messageIdParam, threadId);
      };

      // Delegate to analyzer
      const result = await this.conversationAnalyzer.autoAssignMessageToThread(
        message,
        getThreadsForRoom,
        addMessageToThread
      );

      if (!result) {
        // Analyzer returned null - no thread match found (not an error)
        return {
          success: true,
          assigned: false,
          message: `No suitable thread found for message ${messageId}`,
        };
      }

      return result;
    } catch (error) {
      // Log error with context for debugging
      logger.error('[AutoAssignMessageUseCase] Error executing auto-assignment', {
        ...{
          messageId,
          roomId,
          error: error.message,
          stack: error.stack,
        },
      });
      // Re-throw with context
      throw new Error(
        `[AutoAssignMessageUseCase] Failed to auto-assign message ${messageId}: ${error.message}`
      );
    } finally {
      // Always release lock, even on error (prevents deadlocks)
      await this.releaseProcessingLock(messageId);
    }
  }
}

module.exports = { AutoAssignMessageUseCase };
