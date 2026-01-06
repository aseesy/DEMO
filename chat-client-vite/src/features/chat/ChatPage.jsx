/**
 * ChatPage - Main chat interface with messages and input
 *
 * Consumes chat state from ChatContext. Socket connection persists across view changes.
 * Refactored to use grouped props for invite state management.
 */

import React from 'react';
import { MessageSearch } from './components/MessageSearch.jsx';
import { FlaggingModal } from './components/FlaggingModal.jsx';
import {
  ManualInvitePanel,
  InviteErrorPanel,
  InviteLinkPanel,
  MessagesContainer,
  ChatHeader,
  MessageInput,
  TopicsPanel,
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
 * @param {string} props.username - Current user's email (deprecated name, kept for backward compatibility)
 * @param {number} props.userId - Current user's numeric ID
 * @param {boolean} props.isAuthenticated - Whether user is authenticated
 * @param {Object} props.inviteState - Grouped invite state
 * @param {Object} props.inviteHandlers - Grouped invite handlers
 */
function ChatPageComponent({ username, userId, isAuthenticated, inviteState, inviteHandlers }) {
  // username prop is actually the user's email (for backward compatibility)
  const userEmail = username;

  // DEBUG: Log userEmail and userId props to diagnose ownership issue (development only)
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[ChatPage] Auth props:', {
        userEmail,
        userId,
        isEmail: userEmail?.includes('@'),
      });
    }
  }, [userEmail, userId]);

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
    setOriginalRewrite,
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
    exitSearchMode,
    jumpToMessage,
    highlightedMessageId,
    isInitialLoad,
    room,
  } = useChatContext();

  // Local state
  const [showTopicsPanel, setShowTopicsPanel] = React.useState(false);
  const [flaggingMessage, setFlaggingMessage] = React.useState(null);
  const [flagReason, setFlagReason] = React.useState('');
  const [feedbackGiven, setFeedbackGiven] = React.useState(new Set());
  const [pendingOriginalMessageToRemove, setPendingOriginalMessageToRemove] = React.useState(null);

  // Handle intervention feedback - defined early so it can be used in messagesContainerProps
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

  // Memoize props passed to MessagesContainer to ensure memoization works effectively
  // This prevents MessagesContainer from re-rendering when props haven't actually changed
  const messagesContainerProps = React.useMemo(
    () => ({
      messages,
      username: userEmail,
      userId,
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
      draftCoaching,
      inputMessage,
      setInputMessage,
      setIsPreApprovedRewrite,
      setOriginalRewrite,
      setDraftCoaching,
      socket,
      room,
    }),
    [
      messages,
      userEmail,
      userId,
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
      draftCoaching,
      inputMessage,
      setInputMessage,
      setIsPreApprovedRewrite,
      setOriginalRewrite,
      setDraftCoaching,
      socket,
      room,
    ]
  );

  // MessagesContainer is already memoized, so we can use it directly
  // The memoized props ensure it only re-renders when props actually change

  // Detect mobile vs desktop for search header display
  const [_isMobile, setIsMobile] = React.useState(() => {
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
    <div
      className="flex flex-col relative overflow-hidden"
      style={{
        height: '100%',
        maxHeight: '100%',
        width: '100%',
        maxWidth: '100vw',
      }}
    >
      <ChatHeader
        showTopicsPanel={showTopicsPanel}
        setShowTopicsPanel={setShowTopicsPanel}
        isAuthenticated={isAuthenticated}
        inviteLink={inviteLink}
        hasCoParentConnected={hasCoParentConnected}
        hasPendingInvitation={hasPendingInvitation}
        hasAcceptedInvitation={hasAcceptedInvitation}
        isLoadingInvite={isLoadingInvite}
        handleLoadInvite={handleLoadInvite}
      />

      {/* Chat Content */}
      <div className="flex flex-1 min-h-0 min-w-0" style={{ width: '100%', maxWidth: '100%' }}>
        {/* Topics Panel - AI Summaries */}
        {showTopicsPanel && (
          <TopicsPanel
            roomId={room?.roomId}
            onClose={() => setShowTopicsPanel(false)}
            onJumpToMessage={jumpToMessage}
            socket={socket}
            currentUserEmail={userEmail}
          />
        )}

        {/* Main Chat Area */}
        <div
          className="flex-1 flex flex-col min-h-0 min-w-0"
          style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}
        >
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

          <div
            className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden"
            style={{
              // On mobile, account for bottom nav height so content doesn't get cut off
              paddingBottom:
                typeof window !== 'undefined' && window.innerWidth < 768
                  ? 'calc(3.5rem + env(safe-area-inset-bottom))'
                  : 0,
              width: '100%',
              maxWidth: '100%',
              overflowX: 'hidden',
            }}
          >
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
                hideHeader={true}
              />
            )}

            {/* Messages Container - Scrollable */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto min-h-0"
              style={{
                WebkitOverflowScrolling: 'touch',
                // Ensure it can scroll properly
                overscrollBehavior: 'contain',
                // Prevent horizontal overflow
                overflowX: 'hidden',
                width: '100%',
                maxWidth: '100%',
              }}
              onScroll={e => {
                // Load older messages when scrolled near top
                if (e.target.scrollTop < 100 && hasMoreMessages && !isLoadingOlder) {
                  loadOlderMessages();
                }
              }}
            >
              <MessagesContainer {...messagesContainerProps} />
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
  userId,
  isAuthenticated,
  _currentView,
  _onNewMessage,
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
    <ChatPageComponent
      username={username}
      userId={userId}
      isAuthenticated={isAuthenticated}
      inviteState={inviteState}
      inviteHandlers={inviteHandlers}
    />
  );
}

// Memoize ChatPage to prevent re-renders when context updates but props haven't changed
export const ChatPage = React.memo(ChatPageComponent);

export default ChatViewLegacy;
