import React from 'react';
import { logger } from '../../utils/logger.js';

/**
 * InviteLinkPanel - Displays generated invite link and code with copy functionality
 */
export function InviteLinkPanel({
  inviteLink,
  inviteCode,
  inviteCopied,
  setInviteCopied,
  setInviteLink,
  setInviteCode,
  setInviteError,
  handleCopyInvite,
}) {
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch (err) {
      logger.error('Copy failed', err);
    }
  };

  const handleClose = () => {
    setInviteLink('');
    setInviteCode('');
    setInviteError('');
  };

  return (
    <div className="mb-6 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-6 py-5 text-sm text-emerald-900 shadow-md mx-4 mt-4">
      <div className="font-semibold mb-3 text-lg text-emerald-800">Invite someone to chat</div>

      {inviteCode && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-emerald-800 mb-1">Invite Code</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border-2 border-emerald-200 rounded-lg p-3 text-center">
              <span className="text-xl font-mono font-bold text-emerald-800 tracking-wider">
                {inviteCode}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              title="Copy code"
            >
              {inviteCopied ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-xs font-medium text-emerald-800 mb-1">Invite Link</label>
        <a
          href={inviteLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 bg-white rounded-lg border-2 border-emerald-200 break-all text-emerald-800 font-mono text-xs hover:bg-emerald-100 transition-colors shadow-sm"
          onClick={e => {
            e.preventDefault();
            window.location.href = inviteLink;
          }}
        >
          {inviteLink}
        </a>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <button
          type="button"
          onClick={handleCopyInvite}
          className="flex-1 px-5 py-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 min-h-[44px] shadow-sm hover:shadow-md"
        >
          {inviteCopied ? (
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
              <span>Copied!</span>
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>Copy link</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="px-5 py-3 rounded-lg border-2 border-emerald-300 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors min-h-[44px] bg-white"
        >
          Close
        </button>
      </div>

      <div className="mt-4 text-xs text-emerald-700 leading-relaxed">
        Share the link with new users or the code with existing users.
      </div>
    </div>
  );
}

export default InviteLinkPanel;
