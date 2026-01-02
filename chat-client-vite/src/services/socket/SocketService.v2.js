/**
 * SocketService v2 - Simplified Infrastructure Layer
 *
 * Minimal Socket.io connection management.
 * Single responsibility: Manage raw Socket.io connection.
 *
 * Key Simplifications:
 * - No complex state management (just socket.connected)
 * - No reconnection logic (let Socket.io handle it)
 * - Simple event subscription (Map-based)
 * - Observable state changes (EventEmitter pattern)
 */

import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config.js';

class SocketService {
  constructor() {
    this.socket = null;
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
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket ID
   */
  getSocketId() {
    return this.socket?.id ?? null;
  }

  /**
   * Get socket URL from config or window override
   */
  getSocketUrl() {
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
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    return 'connecting';
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
    if (this.socket?.connected && this.currentToken === token) {
      console.log('[SocketService] Already connected with same token');
      return;
    }

    // If connecting, wait for it to complete
    if (this.connecting) {
      console.log('[SocketService] Connection already in progress, waiting...');
      return;
    }

    // Clean up existing socket if disconnected or token changed
    if (this.socket) {
      if (this.currentToken !== token) {
        console.log('[SocketService] Token changed, cleaning up old connection');
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      } else if (!this.socket.connected) {
        console.log('[SocketService] Cleaning up disconnected socket');
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }
    }

    const socketUrl = this.getSocketUrl();
    const isDev = import.meta.env.DEV;
    const transports = isDev ? ['polling'] : ['polling', 'websocket'];

    console.log('[SocketService] Connecting to:', socketUrl);

    // Set connecting flag to prevent race conditions
    this.connecting = true;
    this.currentToken = token;

    try {
      // Only use forceNew if we have an existing disconnected socket
      const forceNew = this.socket !== null && !this.socket.connected;
      
      this.socket = io(socketUrl, {
        transports,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity, // Keep trying
        timeout: 20000,
        forceNew: forceNew, // Only force new if needed
        autoConnect: true,
        withCredentials: true,
        auth: { token }, // Primary token location
        // Don't use query for token - auth object is preferred
      });

      // Set up connection event handlers
      this.socket.on('connect', () => {
        console.log('[SocketService] ✅ Connected:', this.socket.id);
        this.connecting = false;
        this.notifyStateSubscribers();
        // Process queued emits
        this.processEmitQueue();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[SocketService] Disconnected:', reason);
        this.connecting = false;
        this.notifyStateSubscribers();
        
        // If disconnect was not intentional, log for debugging
        if (reason !== 'io client disconnect') {
          console.warn('[SocketService] Unexpected disconnect:', reason);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('[SocketService] Connection error:', error.message);
        this.connecting = false;
        this.notifyStateSubscribers();
        
        // If auth error, clear token to force re-auth
        if (error.message?.includes('auth') || error.message?.includes('Authentication')) {
          console.warn('[SocketService] Auth error detected, may need new token');
        }
      });

      // Handle reconnection attempts
      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('[SocketService] Reconnection attempt:', attemptNumber);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('[SocketService] ✅ Reconnected after', attemptNumber, 'attempts');
        this.connecting = false;
        this.notifyStateSubscribers();
        this.processEmitQueue();
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('[SocketService] Reconnection error:', error.message);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('[SocketService] Reconnection failed - giving up');
        this.connecting = false;
        this.notifyStateSubscribers();
      });

      // Route all socket events to subscribers
      this.socket.onAny((eventName, ...args) => {
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
      console.error('[SocketService] Failed to create socket:', error);
      this.connecting = false;
      this.socket = null;
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
    if (!this.socket?.connected) {
      // Queue the emit for when connection is ready
      console.log(`[SocketService] Queueing emit '${event}' (not connected yet)`);
      this.emitQueue.push({ event, data });
      return true; // Return true because it's queued
    }
    this.socket.emit(event, data);
    return true;
  }

  /**
   * Process queued emits when connection is established
   */
  processEmitQueue() {
    if (this.emitQueue.length === 0) return;
    
    console.log(`[SocketService] Processing ${this.emitQueue.length} queued emits`);
    while (this.emitQueue.length > 0) {
      const { event, data } = this.emitQueue.shift();
      if (this.socket?.connected) {
        this.socket.emit(event, data);
        console.log(`[SocketService] Emitted queued '${event}'`);
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


