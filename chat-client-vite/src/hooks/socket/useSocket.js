/**
 * useSocket - Simplified React hook for Socket.io connection
 *
 * Simple wrapper around SocketService.
 * Single responsibility: React lifecycle integration.
 *
 * Key Simplifications:
 * - Single useEffect for all connection logic
 * - Simple dependencies (token, enabled)
 * - Clean cleanup on unmount
 * - No refs, just state
 */

import { useState, useEffect } from 'react';
import { socketService } from '../../services/socket/SocketService.v2.js';

/**
 * React hook for Socket.io connection
 * @param {Object} options
 * @param {string} options.token - JWT auth token
 * @param {boolean} options.enabled - Whether connection is enabled (default: true)
 * @returns {Object} { isConnected, emit, disconnect }
 */
export function useSocket({ token, enabled = true }) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !token) {
      // Disconnect if disabled or no token
      if (socketService.isConnected()) {
        socketService.disconnect();
      }
      setIsConnected(false);
      return;
    }

    // Subscribe to connection state changes
    const unsubscribe = socketService.subscribeToState((state) => {
      setIsConnected(state === 'connected');
    });

    // Connect
    socketService.connect(token);

    // Cleanup
    return () => {
      unsubscribe();
      // Note: We don't disconnect here because the service is a singleton
      // and may be used by other components. Disconnect only when explicitly needed.
    };
  }, [token, enabled]);

  return {
    isConnected,
    emit: socketService.emit.bind(socketService),
    disconnect: socketService.disconnect.bind(socketService),
  };
}

