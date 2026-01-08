/**
 * SocketAdapter - Abstraction layer for real-time communication
 *
 * Why this exists:
 * - Decouples application code from socket.io-client
 * - If we switch to native WebSocket, Ably, Pusher, or another service, only this file changes
 * - Provides a stable, framework-agnostic API
 *
 * Usage:
 *   import { createSocketConnection, SocketEvents } from '../adapters/socket';
 *   const socket = createSocketConnection(url, options);
 *   socket.on(SocketEvents.MESSAGE, handler);
 */

/**
 * Socket.io-client Loading Strategy
 *
 * CURRENT APPROACH: CDN (Recommended for Vite)
 * - Loaded from CDN in index.html: <script src="https://cdn.socket.io/4.8.3/socket.io.min.js"></script>
 * - Accessed via window.io (global from CDN)
 * - Why: Vite bundler has historically caused issues with socket.io-client
 *
 * ALTERNATIVE: Vite Alias (If CDN causes issues)
 * - Uncomment alias in vite.config.js: 'socket.io-client': 'socket.io-client/dist/socket.io.min.js'
 * - Import normally: import { io } from 'socket.io-client'
 * - Requires socket.io-client in dependencies (currently in devDependencies)
 *
 * See SOCKET_IO_VITE_SETUP.md for details
 */

// IMPORTANT: Get io at connection time, not module load time, to ensure CDN script has loaded
function getIo() {
  if (typeof window !== 'undefined' && window.io) {
    return window.io;
  }
  // Fallback: If CDN fails, could try importing from npm (requires Vite alias)
  // This is a safety net - CDN should always be available
  return null;
}

// Verify CDN is loaded at module load time (development only)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const loadTimeIo = window.io;
  if (!loadTimeIo) {
    console.warn(
      '[SocketAdapter] window.io not available at module load - CDN may not have loaded yet'
    );
  }
}

/**
 * SocketEvents - Centralized event name constants
 *
 * Why this exists:
 * - Single source of truth for event names
 * - Prevents typos in event string literals
 * - Easy to audit all socket events in one place
 */
export const SocketEvents = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',

  // Room events
  JOIN: 'join',
  JOINED: 'joined',
  LEAVE: 'leave',

  // Message events
  SEND_MESSAGE: 'send_message',
  NEW_MESSAGE: 'new_message',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_ERROR: 'message_error',
  FLAG_MESSAGE: 'flag_message',
  MESSAGE_FLAGGED: 'message_flagged',

  // Typing events
  TYPING: 'typing',
  TYPING_UPDATE: 'typing_update',

  // AI/Mediation events
  AI_INTERVENTION: 'ai_intervention',
  ANALYZE_DRAFT: 'analyze_draft',
  DRAFT_COACHING: 'draft_coaching',

  // Thread events
  CREATE_THREAD: 'create_thread',
  THREAD_CREATED: 'thread_created',
  GET_THREADS: 'get_threads',
  THREADS_LIST: 'threads_list',
  GET_THREAD_MESSAGES: 'get_thread_messages',
  THREAD_MESSAGES: 'thread_messages',
  ADD_TO_THREAD: 'add_to_thread',

  // Search events
  SEARCH_MESSAGES: 'search_messages',
  SEARCH_RESULTS: 'search_results',

  // History events
  GET_MESSAGES: 'get_messages',
  MESSAGES_HISTORY: 'messages_history',
  LOAD_OLDER: 'load_older',
  OLDER_MESSAGES: 'older_messages',
  NO_MORE_MESSAGES: 'no_more_messages',

  // Error events
  ERROR: 'error',
  SERVER_ERROR: 'server_error',
};

/**
 * SocketConnection - Wrapper class for socket instance
 *
 * Provides a clean interface that doesn't expose socket.io internals
 */
class SocketConnection {
  constructor(socket) {
    this._socket = socket;
    this._listeners = new Map();
  }

  /**
   * Check if socket is connected
   */
  get connected() {
    return this._socket?.connected ?? false;
  }

