/**
 * InviteCodeEntryCard - Manual invite code entry UI
 *
 * Presentational component for entering invite codes to connect with co-parent.
 * All state management is handled by parent via props.
 */

import React from 'react';
import { SettingsCard, SettingsIcons } from './SettingsCard.jsx';

/**
 * InviteCodeEntryCard component
 * @param {Object} props
 * @param {string} props.manualInviteCode - Current input value
 * @param {Function} props.onCodeChange - Callback when code changes
 * @param {Function} props.onSubmit - Callback to accept invite
 * @param {boolean} props.isAccepting - Loading state
 * @param {string} props.error - Error message
 */
export function InviteCodeEntryCard({
  manualInviteCode,
  onCodeChange,
  onSubmit,
  isAccepting,
  error,
}) {
  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  const handleChange = e => {
    onCodeChange(e.target.value.toUpperCase());
  };

  return (
    <SettingsCard
      icon={SettingsIcons.userPlus}
      title="Enter Invite Code"
      description="Have an invite code? Enter it here to connect and start chatting."
    >
      <div className="space-y-3">
        <input
          type="text"
          value={manualInviteCode}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="Enter code (e.g., LZ-ABC123)"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-2 focus:ring-teal-light focus:ring-opacity-20 text-gray-900 text-base min-h-[44px] transition-all"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={isAccepting || !manualInviteCode.trim()}
          className="w-full px-5 py-3 rounded-lg bg-teal-medium text-white text-base font-semibold hover:bg-teal-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[44px] shadow-sm hover:shadow-md"
        >
          {isAccepting ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              {SettingsIcons.link}
              <span>Connect</span>
            </>
          )}
        </button>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
        )}
      </div>
    </SettingsCard>
  );
}

export default InviteCodeEntryCard;
