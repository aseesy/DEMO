import React from 'react';
import { apiGet } from '../../../apiClient.js';

/**
 * Hook for managing in-app notifications (invitations, system messages, etc.)
 * This is separate from browser/push notifications
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether to fetch notifications (default: true)
 */
export function useInAppNotifications({ enabled = true } = {}) {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  /**
   * Fetch unread notification count
   */
  const fetchUnreadCount = React.useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await apiGet('/api/notifications/unread-count');

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      } else if (response.status === 401) {
        // User not authenticated - silently ignore
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error fetching notification count:', err);
      // Don't set error state - this is a background operation
    }
  }, [enabled]);

  /**
   * Refresh notification count
   */
  const refresh = React.useCallback(() => {
    if (enabled) {
      fetchUnreadCount();
    }
  }, [fetchUnreadCount, enabled]);

  // Fetch count on mount (only if enabled)
  React.useEffect(() => {
    if (!enabled) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, enabled]);

  return {
    unreadCount,
    isLoading,
    error,
    refresh,
  };
}

export default useInAppNotifications;
