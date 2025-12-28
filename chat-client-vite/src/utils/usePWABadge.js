import { useEffect } from 'react';

/**
 * Hook to manage PWA Badge API
 * Updates the app icon badge with unread message count
 *
 * @param {number} unreadCount - Number of unread messages
 */
export function usePWABadge(unreadCount) {
  useEffect(() => {
    // Only run in browser (not during SSR/build)
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    // Check if Badge API is supported
    if ('setAppBadge' in navigator) {
      try {
        if (unreadCount > 0) {
          navigator.setAppBadge(unreadCount).catch(err => {
            console.warn('[PWA Badge] Failed to set badge:', err);
          });
        } else {
          navigator.clearAppBadge().catch(err => {
            console.warn('[PWA Badge] Failed to clear badge:', err);
          });
        }
      } catch (err) {
        console.warn('[PWA Badge] Error managing badge:', err);
      }
    }
  }, [unreadCount]);
}
