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
    threadId => threadService.loadThreadMessages(threadId),
    []
  );
  const addToThread = useCallback(
    (messageId, threadId) => threadService.addToThread(messageId, threadId),
    []
  );
  const clear = useCallback(() => threadService.clear(), []);

  return {
    ...state,
    create,
    loadThreads,
    loadThreadMessages,
    addToThread,
    clear,
  };
}

export default useThreads;
