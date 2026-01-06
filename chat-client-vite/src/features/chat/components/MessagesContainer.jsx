import React from 'react';
import { ObserverCard } from '../../dashboard/components/ObserverCard.jsx';

/**
 * MessagesContainer - Renders the scrollable message list with date grouping
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
      const msgDate = new Date(msg.created_at || msg.timestamp);
      const needsYear = msgDate.getFullYear() !== currentYear;
      const dateLabel = needsYear 
        ? dateFormatterWithYear.format(msgDate)
        : dateFormatter.format(msgDate);

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
  const handleScroll = React.useCallback((e) => {
    // Throttle scroll events to prevent performance issues
    if (scrollThrottleRef.current) return;
    
    scrollThrottleRef.current = requestAnimationFrame(() => {
      scrollThrottleRef.current = null;
      if (e.target.scrollTop < 100 && hasMoreMessages && !isLoadingOlder) {
        loadOlderMessages();
      }
    });
  }, [hasMoreMessages, isLoadingOlder, loadOlderMessages]);

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
            // UUID-based ownership detection (primary method)
            // Messages should have sender.uuid or sender_id from the server
            const messageUserId = msg.sender?.uuid || msg.sender?.id || msg.sender_id || msg.user_id;

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

            if (pendingOriginalMessageToRemove === msg.id) return null;

            return (
              <div
                key={msg.id || msgIndex}
                id={`message-${msg.id}`}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 ${
                  isHighlighted ? 'animate-pulse bg-yellow-100 rounded-lg p-2 -mx-2' : ''
                }`}
              >
                <div
                  className={`${isOwn ? 'order-2' : 'order-1'}`}
                  style={{
                    maxWidth: '85%',
                    width: 'fit-content',
                  }}
                >
                  {/* Message bubble - only text inside */}
                  <div
                    className={`px-3 py-2 rounded-2xl ${
                      isAI
                        ? 'bg-teal-lightest border border-teal-light text-teal-dark'
                        : isOwn
                          ? isSending
                            ? 'bg-teal-500 text-white' // Slightly lighter while sending
                            : 'bg-teal-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p
                      className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap break-words"
                      style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%',
                      }}
                    >
                      {msg.text || msg.message}
                    </p>
                  </div>

                  {/* Timestamp and indicators - outside bubble */}
                  <div
                    className={`text-xs mt-0.5 flex items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'} ${
                      isOwn ? 'text-gray-600' : 'text-gray-600'
                    }`}
                  >
                    {new Date(msg.created_at || msg.timestamp).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {/* Flag icon - only show for messages from other users (not your own, not AI) */}
                    {!isOwn && !isAI && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setFlaggingMessage(msg);
                        }}
                        className="ml-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Flag this message as offensive or inappropriate"
                        aria-label="Flag message"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                          />
                        </svg>
                      </button>
                    )}
                    {/* Show sending/sent indicator for own messages */}
                    {isOwn && isSending && (
                      <span className="ml-1" title="Sending...">
                        ○
                      </span>
                    )}
                    {isOwn && !isSending && !isAI && (
                      <span className="ml-1" title="Sent">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Intervention feedback buttons */}
                  {msg.intervention_id && !feedbackGiven.has(msg.intervention_id) && (
                    <div className="flex gap-2 mt-1 justify-end">
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
                    <div className="flex gap-2 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setFlaggingMessage(msg)}
                        className="text-xs text-gray-400 hover:text-red-500"
                        title="Flag message"
                      >
                        🚩
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
