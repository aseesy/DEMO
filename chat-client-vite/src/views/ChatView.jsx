import React from 'react';
import { MessageSearch } from '../components/MessageSearch.jsx';
import { ObserverCard } from '../components/ObserverCard.jsx';
import { removeWithMigration } from '../utils/storageMigration.js';
import { trackRewriteUsed, trackInterventionOverride } from '../utils/analytics.js';
import { logger } from '../utils/logger.js';

/**
 * ChatView - Main chat interface with messages, input, and threads
 *
 * Extracted from ChatRoom.jsx for better code organization.
 * This is a presentational component - all state lives in ChatRoom.jsx
 */
export function ChatView({
  // User & Auth
  username,
  isAuthenticated,

  // Messages
  messages,
  messagesContainerRef,
  messagesEndRef,
  isInitialLoad,
  hasMoreMessages,
  isLoadingOlder,
  loadOlderMessages,
  highlightedMessageId,

  // Message Input
  inputMessage,
  setInputMessage,
  handleInputChange,
  sendMessage,

  // Draft Coaching / AI Intervention
  draftCoaching,
  setDraftCoaching,
  isPreApprovedRewrite,
  setIsPreApprovedRewrite,
  originalRewrite,
  setOriginalRewrite,

  // Search
  searchQuery,
  searchMode,
  searchResults,
  searchTotal,
  isSearching,
  searchMessages,
  toggleSearchMode,
  exitSearchMode,
  jumpToMessage,

  // Threads
  threads,
  showThreadsPanel,
  setShowThreadsPanel,
  selectedThreadId,
  setSelectedThreadId,
  getThreadMessages,
  addToThread,

  // Flagging
  flaggingMessage,
  setFlaggingMessage,
  flagReason,
  setFlagReason,
  flagMessage,

  // Intervention Feedback
  feedbackGiven,
  sendInterventionFeedback,
  pendingOriginalMessageToRemove,
  setPendingOriginalMessageToRemove,

  // Invite State
  inviteLink,
  setInviteLink,
  inviteCode,
  setInviteCode,
  inviteCopied,
  setInviteCopied,
  inviteError,
  setInviteError,
  isLoadingInvite,
  handleLoadInvite,
  handleCopyInvite,

  // Co-parent Connection
  hasCoParentConnected,
  hasPendingInvitation,
  hasAcceptedInvitation,

  // Manual Invite
  showManualInvite,
  setShowManualInvite,
  manualInviteCode,
  setManualInviteCode,
  pendingInviteCode,
  setPendingInviteCode,
  isAcceptingInvite,
  handleManualAcceptInvite,

  // Socket
  socket,
}) {
  return (
    <div className="h-full flex flex-col relative">
      {/* Chat Header Bar - Sticky toolbar above messages */}
      <div
        className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-4 sm:px-6 md:px-8 py-3 flex items-center gap-3"
        style={{ WebkitBackdropFilter: 'blur(12px)' }}
      >
        {/* Search Bar - Always visible */}
        <div className="flex-1 relative max-w-3xl mx-auto">
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value.trim()) {
                if (!searchMode) toggleSearchMode();
                searchMessages(value);
              } else if (searchMode) {
                exitSearchMode();
              }
            }}
            placeholder={(() => {
              const other = messages.find(m => m.username && m.username.toLowerCase() !== username?.toLowerCase());
              const name = other?.displayName || other?.username;
              return name ? `Search Conversation With ${name}` : "Search messages...";
            })()}
            className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-full bg-white/90 focus:outline-none focus:border-teal-dark focus:ring-1 focus:ring-teal-dark text-base text-gray-900 placeholder-gray-400 min-h-[44px] shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { searchMessages(''); exitSearchMode(); }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-teal-dark p-1 rounded hover:bg-gray-50"
              aria-label="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Right side: Threads and invite actions */}
        <div className="flex items-center gap-2">
          {threads.length > 0 && (
            <button
              type="button"
              onClick={() => setShowThreadsPanel(!showThreadsPanel)}
              className="px-3 py-2 rounded-lg bg-teal-dark text-white text-sm font-medium hover:bg-teal-darkest transition-all flex items-center gap-2 min-h-[44px]"
              title="View threads"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="hidden sm:inline">Threads ({threads.length})</span>
            </button>
          )}
          {(() => {
            const shouldShowInvite = isAuthenticated &&
              !inviteLink &&
              !hasCoParentConnected &&
              !hasPendingInvitation &&
              !hasAcceptedInvitation;
            return shouldShowInvite ? (
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Invite</span>
                  </>
                )}
              </button>
            ) : null;
          })()}
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex flex-1 min-h-0">
        {/* Threads Sidebar */}
        {showThreadsPanel && (
          <ThreadsSidebar
            threads={threads}
            selectedThreadId={selectedThreadId}
            setSelectedThreadId={setSelectedThreadId}
            setShowThreadsPanel={setShowThreadsPanel}
            getThreadMessages={getThreadMessages}
          />
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Manual Invite Acceptance UI */}
          {(showManualInvite || (pendingInviteCode && !hasCoParentConnected && inviteError)) && (
            <ManualInvitePanel
              pendingInviteCode={pendingInviteCode}
              manualInviteCode={manualInviteCode}
              setManualInviteCode={setManualInviteCode}
              isAcceptingInvite={isAcceptingInvite}
              handleManualAcceptInvite={handleManualAcceptInvite}
              setShowManualInvite={setShowManualInvite}
              setInviteError={setInviteError}
              setPendingInviteCode={setPendingInviteCode}
            />
          )}

          {/* Invite Error Display */}
          {inviteError && !showManualInvite && (
            <InviteErrorPanel
              inviteError={inviteError}
              pendingInviteCode={pendingInviteCode}
              setShowManualInvite={setShowManualInvite}
            />
          )}

          {/* Invite Link Display */}
          {inviteLink && !hasCoParentConnected && (
            <InviteLinkPanel
              inviteLink={inviteLink}
              inviteCode={inviteCode}
              inviteCopied={inviteCopied}
              setInviteCopied={setInviteCopied}
              setInviteLink={setInviteLink}
              setInviteCode={setInviteCode}
              setInviteError={setInviteError}
              handleCopyInvite={handleCopyInvite}
            />
          )}

          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Search Panel */}
            {searchMode && (
              <MessageSearch
                searchQuery={searchQuery}
                searchResults={searchResults}
                searchTotal={searchTotal}
                isSearching={isSearching}
                onSearch={searchMessages}
                onJumpToMessage={jumpToMessage}
                onClose={exitSearchMode}
              />
            )}

            {/* Messages Container */}
            <MessagesContainer
              messages={messages}
              username={username}
              messagesContainerRef={messagesContainerRef}
              messagesEndRef={messagesEndRef}
              isInitialLoad={isInitialLoad}
              hasMoreMessages={hasMoreMessages}
              isLoadingOlder={isLoadingOlder}
              loadOlderMessages={loadOlderMessages}
              highlightedMessageId={highlightedMessageId}
              feedbackGiven={feedbackGiven}
              sendInterventionFeedback={sendInterventionFeedback}
              pendingOriginalMessageToRemove={pendingOriginalMessageToRemove}
              setPendingOriginalMessageToRemove={setPendingOriginalMessageToRemove}
              setFlaggingMessage={setFlaggingMessage}
              addToThread={addToThread}
              threads={threads}
            />

            {/* Observer Card - Shows when message triggers intervention */}
            {draftCoaching && draftCoaching.observerData && !draftCoaching.shouldSend && (
              <div className="px-4 sm:px-6 md:px-8 pb-3">
                <ObserverCard
                  observerData={draftCoaching.observerData}
                  originalText={draftCoaching.originalText || inputMessage}
                  onUseRewrite={(rewrite) => {
                    setInputMessage(rewrite);
                    setIsPreApprovedRewrite(true);
                    setOriginalRewrite(rewrite);
                    setDraftCoaching(null);
                  }}
                  onEditMyself={() => {
                    setDraftCoaching(null);
                  }}
                  onSendOriginal={() => {
                    if (socket && socket.connected) {
                      socket.emit('send_message', {
                        text: draftCoaching.originalText || inputMessage,
                        isPreApprovedRewrite: false,
                        bypassMediation: true,
                      });
                      setInputMessage('');
                      setDraftCoaching(null);
                    }
                  }}
                />
              </div>
            )}

            {/* Loading state while analyzing */}
            {draftCoaching && draftCoaching.analyzing && (
              <div className="px-4 sm:px-6 md:px-8 pb-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-teal-medium" />
                  <span>Analyzing message...</span>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="px-4 sm:px-6 md:px-8 pb-4 pt-2 safe-area-inset-bottom" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <form
                onSubmit={sendMessage}
                className="bg-white shadow-lg rounded-2xl border border-gray-100 p-2 flex items-end gap-2 max-w-3xl mx-auto"
              >
                <div className="flex-1 flex items-center">
                  <textarea
                    value={inputMessage}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    rows={1}
                    className={`flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0 transition-all text-base text-gray-900 placeholder-gray-400 min-h-[44px] max-h-32 resize-none font-normal leading-snug bg-transparent ${draftCoaching && draftCoaching.observerData && !draftCoaching.shouldSend
                      ? 'placeholder-orange-400'
                      : ''
                      }`}
                    style={{ fontSize: '15px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="w-11 h-11 bg-linear-to-br from-teal-500 to-teal-600 text-white rounded-full font-bold hover:from-teal-600 hover:to-teal-700 transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg group"
                  title="Send message"
                >
                  <svg className="w-5 h-5 transition-transform duration-200 group-hover:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ThreadsSidebar - Sidebar panel showing conversation threads
 */
function ThreadsSidebar({
  threads,
  selectedThreadId,
  setSelectedThreadId,
  setShowThreadsPanel,
  getThreadMessages,
}) {
  return (
    <div className="w-72 border-r-2 border-teal-light bg-white flex flex-col shadow-lg">
      <div className="p-4 border-b-2 border-teal-light flex items-center justify-between bg-teal-lightest">
        <h3 className="font-semibold text-base text-teal-dark">Threads</h3>
        <button
          type="button"
          onClick={() => setShowThreadsPanel(false)}
          className="text-gray-500 hover:text-teal-medium p-1.5 rounded-lg hover:bg-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="p-6 text-sm text-gray-500 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No threads yet. Start a conversation about a specific topic to create one.</p>
          </div>
        ) : (
          threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => {
                setSelectedThreadId(thread.id === selectedThreadId ? null : thread.id);
                if (thread.id !== selectedThreadId) {
                  getThreadMessages(thread.id);
                }
              }}
              className={`w-full text-left p-4 border-b border-gray-100 hover:bg-teal-lightest transition-colors ${selectedThreadId === thread.id ? 'bg-teal-lightest border-l-4 border-l-teal-medium' : ''
                }`}
            >
              <div className="font-semibold text-sm text-teal-dark mb-1">{thread.title}</div>
              <div className="text-xs text-gray-500 font-medium">
                {thread.message_count || 0} {thread.message_count === 1 ? 'message' : 'messages'}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * ManualInvitePanel - UI for manually entering invite codes
 */
function ManualInvitePanel({
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
    <div className="mb-4 rounded-xl border-2 border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-sm">
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
            onChange={(e) => setManualInviteCode(e.target.value)}
            placeholder="Enter invite code"
            className="w-full px-4 py-2.5 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 text-gray-900 text-sm min-h-[44px]"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleManualAcceptInvite();
              }
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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

/**
 * InviteErrorPanel - Display invite errors
 */
function InviteErrorPanel({ inviteError, pendingInviteCode, setShowManualInvite }) {
  return (
    <div className="mb-4 rounded-xl border-2 border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900 shadow-sm">
      <div className="font-semibold mb-2 text-base">Error</div>
      <div className="leading-relaxed">{inviteError}</div>
      {inviteError.includes('404') && (
        <div className="mt-3 text-xs text-red-700">
          The server may need to be restarted. Please contact support if this persists.
        </div>
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

/**
 * InviteLinkPanel - Display generated invite link and code
 */
function InviteLinkPanel({
  inviteLink,
  inviteCode,
  inviteCopied,
  setInviteCopied,
  setInviteLink,
  setInviteCode,
  setInviteError,
  handleCopyInvite,
}) {
  return (
    <div className="mb-6 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-6 py-5 text-sm text-emerald-900 shadow-md">
      <div className="font-semibold mb-3 text-lg text-emerald-800">
        Invite someone to chat
      </div>

      {/* Short Code */}
      {inviteCode && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-emerald-800 mb-1">
            Invite Code (for existing users)
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border-2 border-emerald-200 rounded-lg p-3 text-center">
              <span className="text-xl font-mono font-bold text-emerald-800 tracking-wider">
                {inviteCode}
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteCode);
                  setInviteCopied(true);
                  setTimeout(() => setInviteCopied(false), 2000);
                } catch (err) {
                  logger.error('Copy failed', err);
                }
              }}
              className="p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              title="Copy code"
            >
              {inviteCopied ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Invite Link */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-emerald-800 mb-1">
          Invite Link (for new users)
        </label>
        <a
          href={inviteLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 bg-white rounded-lg border-2 border-emerald-200 break-all text-emerald-800 font-mono text-xs hover:bg-emerald-100 transition-colors shadow-sm"
          onClick={(e) => {
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy link</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setInviteLink('');
            setInviteCode('');
            setInviteError('');
          }}
          className="px-5 py-3 rounded-lg border-2 border-emerald-300 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors min-h-[44px] bg-white"
        >
          Close
        </button>
      </div>
      <div className="mt-4 text-xs text-emerald-700 leading-relaxed">
        Share the link with new users or the code with existing users. When they accept, they'll join this chat.
      </div>
    </div>
  );
}

/**
 * MessagesContainer - The scrollable messages area
 * This is a placeholder - the actual message rendering logic is complex
 * and will be included inline for now
 */
function MessagesContainer({
  messages,
  username,
  messagesContainerRef,
  messagesEndRef,
  isInitialLoad,
  hasMoreMessages,
  isLoadingOlder,
  loadOlderMessages,
  highlightedMessageId,
  feedbackGiven,
  sendInterventionFeedback,
  pendingOriginalMessageToRemove,
  setPendingOriginalMessageToRemove,
  setFlaggingMessage,
  addToThread,
  threads,
}) {
  // Helper function to get avatar color from username
  const getAvatarColor = (name) => {
    if (!name) return '#6B7280';
    const colors = [
      '#DC2626', '#EA580C', '#D97706', '#CA8A04',
      '#65A30D', '#16A34A', '#059669', '#0D9488',
      '#0891B2', '#0284C7', '#2563EB', '#4F46E5',
      '#7C3AED', '#9333EA', '#C026D3', '#DB2777',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Calculate streak for messages
  const getMessageStreak = (msgIndex) => {
    let streak = 0;
    for (let i = msgIndex; i >= 0; i--) {
      const msg = messages[i];
      if (!msg || msg.isAI || msg.isComment) break;
      const isOwn = msg.username?.toLowerCase() === username?.toLowerCase();
      if (!isOwn) break;
      if (msg.analysis_result && !msg.analysis_result.approved) continue;
      streak++;
    }
    return streak;
  };

  // Get streak badge
  const getStreakBadge = (streak) => {
    if (streak >= 10) return { emoji: '🔥', label: 'On fire!' };
    if (streak >= 5) return { emoji: '⭐', label: 'Great streak!' };
    if (streak >= 3) return { emoji: '✨', label: 'Keep it up!' };
    return null;
  };

  // Group messages by date
  const messageGroups = React.useMemo(() => {
    const groups = [];
    let currentGroup = null;
    let currentDate = null;

    messages.forEach((msg, index) => {
      const msgDate = new Date(msg.created_at || msg.timestamp);
      const dateLabel = msgDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: msgDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });

      if (dateLabel !== currentDate) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = { date: dateLabel, messages: [] };
        currentDate = dateLabel;
      }
      currentGroup.messages.push({ ...msg, originalIndex: index });
    });

    if (currentGroup) groups.push(currentGroup);
    return groups;
  }, [messages]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 pt-4 pb-2 space-y-4 bg-linear-to-b from-white to-gray-50"
      style={{
        fontFamily: "'Inter', sans-serif",
        opacity: isInitialLoad ? 0 : 1,
        transition: 'opacity 0.15s ease-out'
      }}
      onScroll={(e) => {
        const target = e.target;
        if (target.scrollTop < 100 && hasMoreMessages && !isLoadingOlder) {
          loadOlderMessages();
        }
      }}
    >
      {/* Load More / Loading Indicator */}
      {hasMoreMessages && (
        <div className="flex justify-center py-2">
          {isLoadingOlder ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              Loading older messages...
            </div>
          ) : (
            <button
              onClick={loadOlderMessages}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium py-2 px-4 rounded-lg hover:bg-teal-50 transition-colors"
            >
              Load older messages
            </button>
          )}
        </div>
      )}

      {/* Message Groups */}
      {messageGroups.map((group, groupIndex) => (
        <div key={groupIndex}>
          {/* Date Separator */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-medium text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
              {group.date}
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Messages in group */}
          {group.messages.map((msg, msgIndex) => {
            const isOwn = msg.username?.toLowerCase() === username?.toLowerCase();
            const isAI = msg.isAI || msg.username === 'LiaiZen';
            const isHighlighted = highlightedMessageId === msg.id;
            const streak = isOwn ? getMessageStreak(msg.originalIndex) : 0;
            const streakBadge = getStreakBadge(streak);

            // Check if message is pending removal
            const isPendingOriginal = pendingOriginalMessageToRemove === msg.id;

            // Skip rendering if this message is pending removal
            if (isPendingOriginal) return null;

            return (
              <div
                key={msg.id || msgIndex}
                id={`message-${msg.id}`}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 ${isHighlighted ? 'animate-pulse bg-yellow-100 rounded-lg p-2 -mx-2' : ''}`}
              >
                <div className={`max-w-[85%] sm:max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                  {/* Avatar and Name */}
                  {!isOwn && (
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: getAvatarColor(msg.username) }}
                      >
                        {(msg.displayName || msg.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {msg.displayName || msg.username}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`px-4 py-2.5 rounded-2xl ${
                      isAI
                        ? 'bg-purple-50 border border-purple-200 text-purple-900'
                        : isOwn
                          ? 'bg-teal-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text || msg.message}
                    </p>

                    {/* Timestamp */}
                    <div className={`text-xs mt-1 ${isOwn ? 'text-teal-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at || msg.timestamp).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {/* Streak Badge */}
                  {isOwn && streakBadge && streak >= 3 && (
                    <div className="flex justify-end mt-1">
                      <span className="text-xs text-gray-500">
                        {streakBadge.emoji} {streak} in a row
                      </span>
                    </div>
                  )}

                  {/* Intervention feedback */}
                  {msg.intervention_id && !feedbackGiven[msg.intervention_id] && (
                    <div className="flex gap-2 mt-2 justify-end">
                      <button
                        onClick={() => sendInterventionFeedback(msg.intervention_id, 'helpful')}
                        className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        👍 Helpful
                      </button>
                      <button
                        onClick={() => sendInterventionFeedback(msg.intervention_id, 'not_helpful')}
                        className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        👎 Not helpful
                      </button>
                    </div>
                  )}

                  {/* Message actions */}
                  {!isAI && (
                    <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setFlaggingMessage(msg)}
                        className="text-xs text-gray-400 hover:text-red-500"
                        title="Flag message"
                      >
                        🚩
                      </button>
                      {threads.length > 0 && (
                        <button
                          onClick={() => addToThread(msg)}
                          className="text-xs text-gray-400 hover:text-teal-500"
                          title="Add to thread"
                        >
                          💬
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatView;
