import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '../../services/socket/index.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('[useSocketConnection]');

/**
 * useSocketState - Subscribe to socket connection state
 *
 * Presentation layer hook that subscribes to the SocketService's
 * connection state without managing the connection itself.
 *
 * @returns {{ connectionState: string, isConnected: boolean }}
 */
export function useSocketState() {
  const [connectionState, setConnectionState] = useState(socketService.getConnectionState());

  useEffect(() => {
    return socketService.subscribeToState(setConnectionState);
  }, []);

  return {
    connectionState,
    isConnected: connectionState === 'connected',
  };
}

/**
 * useSocketEvent - Subscribe to a specific socket event
 *
 * Presentation layer hook that subscribes to events from SocketService.
 *
 * @param {string} event - Event name to subscribe to
 * @param {Function} handler - Event handler
 * @param {Array} deps - Dependencies for the handler
 */
export function useSocketEvent(event, handler, deps = []) {
  const handlerRef = useRef(handler);

  // Keep handler ref updated
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler, ...deps]);

  useEffect(() => {
    const callback = (...args) => handlerRef.current(...args);
    return socketService.subscribe(event, callback);
  }, [event]);
}

/**
 * useSocketEvents - Subscribe to multiple socket events
 *
 * @param {Object} handlers - Map of event name to handler function
 * @param {Array} deps - Dependencies for all handlers
 */
export function useSocketEvents(handlers, deps = []) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers, ...deps]);

  useEffect(() => {
    const unsubscribes = Object.entries(handlers).map(([event]) => {
      const callback = (...args) => handlersRef.current[event]?.(...args);
      return socketService.subscribe(event, callback);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [Object.keys(handlers).join(',')]);
}

/**
 * useSocketEmit - Get emit function bound to SocketService
 *
 * @returns {Function} emit(event, data) function
 */
export function useSocketEmit() {
  return useCallback((event, data) => {
    return socketService.emit(event, data);
  }, []);
}

/**
 * useSocketConnection - Manage socket connection lifecycle
 *
 * This hook connects/disconnects based on authentication state.
 * The actual socket lives in SocketService, not React.
 *
 * @param {Object} options
 * @param {boolean} options.isAuthenticated - Whether user is authenticated
 * @param {Function} options.getToken - Function to get auth token
 */
export function useSocketConnection({ isAuthenticated, getToken }) {
  logger.debug('useSocketConnection called', {
    isAuthenticated,
    hasGetToken: typeof getToken === 'function',
  });

  // Track if we've already initiated connection (persists across renders)
  const hasConnectedRef = useRef(false);
  const wasAuthenticatedRef = useRef(false);

  // Subscribe to connection state to reset hasConnectedRef on disconnect
  // This allows reconnection after errors
  useEffect(() => {
    return socketService.subscribeToState(state => {
      if (state === 'disconnected' && hasConnectedRef.current) {
        logger.debug('Socket disconnected, allowing reconnection');
        hasConnectedRef.current = false;
      }
    });
  }, []);

  // Connect/disconnect based on auth state (useEffect for side effects)
  useEffect(() => {
    logger.debug('useEffect triggered', {
      isAuthenticated,
      hasConnected: hasConnectedRef.current,
      wasAuthenticated: wasAuthenticatedRef.current,
      socketConnected: socketService.isConnected(),
    });

    // Connect if authenticated and not already connected
    if (isAuthenticated && !hasConnectedRef.current) {
      const token = getToken();
      logger.debug('Token check', {
        hasToken: !!token,
        tokenLength: token?.length,
      });
      if (token) {
        logger.debug('Initiating socket connection');
        hasConnectedRef.current = true;
        wasAuthenticatedRef.current = true;
        logger.debug('Calling socketService.connect()');
        const result = socketService.connect(token);
        logger.debug('connect() returned', { result });
      } else {
        logger.error('CANNOT CONNECT - No token available');
      }
    } else if (isAuthenticated && hasConnectedRef.current) {
      logger.debug('Already connected, skipping');
    } else if (!isAuthenticated) {
      logger.debug('Not authenticated, skipping connection');
    }

    // Disconnect if auth changed from true to false
    if (!isAuthenticated && wasAuthenticatedRef.current) {
      logger.debug('Auth lost, disconnecting');
      wasAuthenticatedRef.current = false;
      hasConnectedRef.current = false;
      socketService.disconnect();
    }
  }, [isAuthenticated, getToken]);
}

export default {
  useSocketState,
  useSocketEvent,
  useSocketEvents,
  useSocketEmit,
  useSocketConnection,
};
