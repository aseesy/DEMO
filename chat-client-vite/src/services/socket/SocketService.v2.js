/**
 * SocketService - Application Layer Socket Management
 *
 * Single responsibility: Manage socket connection lifecycle and state.
 * Uses SocketAdapter for actual socket.io-client interaction.
 *
 * Architecture (Event-Driven):
 * - Subscribes to tokenManager for auth state changes
 * - Auto-connects when token becomes available
 * - Auto-disconnects when token is cleared
 * - Emits 'connect' event for downstream services (ChatRoomService)
 *
 * Responsibilities:
 * - Connection lifecycle (connect/disconnect)
 * - State management (connected/disconnected/connecting)
 * - Event subscription system
 * - Token management (reactive via tokenManager subscription)
 *
 * What it does NOT do:
 * - Direct socket.io-client usage (uses SocketAdapter)
 * - Transport configuration (delegates to adapter)
 * - Business logic (messages, threads, etc.)
 */

import { createSocketConnection } from '../../adapters/socket/SocketAdapter.js';
import { SOCKET_URL } from '../../config.js';
import { tokenManager } from '../../utils/tokenManager.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('[SocketService]');

class SocketService {
  constructor() {
    this.connection = null; // SocketConnection wrapper from adapter
    this.subscribers = new Map(); // event -> Set<callback>
    this.stateSubscribers = new Set(); // callbacks for state changes
    this.emitQueue = []; // Queue of {event, data} to emit when connected
    this.connecting = false; // Flag to prevent multiple simultaneous connections
    this.currentToken = null; // Track current token to detect changes
    this.tokenUnsubscribe = null; // Cleanup function for token subscription

    // Subscribe to token changes - this is the core of event-driven auth
    this.setupTokenSubscription();
  }

  /**
   * Subscribe to tokenManager for reactive auth
   * When token changes, auto-connect/disconnect
   */
  setupTokenSubscription() {
    this.tokenUnsubscribe = tokenManager.subscribe(token => {
      logger.debug('Token changed', { hasToken: !!token });

      if (token) {
        // Token available - connect (will reconnect if token changed)
        this.connect(token);
      } else {
        // Token cleared - disconnect
        this.disconnect();
      }
    });
  }

  /**
   * Check if the socket is currently connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connection?.connected ?? false;
  }

  /**
   * Get socket ID
   */
  getSocketId() {
    return this.connection?.id ?? null;
  }

  /**
   * Get socket URL from config or window override
   */
  getSocketUrl() {
    // SOCKET_URL is already trimmed in config.js
    if (typeof window !== 'undefined' && window.SOCKET_URL) {
      return window.SOCKET_URL;
    }
    return SOCKET_URL;
  }

