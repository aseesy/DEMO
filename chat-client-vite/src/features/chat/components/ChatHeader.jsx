import React from 'react';

/**
 * ChatHeader - Search bar and action buttons for chat view
 */
export function ChatHeader({
  // Search
  searchQuery,
  searchMode,
  searchMessages,
  toggleSearchMode,
  exitSearchMode,
  // Messages for placeholder
  messages,
  username,
  // Threads
  threads,
  showThreadsPanel,
  setShowThreadsPanel,
  // Invite
  isAuthenticated,
  inviteLink,
  hasCoParentConnected,
  hasPendingInvitation,
  hasAcceptedInvitation,
  isLoadingInvite,
  handleLoadInvite,
}) {
  const handleSearchChange = e => {
    const value = e.target.value;
    if (value.trim()) {
      if (!searchMode) toggleSearchMode();
      searchMessages(value);
    } else if (searchMode) {
      exitSearchMode();
    }
  };

  const handleClearSearch = () => {
    searchMessages('');
    exitSearchMode();
  };

  const getPlaceholder = () => {
    // Find the co-parent (other human user, not AI/system)
    const aiNames = ['alex', 'liaizen', 'ai assistant', 'system', 'liaizen ai'];
    const coParent = messages.find(
      m =>
        m.username &&
        m.username.toLowerCase() !== username?.toLowerCase() &&
        !aiNames.includes(m.username.toLowerCase()) &&
        !m.type?.startsWith('ai_') &&
        m.type !== 'contact_suggestion' &&
        m.type !== 'system'
    );

    // Extract first name only (not full name)
    let firstName = '';
    if (coParent) {
      if (coParent.first_name) {
        firstName = coParent.first_name;
      } else if (coParent.displayName) {
        // Extract first word from displayName (first name)
        firstName = coParent.displayName.split(' ')[0];
      } else if (coParent.username) {
        firstName = coParent.username;
      }
    }

    return firstName ? `Conversation With ${firstName}` : 'messages...';
  };

  const shouldShowInvite =
    isAuthenticated &&
    !inviteLink &&
    !hasCoParentConnected &&
    !hasPendingInvitation &&
    !hasAcceptedInvitation;

  return (
    <div
      className="sticky top-0 md:hidden z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-2 flex items-center gap-2"
      style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}
    >
      {/* Search Bar */}
      <div
        className="flex-1 relative max-w-3xl mx-auto min-w-0"
        style={{ width: '100%', maxWidth: '100%' }}
      >
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery || ''}
          onChange={handleSearchChange}
          placeholder={getPlaceholder()}
          className="w-full pl-12 pr-12 border border-gray-200 rounded-full bg-white/90 focus:outline-none focus:border-teal-dark focus:ring-1 focus:ring-teal-dark text-base text-gray-900 placeholder-gray-400 min-h-[32px] shadow-sm transition-all"
          style={{
            paddingTop: '0.375rem',
            paddingBottom: '0.375rem',
            lineHeight: '1.5',
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-teal-dark p-0.5 rounded hover:bg-gray-50"
            aria-label="Clear search"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Right side: Threads and invite actions */}
      <div className="flex items-center gap-1.5">
        {threads.length > 0 && (
          <button
            type="button"
            onClick={() => setShowThreadsPanel(!showThreadsPanel)}
            className="px-3 py-2 rounded-lg bg-teal-dark text-white text-sm font-medium hover:bg-teal-darkest transition-all flex items-center gap-2 min-h-[44px]"
            title="View threads"
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="hidden sm:inline">Threads ({threads.length})</span>
          </button>
        )}

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
