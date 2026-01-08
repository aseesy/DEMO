/**
 * Redis Pub/Sub Service
 *
 * Provides pub/sub functionality for multi-instance coordination.
 * Allows different server instances to communicate via Redis channels.
 *
 * @module liaizen/infrastructure/pubsub/redisPubSub
 */

const {
  getClient,
  createSubscriber,
  publish,
  isRedisAvailable,
} = require('../database/redisClient');

const { defaultLogger: defaultLogger } = require('../../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'redisPubSub',
});

class RedisPubSub {
  constructor() {
    this.subscriber = null;
    this.subscriptions = new Map(); // channel -> Set of callbacks
    this.isSubscribed = false;
  }

  /**
   * Initialize subscriber connection
   * @returns {Promise<boolean>} True if initialized successfully
   */
  async initialize() {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      this.subscriber = createSubscriber();
      if (!this.subscriber) {
        return false;
      }

      // Set up message handler
      this.subscriber.on('message', (channel, message) => {
        const callbacks = this.subscriptions.get(channel);
        if (callbacks) {
          try {
            const data = JSON.parse(message);
            callbacks.forEach(callback => {
              try {
                callback(data, channel);
              } catch (error) {
                logger.error('Log message', {
                  arg0: `[RedisPubSub] Callback error for ${channel}:`,
                  message: error.message,
                });
              }
            });
          } catch (error) {
            logger.error('Log message', {
              arg0: `[RedisPubSub] Failed to parse message from ${channel}:`,
              message: error.message,
            });
          }
        }
      });

      // Connect if not already connected
      if (this.subscriber.status === 'wait' || this.subscriber.status === 'end') {
        try {
          await this.subscriber.connect();
        } catch (error) {
          // Ignore "already connecting" errors - connection might be in progress
          if (
            !error.message.includes('already connecting') &&
            !error.message.includes('already connected')
          ) {
            throw error;
          }
        }
      }

      // Wait for connection to be ready
      let attempts = 0;
      while (this.subscriber.status !== 'ready' && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      // Verify connection with ping
      if (this.subscriber.status !== 'ready') {
        try {
          await this.subscriber.ping();
        } catch (error) {
          throw new Error(`Subscriber not ready: ${error.message}`);
        }
      }

      this.isSubscribed = true;
      logger.debug('✅ Redis Pub/Sub initialized');
      return true;
    } catch (error) {
      logger.error('❌ Redis Pub/Sub initialization failed', {
        message: error.message,
      });
      return false;
    }
  }

  /**
   * Subscribe to a channel
   * @param {string} channel - Channel name
   * @param {Function} callback - Callback function(data, channel)
   * @returns {Promise<boolean>} True if subscribed successfully
   */
  async subscribe(channel, callback) {
    if (!this.isSubscribed || !this.subscriber) {
      logger.warn('[RedisPubSub] Not initialized, cannot subscribe');
      return false;
    }

    try {
      // Add callback to subscriptions
      if (!this.subscriptions.has(channel)) {
        this.subscriptions.set(channel, new Set());
        // Subscribe to channel in Redis
        await this.subscriber.subscribe(channel);
      }
      this.subscriptions.get(channel).add(callback);
      return true;
    } catch (error) {
      logger.error('Log message', {
        arg0: `[RedisPubSub] Failed to subscribe to ${channel}:`,
        message: error.message,
      });
      return false;
    }
  }

  /**
   * Unsubscribe from a channel
   * @param {string} channel - Channel name
   * @param {Function} callback - Callback function to remove (optional, removes all if not provided)
   * @returns {Promise<boolean>} True if unsubscribed successfully
   */
  async unsubscribe(channel, callback = null) {
    if (!this.subscriptions.has(channel)) {
      return false;
    }

    try {
      const callbacks = this.subscriptions.get(channel);
      if (callback) {
        callbacks.delete(callback);
      } else {
        callbacks.clear();
      }

      // If no more callbacks, unsubscribe from Redis
      if (callbacks.size === 0) {
        this.subscriptions.delete(channel);
        if (this.subscriber) {
          await this.subscriber.unsubscribe(channel);
        }
      }

      return true;
    } catch (error) {
      logger.error('Log message', {
        arg0: `[RedisPubSub] Failed to unsubscribe from ${channel}:`,
        message: error.message,
      });
      return false;
    }
  }

  /**
   * Publish a message to a channel
   * @param {string} channel - Channel name
   * @param {any} data - Data to publish (will be JSON stringified)
   * @returns {Promise<number>} Number of subscribers that received the message
   */
  async publish(channel, data) {
    return await publish(channel, data);
  }

  /**
   * Close pub/sub connections
   * @returns {Promise<void>}
   */
  async close() {
    if (this.subscriber) {
      try {
        await this.subscriber.quit();
        this.subscriber = null;
        this.isSubscribed = false;
        this.subscriptions.clear();
        logger.debug('✅ Redis Pub/Sub closed');
      } catch (error) {
        logger.error('❌ Redis Pub/Sub close error', {
          message: error.message,
        });
      }
    }
  }
}

// Singleton instance
let pubSubInstance = null;

/**
 * Get or create the singleton Pub/Sub instance
 * @returns {RedisPubSub} Pub/Sub instance
 */
function getPubSub() {
  if (!pubSubInstance) {
    pubSubInstance = new RedisPubSub();
  }
  return pubSubInstance;
}

module.exports = {
  RedisPubSub,
  getPubSub,
};
