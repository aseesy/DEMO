/**
 * Error Handlers
 *
 * Handles error-related socket events:
 * - error
 * - replaced_by_new_connection
 */

import { trackConnectionError } from '../../../utils/analyticsEnhancements.js';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ErrorHandlers');

/**
 * Setup error event handlers
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} handlers - Handler functions and refs
 * @returns {Function} Cleanup function to remove listeners
 */
export function setupErrorHandlers(socket, handlers) {
  const { setError, setIsLoadingOlder, setIsSearching, loadingTimeoutRef } = handlers;

  const handleError = ({ message, code }) => {
    // Enhanced error handling with error codes from server
    // Unified error schema: { code, message }
    const errorMessage = code ? `${message} (${code})` : message || 'Unknown socket error';

    trackConnectionError('socket_error', errorMessage);
    logger.error('Socket error', { message, code });
    setError(message);
    setIsLoadingOlder(false);
    if (setIsSearching) setIsSearching(false);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  const handleReplacedByNewConnection = ({ message }) => {
    setError(message || 'You opened this chat in another tab.');
    socket.disconnect();
  };

  socket.on('error', handleError);
  socket.on('replaced_by_new_connection', handleReplacedByNewConnection);

  // Return cleanup function
  return () => {
    socket.off('error', handleError);
    socket.off('replaced_by_new_connection', handleReplacedByNewConnection);
  };
}
