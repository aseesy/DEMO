import { useState, useEffect, useCallback } from 'react';
import { typingService } from '../../services/chat';

/**
 * useTyping - React hook for typing indicators
 *
 * Simply subscribes to TypingService.
 * Re-renders ONLY when typing state changes.
 */
export function useTyping() {
  const [state, setState] = useState(typingService.getState());

  useEffect(() => {
    return typingService.subscribe(setState);
  }, []);

  const startTyping = useCallback(() => typingService.startTyping(), []);
  const stopTyping = useCallback(() => typingService.stopTyping(), []);

  return {
    ...state,
    startTyping,
    stopTyping,
  };
}

export default useTyping;
