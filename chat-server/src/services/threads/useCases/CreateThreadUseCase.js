/**
 * Create Thread Use Case
 *
 * Orchestrates the creation of a new thread.
 * Depends on abstractions (IThreadRepository), not concrete implementations.
 * Emits domain events for decoupled side effects.
 */

const { eventEmitter } = require('../../../core/events/DomainEventEmitter');
const { THREAD_CREATED } = require('../../../core/events/ThreadEvents');

/**
 * Create Thread Use Case
 * Orchestrates thread creation using repository abstraction
 */
class CreateThreadUseCase {
  /**
   * @param {IThreadRepository} threadRepository - Thread repository
   */
  constructor(threadRepository) {
    this.threadRepository = threadRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.roomId - Room ID
   * @param {string} params.title - Thread title
   * @param {string} params.createdBy - Username who created
   * @param {string|null} params.initialMessageId - Optional initial message to add
   * @param {string} params.category - Thread category (defaults to 'logistics')
   * @returns {Promise<string>} Created thread ID
   */
  async execute({ roomId, title, createdBy, initialMessageId = null, category = 'logistics' }) {
    // Create thread via repository
    const threadId = await this.threadRepository.create({
      roomId,
      title,
      createdBy,
      initialMessageId,
      category,
    });

    // If initial message provided, associate it with the thread
    if (initialMessageId) {
      await this.threadRepository.addMessage(initialMessageId, threadId);
    }

    // Emit domain event (fire and forget - decouples from side effects)
    eventEmitter.emit(THREAD_CREATED, {
      threadId,
      roomId,
      title,
      createdBy,
      initialMessageId,
      category,
    });

    return threadId;
  }
}

module.exports = { CreateThreadUseCase };

