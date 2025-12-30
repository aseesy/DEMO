/**
 * Thread Repository Interface
 *
 * Defines the contract for thread persistence operations.
 * Abstracts database implementation from the core domain.
 *
 * @module repositories/interfaces/IThreadRepository
 */

const { IGenericRepository } = require('./IGenericRepository');

/**
 * Thread repository interface for thread persistence
 * Extends IGenericRepository with thread-specific operations
 */
class IThreadRepository extends IGenericRepository {
  /**
   * Find threads by room ID
   * @param {string} roomId - Room ID
   * @param {Object} options - { includeArchived, limit }
   * @returns {Promise<Array>} Array of thread objects
   */
  async findByRoomId(roomId, options = {}) {
    throw new Error('findByRoomId() must be implemented by subclass');
  }

  /**
   * Find thread by ID
   * @param {string} threadId - Thread ID
   * @returns {Promise<Object|null>} Thread object or null
   */
  async findById(threadId) {
    throw new Error('findById() must be implemented by subclass');
  }

  /**
   * Find threads by category
   * @param {string} roomId - Room ID
   * @param {string} category - Category name
   * @param {number} limit - Maximum number of threads
   * @returns {Promise<Array>} Array of thread objects
   */
  async findByCategory(roomId, category, limit = 10) {
    throw new Error('findByCategory() must be implemented by subclass');
  }

  /**
   * Create a new thread
   * @param {Object} threadData - Thread data (roomId, title, createdBy, category, etc.)
   * @returns {Promise<string>} Created thread ID
   */
  async create(threadData) {
    throw new Error('create() must be implemented by subclass');
  }

  /**
   * Update thread title
   * @param {string} threadId - Thread ID
   * @param {string} newTitle - New title
   * @returns {Promise<boolean>} Success status
   */
  async updateTitle(threadId, newTitle) {
    throw new Error('updateTitle() must be implemented by subclass');
  }

  /**
   * Update thread category
   * @param {string} threadId - Thread ID
   * @param {string} newCategory - New category
   * @returns {Promise<boolean>} Success status
   */
  async updateCategory(threadId, newCategory) {
    throw new Error('updateCategory() must be implemented by subclass');
  }

  /**
   * Archive or unarchive a thread
   * @param {string} threadId - Thread ID
   * @param {boolean} archived - Archive status
   * @returns {Promise<boolean>} Success status
   */
  async archive(threadId, archived = true) {
    throw new Error('archive() must be implemented by subclass');
  }

  /**
   * Get messages for a thread
   * @param {string} threadId - Thread ID
   * @param {number} limit - Maximum number of messages
   * @returns {Promise<Array>} Array of message objects
   */
  async getMessages(threadId, limit = 50) {
    throw new Error('getMessages() must be implemented by subclass');
  }

  /**
   * Add a message to a thread
   * @param {string} messageId - Message ID
   * @param {string} threadId - Thread ID
   * @returns {Promise<Object>} Result with success, messageCount, lastMessageAt, sequenceNumber
   */
  async addMessage(messageId, threadId) {
    throw new Error('addMessage() must be implemented by subclass');
  }

  /**
   * Remove a message from a thread
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Result with success, threadId, messageCount
   */
  async removeMessage(messageId) {
    throw new Error('removeMessage() must be implemented by subclass');
  }
}

module.exports = { IThreadRepository };

