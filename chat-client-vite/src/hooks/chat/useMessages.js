import { useState, useEffect, useCallback } from 'react';
import { messageService } from '../../services/chat';

/**
 * useMessages - React hook for message state
 *
 * Simply subscribes to MessageService.
 * Re-renders ONLY when message state changes.
 */
export function useMessages() {
  const [state, setState] = useState(messageService.getState());

  useEffect(() => {
    return messageService.subscribe(setState);
  }, []);

  const send = useCallback(payload => messageService.send(payload), []);
  const loadOlder = useCallback(() => messageService.loadOlder(), []);
  const clear = useCallback(() => messageService.clear(), []);

  return {
    ...state,
    send,
    loadOlder,
    clear,
  };
}

export default useMessages;
