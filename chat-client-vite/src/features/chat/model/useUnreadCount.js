import { useState, useEffect } from 'react';

/**
 * useUnreadCount Hook
 *
 * Responsibility: Unread message count state management
 *
 * What it does:
 * - Manages unreadCount number state
 * - Resets count to 0 when user views chat
 * - Provides setter for socket event handlers
 *
 * What it does NOT do:
 * - ❌ Socket connection management
 * - ❌ Socket event handling (done in messageHandlers.js)
 * - ❌ Determining what counts as "unread" (done in handlers)
 *
 * @param {string} currentView - Current app view ('chat', 'dashboard', etc.)
 */
export function useUnreadCount(currentView) {
  const [unreadCount, setUnreadCount] = useState(0);

  // Reset unread count when viewing chat
  useEffect(() => {
    if (currentView === 'chat') {
      console.log('[UnreadCount] Resetting to 0 (viewing chat)');
      setUnreadCount(0);
    }
  }, [currentView]);

  return {
    unreadCount,
    setUnreadCount,
  };
}

export default useUnreadCount;