  /**
   * Get socket ID
   */
  get id() {
    return this._socket?.id ?? null;
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name (use SocketEvents constants)
   * @param {Function} handler - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    this._socket.on(event, handler);

    // Track listener for cleanup
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event (once)
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  once(event, handler) {
    this._socket.once(event, handler);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  off(event, handler) {
    this._socket.off(event, handler);

    const handlers = this._listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Subscribe to all events (onAny)
   * @param {Function} handler - Event handler (receives eventName, ...args)
   * @returns {Function} Unsubscribe function
   */
  onAny(handler) {
    if (this._socket && typeof this._socket.onAny === 'function') {
      this._socket.onAny(handler);
      // Track for cleanup
      if (!this._listeners.has('*')) {
        this._listeners.set('*', new Set());
      }
      this._listeners.get('*').add(handler);
      return () => {
        this._socket.offAny(handler);
        const handlers = this._listeners.get('*');
        if (handlers) {
          handlers.delete(handler);
        }
      };
    }
    // Fallback if onAny not available
    return () => {};
  }

  /**
   * Emit an event
   * @param {string} event - Event name (use SocketEvents constants)
   * @param {*} data - Data to send
   */
  emit(event, data) {
    if (this._socket?.connected) {
      this._socket.emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Emit an event with acknowledgment callback
   * @param {string} event - Event name
   * @param {*} data - Data to send
   * @param {Function} callback - Acknowledgment callback
   */
  emitWithAck(event, data, callback) {
    if (this._socket?.connected) {
      this._socket.emit(event, data, callback);
      return true;
    }
    return false;
  }

  /**
   * Connect the socket
   */
  connect() {
    this._socket.connect();
  }

  /**
   * Disconnect the socket
   */
  disconnect() {
    this._socket.disconnect();
  }

  /**
   * Remove all listeners and disconnect
   */
  destroy() {
    // Remove all tracked listeners
    this._listeners.forEach((handlers, event) => {
      handlers.forEach(handler => {
        this._socket.off(event, handler);
      });
    });
    this._listeners.clear();

    // Disconnect
    this._socket.disconnect();
    this._socket = null;
  }

  /**
   * Get the raw socket (escape hatch for edge cases)
   * @deprecated Prefer using the wrapper methods
   */
  getRawSocket() {
    console.warn('SocketConnection.getRawSocket() is deprecated. Use wrapper methods instead.');
    return this._socket;
  }
}

/**
 * createSocketConnection - Factory function to create a socket connection
 *
 * This is the SINGLE POINT where socket.io-client is used.
 * All socket connections must go through this function.
 *
 * @param {string} url - Server URL
 * @param {Object} options - Connection options
 * @param {boolean} options.autoConnect - Auto-connect on creation (default: true)
 * @param {boolean} options.withCredentials - Include credentials (default: true)
 * @param {string[]} options.transports - Transport methods (default: ['polling', 'websocket'])
 * @param {Object} options.auth - Authentication data (REQUIRED: { token: '...' })
 * @param {boolean} options.reconnection - Enable reconnection (default: true)
 * @param {number} options.reconnectionDelay - Delay between reconnection attempts (default: 1000)
 * @param {number} options.reconnectionDelayMax - Max delay (default: 5000)
 * @param {number} options.reconnectionAttempts - Max attempts (default: Infinity)
 * @param {number} options.timeout - Connection timeout (default: 20000)
 * @returns {SocketConnection} Wrapped socket instance
 */
export function createSocketConnection(url, options = {}) {
  const {
    autoConnect = true,
    withCredentials = true,
    // Transport configuration: Must match server config in server.js for consistent behavior
    // websocket first (more efficient), polling as fallback
    transports = import.meta.env.VITE_SOCKET_FORCE_POLLING === 'true'
      ? ['polling']
      : ['websocket', 'polling'],
    auth,
    reconnection = true,
    reconnectionDelay = 2000, // Increased from 1s to 2s to reduce CPU load
    reconnectionDelayMax = 10000, // Increased from 5s to 10s for better backoff
    reconnectionAttempts = 10, // Limited from Infinity to prevent infinite reconnection loops
    timeout = 20000,
    ...restOptions
  } = options;

  // CRITICAL: Token MUST be in auth object
  // Server expects: socket.handshake.auth.token
  if (!auth?.token) {
    throw new Error('SocketAdapter: auth.token is required. Use { auth: { token: "..." } }');
  }

  // Create socket connection using socket.io-client from CDN
  // Get io at connection time to ensure CDN has loaded
  const io = getIo();

  if (!io) {
    throw new Error(
      '[SocketAdapter] FATAL: io is null! CDN script not loaded. Check index.html for socket.io CDN script.'
    );
  }

  const socket = io(url, {
    autoConnect,
    withCredentials,
    transports,
    auth, // Token in auth object (standard Socket.io v4+ pattern)
    reconnection,
    reconnectionDelay,
    reconnectionDelayMax,
    reconnectionAttempts,
    timeout,
    ...restOptions,
  });

  return new SocketConnection(socket);
}

export default createSocketConnection;
