/**
 * Thread Service Factory
 *
 * Creates and wires together thread-related services using dependency injection.
 * This is where concrete implementations are instantiated and injected.
 */

const { AIThreadAnalyzer } = require('./analyzers/AIThreadAnalyzer');
const { PostgresThreadRepository } = require('../../repositories/postgres/PostgresThreadRepository');
const { CreateThreadUseCase } = require('./useCases/CreateThreadUseCase');
const { AnalyzeConversationUseCase } = require('./useCases/AnalyzeConversationUseCase');
const { SuggestThreadUseCase } = require('./useCases/SuggestThreadUseCase');
const { AutoAssignMessageUseCase } = require('./useCases/AutoAssignMessageUseCase');
const { ArchiveThreadUseCase } = require('./useCases/ArchiveThreadUseCase');
const { ReplyInThreadUseCase } = require('./useCases/ReplyInThreadUseCase');
const { MoveMessageToThreadUseCase } = require('./useCases/MoveMessageToThreadUseCase');
const { factory: semanticIndexFactory } = require('../../infrastructure/semantic/SemanticIndexFactory');

/**
 * Factory for creating thread services
 * Singleton pattern - creates instances once and reuses them
 */
class ThreadServiceFactory {
  constructor() {
    // Lazy initialization - create instances on first access
    this._threadRepository = null;
    this._conversationAnalyzer = null;
    this._createThreadUseCase = null;
    this._analyzeConversationUseCase = null;
    this._suggestThreadUseCase = null;
    this._autoAssignMessageUseCase = null;
    this._archiveThreadUseCase = null;
    this._replyInThreadUseCase = null;
    this._moveMessageToThreadUseCase = null;
  }

  /**
   * Get semantic index instance (checks availability once at wiring time)
   * @returns {ISemanticIndex} Semantic index implementation
   */
  getSemanticIndex() {
    if (!this._semanticIndex) {
      this._semanticIndex = semanticIndexFactory.getSemanticIndex();
    }
    return this._semanticIndex;
  }

  /**
   * Get thread repository instance
   * @returns {IThreadRepository} Thread repository
   */
  getThreadRepository() {
    if (!this._threadRepository) {
      // Inject semantic index into repository
      const semanticIndex = this.getSemanticIndex();
      this._threadRepository = new PostgresThreadRepository(semanticIndex);
    }
    return this._threadRepository;
  }

  /**
   * Get conversation analyzer instance
   * @returns {IConversationAnalyzer} Conversation analyzer
   */
  getConversationAnalyzer() {
    if (!this._conversationAnalyzer) {
      // Inject semantic index into analyzer
      const semanticIndex = this.getSemanticIndex();
      this._conversationAnalyzer = new AIThreadAnalyzer(semanticIndex);
    }
    return this._conversationAnalyzer;
  }

  /**
   * Get create thread use case instance
   * @returns {CreateThreadUseCase} Create thread use case
   */
  getCreateThreadUseCase() {
    if (!this._createThreadUseCase) {
      this._createThreadUseCase = new CreateThreadUseCase(this.getThreadRepository());
    }
    return this._createThreadUseCase;
  }

  /**
   * Get analyze conversation use case instance
   * @returns {AnalyzeConversationUseCase} Analyze conversation use case
   */
  getAnalyzeConversationUseCase() {
    if (!this._analyzeConversationUseCase) {
      this._analyzeConversationUseCase = new AnalyzeConversationUseCase(
        this.getConversationAnalyzer(),
        this.getThreadRepository(),
        this.getCreateThreadUseCase()
      );
    }
    return this._analyzeConversationUseCase;
  }

  /**
   * Get suggest thread use case instance
   * @returns {SuggestThreadUseCase} Suggest thread use case
   */
  getSuggestThreadUseCase() {
    if (!this._suggestThreadUseCase) {
      this._suggestThreadUseCase = new SuggestThreadUseCase(
        this.getConversationAnalyzer(),
        this.getThreadRepository()
      );
    }
    return this._suggestThreadUseCase;
  }

  /**
   * Get auto assign message use case instance
   * @returns {AutoAssignMessageUseCase} Auto assign message use case
   */
  getAutoAssignMessageUseCase() {
    if (!this._autoAssignMessageUseCase) {
      this._autoAssignMessageUseCase = new AutoAssignMessageUseCase(
        this.getConversationAnalyzer(),
        this.getThreadRepository()
      );
    }
    return this._autoAssignMessageUseCase;
  }

  /**
   * Get archive thread use case instance
   * @returns {ArchiveThreadUseCase} Archive thread use case
   */
  getArchiveThreadUseCase() {
    if (!this._archiveThreadUseCase) {
      this._archiveThreadUseCase = new ArchiveThreadUseCase(this.getThreadRepository());
    }
    return this._archiveThreadUseCase;
  }

  /**
   * Get reply in thread use case instance
   * @returns {ReplyInThreadUseCase} Reply in thread use case
   */
  getReplyInThreadUseCase() {
    if (!this._replyInThreadUseCase) {
      const MessageService = require('../../services/messages/messageService');
      const messageService = new MessageService();
      this._replyInThreadUseCase = new ReplyInThreadUseCase(
        this.getThreadRepository(),
        messageService
      );
    }
    return this._replyInThreadUseCase;
  }

  /**
   * Get move message to thread use case instance
   * @returns {MoveMessageToThreadUseCase} Move message to thread use case
   */
  getMoveMessageToThreadUseCase() {
    if (!this._moveMessageToThreadUseCase) {
      this._moveMessageToThreadUseCase = new MoveMessageToThreadUseCase(this.getThreadRepository());
    }
    return this._moveMessageToThreadUseCase;
  }
}

// Export singleton instance
const factory = new ThreadServiceFactory();
module.exports = { ThreadServiceFactory, factory };

