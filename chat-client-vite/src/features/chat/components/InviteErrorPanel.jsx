import React from 'react';

/**
 * InviteErrorPanel - Displays invite-related errors with recovery options
 */
export function InviteErrorPanel({ inviteError, pendingInviteCode, setShowManualInvite }) {
  return (
    <div className="mb-4 rounded-xl border-2 border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900 shadow-sm mx-4 mt-4">
      <div className="font-semibold mb-2 text-base">Error</div>
      <div className="leading-relaxed">{inviteError}</div>
      {inviteError.includes('404') && (
        <div className="mt-3 text-xs text-red-700">The server may need to be restarted.</div>
      )}
      {pendingInviteCode && (
        <button
          type="button"
          onClick={() => setShowManualInvite(true)}
          className="mt-3 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all"
        >
          Try accepting invite manually
        </button>
      )}
    </div>
  );
}

export default InviteErrorPanel;
