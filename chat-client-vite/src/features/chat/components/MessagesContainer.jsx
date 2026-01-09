import React from 'react';
import { ObserverCard } from '../../dashboard/components/ObserverCard.jsx';
import { MessageItem } from './MessageItem.jsx';
import { VirtualizedMessagesContainer } from './VirtualizedMessagesContainer.jsx';
import { createLogger } from '../../../utils/logger.js';
import {
  groupMessagesByDate,
  detectMessageOwnership,
  isAIMessage,
  createDateFormatterCache,
} from '../../../utils/messageDisplayUtils.js';

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
  // Create date formatter cache once (reused across renders)
  const dateFormatterCache = React.useMemo(() => createDateFormatterCache(), []);

  // Optimized message grouping - memoized with efficient date formatting
  const messageGroups = React.useMemo(() => {
    if (!messages || messages.length === 0) return [];

    // Use utility function for date grouping
    const groups = groupMessagesByDate(messages, dateFormatterCache);

    // Add originalIndex and preserve all message fields
    return groups.map(group => ({
      ...group,
      messages: group.messages.map((msg, index) => ({
        ...msg,
        originalIndex: index,
      })),
    }));
  }, [messages, dateFormatterCache]);

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

            // Use utility function for ownership detection
            const { isOwn, messageUserId, senderDisplayName } = detectMessageOwnership(msg, userId);

            // DEBUG: Log only on initial mount to diagnose ownership issues (dev only)
            // Set localStorage.debugOwnership=true to enable continuous logging
            if (
              import.meta.env.DEV &&
              typeof window !== 'undefined' &&
              window.localStorage?.getItem('debugOwnership') === 'true' &&
              msgIndex < 3
            ) {
              const logger = createLogger('MessagesContainer');
              logger.debug('Message ownership check', {
                messageId: msg.id,
                messageText: msg.text?.substring(0, 30),
                messageUserId: messageUserId ? String(messageUserId) : null,
                currentUserId: userId ? String(userId) : null,
                senderDisplayName,
                isOwn,
              });
            }

            // Use utility function for AI detection
            const isAI = isAIMessage(msg);
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

      {/* Loading state when analyzing - Fixed at bottom to stay above input bar */}
      {draftCoaching && draftCoaching.analyzing && (
        <div
          className="mb-1"
          style={{
            position: 'sticky',
            bottom: 0,
            zIndex: 50, // Higher than MessageInput (z-index: 40 on mobile)
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(8px)',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            borderTop: '1px solid rgba(229, 231, 235, 0.9)',
            marginTop: '0.5rem',
            marginBottom: '0.5rem',
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div className="flex items-center gap-3 text-sm text-gray-700 max-w-3xl mx-auto">
            <div className="relative">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-teal-light border-t-teal-medium" />
              <div className="absolute inset-0 inline-block animate-ping rounded-full h-5 w-5 border border-teal-medium opacity-20" />
            </div>
            <span className="font-medium">Analyzing message...</span>
            <div className="flex gap-1 ml-1">
              <span
                className="inline-block w-1 h-1 bg-teal-medium rounded-full animate-pulse"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="inline-block w-1 h-1 bg-teal-medium rounded-full animate-pulse"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="inline-block w-1 h-1 bg-teal-medium rounded-full animate-pulse"
                style={{ animationDelay: '300ms' }}
              />
            </div>
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
