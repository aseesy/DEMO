/**
 * Socket Debug Utilities
 *
 * Exposes debugging tools on window.__SOCKET_DEBUG__ in development mode.
 * Uses the SocketService singleton for all operations.
 */
import { socketService } from '../../../services/socket/index.js';
import { authStorage } from '../../../adapters/storage/index.js';
import { SOCKET_URL } from '../../../config.js';

export function initSocketDebug() {
  if (typeof window === 'undefined' || !import.meta.env.DEV) {
    return;
  }

  window.__SOCKET_DEBUG__ = {
    SOCKET_URL,
    service: socketService,

    testConnection: () => {
      const token = authStorage.getToken();
      console.log('[Debug] Testing connection with token:', token ? 'present' : 'missing');
      return socketService.connect(token);
    },

    checkAuth: () => {
      const token = authStorage.getToken();
      console.log('[Debug] Auth token:', {
        hasToken: !!token,
        tokenLength: token?.length,
        preview: token ? token.substring(0, 20) + '...' : null,
      });
      return token;
    },

    getState: () => ({
      connectionState: socketService.getConnectionState(),
      isConnected: socketService.isConnected(),
      socketId: socketService.getSocketId(),
    }),

    disconnect: () => socketService.disconnect(),
    emit: (event, data) => socketService.emit(event, data),
  };

  console.log('[socketDebug] Debug tools at window.__SOCKET_DEBUG__');
}

initSocketDebug();
