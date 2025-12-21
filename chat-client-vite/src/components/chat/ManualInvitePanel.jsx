import React from 'react';
import { removeWithMigration } from '../../utils/storageMigration.js';

/**
 * ManualInvitePanel - UI for manually accepting an invite code
 */
export function ManualInvitePanel({
  pendingInviteCode,
  manualInviteCode,
  setManualInviteCode,
  isAcceptingInvite,
  handleManualAcceptInvite,
  setShowManualInvite,
  setInviteError,
  setPendingInviteCode,
}) {
  return (
    <div className="mb-4 rounded-xl border-2 border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-sm mx-4 mt-4">
      <div className="font-semibold mb-2 text-base text-amber-800">Accept Invite</div>
      <div className="leading-relaxed mb-4 text-amber-700">
        {pendingInviteCode
          ? `You have a pending invite code: ${pendingInviteCode}`
          : 'Enter your invite code to join the chat'}
      </div>
      <div className="space-y-3">
        {!pendingInviteCode && (
          <input
            type="text"
            value={manualInviteCode}
            onChange={e => setManualInviteCode(e.target.value)}
            placeholder="Enter invite code"
            className="w-full px-4 py-2.5 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 text-gray-900 text-sm min-h-[44px]"
            onKeyPress={e => {
              if (e.key === 'Enter') handleManualAcceptInvite();
            }}
          />
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleManualAcceptInvite}
            disabled={isAcceptingInvite || (!manualInviteCode.trim() && !pendingInviteCode)}
            className="flex-1 px-5 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[44px] shadow-sm hover:shadow-md"
          >
            {isAcceptingInvite ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Accepting...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Accept Invite</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowManualInvite(false);
              setInviteError('');
              setPendingInviteCode(null);
              removeWithMigration('pendingInviteCode');
            }}
            className="px-4 py-2.5 rounded-lg bg-white border-2 border-amber-300 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-all min-h-[44px]"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManualInvitePanel;
