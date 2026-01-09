import React from 'react';

/**
 * MessageItem - Individual message component
 *
 * Memoized to prevent re-renders when other messages update.
 * Only re-renders when this specific message changes.
 */
function MessageItemComponent({
  message,
  isOwn,
  _senderDisplayName,
  isAI,
  isHighlighted,
  isSending,
  _userId,
  feedbackGiven,
  sendInterventionFeedback,
  onFlag,
}) {
  return (
    <div
      id={`message-${message.id}`}
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
        {/* LiaiZen label for AI messages */}
        {isAI && (
          <div className="flex items-center gap-1.5 mb-1">
            <img src="/assets/Logo.svg" alt="" className="h-4 w-4" />
            <span className="text-xs font-medium text-teal-700">LiaiZen</span>
          </div>
        )}
        {/* Message bubble - only text inside */}
        <div
          className={`px-3 py-2 rounded-2xl ${
            isAI
              ? 'bg-teal-50 border border-teal-200 text-teal-800'
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
            {message.text || message.message}
          </p>
        </div>

        {/* Timestamp and indicators - outside bubble */}
        <div
          className={`text-xs mt-0.5 flex items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'} ${
            isOwn ? 'text-gray-600' : 'text-gray-600'
          }`}
        >
          {(() => {
            const date = new Date(message.timestamp || message.created_at || Date.now());
            return isNaN(date.getTime())
              ? ''
              : date.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                });
          })()}
          {/* Flag icon - only show for messages from other users (not your own, not AI) */}
          {!isOwn && !isAI && (
            <button
              onClick={e => {
                e.stopPropagation();
                onFlag(message);
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
        {message.intervention_id && !feedbackGiven.has(message.intervention_id) && (
          <div className="flex gap-2 mt-1 justify-end">
            <button
              onClick={() => sendInterventionFeedback(message.intervention_id, 'helpful')}
              className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
            >
              👍 Helpful
            </button>
            <button
              onClick={() => sendInterventionFeedback(message.intervention_id, 'not_helpful')}
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
              onClick={() => onFlag(message)}
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
}

/**
 * Custom comparison function for React.memo
 * Only re-render if message properties that affect rendering actually changed
 */
function areMessagePropsEqual(prevProps, nextProps) {
  // Compare message content
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (prevProps.message.text !== nextProps.message.text) return false;
  if (prevProps.message.status !== nextProps.message.status) return false;
  if (prevProps.message.isOptimistic !== nextProps.message.isOptimistic) return false;
  if (prevProps.message.intervention_id !== nextProps.message.intervention_id) return false;

  // Compare computed props
  if (prevProps.isOwn !== nextProps.isOwn) return false;
  if (prevProps.isAI !== nextProps.isAI) return false;
  if (prevProps.isHighlighted !== nextProps.isHighlighted) return false;
  if (prevProps.isSending !== nextProps.isSending) return false;

  // Compare feedback state (only if this message has intervention)
  if (prevProps.message.intervention_id) {
    const prevHasFeedback = prevProps.feedbackGiven.has(prevProps.message.intervention_id);
    const nextHasFeedback = nextProps.feedbackGiven.has(nextProps.message.intervention_id);
    if (prevHasFeedback !== nextHasFeedback) return false;
  }

  // All relevant props are equal - skip re-render
  return true;
}

// Memoize with custom comparison for optimal performance
export const MessageItem = React.memo(MessageItemComponent, areMessagePropsEqual);

export default MessageItem;
