/**
 * Error Handlers
 *
 * Handles error-related socket events:
 * - error
 * - replaced_by_new_connection
 */

import { trackConnectionError } from '../../../utils/analyticsEnhancements.js';

/**
 * Setup error event handlers
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} handlers - Handler functions and refs
 */
export function setupErrorHandlers(socket, handlers) {
  const { setError, setIsLoadingOlder, setIsSearching, loadingTimeoutRef } = handlers;

  socket.on('error', ({ message }) => {
    trackConnectionError('socket_error', message || 'Unknown socket error');
    console.error('Socket error:', message);
    setError(message);
    setIsLoadingOlder(false);
    if (setIsSearching) setIsSearching(false);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  });

  socket.on('replaced_by_new_connection', ({ message }) => {
    setError(message || 'You opened this chat in another tab.');
    socket.disconnect();
  });
}
