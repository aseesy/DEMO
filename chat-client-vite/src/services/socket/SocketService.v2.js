/**
 * SocketService - Application Layer Socket Management
 *
 * Single responsibility: Manage socket connection lifecycle and state.
 * Uses SocketAdapter for actual socket.io-client interaction.
 *
 * Responsibilities:
 * - Connection lifecycle (connect/disconnect)
 * - State management (connected/disconnected/connecting)
 * - Event subscription system
 * - Token management
 *
 * What it does NOT do:
 * - Direct socket.io-client usage (uses SocketAdapter)
 * - Transport configuration (delegates to adapter)
 * - Business logic (messages, threads, etc.)
 */

import { createSocketConnection } from '../../adapters/socket/SocketAdapter.js';
import { SOCKET_URL } from '../../config.js';

class SocketService {
  constructor() {
    this.connection = null; // SocketConnection wrapper from adapter
    this.subscribers = new Map(); // event -> Set<callback>
    this.stateSubscribers = new Set(); // callbacks for state changes
    this.emitQueue = []; // Queue of {event, data} to emit when connected
    this.connecting = false; // Flag to prevent multiple simultaneous connections
    this.currentToken = null; // Track current token to detect changes
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
        console.error('[SocketService] Error in state subscriber:', error);
      }
    });
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
      console.warn('[SocketService] Cannot connect without auth token');
      return;
    }

    // Already connected with same token - no need to reconnect
    if (this.connection?.connected && this.currentToken === token) {
      if (import.meta.env.DEV) {
        console.log('[SocketService] Already connected with same token');
      }
      return;
    }

    // If connecting, wait for it to complete
    if (this.connecting) {
      if (import.meta.env.DEV) {
        console.log('[SocketService] Connection already in progress, waiting...');
      }
      return;
    }

    // Clean up existing connection if disconnected or token changed
    if (this.connection) {
      if (this.currentToken !== token) {
        if (import.meta.env.DEV) {
          console.log('[SocketService] Token changed, cleaning up old connection');
        }
        this.connection.destroy();
        this.connection = null;
      } else if (!this.connection.connected) {
        if (import.meta.env.DEV) {
          console.log('[SocketService] Cleaning up disconnected connection');
        }
        this.connection.destroy();
        this.connection = null;
      }
    }

    const socketUrl = this.getSocketUrl();

    if (import.meta.env.DEV) {
      console.log('[SocketService] Connecting to:', socketUrl);
    }

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
        if (import.meta.env.DEV) {
          console.log('[SocketService] ✅ Connected:', this.connection.id);
        }
        this.connecting = false;
        this.notifyStateSubscribers();
        // Process queued emits
        this.processEmitQueue();
      });

      this.connection.on('disconnect', reason => {
        if (import.meta.env.DEV) {
          console.log('[SocketService] Disconnected:', reason);
        }
        this.connecting = false;
        this.notifyStateSubscribers();

        // If disconnect was not intentional, log for debugging
        if (reason !== 'io client disconnect' && import.meta.env.DEV) {
          console.warn('[SocketService] Unexpected disconnect:', reason);
        }
      });

      this.connection.on('connect_error', error => {
        console.error('[SocketService] Connection error:', error.message);
        this.connecting = false;
        this.notifyStateSubscribers();

        // If auth error, clear token to force re-auth
        if (error.message?.includes('auth') || error.message?.includes('Authentication')) {
          if (import.meta.env.DEV) {
            console.warn('[SocketService] Auth error detected, may need new token');
          }
        }
      });

      // Handle reconnection attempts
      this.connection.on('reconnect_attempt', attemptNumber => {
        if (import.meta.env.DEV) {
          console.log('[SocketService] Reconnection attempt:', attemptNumber);
        }
      });

      this.connection.on('reconnect', attemptNumber => {
        if (import.meta.env.DEV) {
          console.log('[SocketService] ✅ Reconnected after', attemptNumber, 'attempts');
        }
        this.connecting = false;
        this.notifyStateSubscribers();
        this.processEmitQueue();
      });

      this.connection.on('reconnect_error', error => {
        if (import.meta.env.DEV) {
          console.error('[SocketService] Reconnection error:', error.message);
        }
      });

      this.connection.on('reconnect_failed', () => {
        console.error('[SocketService] Reconnection failed - giving up');
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
              console.error(`[SocketService] Error in subscriber for ${eventName}:`, error);
            }
          });
        }
      });

      // Initial state notification
      this.notifyStateSubscribers();
    } catch (error) {
      console.error('[SocketService] Failed to create connection:', error);
      this.connecting = false;
      this.connection = null;
      this.notifyStateSubscribers();
    }
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      console.log('[SocketService] Disconnecting');
      this.connecting = false;
      this.currentToken = null;
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
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
      if (import.meta.env.DEV) {
        console.log(`[SocketService] Queueing emit '${event}' (not connected yet)`);
      }
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

    if (import.meta.env.DEV) {
      console.log(`[SocketService] Processing ${this.emitQueue.length} queued emits`);
    }
    while (this.emitQueue.length > 0) {
      const { event, data } = this.emitQueue.shift();
      if (this.connection?.connected) {
        this.connection.emit(event, data);
        if (import.meta.env.DEV) {
          console.log(`[SocketService] Emitted queued '${event}'`);
        }
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
      console.error('[SocketService] Error in state subscriber:', error);
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
