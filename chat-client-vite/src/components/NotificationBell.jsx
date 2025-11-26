import React from 'react';

/**
 * NotificationBell - Bell icon with unread count badge
 * Follows LiaiZen design system with teal colors
 *
 * @param {number} unreadCount - Number of unread notifications
 * @param {function} onClick - Click handler to open notifications panel
 * @param {boolean} isOpen - Whether the notifications panel is currently open
 */
export function NotificationBell({ unreadCount = 0, onClick, isOpen = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative p-2 rounded-full transition-all duration-200 min-h-[44px] min-w-[44px]
        flex items-center justify-center
        ${isOpen
          ? 'bg-teal-lightest text-teal-dark'
          : 'text-gray-600 hover:bg-gray-100 hover:text-teal-dark'
        }
        focus:outline-none focus:ring-2 focus:ring-teal-medium focus:ring-offset-2
      `}
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      {/* Bell Icon */}
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <span
          className={`
            absolute -top-0.5 -right-0.5 flex items-center justify-center
            min-w-[20px] h-5 px-1.5 rounded-full
            bg-red-500 text-white text-xs font-bold
            transform transition-transform duration-200
            ${unreadCount > 0 ? 'scale-100' : 'scale-0'}
          `}
          aria-hidden="true"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Pulse animation for new notifications */}
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 flex h-5 w-5"
          aria-hidden="true"
        >
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        </span>
      )}
    </button>
  );
}

export default NotificationBell;
