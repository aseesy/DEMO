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

    // Already connected
    if (this.socket?.connected) {
      console.log('[SocketService] Already connected');
      return;
    }

    // Clean up existing socket if disconnected
    if (this.socket && !this.socket.connected) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    const socketUrl = this.getSocketUrl();
    const isDev = import.meta.env.DEV;
    const transports = isDev ? ['polling'] : ['polling', 'websocket'];

    console.log('[SocketService] Connecting to:', socketUrl);

    try {
      this.socket = io(socketUrl, {
        transports,
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 5,
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
        withCredentials: true,
        auth: { token },
        query: { token },
      });

      // Set up connection event handlers
      this.socket.on('connect', () => {
        console.log('[SocketService] Connected:', this.socket.id);
        this.notifyStateSubscribers();
        // Process queued emits
        this.processEmitQueue();
      });

      this.socket.on('disconnect', () => {
        console.log('[SocketService] Disconnected');
        this.notifyStateSubscribers();
      });

      this.socket.on('connect_error', (error) => {
        console.error('[SocketService] Connection error:', error);
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


