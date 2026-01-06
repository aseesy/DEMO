/**
 * MessageQueueService - Offline Queue Management
 *
 * Responsibility: Manage offline message queue and persistence
 *
 * Why this exists:
 * - Separates queue management from UI state and transport
 * - Handles localStorage persistence via StorageAdapter
 * - Can be tested independently
 *
 * Single Responsibility: Queue management only
 */

import { storage, StorageKeys } from '../../adapters/storage';

/**
 * MessageQueueService
 *
 * Manages offline message queue
 */
export class MessageQueueService {
  constructor() {
    this._queue = this._loadQueue();
  }

  /**
   * Load queue from storage via StorageAdapter
   * @private
   */
  _loadQueue() {
    try {
      const stored = storage.get(StorageKeys.OFFLINE_QUEUE);
      return Array.isArray(stored) ? stored : [];
    } catch (error) {
      console.warn('[MessageQueueService] Failed to load queue:', error);
      return [];
    }
  }

  /**
   * Save queue to storage via StorageAdapter
   * @private
   */
  _saveQueue() {
    try {
      storage.set(StorageKeys.OFFLINE_QUEUE, this._queue);
    } catch (error) {
      console.warn('[MessageQueueService] Failed to save queue:', error);
    }
  }

  /**
   * Add message to queue
   * @param {Object} message - Message to queue
   */
  enqueue(message) {
    this._queue.push(message);
    this._saveQueue();
  }

  /**
   * Get all queued messages
   * @returns {Array} Queued messages
   */
  getQueue() {
    return [...this._queue];
  }

  /**
   * Remove message from queue
   * @param {string} messageId - Message ID to remove
   */
  dequeue(messageId) {
    this._queue = this._queue.filter(msg => msg.id !== messageId);
    this._saveQueue();
  }

  /**
   * Clear entire queue
   */
  clear() {
    this._queue = [];
    this._saveQueue();
  }

  /**
   * Get queue size
   * @returns {number}
   */
  size() {
    return this._queue.length;
  }
}

/**
 * Create a MessageQueueService instance
 * @returns {MessageQueueService}
 */
export function createMessageQueueService() {
  return new MessageQueueService();
}
