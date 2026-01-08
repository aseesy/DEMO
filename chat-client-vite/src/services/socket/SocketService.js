// WORKAROUND: Use socket.io from CDN (loaded in index.html) instead of npm package
// The Vite-bundled version was sending malformed packets with newline characters
const io = typeof window !== 'undefined' && window.io ? window.io : null;
import { SOCKET_URL, API_BASE_URL } from '../../config.js';

// DEBUG: Helper to send logs to server (so we can see them)
const debugToServer = async (message, data = {}) => {
  try {
    await fetch(`${API_BASE_URL}/api/debug-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, data, timestamp: new Date().toISOString() }),
    });
  } catch (e) {
    // Ignore errors
  }
};

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
    console.log('[SocketService] ========================================');
    console.log('[SocketService] CONSTRUCTOR CALLED at', new Date().toISOString());
    console.log('[SocketService] ========================================');
    debugToServer('SocketService CONSTRUCTOR', { timestamp: new Date().toISOString() });
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
    console.log('[SocketService] ========== CONNECT CALLED ==========');
    console.log(
      '[SocketService] Token:',
      token ? `present (${token.substring(0, 20)}...)` : 'MISSING'
    );
    console.log('[SocketService] Current state:', this.connectionState);
    console.log('[SocketService] Socket exists:', !!this.socket);
    console.log('[SocketService] Socket connected:', this.socket?.connected);
    debugToServer('SocketService CONNECT CALLED', {
      hasToken: !!token,
      state: this.connectionState,
      socketExists: !!this.socket,
    });

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

      // Use polling-first in dev to avoid WebSocket upgrade issues with allowUpgrades:false
      const transports = isDev ? ['polling'] : ['polling', 'websocket'];

      console.log('[SocketService] ========================================');
      console.log('[SocketService] CREATING SOCKET at', new Date().toISOString());
      console.log('[SocketService] URL:', socketUrl);
      console.log('[SocketService] Transports:', transports);
      console.log('[SocketService] Token length:', token?.length);
      console.log('[SocketService] io function type:', typeof io);
      console.log('[SocketService] ========================================');

      if (typeof io !== 'function') {
        console.error(
          '[SocketService] ❌ io is not a function! Socket.io-client may not be loaded correctly'
        );
        this.setConnectionState('disconnected');
        return false;
      }

      this.socket = io(socketUrl, {
        transports,
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 10, // Limited to prevent infinite reconnection loops
        timeout: 20000,
        forceNew: true, // Force new connection to avoid stale socket issues
        autoConnect: true,
        withCredentials: true, // Send cookies/credentials for CORS
        auth: { token },
        // Also pass in query for backwards compatibility with server middleware
        query: { token },
      });

      console.log('[SocketService] Socket created successfully!');
      console.log('[SocketService] Socket object:', this.socket);
      console.log('[SocketService] Socket id:', this.socket?.id);
      console.log('[SocketService] Socket manager:', this.socket?.io);
      console.log('[SocketService] Socket connected:', this.socket?.connected);

      // Log transport events for debugging
      if (this.socket?.io) {
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
      } else {
        console.error('[SocketService] ❌ Socket.io manager not available');
      }

      this.setupInternalHandlers();
      console.log('[SocketService] ✅ Internal handlers set up');
      return true;
    } catch (err) {
      console.error('[SocketService] ❌ Connection failed with error:', err);
      console.error('[SocketService] Error name:', err.name);
      console.error('[SocketService] Error message:', err.message);
      console.error('[SocketService] Error stack:', err.stack);
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
        // Reset state to allow retry (socket.io handles reconnection internally)
        this.setConnectionState('disconnected');
        this.notifySubscribers('connect_error', { error: error.message });
      }
    });

    // Handle when all reconnection attempts fail
    this.socket.io.on('reconnect_failed', () => {
      console.log('[SocketService] ❌ All reconnection attempts failed');
      this.setConnectionState('disconnected');
      this.notifySubscribers('reconnect_failed', {});
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
  // HMR: Clean up old socket completely and create fresh instance
  const oldService = window.__SOCKET_SERVICE__;
  console.log('[SocketService] HMR detected - cleaning up old socket');

  // Fully disconnect and clean up old socket
  if (oldService.socket) {
    console.log('[SocketService] Destroying old socket:', oldService.socket.id);
    oldService.socket.removeAllListeners();
    oldService.socket.disconnect();
    oldService.socket = null;
  }

  // Create fresh instance for clean state
  socketService = new SocketService();
  console.log('[SocketService] Created fresh instance after HMR cleanup');
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