  /**
   * Notify state subscribers of connection state change
   */
  notifyStateSubscribers() {
    const state = this.getConnectionState();
    this.stateSubscribers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        logger.error('Error in state subscriber', error);
      }
    });
  }

  /**
   * Notify event subscribers for a specific event
   * Used for events not routed through onAny (connect, disconnect)
   */
  notifyEventSubscribers(event, ...args) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          logger.error('Error in event subscriber', error, { event });
        }
      });
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState() {
    if (!this.connection) return 'disconnected';
    if (this.connection.connected) return 'connected';
    return this.connecting ? 'connecting' : 'disconnected';
  }

  /**
   * Connect to socket server with authentication
   * @param {string} token - JWT auth token
   */
  connect(token) {
    if (!token) {
      logger.warn('Cannot connect without auth token');
      return;
    }

    // Already connected with same token - no need to reconnect
    if (this.connection?.connected && this.currentToken === token) {
      logger.debug('Already connected with same token');
      return;
    }

    // If connecting, wait for it to complete
    if (this.connecting) {
      logger.debug('Connection already in progress, waiting');
      return;
    }

    // Clean up existing connection if disconnected or token changed
    if (this.connection) {
      if (this.currentToken !== token) {
        logger.debug('Token changed, cleaning up old connection');
        this.connection.destroy();
        this.connection = null;
      } else if (!this.connection.connected) {
        logger.debug('Cleaning up disconnected connection');
        this.connection.destroy();
        this.connection = null;
      }
    }

    const socketUrl = this.getSocketUrl();

    logger.debug('Connecting to socket', { url: socketUrl });

    // Set connecting flag to prevent race conditions
    this.connecting = true;
    this.currentToken = token;

    try {
      // Use SocketAdapter to create connection
      // This is the ONLY way to create socket connections
      this.connection = createSocketConnection(socketUrl, {
        auth: { token }, // Token in auth object (required by server)
        autoConnect: true,
      });

      // Set up connection event handlers using adapter's wrapper
      this.connection.on('connect', () => {
        logger.info('Connected', { socketId: this.connection.id });
        this.connecting = false;
        this.notifyStateSubscribers();
        // Notify event subscribers about 'connect' (not routed via onAny)
        this.notifyEventSubscribers('connect');
        // Process queued emits
        this.processEmitQueue();
      });

      this.connection.on('disconnect', reason => {
        logger.info('Disconnected', { reason });
        this.connecting = false;
        this.notifyStateSubscribers();
        // Notify event subscribers about 'disconnect' (not routed via onAny)
        this.notifyEventSubscribers('disconnect', reason);

        // If disconnect was not intentional, log for debugging
        if (reason !== 'io client disconnect') {
          logger.warn('Unexpected disconnect', { reason });
        }
      });

      this.connection.on('connect_error', error => {
        logger.error('Connection error', error, { errorMessage: error.message });
        this.connecting = false;
        this.notifyStateSubscribers();

        // If auth error, clear token to force re-auth
        if (error.message?.includes('auth') || error.message?.includes('Authentication')) {
          logger.warn('Auth error detected, may need new token');
        }
      });

      // Handle reconnection attempts
      this.connection.on('reconnect_attempt', attemptNumber => {
        logger.debug('Reconnection attempt', { attemptNumber });
      });

      this.connection.on('reconnect', attemptNumber => {
        logger.info('Reconnected', { attemptNumber });
        this.connecting = false;
        this.notifyStateSubscribers();
        this.processEmitQueue();
      });

      this.connection.on('reconnect_error', error => {
        logger.error('Reconnection error', error, { errorMessage: error.message });
      });

      this.connection.on('reconnect_failed', () => {
        logger.error('Reconnection failed - giving up');
        this.connecting = false;
        this.notifyStateSubscribers();
      });

      // Route all socket events to subscribers using onAny
      this.connection.onAny((eventName, ...args) => {
        const callbacks = this.subscribers.get(eventName);
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              callback(...args);
            } catch (error) {
              logger.error('Error in subscriber', error, { eventName });
            }
          });
        }
      });

      // Initial state notification
      this.notifyStateSubscribers();
    } catch (error) {
      logger.error('Failed to create connection', error);
      this.connecting = false;
      this.connection = null;
      this.notifyStateSubscribers();
    }
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.connection) {
      logger.debug('Disconnecting');
      this.connecting = false;
      this.currentToken = null;
      this.connection.destroy();
      this.connection = null;
      this.notifyStateSubscribers();
    }
  }

  /**
   * Emit an event to the server
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (!this.connection?.connected) {
      // Queue the emit for when connection is ready
      logger.debug('Queueing emit (not connected yet)', { event });
      this.emitQueue.push({ event, data });
      return true; // Return true because it's queued
    }
    this.connection.emit(event, data);
    return true;
  }

  /**
   * Process queued emits when connection is established
   */
  processEmitQueue() {
    if (this.emitQueue.length === 0) return;

    logger.debug('Processing queued emits', { queueLength: this.emitQueue.length });
    while (this.emitQueue.length > 0) {
      const { event, data } = this.emitQueue.shift();
      if (this.connection?.connected) {
        this.connection.emit(event, data);
        logger.debug('Emitted queued event', { event });
      }
    }
  }

  /**
   * Subscribe to a socket event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);

    // Note: Events are routed via onAny handler, so we don't need to
    // directly subscribe to the connection here. The onAny handler
    // will call all subscribers when events are received.

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(event);
        }
      }
    };
  }

  /**
   * Subscribe to connection state changes
   * @param {Function} callback - Callback function(state: 'disconnected' | 'connecting' | 'connected')
   * @returns {Function} Unsubscribe function
   */
  subscribeToState(callback) {
    this.stateSubscribers.add(callback);

    // Immediately call with current state
    try {
      callback(this.getConnectionState());
    } catch (error) {
      logger.error('Error in state subscriber', error);
    }

    // Return unsubscribe function
    return () => {
      this.stateSubscribers.delete(callback);
    };
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
