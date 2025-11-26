import React from 'react';
import { useInvitations } from '../hooks/useInvitations.js';
import { apiGet, apiPut } from '../apiClient.js';
import { Button } from './ui';

/**
 * NotificationsPanel - Dropdown panel showing user notifications
 * Handles invitation accept/decline actions inline
 *
 * @param {boolean} isOpen - Whether the panel is visible
 * @param {function} onClose - Close handler
 * @param {function} onInvitationAccepted - Callback when invitation is accepted
 */
export function NotificationsPanel({ isOpen, onClose, onInvitationAccepted }) {
  const [notifications, setNotifications] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const {
    acceptInvitation,
    declineInvitation,
    isAccepting,
    isDeclining,
  } = useInvitations();

  // Track which notification is being processed
  const [processingId, setProcessingId] = React.useState(null);

  // Fetch notifications when panel opens
  React.useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiGet('/api/notifications');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load notifications');
        return;
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Unable to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (notification) => {
    const token = notification.data?.invitationToken;
    if (!token) {
      setError('Invalid invitation data');
      return;
    }

    setProcessingId(notification.id);
    const result = await acceptInvitation(token);

    if (result.success) {
      // Mark notification as actioned
      await markNotificationActioned(notification.id, 'accepted');
      // Remove from list
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      // Notify parent
      if (onInvitationAccepted) {
        onInvitationAccepted(result);
      }
    } else {
      setError(result.error || 'Failed to accept invitation');
    }

    setProcessingId(null);
  };

  const handleDeclineInvitation = async (notification) => {
    const token = notification.data?.invitationToken;
    if (!token) {
      setError('Invalid invitation data');
      return;
    }

    setProcessingId(notification.id);
    const result = await declineInvitation(token);

    if (result.success) {
      // Mark notification as actioned
      await markNotificationActioned(notification.id, 'declined');
      // Remove from list
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    } else {
      setError(result.error || 'Failed to decline invitation');
    }

    setProcessingId(null);
  };

  const markNotificationActioned = async (notificationId, action) => {
    try {
      await apiPut(`/api/notifications/${notificationId}/action`, { action });
    } catch (err) {
      console.error('Error marking notification as actioned:', err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiPut(`/api/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const dismissNotification = async (notificationId) => {
    try {
      await apiPut(`/api/notifications/${notificationId}/dismiss`);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'coparent_invitation':
        return (
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      case 'invitation_accepted':
        return (
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'invitation_declined':
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border-2 border-gray-200 z-50 overflow-hidden"
        role="dialog"
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-teal-dark to-teal-medium text-white flex items-center justify-between">
          <h2 className="font-semibold text-lg">Notifications</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-red-50 text-red-700 text-sm border-b border-red-100">
            {error}
            <button
              type="button"
              onClick={() => setError('')}
              className="ml-2 text-red-600 hover:text-red-800 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-teal-lightest border-t-teal-medium" />
              <p className="mt-2 text-gray-500 text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">All caught up!</p>
              <p className="text-gray-400 text-sm mt-1">You have no notifications</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-teal-50/50' : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    {getNotificationIcon(notification.type)}

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? 'font-semibold' : ''} text-gray-900`}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(notification.created_at)}
                      </p>

                      {/* Action buttons for invitation notifications */}
                      {notification.type === 'coparent_invitation' && !notification.action_taken && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptInvitation(notification);
                            }}
                            disabled={processingId === notification.id}
                            loading={processingId === notification.id && isAccepting}
                            className="flex-1"
                          >
                            Accept
                          </Button>
                          <Button
                            variant="tertiary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeclineInvitation(notification);
                            }}
                            disabled={processingId === notification.id}
                            loading={processingId === notification.id && isDeclining}
                            className="flex-1"
                          >
                            Decline
                          </Button>
                        </div>
                      )}

                      {/* Show action taken */}
                      {notification.action_taken && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          {notification.action_taken === 'accepted' ? 'You accepted this invitation' :
                           notification.action_taken === 'declined' ? 'You declined this invitation' :
                           'Dismissed'}
                        </p>
                      )}
                    </div>

                    {/* Dismiss button for non-invitation notifications */}
                    {notification.type !== 'coparent_invitation' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors self-start"
                        aria-label="Dismiss notification"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 bg-teal-medium rounded-full self-start mt-2 flex-shrink-0" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={fetchNotifications}
              className="text-sm text-teal-medium hover:text-teal-dark font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default NotificationsPanel;
