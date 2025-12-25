/**
 * ChatPage - Main chat interface with messages, input, and threads
 *
 * Consumes chat state from ChatContext. Socket connection persists across view changes.
 * Refactored to use grouped props for invite state management.
 */

import React from 'react';
import { MessageSearch } from './components/MessageSearch.jsx';
import { FlaggingModal } from './components/FlaggingModal.jsx';
import {
  ThreadsSidebar,
  ManualInvitePanel,
  InviteErrorPanel,
  InviteLinkPanel,
  MessagesContainer,
  ChatHeader,
  MessageInput,
} from './components';
import { useChatContext } from './context/ChatContext.jsx';
import {
  trackMessageSent,
  trackMessageFlagged,
  trackAIIntervention,
} from '../../utils/analytics.js';

/**
 * ChatView component
 *
 * Props have been grouped into logical objects:
 * - inviteState: All invite-related state
 * - inviteHandlers: All invite-related handlers
 *
 * @param {Object} props
 * @param {string} props.username - Current user's username
 * @param {boolean} props.isAuthenticated - Whether user is authenticated
 * @param {Object} props.inviteState - Grouped invite state
 * @param {Object} props.inviteHandlers - Grouped invite handlers
 */
export function ChatPage({ username, isAuthenticated, inviteState, inviteHandlers }) {
  // Get all chat state from context (socket persists across view changes)
  const {
    messages,
    inputMessage,
    sendMessage: originalSendMessage,
    handleInputChange,
    messagesEndRef,
    messagesContainerRef,
    setInputMessage,
    removeMessages,
    flagMessage: originalFlagMessage,
    draftCoaching,
    setDraftCoaching,
    isPreApprovedRewrite,
    setIsPreApprovedRewrite,
    originalRewrite,
    setOriginalRewrite,
    threads,
    threadMessages,
    selectedThreadId,
    setSelectedThreadId,
    getThreadMessages,
    addToThread,
    socket,
    loadOlderMessages,
    isLoadingOlder,
    hasMoreMessages,
    searchMessages,
    searchQuery,
    searchResults,
    searchTotal,
    isSearching,
    searchMode,
    toggleSearchMode,
    exitSearchMode,
    jumpToMessage,
    highlightedMessageId,
    isInitialLoad,
  } = useChatContext();

  // Determine which messages to display: thread messages if thread selected, otherwise all messages
  const displayMessages = React.useMemo(() => {
    if (selectedThreadId && threadMessages[selectedThreadId]) {
      return threadMessages[selectedThreadId];
    }
    return messages;
  }, [selectedThreadId, threadMessages, messages]);

  // Local state
  const [showThreadsPanel, setShowThreadsPanel] = React.useState(false);
  const [flaggingMessage, setFlaggingMessage] = React.useState(null);
  const [flagReason, setFlagReason] = React.useState('');
  const [feedbackGiven, setFeedbackGiven] = React.useState(new Set());
  const [pendingOriginalMessageToRemove, setPendingOriginalMessageToRemove] = React.useState(null);

  // Detect mobile vs desktop for search header display
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return true;
  });

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track which interventions we've already tracked
  const trackedInterventionsRef = React.useRef(new Set());

  // Track AI interventions
  React.useEffect(() => {
    messages.forEach(msg => {
      if (
        msg.type === 'ai_intervention' &&
        msg.id &&
        !trackedInterventionsRef.current.has(msg.id)
      ) {
        trackedInterventionsRef.current.add(msg.id);
        trackAIIntervention(
          msg.interventionType || 'general',
          msg.confidence || 'medium',
          msg.riskLevel || 'medium'
        );
      }
    });
  }, [messages]);

  // Threads are now automatically loaded by useChatSocket when roomId is available
  // No need to manually load threads here - useChatSocket handles it

  // Listen for rewrite-sent event to clean up pending messages
  React.useEffect(() => {
    const handleRewriteSent = () => {
      removeMessages(m => {
        if (m.type === 'pending_original' || m.type === 'ai_intervention') {
          return true;
        }
        return false;
      });
      setPendingOriginalMessageToRemove(null);
    };

    window.addEventListener('rewrite-sent', handleRewriteSent);
    return () => window.removeEventListener('rewrite-sent', handleRewriteSent);
  }, [removeMessages]);

  // Wrapped sendMessage with analytics
  const sendMessage = React.useCallback(
    e => {
      const clean = inputMessage.trim();
      if (clean) {
        trackMessageSent(clean.length, isPreApprovedRewrite);
        window.dispatchEvent(new CustomEvent('rewrite-sent', { detail: { isNewMessage: true } }));
      }
      originalSendMessage(e);
    },
    [inputMessage, isPreApprovedRewrite, originalSendMessage]
  );

  // Wrapped flagMessage with analytics
  const flagMessage = React.useCallback(
    (messageId, reason = 'user_flagged') => {
      trackMessageFlagged(reason);
      originalFlagMessage(messageId);
    },
    [originalFlagMessage]
  );

  // Handle intervention feedback
  const sendInterventionFeedback = React.useCallback(
    (interventionId, helpful) => {
      if (!socket || !socket.connected) {
        console.warn('Cannot send feedback: socket not connected');
        return;
      }
      socket.emit('intervention_feedback', {
        interventionId,
        helpful,
        reason: null,
      });
      setFeedbackGiven(prev => new Set([...prev, interventionId]));
    },
    [socket]
  );

  // Destructure invite state for child components
  // Safety check: inviteState should always be provided, but handle undefined gracefully
  if (!inviteState) {
    console.error(
      'ChatView: inviteState is undefined. Make sure to use ChatViewLegacy wrapper or pass inviteState prop.'
    );
    return null;
  }

  const {
    inviteLink,
    inviteCode,
    inviteCopied,
    inviteError,
    isLoadingInvite,
    hasCoParentConnected,
    hasPendingInvitation,
    hasAcceptedInvitation,
    showManualInvite,
    manualInviteCode,
    pendingInviteCode,
    isAcceptingInvite,
  } = inviteState;

  // Safety check: inviteHandlers should always be provided
  if (!inviteHandlers) {
    console.error(
      'ChatView: inviteHandlers is undefined. Make sure to use ChatViewLegacy wrapper or pass inviteHandlers prop.'
    );
    return null;
  }

  const {
    setInviteLink,
    setInviteCode,
    setInviteCopied,
    setInviteError,
    setShowManualInvite,
    setManualInviteCode,
    setPendingInviteCode,
    handleLoadInvite,
    handleCopyInvite,
    handleManualAcceptInvite,
  } = inviteHandlers;

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <ChatHeader
        searchQuery={searchQuery}
        searchMode={searchMode}
        searchMessages={searchMessages}
        toggleSearchMode={toggleSearchMode}
        exitSearchMode={exitSearchMode}
        messages={messages}
        username={username}
        threads={threads}
        showThreadsPanel={showThreadsPanel}
        setShowThreadsPanel={setShowThreadsPanel}
        isAuthenticated={isAuthenticated}
        inviteLink={inviteLink}
        hasCoParentConnected={hasCoParentConnected}
        hasPendingInvitation={hasPendingInvitation}
        hasAcceptedInvitation={hasAcceptedInvitation}
        isLoadingInvite={isLoadingInvite}
        handleLoadInvite={handleLoadInvite}
      />

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
        <div className="flex-1 flex flex-col min-h-0">
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

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
                hideHeader={!isMobile}
              />
            )}

            {/* Messages Container - Scrollable */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto min-h-0"
              style={{
                WebkitOverflowScrolling: 'touch',
              }}
              onScroll={e => {
                // Load older messages when scrolled near top
                if (e.target.scrollTop < 100 && hasMoreMessages && !isLoadingOlder) {
                  loadOlderMessages();
                }
              }}
            >
              <MessagesContainer
                messages={displayMessages}
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
                selectedThreadId={selectedThreadId}
                setSelectedThreadId={setSelectedThreadId}
                draftCoaching={draftCoaching}
                inputMessage={inputMessage}
                setInputMessage={setInputMessage}
                setIsPreApprovedRewrite={setIsPreApprovedRewrite}
                setOriginalRewrite={setOriginalRewrite}
                setDraftCoaching={setDraftCoaching}
                socket={socket}
              />
            </div>

            {/* Input Section - Fixed at bottom */}
            <div className="flex-shrink-0">
              <MessageInput
                inputMessage={inputMessage}
                handleInputChange={handleInputChange}
                sendMessage={sendMessage}
                hasCoachingWarning={
                  draftCoaching && draftCoaching.observerData && !draftCoaching.shouldSend
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Flagging Modal */}
      <FlaggingModal
        flaggingMessage={flaggingMessage}
        flagReason={flagReason}
        setFlagReason={setFlagReason}
        onFlag={reason => {
          flagMessage(flaggingMessage.id || flaggingMessage.timestamp, reason);
          setFlaggingMessage(null);
          setFlagReason('');
        }}
        onClose={() => {
          setFlaggingMessage(null);
          setFlagReason('');
        }}
      />
    </div>
  );
}

