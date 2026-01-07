import React from 'react';
import { ObserverCard } from '../../dashboard/components/ObserverCard.jsx';
import { MessageItem } from './MessageItem.jsx';
import { VirtualizedMessagesContainer } from './VirtualizedMessagesContainer.jsx';

// Threshold for switching to virtual scrolling (performance optimization)
// Use virtual scrolling when message count exceeds this threshold
const VIRTUAL_SCROLLING_THRESHOLD = 50;

/**
 * MessagesContainer - Renders the scrollable message list with date grouping
 *
 * Automatically switches to virtual scrolling for long message lists (50+ messages)
 * for optimal performance. Regular scrolling is used for shorter lists.
 */
function MessagesContainerComponent({
  messages,
  username,
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
  setFlaggingMessage,
  draftCoaching,
  inputMessage,
  setInputMessage,
  setIsPreApprovedRewrite,
  setOriginalRewrite,
  setDraftCoaching,
  socket: _socket, // Unused but kept for API compatibility
  room,
}) {
  // Optimized message grouping - memoized with efficient date formatting
  const messageGroups = React.useMemo(() => {
    if (!messages || messages.length === 0) return [];

    const groups = [];
    let currentGroup = null;
    let currentDate = null;
    const currentYear = new Date().getFullYear();

    // Filter out contact_suggestion messages - they only trigger modals, not chat display
    const displayMessages = messages.filter(msg => msg.type !== 'contact_suggestion');

    if (displayMessages.length === 0) return [];

    // Cache date formatter to avoid creating new formatter for each message
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const dateFormatterWithYear = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    for (let index = 0; index < displayMessages.length; index++) {
      const msg = displayMessages[index];
      const msgDate = new Date(msg.created_at || msg.timestamp || Date.now());
      // Guard against invalid dates
      const isValidDate = !isNaN(msgDate.getTime());
      const needsYear = isValidDate && msgDate.getFullYear() !== currentYear;
      const dateLabel = isValidDate
        ? needsYear
          ? dateFormatterWithYear.format(msgDate)
          : dateFormatter.format(msgDate)
        : 'Unknown Date';

      if (dateLabel !== currentDate) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = { date: dateLabel, messages: [] };
        currentDate = dateLabel;
      }
      // Include needed fields plus sender object for ownership detection
      currentGroup.messages.push({
        id: msg.id,
        text: msg.text,
        // username field is deprecated (set to email for backward compatibility)
        username: msg.username, // Keep for backward compatibility, but prefer sender.email
        timestamp: msg.timestamp || msg.created_at,
        type: msg.type,
        originalIndex: index,
        // Include sender object for UUID-based ownership and display name
        sender: msg.sender,
        sender_id: msg.sender_id,
        user_id: msg.user_id,
        // Include other needed fields
        ...(msg.intervention_id && { intervention_id: msg.intervention_id }),
        ...(msg.isOptimistic && { isOptimistic: msg.isOptimistic }),
        ...(msg.status && { status: msg.status }),
        ...(msg.isAI && { isAI: msg.isAI }),
      });
    }

    if (currentGroup) groups.push(currentGroup);
    return groups;
  }, [messages]);

  // Throttle scroll handler to prevent excessive calls
  const scrollThrottleRef = React.useRef(null);
  const handleScroll = React.useCallback(
    e => {
      // Throttle scroll events to prevent performance issues
      if (scrollThrottleRef.current) return;

      scrollThrottleRef.current = requestAnimationFrame(() => {
        scrollThrottleRef.current = null;
        if (e.target.scrollTop < 100 && hasMoreMessages && !isLoadingOlder) {
          loadOlderMessages();
        }
      });
    },
    [hasMoreMessages, isLoadingOlder, loadOlderMessages]
  );

  // Scroll to bottom when a message is blocked/intervened
  React.useEffect(() => {
    if (
      draftCoaching &&
      draftCoaching.observerData &&
      !draftCoaching.shouldSend &&
      !draftCoaching.analyzing &&
      messagesEndRef.current
    ) {
      // Use setTimeout to ensure DOM has updated with the blocked message and ObserverCard
      const timeoutId = setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
          });
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [draftCoaching, messagesEndRef]);

  // Responsive padding calculation
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return true; // Default to mobile for SSR
  });

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use virtual scrolling for long message lists (better performance)
  const shouldUseVirtualization = messages && messages.length > VIRTUAL_SCROLLING_THRESHOLD;

  // If message count exceeds threshold, use virtualized container
  if (shouldUseVirtualization) {
    return (
      <VirtualizedMessagesContainer
        messages={messages}
        username={username}
        userId={userId}
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
        setFlaggingMessage={setFlaggingMessage}
        draftCoaching={draftCoaching}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        setIsPreApprovedRewrite={setIsPreApprovedRewrite}
        setOriginalRewrite={setOriginalRewrite}
        setDraftCoaching={setDraftCoaching}
        socket={_socket}
        room={room}
      />
    );
  }

  // Regular scrolling for shorter lists (simpler, no virtualization overhead)
  return (
    <div
      ref={messagesContainerRef}
      className="pt-2 space-y-1 bg-linear-to-b from-white to-gray-50"
      style={{
        fontFamily: "'Inter', sans-serif",
        opacity: isInitialLoad ? 0 : 1,
        transition: 'opacity 0.15s ease-out',
        WebkitOverflowScrolling: 'touch',
        // Horizontal padding - responsive: match input bar padding
        paddingLeft: 'clamp(1rem, 4vw, 2rem)',
        paddingRight: 'clamp(1rem, 4vw, 2rem)',
        // Add padding at bottom to ensure messages are visible above input bar
        // On mobile: account for input bar (~3rem) + gap (0.5rem) + nav (2.5rem) + safe area
        // On desktop: account for input bar only (~3rem + 0.5rem gap)
        paddingBottom: isMobile
          ? 'calc(3rem + 0.5rem + 2.5rem + env(safe-area-inset-bottom))'
          : 'calc(3rem + 0.5rem)',
        // Ensure no horizontal overflow
        overflowX: 'hidden',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
      onScroll={handleScroll}
    >
      {/* Thread Header - Show when viewing a thread */}

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

      {messageGroups.map((group, groupIndex) => (
        <div key={groupIndex}>
          {/* Date separator */}
          <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-medium text-gray-700 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full">
              {group.date}
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Messages in this date group */}
          {group.messages.map((msg, msgIndex) => {
            // Skip if message is pending removal
            if (pendingOriginalMessageToRemove === msg.id) return null;

            // UUID-based ownership detection (primary method)
            // Messages should have sender.uuid or sender_id from the server
            const messageUserId =
              msg.sender?.uuid || msg.sender?.id || msg.sender_id || msg.user_id;

            // Compare UUIDs/IDs (convert to string for safe comparison)
            const isOwn = userId && messageUserId && String(userId) === String(messageUserId);

            // Get display name - prefer first_name, fallback to email
            // username field is deprecated (set to email for backward compatibility)
            const senderDisplayName = msg.sender?.first_name || msg.sender?.email || 'Unknown';

            // DEBUG: Log first few messages to diagnose ownership issue
            if (msgIndex < 3) {
              console.log('[MessagesContainer] Message ownership check:', {
                messageId: msg.id,
                messageText: msg.text?.substring(0, 30),
                messageUserId,
                currentUserId: userId,
                senderObject: msg.sender,
                senderDisplayName,
                isOwn,
                comparison: `${userId} === ${messageUserId}`,
              });
            }

            const isAI = msg.isAI || msg.sender?.email === 'LiaiZen';
            const isHighlighted = highlightedMessageId === msg.id;
            const isSending = msg.isOptimistic || msg.status === 'sending';

            // Use memoized MessageItem component - only re-renders when this specific message changes
            return (
              <MessageItem
                key={msg.id || msgIndex}
                message={msg}
                isOwn={isOwn}
                senderDisplayName={senderDisplayName}
                isAI={isAI}
                isHighlighted={isHighlighted}
                isSending={isSending}
                userId={userId}
                feedbackGiven={feedbackGiven}
                sendInterventionFeedback={sendInterventionFeedback}
                onFlag={setFlaggingMessage}
              />
            );
          })}
        </div>
      ))}

      {/* Observer Card - Inline in messages when intervention occurs */}
      {draftCoaching && draftCoaching.observerData && !draftCoaching.shouldSend && (
        <div className="mb-1 relative z-10" style={{ pointerEvents: 'auto' }}>
          <ObserverCard
            observerData={draftCoaching.observerData}
            originalText={draftCoaching.originalText || inputMessage}
            onUseRewrite={rewrite => {
              setInputMessage(rewrite);
              setIsPreApprovedRewrite(true);
              setOriginalRewrite(rewrite);
              setDraftCoaching(null);
            }}
            onEditMyself={() => {
              setDraftCoaching(null);
            }}
          />
        </div>
      )}

      {/* Loading state when analyzing */}
      {draftCoaching && draftCoaching.analyzing && (
        <div className="mb-1">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-teal-medium" />
            <span>Analyzing message...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

// Memoize MessagesContainer to prevent re-renders when parent updates but props haven't changed
export const MessagesContainer = React.memo(MessagesContainerComponent);

export default MessagesContainer;
