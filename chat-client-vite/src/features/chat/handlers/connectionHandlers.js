/**
 * Connection Handlers
 *
 * Handles socket connection events:
 * - connect
 * - disconnect
 * - connect_error
 * - join_success
 */

import { trackConnectionError } from '../../../utils/analyticsEnhancements.js';

/**
 * Setup connection event handlers
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} handlers - Handler functions and refs
 */
export function setupConnectionHandlers(socket, handlers) {
  const {
    isAuthenticated,
    username,
    offlineQueueRef,
    setIsConnected,
    setError,
    setIsJoined,
    setMessageStatuses,
    setRoomId,
  } = handlers;

  socket.on('connect', () => {
    setIsConnected(true);
    setError('');
    if (isAuthenticated && username) socket.emit('join', { email: username });

    if (offlineQueueRef.current.length > 0 && socket.connected) {
      const queue = [...offlineQueueRef.current];
      offlineQueueRef.current = [];
      queue.forEach(msg => {
        socket.emit('send_message', {
          text: msg.text,
          isPreApprovedRewrite: msg.isPreApprovedRewrite || false,
          originalRewrite: msg.originalRewrite || null,
        });
        setMessageStatuses(prev => new Map(prev).set(msg.id, 'pending'));
      });
      try {
        localStorage.removeItem('liaizen_offline_queue');
      } catch {
        /* ignore */
      }
    }
  });

  socket.on('disconnect', () => {
    setIsConnected(false);
    setIsJoined(false);
  });

  socket.on('connect_error', err => {
    console.error('Chat connection error:', err);
    setIsConnected(false);
    setError('Unable to connect to chat server.');
    trackConnectionError('socket_connect_error', err.message || String(err));
  });

  socket.on('join_success', data => {
    setIsJoined(true);
    setError('');
    // Extract roomId from join_success event (authoritative source from backend)
    // This takes precedence over HTTP-fetched roomId since it's from the actual join
    if (data?.roomId && setRoomId) {
      setRoomId(data.roomId);
    }
  });
}
