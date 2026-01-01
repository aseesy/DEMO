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
 * @returns {Function} Cleanup function to remove listeners
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

  // Define handlers as named functions for cleanup
  const handleConnect = () => {
    console.log('[connectionHandlers] ✅ Socket connected, emitting join:', { email: username, isAuthenticated });
    setIsConnected(true);
    setError('');
    if (isAuthenticated && username) {
      console.log('[connectionHandlers] 📤 Emitting join from handleConnect:', { email: username });
      socket.emit('join', { email: username });
    } else {
      console.log('[connectionHandlers] ⏸️ Not joining from handleConnect:', { isAuthenticated, username });
    }

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
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsJoined(false);
  };

  const handleConnectError = err => {
    console.error('Chat connection error:', err);
    setIsConnected(false);
    // Check for auth errors from server
    if (err.data?.code === 'AUTH_REQUIRED' || err.data?.code === 'AUTH_INVALID') {
      setError('Authentication required. Please log in again.');
    } else if (err.data?.code === 'AUTH_EXPIRED') {
      setError('Session expired. Please log in again.');
    } else {
      setError('Unable to connect to chat server.');
    }
    trackConnectionError('socket_connect_error', err.message || String(err));
  };

  const handleJoinSuccess = data => {
    console.log('[join_success] Received:', {
      roomId: data?.roomId,
      hasMessages: !!data?.messages,
      messageCount: data?.messages?.length || 0,
      dataKeys: Object.keys(data || {}),
    });
    setIsJoined(true);
    setError('');
    // Extract roomId from join_success event (authoritative source from backend)
    // This takes precedence over HTTP-fetched roomId since it's from the actual join
    if (data?.roomId && setRoomId) {
      setRoomId(data.roomId);
    }
    // Note: Backend sends message_history event separately after join_success
    // We don't handle messages here - they come via message_history event
  };

  // Register handlers
  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);
  socket.on('connect_error', handleConnectError);
  socket.on('join_success', handleJoinSuccess);

  // Return cleanup function
  return () => {
    socket.off('connect', handleConnect);
    socket.off('disconnect', handleDisconnect);
    socket.off('connect_error', handleConnectError);
    socket.off('join_success', handleJoinSuccess);
  };
}
