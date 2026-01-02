import { useState, useEffect, useCallback } from 'react';
import { unreadService } from '../../services/chat';

/**
 * useUnread - React hook for unread count
 *
 * Simply subscribes to UnreadService.
 * Re-renders ONLY when unread count changes.
 */
export function useUnread() {
  const [state, setState] = useState(unreadService.getState());

  useEffect(() => {
    return unreadService.subscribe(setState);
  }, []);

  const markAllRead = useCallback(() => unreadService.markAllRead(), []);
  const setUsername = useCallback(username => unreadService.setUsername(username), []);
  const setViewingChat = useCallback(isViewing => unreadService.setViewingChat(isViewing), []);

  return {
    ...state,
    markAllRead,
    setUsername,
    setViewingChat,
  };
}

export default useUnread;
