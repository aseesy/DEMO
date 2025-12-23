/**
 * InviteLinkFooter - Link to accept invitation page
 */

import React from 'react';

/**
 * @param {Object} props
 * @param {boolean} props.show - Whether to show the footer
 * @param {Function} props.onAcceptInvite - Called when user clicks accept invite
 */
export function InviteLinkFooter({ show = false, onAcceptInvite }) {
  if (!show) {
    return null;
  }

  return (
    <div className="mt-4 text-center">
      <p className="text-xs text-gray-500">
        Have an invitation?{' '}
        <button
          type="button"
          onClick={onAcceptInvite}
          className="text-teal-medium hover:text-teal-dark font-medium"
        >
          Accept invitation here
        </button>
      </p>
    </div>
  );
}

export default InviteLinkFooter;
