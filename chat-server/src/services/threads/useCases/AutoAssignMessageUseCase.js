/**
 * Auto Assign Message Use Case
 *
 * Orchestrates automatic message assignment to threads.
 * Depends on abstractions (IConversationAnalyzer, IThreadRepository), not concrete implementations.
 */

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
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {Object} params.message - Message object with id, text, roomId
   * @returns {Promise<Object|null>} Assignment result or null
   */
  async execute({ message }) {
    // Get threads for room (used by analyzer)
    const getThreadsForRoom = async (roomId, includeArchived) => {
      return this.threadRepository.findByRoomId(roomId, { includeArchived });
    };

    // Add message to thread function (used by analyzer)
    const addMessageToThread = async (messageId, threadId) => {
      return this.threadRepository.addMessage(messageId, threadId);
    };

    // Delegate to analyzer
    return this.conversationAnalyzer.autoAssignMessageToThread(
      message,
      getThreadsForRoom,
      addMessageToThread
    );
  }
}

module.exports = { AutoAssignMessageUseCase };

