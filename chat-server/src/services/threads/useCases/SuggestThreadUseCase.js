/**
 * Suggest Thread Use Case
 *
 * Orchestrates thread suggestion for a message.
 * Depends on abstractions (IConversationAnalyzer, IThreadRepository), not concrete implementations.
 */

/**
 * Suggest Thread Use Case
 * Orchestrates thread suggestion using analyzer and repository abstractions
 */
class SuggestThreadUseCase {
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
   * @param {Object} params.message - Message object
   * @param {Array<Object>} params.recentMessages - Recent messages for context
   * @param {string} params.roomId - Room ID
   * @returns {Promise<Object|null>} Suggestion or null
   */
  async execute({ message, recentMessages, roomId }) {
    // Get threads for room (used by analyzer)
    const getThreadsForRoom = async (roomId, includeArchived) => {
      return this.threadRepository.findByRoomId(roomId, { includeArchived });
    };

    // Delegate to analyzer
    return this.conversationAnalyzer.suggestThreadForMessage(
      message,
      recentMessages,
      roomId,
      getThreadsForRoom
    );
  }
}

module.exports = { SuggestThreadUseCase };

