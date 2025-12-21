/**
 * NotificationItem - Renders a single notification
 *
 * Presentational component - receives all data and handlers as props
 */

import React from 'react';
import { Button } from '../ui';
import { NotificationIcon } from './NotificationIcon.jsx';
import { formatRelativeTime } from '../../utils/dateHelpers.js';

/**
 * NotificationItem component
 * @param {Object} props
 * @param {Object} props.notification - The notification object
 * @param {Function} props.onAccept - Handler for accepting invitation
 * @param {Function} props.onDecline - Handler for declining invitation
 * @param {Function} props.onDismiss - Handler for dismissing notification
 * @param {Function} props.onMarkAsRead - Handler for marking as read
 * @param {boolean} props.isProcessing - Whether this notification is being processed
 * @param {boolean} props.isAccepting - Whether accept is in progress
 * @param {boolean} props.isDeclining - Whether decline is in progress
 */
export function NotificationItem({
  notification,
  onAccept,
  onDecline,
  onDismiss,
  onMarkAsRead,
  isProcessing = false,
  isAccepting = false,
  isDeclining = false,
}) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }
  };

  const handleAccept = (e) => {
    e.stopPropagation();
    onAccept?.(notification);
  };

  const handleDecline = (e) => {
    e.stopPropagation();
    onDecline?.(notification);
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    onDismiss?.(notification.id);
  };

  const isInvitation = notification.type === 'coparent_invitation';
  const showActions = isInvitation && !notification.action_taken;

  return (
    <li
      className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
        !notification.read ? 'bg-teal-50/50' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <NotificationIcon type={notification.type} />

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm ${!notification.read ? 'font-semibold' : ''} text-gray-900`}
          >
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
          {showActions && (
            <div className="flex gap-2 mt-3">
              <Button
                size="small"
                onClick={handleAccept}
                disabled={isProcessing}
                loading={isProcessing && isAccepting}
                className="flex-1"
              >
                Accept
              </Button>
              <Button
                variant="tertiary"
                size="small"
                onClick={handleDecline}
                disabled={isProcessing}
                loading={isProcessing && isDeclining}
                className="flex-1"
              >
                Decline
              </Button>
            </div>
          )}

          {/* Show action taken */}
          {notification.action_taken && (
            <p className="text-xs text-gray-500 mt-2 italic">
              {notification.action_taken === 'accepted'
                ? 'You accepted this invitation'
                : notification.action_taken === 'declined'
                  ? 'You declined this invitation'
                  : 'Dismissed'}
            </p>
          )}
        </div>

        {/* Dismiss button for non-invitation notifications */}
        {!isInvitation && (
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors self-start"
            aria-label="Dismiss notification"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Unread indicator */}
        {!notification.read && (
          <div className="w-2 h-2 bg-teal-medium rounded-full self-start mt-2 flex-shrink-0" />
        )}
      </div>
    </li>
  );
}

export default NotificationItem;
