/**
 * Auto Assign Message Use Case
 *
 * Orchestrates automatic message assignment to threads.
 * Depends on abstractions (IConversationAnalyzer, IThreadRepository), not concrete implementations.
 *
 * SAFEGUARDS AGAINST INFINITE LOOPS:
 * - Prevents concurrent execution for the same message
 * - Limits thread query depth to prevent deep hierarchy traversal
 * - Limits maximum threads queried to prevent performance issues
 * - Rate limiting to prevent high-traffic bursts from overwhelming the system
 * - Checks if message is already assigned before processing
 */

// In-memory tracking to prevent concurrent execution
const processingMessages = new Set();
const recentAssignments = new Map(); // messageId -> timestamp for rate limiting

// Configuration constants
const MAX_THREAD_DEPTH = 3; // Maximum depth to query (0 = top-level only, 3 = up to 3 levels deep)
const MAX_THREADS_TO_QUERY = 50; // Maximum number of threads to query (prevents performance issues)
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second window for rate limiting
const MAX_ASSIGNMENTS_PER_WINDOW = 10; // Maximum assignments per rate limit window per room

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
    fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AutoAssignMessageUseCase.js:44',message:'isMessageAlreadyAssigned entry',data:{messageId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      // Check if message has a thread_id in the messages table
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AutoAssignMessageUseCase.js:47',message:'Before require dbPostgres',data:{path:'../../../../dbPostgres'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const db = require('../../../../dbPostgres');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AutoAssignMessageUseCase.js:50',message:'After require dbPostgres',data:{dbExists:!!db,hasQuery:typeof db?.query==='function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const result = await db.query(
        'SELECT thread_id FROM messages WHERE id = $1 AND thread_id IS NOT NULL LIMIT 1',
        [messageId]
      );
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AutoAssignMessageUseCase.js:54',message:'Query result',data:{rowCount:result?.rows?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return result.rows.length > 0;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AutoAssignMessageUseCase.js:57',message:'Error in isMessageAlreadyAssigned',data:{errorMessage:error?.message,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('[AutoAssignMessageUseCase] Error checking message assignment:', error);
      // Fail-open: if we can't check, proceed (better than blocking)
      return false;
    }
  }

  /**
   * Check rate limit for room
   * @param {string} roomId - Room ID
   * @returns {boolean} True if within rate limit
   */
  checkRateLimit(roomId) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AutoAssignMessageUseCase.js:65',message:'checkRateLimit entry',data:{roomId,recentAssignmentsSize:recentAssignments.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // Clean up old entries
    for (const [msgId, timestamp] of recentAssignments.entries()) {
      if (timestamp < windowStart) {
        recentAssignments.delete(msgId);
      }
    }

    // Count assignments in current window for this room
    const assignmentsInWindow = Array.from(recentAssignments.values()).filter(
      ts => ts >= windowStart
    ).length;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AutoAssignMessageUseCase.js:81',message:'checkRateLimit result',data:{assignmentsInWindow,limit:MAX_ASSIGNMENTS_PER_WINDOW,withinLimit:assignmentsInWindow<MAX_ASSIGNMENTS_PER_WINDOW},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    return assignmentsInWindow < MAX_ASSIGNMENTS_PER_WINDOW;
  }

  /**
   * Get threads for room with depth and count limits
   * @param {string} roomId - Room ID
   * @param {boolean} includeArchived - Include archived threads
   * @returns {Promise<Array>} Filtered threads array
   */
  async getThreadsForRoomWithLimits(roomId, includeArchived) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AutoAssignMessageUseCase.js:90',message:'getThreadsForRoomWithLimits entry',data:{roomId,includeArchived},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      // Query threads with depth limit
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AutoAssignMessageUseCase.js:93',message:'Before require dbPostgres in getThreadsForRoomWithLimits',data:{path:'../../../../dbPostgres'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
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
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AutoAssignMessageUseCase.js:106',message:'Query success',data:{rowCount:result?.rows?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      return result.rows || [];
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AutoAssignMessageUseCase.js:109',message:'Error in getThreadsForRoomWithLimits',data:{errorMessage:error?.message,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('[AutoAssignMessageUseCase] Error querying threads:', error);
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
   * @returns {Promise<Object|null>} Assignment result or null
   */
  async execute({ message }) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AutoAssignMessageUseCase.js:125',message:'execute entry',data:{hasMessage:!!message,hasId:!!message?.id,hasRoomId:!!message?.roomId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    // Validate input
    if (!message || !message.id || !message.roomId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AutoAssignMessageUseCase.js:128',message:'Invalid message object warning',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.warn('[AutoAssignMessageUseCase] Invalid message object');
      return null;
    }

    const messageId = message.id;
    const roomId = message.roomId;

    // SAFEGUARD 1: Prevent concurrent execution for the same message
    if (processingMessages.has(messageId)) {
      console.log(
        `[AutoAssignMessageUseCase] Message ${messageId} already being processed, skipping`
      );
      return null;
    }

    // SAFEGUARD 2: Check if message is already assigned (prevent recursive calls)
    const alreadyAssigned = await this.isMessageAlreadyAssigned(messageId);
    if (alreadyAssigned) {
      console.log(`[AutoAssignMessageUseCase] Message ${messageId} already assigned to thread`);
      return null;
    }

    // SAFEGUARD 3: Rate limiting for high-traffic bursts
    if (!this.checkRateLimit(roomId)) {
      console.warn(
        `[AutoAssignMessageUseCase] Rate limit exceeded for room ${roomId}, skipping auto-assignment`
      );
      return null;
    }

    // Mark message as processing
    processingMessages.add(messageId);

    try {
      // Get threads for room with depth and count limits (used by analyzer)
      const getThreadsForRoom = async (roomIdParam, includeArchived) => {
        return this.getThreadsForRoomWithLimits(roomIdParam, includeArchived);
      };

      // Add message to thread function (used by analyzer)
      const addMessageToThread = async (messageIdParam, threadId) => {
        // SAFEGUARD 4: Double-check message isn't already assigned before adding
        const stillUnassigned = !(await this.isMessageAlreadyAssigned(messageIdParam));
        if (!stillUnassigned) {
          console.log(
            `[AutoAssignMessageUseCase] Message ${messageIdParam} was assigned concurrently, skipping`
          );
          return null;
        }

        // Record assignment for rate limiting
        recentAssignments.set(messageIdParam, Date.now());

        return this.threadRepository.addMessage(messageIdParam, threadId);
      };

      // Delegate to analyzer
      const result = await this.conversationAnalyzer.autoAssignMessageToThread(
        message,
        getThreadsForRoom,
        addMessageToThread
      );

      return result;
    } catch (error) {
      console.error('[AutoAssignMessageUseCase] Error executing auto-assignment:', error);
      return null;
    } finally {
      // Always remove from processing set, even on error
      processingMessages.delete(messageId);

      // Clean up old rate limit entries periodically (every 100 calls)
      if (processingMessages.size === 0 && recentAssignments.size > 1000) {
        const now = Date.now();
        const windowStart = now - RATE_LIMIT_WINDOW_MS * 10; // Keep 10x window for cleanup
        for (const [msgId, timestamp] of recentAssignments.entries()) {
          if (timestamp < windowStart) {
            recentAssignments.delete(msgId);
          }
        }
      }
    }
  }
}

module.exports = { AutoAssignMessageUseCase };

