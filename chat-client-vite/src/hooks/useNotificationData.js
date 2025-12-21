/**
 * useNotificationData - Hook for fetching and managing notification state
 *
 * Responsibilities:
 * - Fetch notifications from API
 * - Manage loading/error state
 * - Provide notifications list
 *
 * Does NOT handle: UI rendering, action handling (use useNotificationActions for that)
 */

import { useState, useCallback } from 'react';
import { apiGet } from '../apiClient.js';

/**
 * @typedef {Object} Notification
 * @property {string} id - Unique notification ID
 * @property {string} type - Notification type (coparent_invitation, invitation_accepted, etc.)
 * @property {string} title - Notification title
 * @property {string} [message] - Optional message body
 * @property {boolean} read - Whether notification has been read
 * @property {string} [action_taken] - Action taken (accepted, declined, dismissed)
 * @property {Object} [data] - Additional data (e.g., invitationToken)
 * @property {string} created_at - ISO date string
 */

/**
 * Hook for fetching and managing notification data
 * @returns {Object} Notification data state and operations
 */
export function useNotificationData() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Fetch notifications from the API
   */
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiGet('/api/notifications');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load notifications');
        return { success: false, error: data.error };
      }

      setNotifications(data.notifications || []);
      return { success: true, notifications: data.notifications || [] };
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Unable to load notifications');
      return { success: false, error: 'Unable to load notifications' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Remove a notification from the local list
   * @param {string} notificationId - ID of notification to remove
   */
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  /**
   * Update a notification in the local list
   * @param {string} notificationId - ID of notification to update
   * @param {Object} updates - Fields to update
   */
  const updateNotification = useCallback((notificationId, updates) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, ...updates } : n))
    );
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError('');
  }, []);

  /**
   * Get count of unread notifications
   */
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    // State
    notifications,
    isLoading,
    error,
    unreadCount,

    // Actions
    fetchNotifications,
    removeNotification,
    updateNotification,
    clearError,
    setError,
  };
}

export default useNotificationData;
