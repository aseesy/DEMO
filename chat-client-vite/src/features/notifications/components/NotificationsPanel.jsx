/**
 * NotificationsPanel - Dropdown panel showing user notifications
 *
 * This is a thin presentational wrapper that:
 * - Uses useNotificationData for data fetching
 * - Uses useNotificationActions for action handling
 * - Renders NotificationItem components
 *
 * @param {boolean} isOpen - Whether the panel is visible
 * @param {function} onClose - Close handler
 * @param {function} onInvitationAccepted - Callback when invitation is accepted
 */

import React, { useEffect } from 'react';
import { useNotificationData } from '../model/useNotificationData.js';
import { useNotificationActions } from '../model/useNotificationActions.js';
import { NotificationItem } from './NotificationItem.jsx';

export function NotificationsPanel({ isOpen, onClose, onInvitationAccepted }) {
  const {
    notifications,
    isLoading,
    error,
    fetchNotifications,
    removeNotification,
    updateNotification,
    clearError,
    setError,
  } = useNotificationData();

  const {
    processingId,
    isAccepting,
    isDeclining,
    handleAcceptInvitation,
    handleDeclineInvitation,
    markAsRead,
    dismissNotification,
    isProcessing,
  } = useNotificationActions({
    onNotificationRemove: removeNotification,
    onNotificationUpdate: updateNotification,
    onError: setError,
  });

  // Fetch notifications when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Handle accept with parent callback
  const onAccept = async notification => {
    const result = await handleAcceptInvitation(notification);
    if (result.success && onInvitationAccepted) {
      onInvitationAccepted(result.data);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div
        className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border-2 border-gray-200 z-50 overflow-hidden"
        role="dialog"
        aria-label="Notifications"
      >
        {/* Header */}
        <NotificationHeader onClose={onClose} />

        {/* Error banner */}
        {error && <ErrorBanner error={error} onDismiss={clearError} />}

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <LoadingState />
          ) : notifications.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onAccept={onAccept}
                  onDecline={handleDeclineInvitation}
                  onDismiss={dismissNotification}
                  onMarkAsRead={markAsRead}
                  isProcessing={isProcessing(notification.id)}
                  isAccepting={isAccepting}
                  isDeclining={isDeclining}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && <NotificationFooter onRefresh={fetchNotifications} />}
      </div>
    </>
  );
}

// Sub-components for cleaner organization

function NotificationHeader({ onClose }) {
  return (
    <div className="px-4 py-3 bg-gradient-to-r from-teal-dark to-teal-medium text-white flex items-center justify-between">
      <h2 className="font-semibold text-lg">Notifications</h2>
      <button
        type="button"
        onClick={onClose}
        className="p-1 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Close notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

function ErrorBanner({ error, onDismiss }) {
  return (
    <div className="px-4 py-2 bg-red-50 text-red-700 text-sm border-b border-red-100">
      {error}
      <button
        type="button"
        onClick={onDismiss}
        className="ml-2 text-red-600 hover:text-red-800 font-medium"
      >
        Dismiss
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-8 text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-teal-lightest border-t-teal-medium" />
      <p className="mt-2 text-gray-500 text-sm">Loading notifications...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <p className="text-gray-600 font-medium">All caught up!</p>
      <p className="text-gray-400 text-sm mt-1">You have no notifications</p>
    </div>
  );
}

function NotificationFooter({ onRefresh }) {
  return (
    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
      <button
        type="button"
        onClick={onRefresh}
        className="text-sm text-teal-medium hover:text-teal-dark font-medium transition-colors"
      >
        Refresh
      </button>
    </div>
  );
}

export default NotificationsPanel;
