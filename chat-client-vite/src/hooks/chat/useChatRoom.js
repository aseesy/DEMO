import { useState, useEffect, useCallback } from 'react';
import { chatRoomService } from '../../services/chat';

/**
 * useChatRoom - React hook for room state
 *
 * Simply subscribes to ChatRoomService.
 * Re-renders ONLY when room state changes.
 */
export function useChatRoom() {
  const [state, setState] = useState(chatRoomService.getState());

  useEffect(() => {
    return chatRoomService.subscribe(setState);
  }, []);

  const join = useCallback(email => chatRoomService.join(email), []);
  const leave = useCallback(() => chatRoomService.leave(), []);
  const clearError = useCallback(() => chatRoomService.clearError(), []);

  return {
    ...state,
    join,
    leave,
    clearError,
  };
}

export default useChatRoom;
