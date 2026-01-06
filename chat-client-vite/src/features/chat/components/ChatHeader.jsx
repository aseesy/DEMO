import React from 'react';

/**
 * ChatHeader - Action buttons for chat view
 *
 * NOTE: AI Summaries/Topics button was intentionally removed from chat.
 * Do NOT re-add it here. AI conversation features belong elsewhere in the app.
 *
 * Note: Search functionality is handled in the desktop Navigation component, not here
 */
export function ChatHeader({
  // Invite
  isAuthenticated,
  inviteLink,
  hasCoParentConnected,
  hasPendingInvitation,
  hasAcceptedInvitation,
  isLoadingInvite,
  handleLoadInvite,
}) {
  const shouldShowInvite =
    isAuthenticated &&
    !inviteLink &&
    !hasCoParentConnected &&
    !hasPendingInvitation &&
    !hasAcceptedInvitation;

  // If no invite button needed, don't render the header at all
  if (!shouldShowInvite) {
    return null;
  }

  return (
    <div
      className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-2 flex items-center justify-end gap-2"
      style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}
    >
      {/* Invite action */}
      <div className="flex items-center gap-1.5">
        {shouldShowInvite && (
          <button
            type="button"
            onClick={handleLoadInvite}
            disabled={isLoadingInvite}
            className="px-3 py-2 rounded-lg bg-teal-dark text-white text-sm font-medium hover:bg-teal-darkest disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-h-[44px]"
            title="Invite someone to join this chat"
          >
            {isLoadingInvite ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Loading…</span>
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Invite</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatHeader;
