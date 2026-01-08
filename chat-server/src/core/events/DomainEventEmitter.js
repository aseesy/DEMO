/**
 * Domain Event Emitter
 *
 * Simple in-memory event emitter for domain events.
 * Decouples event producers from event consumers.
 *
 * Usage:
 *   // Emit event
 *   DomainEventEmitter.emit('ThreadCreated', { threadId, roomId, title });
 *
 *   // Listen to event
 *   DomainEventEmitter.on('ThreadCreated', async (event) => {
 *     // Handle event
 *   });
 */

const { defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'domainEventEmitter',
});

class DomainEventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Register an event listener
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler function
   */
  on(eventName, handler) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(handler);
  }

  /**
   * Remove an event listener
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler function to remove
   */
  off(eventName, handler) {
    if (!this.listeners.has(eventName)) return;
    const handlers = this.listeners.get(eventName);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit an event (fire and forget)
   * All listeners are called asynchronously and errors are caught
   * @param {string} eventName - Event name
   * @param {Object} eventData - Event payload
   */
  emit(eventName, eventData) {
    if (!this.listeners.has(eventName)) {
      return; // No listeners, nothing to do
    }

    const handlers = this.listeners.get(eventName);

    // Fire and forget - call all handlers asynchronously
    handlers.forEach(handler => {
      setImmediate(async () => {
        try {
          await handler(eventData);
        } catch (error) {
          logger.error('Log message', {
            arg0: `[DomainEventEmitter] Error in ${eventName} handler:`,
            error: error,
          });
          // Don't throw - event handlers should not break the main flow
        }
      });
    });
  }

  /**
   * Get all listeners for an event (for testing/debugging)
   * @param {string} eventName - Event name
   * @returns {Array<Function>} Array of handlers
   */
  getListeners(eventName) {
    return this.listeners.get(eventName) || [];
  }

  /**
   * Clear all listeners (useful for testing)
   */
  clear() {
    this.listeners.clear();
  }
}

// Export singleton instance
const eventEmitter = new DomainEventEmitter();
module.exports = { DomainEventEmitter, eventEmitter };
