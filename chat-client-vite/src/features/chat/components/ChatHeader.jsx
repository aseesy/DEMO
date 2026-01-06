import React from 'react';

/**
 * ChatHeader - Action buttons for chat view
 * Note: Search functionality is handled in the desktop Navigation component, not here
 */
export function ChatHeader({
  // Topics
  showTopicsPanel,
  setShowTopicsPanel,
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

  return (
    <div
      className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-2 flex items-center justify-end gap-2"
      style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}
    >
      {/* Right side: AI Summaries and invite actions */}
      <div className="flex items-center gap-1.5">
        {/* AI Summaries button */}
        <button
          type="button"
          onClick={() => setShowTopicsPanel(!showTopicsPanel)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 min-h-[44px] ${
            showTopicsPanel
              ? 'bg-teal-darkest text-white'
              : 'bg-teal-dark text-white hover:bg-teal-darkest'
          }`}
          title="AI Summaries"
        >
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
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <span className="hidden sm:inline">AI</span>
        </button>

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
