import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * useThreads Hook
 *
 * Responsibility: Thread state and operations management
 *
 * What it does:
 * - Manages threads array state
 * - Manages threadMessages object state (threadId -> messages)
 * - Manages isLoadingThreadMessages flag
 * - Provides methods to emit thread socket events
 * - Auto-loads threads when roomId is available
 *
 * What it does NOT do:
 * - ❌ Socket connection management
 * - ❌ Socket event handling (done in threadHandlers.js)
 * - ❌ Message content management (done in useMessages)
 *
 * @param {Object} options
 * @param {Object} options.socketRef - Ref to socket.io socket instance
 * @param {string} options.roomId - Current room ID (optional, for auto-loading)
 * @param {boolean} options.isConnected - Socket connection state (optional)
 * @param {boolean} options.isJoined - Room join state (optional)
 */
export function useThreads({ socketRef, roomId, isConnected, isJoined } = {}) {
  // State
  const [threads, setThreads] = useState([]);
  const [threadMessages, setThreadMessages] = useState({});
  const [isLoadingThreadMessages, setIsLoadingThreadMessages] = useState(false);

  // Track last loaded roomId to prevent duplicate thread loads
  const lastLoadedRoomIdRef = useRef(null);

  // Methods - emit socket events
  const createThread = useCallback(
    (threadRoomId, title, messageId, category = 'logistics') => {
      if (socketRef?.current?.connected) {
        socketRef.current.emit('create_thread', {
          roomId: threadRoomId,
          title,
          messageId,
          category,
        });
      }
    },
    [socketRef]
  );

  const getThreads = useCallback(
    threadRoomId => {
      if (socketRef?.current?.connected) {
        socketRef.current.emit('get_threads', { roomId: threadRoomId });
      }
    },
    [socketRef]
  );

  const getThreadMessages = useCallback(
    threadId => {
      if (socketRef?.current?.connected) {
        setIsLoadingThreadMessages(true);
        socketRef.current.emit('get_thread_messages', { threadId });
      }
    },
    [socketRef]
  );

  const addToThread = useCallback(
    (messageId, threadId) => {
      if (socketRef?.current?.connected) {
        socketRef.current.emit('add_to_thread', { messageId, threadId });
      }
    },
    [socketRef]
  );

  // Auto-load threads when roomId is available and socket is connected
  // Use ref to prevent duplicate loads when dependencies change rapidly
  useEffect(() => {
    if (roomId && socketRef?.current?.connected && isJoined) {
      // Only load if we haven't already loaded threads for this roomId
      if (lastLoadedRoomIdRef.current !== roomId) {
        lastLoadedRoomIdRef.current = roomId;
        getThreads(roomId);
      }
    } else if (!roomId) {
      // Reset ref when roomId is cleared (user lost room or disconnected)
      lastLoadedRoomIdRef.current = null;
    }
  }, [roomId, isConnected, isJoined, getThreads, socketRef]);

  return {
    // State
    threads,
    threadMessages,
    isLoadingThreadMessages,

    // Setters (for socket event handlers)
    setThreads,
    setThreadMessages,
    setIsLoadingThreadMessages,

    // Methods
    createThread,
    getThreads,
    getThreadMessages,
    addToThread,
  };
}

export default useThreads;
