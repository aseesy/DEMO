import React from 'react';
import { ObserverCard } from '../../dashboard/components/ObserverCard.jsx';
import { getCategoryConfig } from '../../../config/threadCategories.js';

/**
 * MessagesContainer - Renders the scrollable message list with date grouping
 */
export function MessagesContainer({
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
  setFlaggingMessage,
  addToThread,
  threads,
  selectedThreadId,
  setSelectedThreadId,
  draftCoaching,
  inputMessage,
  setInputMessage,
  setIsPreApprovedRewrite,
  setOriginalRewrite,
  setDraftCoaching,
  socket: _socket, // Unused but kept for API compatibility
}) {
  const messageGroups = React.useMemo(() => {
    const groups = [];
    let currentGroup = null;
    let currentDate = null;

    // Filter out contact_suggestion messages - they only trigger modals, not chat display
    const displayMessages = messages.filter(msg => msg.type !== 'contact_suggestion');

    displayMessages.forEach((msg, index) => {
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

  const handleScroll = e => {
    if (e.target.scrollTop < 100 && hasMoreMessages && !isLoadingOlder) {
      loadOlderMessages();
    }
  };

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

  // Find the selected thread to show its title
  const selectedThread = selectedThreadId ? threads.find(t => t.id === selectedThreadId) : null;

  return (
    <div
      ref={messagesContainerRef}
      className="pt-2 space-y-1 bg-linear-to-b from-white to-gray-50"
      style={{
        fontFamily: "'Inter', sans-serif",
        opacity: isInitialLoad ? 0 : 1,
        transition: 'opacity 0.15s ease-out',
        WebkitOverflowScrolling: 'touch',
        // Horizontal padding - use rem for consistency
        paddingLeft: '0.5rem',
        paddingRight: '0.5rem',
        // Add padding at bottom to ensure messages are visible above input bar
        // Account for: input bar (~5rem) + safe area
        paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))',
        // Ensure no horizontal overflow
        overflowX: 'hidden',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
      onScroll={handleScroll}
    >
      {/* Thread Header - Show when viewing a thread */}
      {selectedThread && (
        <div
          className="sticky top-0 z-10 bg-white border-b-2 border-teal-light mb-2 py-3 flex items-center justify-between"
          style={{
            marginLeft: '-0.5rem',
            marginRight: '-0.5rem',
            paddingLeft: '0.5rem',
            paddingRight: '0.5rem',
          }}
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-teal-medium"
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
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-sm text-teal-dark">{selectedThread.title}</h3>
                {selectedThread.category &&
                  (() => {
                    const config = getCategoryConfig(selectedThread.category);
                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                      >
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </span>
                    );
                  })()}
              </div>
              <p className="text-xs text-gray-500">
                {selectedThread.message_count || 0} message
                {selectedThread.message_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              // Clear thread selection to return to all messages
              if (setSelectedThreadId) {
                setSelectedThreadId(null);
              }
            }}
            className="text-sm text-teal-medium hover:text-teal-dark font-medium px-3 py-1.5 rounded-lg hover:bg-teal-lightest transition-colors flex items-center gap-1"
            title="View all messages"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">All Messages</span>
          </button>
        </div>
      )}

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
            // Use new sender structure (sender.email) with fallback to legacy fields
            const messageEmail = msg.sender?.email || msg.user_email || msg.email || msg.username;
            const isOwn =
              messageEmail && username && messageEmail.toLowerCase() === username.toLowerCase();

            // DEBUG: Log first few messages to diagnose ownership issue
            if (msgIndex < 3) {
              console.log('[MessagesContainer] Message ownership check:', {
                messageId: msg.id,
                messageText: msg.text?.substring(0, 30),
                messageEmail,
                username,
                senderObject: msg.sender,
                user_email: msg.user_email,
                email: msg.email,
                username_field: msg.username,
                isOwn,
                comparison: messageEmail?.toLowerCase() === username?.toLowerCase(),
              });
            }

            const isAI = msg.isAI || msg.sender?.email === 'LiaiZen' || msg.username === 'LiaiZen';
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

export default MessagesContainer;
