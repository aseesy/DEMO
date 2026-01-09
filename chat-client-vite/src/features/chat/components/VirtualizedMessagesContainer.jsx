import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import { MessageItem } from './MessageItem.jsx';
import { ObserverCard } from '../../dashboard/components/ObserverCard.jsx';
import {
  formatMessageDate,
  detectMessageOwnership,
  isAIMessage,
  createDateFormatterCache,
} from '../../../utils/messageDisplayUtils.js';

/**
 * VirtualizedMessagesContainer - Renders messages with virtual scrolling
 *
 * Uses react-virtuoso for efficient rendering of long message lists.
 * Only visible messages are rendered in the DOM, providing constant performance
 * regardless of message count.
 *
 * Features:
 * - Virtual scrolling (only visible messages rendered)
 * - Date grouping preserved
 * - Pagination support (load older messages)
 * - Scroll-to-bottom support
 * - Jump-to-message support
 */
function VirtualizedMessagesContainerComponent({
  messages,
  _username,
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
  socket: _socket,
  _room,
}) {
  // Create date formatter cache once (reused across renders)
  const dateFormatterCache = React.useMemo(() => createDateFormatterCache(), []);

  // Flatten message groups into a single list with date separators
  // Format: [{ type: 'date', date: '...' }, { type: 'message', message: {...}, groupIndex, msgIndex }, ...]
  const flattenedItems = React.useMemo(() => {
    if (!messages || messages.length === 0) return [];

    const items = [];

    // Filter out contact_suggestion messages
    const displayMessages = messages.filter(msg => msg.type !== 'contact_suggestion');
    if (displayMessages.length === 0) return [];

    let currentDate = null;

    for (let index = 0; index < displayMessages.length; index++) {
      const msg = displayMessages[index];

      // Use utility function for date formatting
      const dateLabel = formatMessageDate(
        msg.created_at || msg.timestamp || Date.now(),
        dateFormatterCache
      );

      // Add date separator if date changed
      if (dateLabel !== currentDate) {
        items.push({
          type: 'date',
          date: dateLabel,
          id: `date-${dateLabel}-${index}`,
        });
        currentDate = dateLabel;
      }

      // Add message item (preserve all fields)
      items.push({
        type: 'message',
        message: {
          ...msg,
          timestamp: msg.timestamp || msg.created_at,
        },
        id: msg.id || `msg-${index}`,
      });
    }

    return items;
  }, [messages, dateFormatterCache]);

  // Responsive padding calculation
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
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to bottom when draftCoaching appears
  React.useEffect(() => {
    if (
      draftCoaching &&
      draftCoaching.observerData &&
      !draftCoaching.shouldSend &&
      !draftCoaching.analyzing &&
      messagesEndRef.current
    ) {
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

  // Render individual item (date separator or message)
  const itemContent = React.useCallback(
    index => {
      const item = flattenedItems[index];
      if (!item) return null;

      if (item.type === 'date') {
        return (
          <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-medium text-gray-700 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full">
              {item.date}
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        );
      }

      // Message item
      const msg = item.message;
      if (pendingOriginalMessageToRemove === msg.id) return null;

      // Use utility functions for ownership detection and AI detection
      const { isOwn, senderDisplayName } = detectMessageOwnership(msg, userId);
      const isAI = isAIMessage(msg);
      const isHighlighted = highlightedMessageId === msg.id;
      const isSending = msg.isOptimistic || msg.status === 'sending';

      return (
        <MessageItem
          key={msg.id}
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
    },
    [
      flattenedItems,
      userId,
      highlightedMessageId,
      feedbackGiven,
      sendInterventionFeedback,
      setFlaggingMessage,
      pendingOriginalMessageToRemove,
    ]
  );

  // Handle start reached (scrolled to top) - load older messages
  const startReached = React.useCallback(() => {
    if (hasMoreMessages && !isLoadingOlder) {
      loadOlderMessages();
    }
  }, [hasMoreMessages, isLoadingOlder, loadOlderMessages]);

  // Get container height - account for input bar and navigation
  const containerHeight = React.useMemo(() => {
    if (typeof window === 'undefined') return '100vh';

    // Calculate available height
    // Mobile: viewport - nav (2.5rem) - input (3rem) - gap (0.5rem) - safe area
    // Desktop: viewport - input (3rem) - gap (0.5rem)
    const navHeight = isMobile ? 2.5 : 0;
    const inputHeight = 3;
    const gap = 0.5;
    const safeArea = isMobile
      ? parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            'env(safe-area-inset-bottom)'
          ) || '0'
        )
      : 0;

    return `calc(100vh - ${navHeight + inputHeight + gap}rem - ${safeArea}px)`;
  }, [isMobile]);

  return (
    <div
      className="pt-2 space-y-1 bg-linear-to-b from-white to-gray-50"
      style={{
        fontFamily: "'Inter', sans-serif",
        opacity: isInitialLoad ? 0 : 1,
        transition: 'opacity 0.15s ease-out',
        WebkitOverflowScrolling: 'touch',
        paddingLeft: 'clamp(1rem, 4vw, 2rem)',
        paddingRight: 'clamp(1rem, 4vw, 2rem)',
        paddingBottom: isMobile
          ? 'calc(3rem + 0.5rem + 2.5rem + env(safe-area-inset-bottom))'
          : 'calc(3rem + 0.5rem)',
        overflowX: 'hidden',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        height: containerHeight,
      }}
      ref={messagesContainerRef}
    >
      {/* Load older messages button (shown when not at top) */}
      {hasMoreMessages && !isLoadingOlder && (
        <div className="flex justify-center py-2 sticky top-0 bg-white z-10">
          <button
            onClick={loadOlderMessages}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium py-2 px-4 rounded-lg hover:bg-teal-50 transition-colors"
          >
            Load older messages
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {isLoadingOlder && (
        <div className="flex justify-center py-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Loading older messages...
          </div>
        </div>
      )}

      {/* Virtualized message list */}
      {flattenedItems.length > 0 ? (
        <Virtuoso
          totalCount={flattenedItems.length}
          itemContent={itemContent}
          initialTopMostItemIndex={Math.max(0, flattenedItems.length - 1)} // Start at bottom (newest messages)
          followOutput="smooth" // Auto-scroll to bottom on new messages
          startReached={startReached} // Load older messages when scrolled to top
          increaseViewportBy={200} // Render 200px outside viewport for smoother scrolling
          style={{ height: '100%', width: '100%' }}
          components={{
            Footer: () => <div ref={messagesEndRef} style={{ height: '1px' }} />, // Scroll anchor at bottom
          }}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">No messages yet</div>
      )}

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
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            borderTop: '1px solid rgba(229, 231, 235, 0.8)',
            marginTop: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          <div className="flex items-center gap-3 text-sm text-gray-600 max-w-3xl mx-auto">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-teal-medium" />
            <span>Analyzing message...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Memoize to prevent re-renders when parent updates but props haven't changed
export const VirtualizedMessagesContainer = React.memo(VirtualizedMessagesContainerComponent);

export default VirtualizedMessagesContainer;
