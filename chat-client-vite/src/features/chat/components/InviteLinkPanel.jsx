import React from 'react';
import { logger } from '../../../utils/logger.js';

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
    <div className="mb-6 rounded-xl border-2 border-[#C5E8E4] bg-[#E6F7F5] px-6 py-5 text-sm text-[#111827] shadow-md mx-4 mt-4">
      <div className="font-serif font-semibold mb-3 text-lg text-[#275559]">Invite someone to chat</div>

      {inviteCode && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-[#00908B] mb-1">Invite Code</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border-2 border-[#C5E8E4] rounded-lg p-3 text-center">
              <span className="text-xl font-mono font-bold text-[#275559] tracking-wider">
                {inviteCode}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-3 bg-[#275559] text-white rounded-lg hover:bg-[#1f4447] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Copy code"
            >
              {inviteCopied ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-xs font-medium text-[#00908B] mb-1">Invite Link</label>
        <div className="p-3 bg-white rounded-lg border-2 border-[#C5E8E4] break-all text-[#111827] font-mono text-xs">
          {inviteLink}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <button
          type="button"
          onClick={handleCopyInvite}
          className="flex-1 px-5 py-3 rounded-lg bg-[#275559] text-white text-sm font-semibold hover:bg-[#1f4447] transition-all flex items-center justify-center gap-2 min-h-[44px] shadow-sm hover:shadow-md"
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
          className="px-5 py-3 rounded-lg border-2 border-[#C5E8E4] text-[#00908B] text-sm font-semibold hover:bg-[#E6F7F5] transition-colors min-h-[44px] bg-white"
        >
          Close
        </button>
      </div>

      <div className="mt-4 text-xs text-[#4b5563] leading-relaxed">
        Share the link with new users or the code with existing users.
      </div>
    </div>
  );
}

export default InviteLinkPanel;
