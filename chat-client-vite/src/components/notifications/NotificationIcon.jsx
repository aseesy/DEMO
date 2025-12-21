/**
 * NotificationIcon - Renders appropriate icon based on notification type
 *
 * Pure presentational component - no business logic
 */

import React from 'react';

/**
 * Icon configurations by notification type
 */
const ICON_CONFIG = {
  coparent_invitation: {
    bgColor: 'bg-teal-100',
    iconColor: 'text-teal-600',
    path: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  },
  invitation_accepted: {
    bgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  invitation_declined: {
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-600',
    path: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  default: {
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-600',
    path: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },
};

/**
 * Get icon configuration for a notification type
 * @param {string} type - Notification type
 * @returns {Object} Icon configuration
 */
export function getIconConfig(type) {
  return ICON_CONFIG[type] || ICON_CONFIG.default;
}

/**
 * NotificationIcon component
 * @param {Object} props
 * @param {string} props.type - Notification type
 * @param {string} [props.className] - Additional CSS classes
 */
export function NotificationIcon({ type, className = '' }) {
  const config = getIconConfig(type);

  return (
    <div
      className={`w-10 h-10 ${config.bgColor} rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <svg
        className={`w-5 h-5 ${config.iconColor}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={config.path}
        />
      </svg>
    </div>
  );
}

export default NotificationIcon;
