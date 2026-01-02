/**
 * Event Bus - Central Event System
 *
 * Phase 2: Event-Driven Architecture
 * Replaces direct state passing with event-driven communication
 *
 * Services emit events, other services subscribe to events
 * Decouples services and makes system more testable
 */

class EventBus {
  constructor() {
    this.subscribers = new Map(); // eventName -> Set<callback>
    this.eventHistory = []; // For debugging (last 100 events)
    this.maxHistorySize = 100;
  }

  /**
   * Emit an event to all subscribers
   * @param {string} eventName - Event name
   * @param {any} data - Event data
   */
  emit(eventName, data) {
    const subscribers = this.subscribers.get(eventName);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error in subscriber for '${eventName}':`, error);
        }
      });
    }

    // Store in history for debugging
    this.eventHistory.push({
      event: eventName,
      data: typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : String(data),
      timestamp: new Date().toISOString(),
    });

    // Keep history size manageable
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventName, callback) {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, new Set());
    }
    this.subscribers.get(eventName).add(callback);

    return () => {
      const subscribers = this.subscribers.get(eventName);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(eventName);
        }
      }
    };
  }

  /**
   * Get event history (for debugging)
   * @param {number} limit - Number of recent events to return
   * @returns {Array} Event history
   */
  getHistory(limit = 20) {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Get subscriber count for an event
   * @param {string} eventName - Event name
   * @returns {number} Number of subscribers
   */
  getSubscriberCount(eventName) {
    return this.subscribers.get(eventName)?.size || 0;
  }

  /**
   * Clear all subscribers (for testing/cleanup)
   */
  clear() {
    this.subscribers.clear();
    this.eventHistory = [];
  }
}

// Export singleton instance
const eventBus = new EventBus();

module.exports = { eventBus, EventBus };

