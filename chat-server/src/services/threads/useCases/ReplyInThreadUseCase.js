/**
 * Reply in Thread Use Case
 *
 * Orchestrates sending a message directly in a thread.
 * Validates thread exists and belongs to same room as message.
 * Automatically adds message to thread after creation.
 * Emits domain events for decoupled side effects.
 */

const { eventEmitter } = require('../../../core/events/DomainEventEmitter');
const { THREAD_MESSAGE_ADDED } = require('../../../core/events/ThreadEvents');

/**
 * Reply in Thread Use Case
 * Orchestrates thread reply using repository abstraction
 */
class ReplyInThreadUseCase {
  /**
   * @param {IThreadRepository} threadRepository - Thread repository
   * @param {Object} messageService - Message service for creating messages
   */
  constructor(threadRepository, messageService) {
    this.threadRepository = threadRepository;
    this.messageService = messageService;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.threadId - Thread ID to reply in
   * @param {string} params.messageText - Message text
   * @param {string} params.userEmail - Sender email
   * @param {string} params.roomId - Room ID (must match thread's room)
   * @param {Object} params.messageData - Additional message data (optional)
   * @returns {Promise<Object>} Result with message and thread metadata
   */
  async execute({ threadId, messageText, userEmail, roomId, messageData = {} }) {
    // Validate thread exists and belongs to room
    const thread = await this.threadRepository.findById(threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${threadId}`);
    }

    if (thread.room_id !== roomId) {
      throw new Error(`Thread belongs to different room. Thread room: ${thread.room_id}, Message room: ${roomId}`);
    }

    if (thread.is_archived === 1) {
      throw new Error('Cannot reply to archived thread. Please reopen the thread first.');
    }

    // Create message WITHOUT threadId first (to avoid partial state if addMessage fails)
    // We'll add it to the thread atomically in the next step
    const message = await this.messageService.createMessage(
      {
        ...messageData,
        text: messageText,
        roomId,
        // Don't set threadId here - addMessage will handle it atomically
      },
      userEmail,
      { retry: true, maxRetries: 3 }
    );

    // Add message to thread atomically (handles sequence assignment, count increment, and thread_id update)
    const addResult = await this.threadRepository.addMessage(message.id, threadId);

    // Emit domain event (fire and forget - decouples from side effects)
    eventEmitter.emit(THREAD_MESSAGE_ADDED, {
      messageId: message.id,
      threadId,
      roomId,
      userEmail,
    });

    return {
      success: true,
      message,
      thread: {
        id: threadId,
        title: thread.title,
        category: thread.category,
        messageCount: addResult.messageCount,
        lastMessageAt: addResult.lastMessageAt,
      },
    };
  }
}

module.exports = { ReplyInThreadUseCase };

