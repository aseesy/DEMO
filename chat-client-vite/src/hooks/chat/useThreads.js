import { useState, useEffect, useCallback } from 'react';
import { threadService } from '../../services/chat';

/**
 * useThreads - React hook for thread state
 *
 * Simply subscribes to ThreadService.
 * Re-renders ONLY when thread state changes.
 */
export function useThreads() {
  const [state, setState] = useState(threadService.getState());

  useEffect(() => {
    return threadService.subscribe(setState);
  }, []);

  const create = useCallback(
    (roomId, title, messageId, category) =>
      threadService.create(roomId, title, messageId, category),
    []
  );
  const loadThreads = useCallback(roomId => threadService.loadThreads(roomId), []);
  const loadThreadMessages = useCallback(
    (threadId, limit, offset) => threadService.loadThreadMessages(threadId, limit, offset),
    []
  );
  const addToThread = useCallback(
    (messageId, threadId) => threadService.addToThread(messageId, threadId),
    []
  );
  const replyInThread = useCallback(
    (threadId, text, messageData) => threadService.replyInThread(threadId, text, messageData),
    []
  );
  const moveMessageToThread = useCallback(
    (messageId, targetThreadId, roomId) => 
      threadService.moveMessageToThread(messageId, targetThreadId, roomId),
    []
  );
  const archiveThread = useCallback(
    (threadId, archived, cascade) => 
      threadService.archiveThread(threadId, archived, cascade),
    []
  );
  const clear = useCallback(() => threadService.clear(), []);

  return {
    ...state,
    create,
    loadThreads,
    loadThreadMessages,
    addToThread,
    replyInThread,
    moveMessageToThread,
    archiveThread,
    clear,
  };
}

export default useThreads;
