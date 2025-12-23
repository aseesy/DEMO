/**
 * useNotificationActions - Hook for notification action handling
 *
 * Responsibilities:
 * - Accept/decline invitation actions
 * - Mark as read
 * - Dismiss notifications
 * - Track processing state
 *
 * Depends on: useInvitations for invitation-specific actions
 */

import { useState, useCallback } from 'react';
import { apiPut } from '../../../apiClient.js';
import { useInvitations } from '../../invitations';

/**
 * Hook for handling notification actions
 * @param {Object} options - Configuration options
 * @param {Function} options.onNotificationRemove - Callback when notification should be removed
 * @param {Function} options.onNotificationUpdate - Callback when notification should be updated
 * @param {Function} options.onError - Callback for error handling
 * @returns {Object} Action handlers and state
 */
export function useNotificationActions({
  onNotificationRemove,
  onNotificationUpdate,
  onError,
} = {}) {
  const [processingId, setProcessingId] = useState(null);

  const { acceptInvitation, declineInvitation, isAccepting, isDeclining } = useInvitations();

  /**
   * Mark a notification as actioned on the server
   * @param {string} notificationId - Notification ID
   * @param {string} action - Action taken (accepted, declined, dismissed)
   */
  const markNotificationActioned = useCallback(async (notificationId, action) => {
    try {
      await apiPut(`/api/notifications/${notificationId}/action`, { action });
      return { success: true };
    } catch (err) {
      console.error('Error marking notification as actioned:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await apiPut(`/api/notifications/${notificationId}/read`);
      onNotificationUpdate?.(notificationId, { read: true });
      return { success: true };
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { success: false, error: err.message };
    }
  }, [onNotificationUpdate]);

  /**
   * Dismiss a notification
   * @param {string} notificationId - Notification ID
   */
  const dismissNotification = useCallback(async (notificationId) => {
    try {
      await apiPut(`/api/notifications/${notificationId}/dismiss`);
      onNotificationRemove?.(notificationId);
      return { success: true };
    } catch (err) {
      console.error('Error dismissing notification:', err);
      return { success: false, error: err.message };
    }
  }, [onNotificationRemove]);

  /**
   * Accept an invitation from a notification
   * @param {Object} notification - The notification object
   * @returns {Object} Result with success flag and optional data
   */
  const handleAcceptInvitation = useCallback(async (notification) => {
    const token = notification.data?.invitationToken;
    if (!token) {
      const error = 'Invalid invitation data';
      onError?.(error);
      return { success: false, error };
    }

    setProcessingId(notification.id);

    try {
      const result = await acceptInvitation(token);

      if (result.success) {
        await markNotificationActioned(notification.id, 'accepted');
        onNotificationRemove?.(notification.id);
        return { success: true, data: result };
      } else {
        const error = result.error || 'Failed to accept invitation';
        onError?.(error);
        return { success: false, error };
      }
    } finally {
      setProcessingId(null);
    }
  }, [acceptInvitation, markNotificationActioned, onNotificationRemove, onError]);

  /**
   * Decline an invitation from a notification
   * @param {Object} notification - The notification object
   * @returns {Object} Result with success flag
   */
  const handleDeclineInvitation = useCallback(async (notification) => {
    const token = notification.data?.invitationToken;
    if (!token) {
      const error = 'Invalid invitation data';
      onError?.(error);
      return { success: false, error };
    }

    setProcessingId(notification.id);

    try {
      const result = await declineInvitation(token);

      if (result.success) {
        await markNotificationActioned(notification.id, 'declined');
        onNotificationRemove?.(notification.id);
        return { success: true };
      } else {
        const error = result.error || 'Failed to decline invitation';
        onError?.(error);
        return { success: false, error };
      }
    } finally {
      setProcessingId(null);
    }
  }, [declineInvitation, markNotificationActioned, onNotificationRemove, onError]);

  /**
   * Check if a specific notification is being processed
   * @param {string} notificationId - Notification ID
   * @returns {boolean}
   */
  const isProcessing = useCallback((notificationId) => {
    return processingId === notificationId;
  }, [processingId]);

  return {
    // State
    processingId,
    isAccepting,
    isDeclining,

    // Actions
    handleAcceptInvitation,
    handleDeclineInvitation,
    markAsRead,
    dismissNotification,
    isProcessing,
  };
}

export default useNotificationActions;
