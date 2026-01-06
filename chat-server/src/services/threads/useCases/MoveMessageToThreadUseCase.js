/**
 * Move Message to Thread Use Case
 *
 * Orchestrates moving a message from one thread to another (or from main chat to thread).
 * Uses database transactions for atomicity.
 * Emits domain events for decoupled side effects.
 */

const { eventEmitter } = require('../../../core/events/DomainEventEmitter');
const { THREAD_MESSAGE_ADDED } = require('../../../core/events/ThreadEvents');

/**
 * Move Message to Thread Use Case
 * Orchestrates message movement using repository abstraction
 */
class MoveMessageToThreadUseCase {
  /**
   * @param {IThreadRepository} threadRepository - Thread repository
   */
  constructor(threadRepository) {
    this.threadRepository = threadRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.messageId - Message ID to move
   * @param {string} params.targetThreadId - Target thread ID (null to move to main chat)
   * @param {string} params.roomId - Room ID (for validation)
   * @returns {Promise<Object>} Result with success status and affected thread IDs
   */
  async execute({ messageId, targetThreadId, roomId }) {
    const db = require('../../../../dbPostgres');

    // Get message to verify it exists and get current thread
    const messageResult = await db.query('SELECT thread_id, room_id FROM messages WHERE id = $1', [messageId]);
    if (messageResult.rows.length === 0) {
      throw new Error(`Message not found: ${messageId}`);
    }

    const message = messageResult.rows[0];
    const currentThreadId = message.thread_id;

    // Validate room matches
    if (message.room_id !== roomId) {
      throw new Error(`Message belongs to different room. Message room: ${message.room_id}, Target room: ${roomId}`);
    }

    // If moving to same thread, no-op
    if (currentThreadId === targetThreadId) {
      return {
        success: true,
        messageId,
        oldThreadId: currentThreadId,
        newThreadId: targetThreadId,
        message: 'Message already in target thread',
      };
    }

    // Validate target thread exists and belongs to room (if moving to thread)
    if (targetThreadId) {
      const targetThread = await this.threadRepository.findById(targetThreadId);
      if (!targetThread) {
        throw new Error(`Target thread not found: ${targetThreadId}`);
      }
      if (targetThread.room_id !== roomId) {
        throw new Error(`Target thread belongs to different room. Thread room: ${targetThread.room_id}, Message room: ${roomId}`);
      }
    }

    // Use transaction for atomicity
    await db.query('BEGIN');
    try {
      const affectedThreads = [];

      // Step 1: Remove from old thread (if exists)
      if (currentThreadId) {
        const removeResult = await this.threadRepository.removeMessage(messageId);
        affectedThreads.push({
          threadId: currentThreadId,
          messageCount: removeResult.messageCount,
          action: 'removed',
        });
      }

      // Step 2: Add to new thread (if target is a thread)
      if (targetThreadId) {
        const addResult = await this.threadRepository.addMessage(messageId, targetThreadId);
        affectedThreads.push({
          threadId: targetThreadId,
          messageCount: addResult.messageCount,
          action: 'added',
        });

        // Emit domain event
        eventEmitter.emit(THREAD_MESSAGE_ADDED, {
          messageId,
          threadId: targetThreadId,
          roomId,
          movedFrom: currentThreadId,
        });
      } else {
        // Moving to main chat - just remove thread_id from message
        await db.query('UPDATE messages SET thread_id = NULL, thread_sequence = NULL WHERE id = $1', [messageId]);
      }

      await db.query('COMMIT');

      return {
        success: true,
        messageId,
        oldThreadId: currentThreadId,
        newThreadId: targetThreadId,
        affectedThreads,
      };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
}

module.exports = { MoveMessageToThreadUseCase };

