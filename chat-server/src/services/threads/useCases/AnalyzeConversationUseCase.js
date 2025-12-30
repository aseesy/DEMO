/**
 * Analyze Conversation Use Case
 *
 * Orchestrates conversation analysis to identify and create threads.
 * Depends on abstractions (IConversationAnalyzer, IThreadRepository), not concrete implementations.
 */

/**
 * Analyze Conversation Use Case
 * Orchestrates conversation analysis using analyzer and repository abstractions
 */
class AnalyzeConversationUseCase {
  /**
   * @param {IConversationAnalyzer} conversationAnalyzer - Conversation analyzer
   * @param {IThreadRepository} threadRepository - Thread repository
   * @param {CreateThreadUseCase} createThreadUseCase - Create thread use case
   */
  constructor(conversationAnalyzer, threadRepository, createThreadUseCase) {
    this.conversationAnalyzer = conversationAnalyzer;
    this.threadRepository = threadRepository;
    this.createThreadUseCase = createThreadUseCase;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.roomId - Room ID to analyze
   * @param {number} params.limit - Maximum number of messages to analyze (default: 100)
   * @returns {Promise<Object>} Analysis results with suggestions and created threads
   */
  async execute({ roomId, limit = 100 }) {
    // Get threads for room (used by analyzer)
    const getThreadsForRoom = async (roomId, includeArchived) => {
      return this.threadRepository.findByRoomId(roomId, { includeArchived });
    };

    // Create thread function (used by analyzer)
    const createThread = async (roomId, title, createdBy, initialMessageId, category) => {
      return this.createThreadUseCase.execute({
        roomId,
        title,
        createdBy,
        initialMessageId,
        category,
      });
    };

    // Add message to thread function (used by analyzer)
    const addMessageToThread = async (messageId, threadId) => {
      return this.threadRepository.addMessage(messageId, threadId);
    };

    // Archive thread function (used by analyzer)
    const archiveThread = async (threadId, archived) => {
      return this.threadRepository.archive(threadId, archived);
    };

    // Generate embedding function (used by analyzer)
    const generateEmbeddingForText = async (text) => {
      const threadEmbeddings = require('../threadEmbeddings');
      return threadEmbeddings.generateEmbeddingForText(text);
    };

    // Delegate to analyzer
    return this.conversationAnalyzer.analyzeConversationHistory(roomId, limit, {
      getThreadsForRoom,
      createThread,
      addMessageToThread,
      archiveThread,
      generateEmbeddingForText,
    });
  }
}

module.exports = { AnalyzeConversationUseCase };

