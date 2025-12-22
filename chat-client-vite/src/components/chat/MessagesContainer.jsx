import React from 'react';
import { ObserverCard } from '../ObserverCard.jsx';

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
  draftCoaching,
  inputMessage,
  setInputMessage,
  setIsPreApprovedRewrite,
  setOriginalRewrite,
  setDraftCoaching,
  socket,
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

  return (
    <div
      ref={messagesContainerRef}
      className="px-3 sm:px-4 md:px-6 pt-3 pb-3 space-y-2 bg-linear-to-b from-white to-gray-50"
      style={{
        fontFamily: "'Inter', sans-serif",
        opacity: isInitialLoad ? 0 : 1,
        transition: 'opacity 0.15s ease-out',
        WebkitOverflowScrolling: 'touch',
      }}
      onScroll={handleScroll}
    >
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
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-medium text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
              {group.date}
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Messages in this date group */}
          {group.messages.map((msg, msgIndex) => {
            const isOwn = msg.username?.toLowerCase() === username?.toLowerCase();
            const isAI = msg.isAI || msg.username === 'LiaiZen';
            const isHighlighted = highlightedMessageId === msg.id;
            const isSending = msg.isOptimistic || msg.status === 'sending';

            if (pendingOriginalMessageToRemove === msg.id) return null;

            return (
              <div
                key={msg.id || msgIndex}
                id={`message-${msg.id}`}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 ${
                  isHighlighted ? 'animate-pulse bg-yellow-100 rounded-lg p-2 -mx-2' : ''
                }`}
              >
                <div className={`max-w-[85%] sm:max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                  {/* Message bubble */}
                  <div
                    className={`px-4 py-2.5 rounded-2xl ${
                      isAI
                        ? 'bg-purple-50 border border-purple-200 text-purple-900'
                        : isOwn
                          ? isSending
                            ? 'bg-teal-500 text-white' // Slightly lighter while sending
                            : 'bg-teal-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
                      {msg.text || msg.message}
                    </p>
                    <div
                      className={`text-xs mt-1 flex items-center gap-1 ${isOwn ? 'text-teal-200' : 'text-gray-400'}`}
                    >
                      {new Date(msg.created_at || msg.timestamp).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
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
                  </div>

                  {/* Intervention feedback buttons */}
                  {msg.intervention_id && !feedbackGiven.has(msg.intervention_id) && (
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

      {/* Blocked Message - Show the original message that was blocked */}
      {draftCoaching &&
        draftCoaching.observerData &&
        !draftCoaching.shouldSend &&
        draftCoaching.originalText && (
          <div className="flex justify-end mb-2">
            <div className="max-w-[85%] sm:max-w-[75%]">
              {/* Blocked message bubble */}
              <div className="px-4 py-2.5 rounded-2xl bg-gray-100 border-2 border-orange-300 text-gray-600 relative">
                <div className="absolute -top-2 left-4 px-2 py-0.5 bg-orange-100 border border-orange-300 rounded text-xs font-medium text-orange-700">
                  Not sent
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word mt-2">
                  {draftCoaching.originalText}
                </p>
                <div className="text-xs mt-1 text-gray-400">
                  {new Date().toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Observer Card - Inline in messages when intervention occurs */}
      {draftCoaching && draftCoaching.observerData && !draftCoaching.shouldSend && (
        <div className="mb-2">
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
        <div className="mb-2">
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