/**
 * Legacy prop adapter for backwards compatibility
 *
 * This wrapper converts the old individual props format to the new grouped format.
 * Use ChatView directly with grouped props for new code.
 */
export function ChatViewLegacy({
  username,
  isAuthenticated,
  currentView,
  onNewMessage,
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
  hasCoParentConnected,
  hasPendingInvitation,
  hasAcceptedInvitation,
  showManualInvite,
  setShowManualInvite,
  manualInviteCode,
  setManualInviteCode,
  pendingInviteCode,
  setPendingInviteCode,
  isAcceptingInvite,
  handleManualAcceptInvite,
}) {
  // Group invite state
  const inviteState = {
    inviteLink,
    inviteCode,
    inviteCopied,
    inviteError,
    isLoadingInvite,
    hasCoParentConnected,
    hasPendingInvitation,
    hasAcceptedInvitation,
    showManualInvite,
    manualInviteCode,
    pendingInviteCode,
    isAcceptingInvite,
  };

  // Group invite handlers
  const inviteHandlers = {
    setInviteLink,
    setInviteCode,
    setInviteCopied,
    setInviteError,
    setShowManualInvite,
    setManualInviteCode,
    setPendingInviteCode,
    handleLoadInvite,
    handleCopyInvite,
    handleManualAcceptInvite,
  };

  return (
    <ChatPage
      username={username}
      isAuthenticated={isAuthenticated}
      inviteState={inviteState}
      inviteHandlers={inviteHandlers}
    />
  );
}

export default ChatViewLegacy;
