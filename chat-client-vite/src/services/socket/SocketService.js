import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config.js';

/**
 * SocketService - Infrastructure layer for Socket.io connection
 *
 * This is a singleton service that manages the socket connection
 * OUTSIDE of React's component lifecycle.
 *
 * Responsibilities:
 * - Socket connection/disconnection
 * - Authentication
 * - Reconnection handling
 * - Event routing to subscribers
 *
 * What it does NOT do:
 * - React state management (that's the presentation layer's job)
 * - Business logic (threads, coaching, etc.)
 * - UI concerns
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.subscribers = new Map(); // event -> Set<callback>
    this.connectionState = 'disconnected'; // disconnected | connecting | connected
    this.stateSubscribers = new Set(); // callbacks for connection state changes
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
   * Connect to socket server with authentication
   * @param {string} token - JWT auth token
   * @returns {boolean} - Whether connection was initiated
   */
  connect(token) {
    console.log('[SocketService] connect() called, token:', token ? 'present' : 'missing');

    if (!token) {
      console.warn('[SocketService] Cannot connect without auth token');
      return false;
    }

    // Already connected
    if (this.socket?.connected) {
      console.log('[SocketService] Already connected:', this.socket.id);
      return true;
    }

    // If we have a socket that's not connected, clean it up first
    if (this.socket) {
      console.log('[SocketService] Cleaning up old disconnected socket');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.connectionState === 'connecting') {
      console.log('[SocketService] Connection already in progress');
      return true;
    }

    this.setConnectionState('connecting');

    const socketUrl = this.getSocketUrl();
    console.log('[SocketService] 🔌 Connecting to:', socketUrl);
    console.log(
      '[SocketService] Current location:',
      typeof window !== 'undefined' ? window.location.href : 'SSR'
    );

    try {
      // In dev mode, use polling only to avoid session race conditions
      // In production, start with polling and upgrade to websocket
      const isDev = import.meta.env.DEV;

      this.socket = io(socketUrl, {
        transports: isDev ? ['polling'] : ['polling', 'websocket'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 5,
        timeout: 20000,
        forceNew: true, // Force new connection to avoid stale socket issues
        upgrade: !isDev, // Only upgrade to websocket in production
        autoConnect: true,
        auth: { token },
        // Also pass in query for backwards compatibility with server middleware
        query: { token },
      });

      console.log('[SocketService] Socket created, id:', this.socket.id);
      console.log('[SocketService] Socket.io manager:', this.socket.io);

      // Log transport events for debugging
      this.socket.io.on('open', () => {
        console.log('[SocketService] 🔓 Transport open');
      });
      this.socket.io.on('close', reason => {
        console.log('[SocketService] 🔒 Transport closed:', reason);
      });
      this.socket.io.on('packet', packet => {
        console.log('[SocketService] 📦 Packet received:', packet.type);
      });
      this.socket.io.on('error', err => {
        console.log('[SocketService] ⚠️ Transport error:', err);
      });

      this.setupInternalHandlers();
      return true;
    } catch (err) {
      console.error('[SocketService] ❌ Connection failed:', err);
      this.setConnectionState('disconnected');
      return false;
    }
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      console.log('[SocketService] 🔌 Disconnecting');
      this.socket.disconnect();
      this.socket = null;
      this.setConnectionState('disconnected');
    }
  }

  /**
   * Setup internal socket event handlers
   */
  setupInternalHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[SocketService] ✅ Connected:', this.socket.id);
      this.setConnectionState('connected');
      this.notifySubscribers('connect', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', reason => {
      console.log('[SocketService] ❌ Disconnected:', reason);
      this.setConnectionState('disconnected');
      this.notifySubscribers('disconnect', { reason });
    });

    this.socket.on('connect_error', error => {
      // Suppress WebSocket upgrade errors (expected in dev)
      const isWebSocketError =
        error.message?.includes('WebSocket') ||
        error.message?.includes('websocket') ||
        error.type === 'TransportError';

      if (!isWebSocketError) {
        console.log('[SocketService] ⚠️ Connection error:', error.message);
        this.notifySubscribers('connect_error', { error: error.message });
      }
    });

    this.socket.io.on('reconnect_attempt', attempt => {
      console.log('[SocketService] 🔄 Reconnection attempt:', attempt);
      this.setConnectionState('connecting');
      this.notifySubscribers('reconnect_attempt', { attempt });
    });

    this.socket.io.on('reconnect', () => {
      console.log('[SocketService] ✅ Reconnected');
      this.setConnectionState('connected');
      this.notifySubscribers('reconnect', {});
    });

    // Forward all other events to subscribers
    this.socket.onAny((event, ...args) => {
      this.notifySubscribers(event, ...args);
    });
  }

  /**
   * Emit an event to the server
   * @param {string} event - Event name
   * @param {any} data - Event data
   * @returns {boolean} - Whether emit was successful
   */
  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn('[SocketService] Cannot emit, not connected:', event);
      return false;
    }
    this.socket.emit(event, data);
    return true;
  }

  /**
   * Subscribe to a socket event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const eventSubscribers = this.subscribers.get(event);
      if (eventSubscribers) {
        eventSubscribers.delete(callback);
        if (eventSubscribers.size === 0) {
          this.subscribers.delete(event);
        }
      }
    };
  }

  /**
   * Subscribe to connection state changes
   * @param {Function} callback - Called with (state: 'disconnected' | 'connecting' | 'connected')
   * @returns {Function} - Unsubscribe function
   */
  subscribeToState(callback) {
    this.stateSubscribers.add(callback);
    // Immediately notify of current state
    callback(this.connectionState);
    return () => this.stateSubscribers.delete(callback);
  }

  /**
   * Notify all subscribers of an event
   */
  notifySubscribers(event, ...args) {
    const eventSubscribers = this.subscribers.get(event);
    if (eventSubscribers) {
      eventSubscribers.forEach(callback => {
        try {
          callback(...args);
        } catch (err) {
          console.error(`[SocketService] Subscriber error for ${event}:`, err);
        }
      });
    }
  }

  /**
   * Set connection state and notify subscribers
   */
  setConnectionState(state) {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.stateSubscribers.forEach(callback => {
        try {
          callback(state);
        } catch (err) {
          console.error('[SocketService] State subscriber error:', err);
        }
      });
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState() {
    return this.connectionState;
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket ID (if connected)
   */
  getSocketId() {
    return this.socket?.id ?? null;
  }
}

// Singleton instance - check for existing instance from HMR
let socketService;

if (typeof window !== 'undefined' && window.__SOCKET_SERVICE__) {
  // Reuse existing instance from HMR to avoid duplicate sockets
  socketService = window.__SOCKET_SERVICE__;
  console.log('[SocketService] Reusing existing instance from HMR');
} else {
  socketService = new SocketService();
  console.log('[SocketService] Created new instance');
}

// Debug: Expose on window in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.__SOCKET_SERVICE__ = socketService;
  console.log('[SocketService] Debug: Available at window.__SOCKET_SERVICE__');
}

export { socketService };

export default socketService;
