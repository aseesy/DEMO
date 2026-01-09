import { useState, useEffect, useCallback } from 'react';
import { chatRoomService } from '../../services/chat';

/**
 * useChatRoom - React hook for room state
 *
 * Simply subscribes to ChatRoomService.
 * Re-renders ONLY when room state changes.
 *
 * Event-driven flow:
 * - Call setEmail(email) when user authenticates
 * - Service auto-joins when socket connects
 * - No need to manually call join() in useEffect chains
 */
export function useChatRoom() {
  const [state, setState] = useState(chatRoomService.getState());

  useEffect(() => {
    return chatRoomService.subscribe(setState);
  }, []);

  // Event-driven: Set email once, service handles the rest
  const setEmail = useCallback(email => chatRoomService.setEmail(email), []);
  const clearEmail = useCallback(() => chatRoomService.clearEmail(), []);

  // Legacy methods (still work, but prefer setEmail for new code)
  const join = useCallback(email => chatRoomService.join(email), []);
  const leave = useCallback(() => chatRoomService.leave(), []);
  const clearError = useCallback(() => chatRoomService.clearError(), []);

  return {
    ...state,
    setEmail,
    clearEmail,
    join,
    leave,
    clearError,
  };
}

export default useChatRoom;
