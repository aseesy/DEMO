/**
 * InviteNotificationBanner - Displays invite notification when user has pending invite
 */

import React from 'react';

/**
 * @param {Object} props
 * @param {boolean} props.show - Whether to show the banner
 * @param {string} props.title - Banner title
 * @param {string} props.message - Banner message
 */
export function InviteNotificationBanner({
  show = false,
  title = "You've been invited to connect!",
  message = 'Log in to accept the invitation and connect with your co-parent.',
}) {
  if (!show) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl bg-emerald-50 border-2 border-emerald-200 px-4 py-3 text-sm text-emerald-800 transition-all duration-300">
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-emerald-700">{message}</div>
    </div>
  );
}

export default InviteNotificationBanner;
