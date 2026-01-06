import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../../../apiClient.js';
import { getCategoryConfig, CATEGORY_DISPLAY_ORDER } from '../../../config/threadCategories.js';

/**
 * Decision item component
 */
function DecisionItem({ decision }) {
  return (
    <div className="flex items-start gap-2 text-xs bg-green-50 p-2 rounded border border-green-100">
      <span className="text-green-600 flex-shrink-0 mt-0.5">✓</span>
      <div>
        <p className="text-gray-700">{decision.text}</p>
        {decision.decidedBy && (
          <p className="text-gray-400 mt-0.5">Decided by: {decision.decidedBy}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Open item component
 */
function OpenItem({ item }) {
  const statusColors = {
    open: 'bg-amber-50 border-amber-100 text-amber-600',
    resolved: 'bg-green-50 border-green-100 text-green-600',
    superseded: 'bg-gray-50 border-gray-100 text-gray-400',
  };
  const colors = statusColors[item.status] || statusColors.open;

  return (
    <div className={`flex items-start gap-2 text-xs p-2 rounded border ${colors}`}>
      <span className="flex-shrink-0 mt-0.5">
        {item.status === 'open' ? '○' : item.status === 'resolved' ? '✓' : '—'}
      </span>
      <div>
        <p className="text-gray-700">{item.text}</p>
        {item.assignedTo && (
          <p className="text-gray-400 mt-0.5">Assigned to: {item.assignedTo}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Message item in thread detail view
 */
function MessageItem({ message, isCurrentUser }) {
  const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className={`flex gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`max-w-[80%] p-2 rounded-lg text-sm ${
          isCurrentUser
            ? 'bg-teal-medium text-white'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        <p className={`text-xs font-medium mb-1 ${isCurrentUser ? 'text-teal-lightest' : 'text-gray-500'}`}>
          {message.senderName}
        </p>
        <p>{message.text}</p>
        <p className={`text-xs mt-1 ${isCurrentUser ? 'text-teal-lightest' : 'text-gray-400'}`}>
          {time}
        </p>
      </div>
    </div>
  );
}

/**
 * Confidence indicator
 */
function ConfidenceIndicator({ score }) {
  const percentage = Math.round((parseFloat(score) || 0) * 100);
  const color = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-500';

  return (
    <span className={`text-xs ${color}`} title={`${percentage}% confidence`}>
      {percentage >= 80 ? 'High' : percentage >= 60 ? 'Medium' : 'Low'} confidence
    </span>
  );
}

/**
 * Single thread card - expandable to show full conversation
 */
function ThreadCard({ thread, isExpanded, onToggle, onLoadDetails, currentUserEmail }) {
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const config = getCategoryConfig(thread.category);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleToggle = async () => {
    if (!isExpanded && !details) {
      setLoadingDetails(true);
      try {
        const result = await onLoadDetails(thread.id);
        setDetails(result);
      } finally {
        setLoadingDetails(false);
      }
    }
    onToggle();
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header - always visible */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Expand/collapse icon */}
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        <div className="flex-1 min-w-0">
          {/* Title and date */}
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-sm text-gray-900 truncate">{thread.title}</h4>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatDate(thread.lastMessageAt || thread.firstMessageAt)}
            </span>
          </div>

          {/* Summary preview */}
          {thread.summary && !isExpanded && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {thread.summary}
            </p>
          )}

          {/* Message count */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">
              {thread.messageCount || 0} messages
            </span>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {loadingDetails ? (
            <div className="flex items-center justify-center py-6">
              <svg className="w-6 h-6 text-teal-medium animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          ) : details ? (
            <div className="p-3 space-y-3">
              {/* Summary */}
              {details.summary && (
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs font-medium text-gray-500 mb-1">Summary</p>
                  <p className="text-sm text-gray-700">{details.summary}</p>
                </div>
              )}

              {/* Decisions */}
              {details.decisions && details.decisions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Decisions Made</p>
                  <div className="space-y-1.5">
                    {details.decisions.map((decision, i) => (
                      <DecisionItem key={decision.id || i} decision={decision} />
                    ))}
                  </div>
                </div>
              )}

              {/* Open Items */}
              {details.openItems && details.openItems.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Open Items</p>
                  <div className="space-y-1.5">
                    {details.openItems.map((item, i) => (
                      <OpenItem key={item.id || i} item={item} />
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {details.messages && details.messages.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Conversation ({details.messages.length} messages)
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-white">
                    {details.messages.map((msg, i) => (
                      <MessageItem
                        key={msg.id || i}
                        message={msg}
                        isCurrentUser={msg.senderEmail === currentUserEmail}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Meta info */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <ConfidenceIndicator score={details.aiConfidence} />
              </div>
            </div>
          ) : (
            <div className="p-3 text-sm text-gray-500">
              {thread.summary || 'No additional details available.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Category section with collapsible thread list
 */
function CategorySection({ category, threads, expandedThreadId, onThreadToggle, onLoadDetails, currentUserEmail }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const config = getCategoryConfig(category);

  if (!threads || threads.length === 0) return null;

  return (
    <div className="mb-4">
      {/* Category header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`w-full flex items-center justify-between p-2 rounded-lg ${config.color} mb-2`}
      >
        <div className="flex items-center gap-2">
          <span>{config.icon}</span>
          <span className="font-medium text-sm">{config.label}</span>
          <span className="text-xs opacity-75">({threads.length})</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Threads list */}
      {!isCollapsed && (
        <div className="space-y-2 pl-2">
          {threads.map(thread => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              isExpanded={expandedThreadId === thread.id}
              onToggle={() => onThreadToggle(thread.id)}
              onLoadDetails={onLoadDetails}
              currentUserEmail={currentUserEmail}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * TopicsPanel - Displays AI-summarized conversation threads grouped by category
 */
export function TopicsPanel({
  roomId,
  onClose,
  onJumpToMessage,
  socket,
  currentUserEmail
}) {
  const [threadsByCategory, setThreadsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedThreadId, setExpandedThreadId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch threads on mount
  const fetchThreads = useCallback(async () => {
    if (!roomId) {
      console.log('[TopicsPanel] No roomId available yet');
      setLoading(false);
      return;
    }

    console.log('[TopicsPanel] Fetching threads for room:', roomId);
    setLoading(true);
    setError(null);

    try {
      const response = await apiGet(`/api/rooms/${roomId}/threads`);
      console.log('[TopicsPanel] API response:', response);
      if (response.success) {
        setThreadsByCategory(response.threads || {});
        setTotalCount(response.totalCount || 0);
      } else {
        setError(response.error || 'Failed to load threads');
      }
    } catch (err) {
      console.error('[TopicsPanel] Error fetching threads:', err);
      setError('Failed to load threads');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !roomId) return;

    // Handle threads updated
    const handleThreadsUpdated = (data) => {
      if (data.roomId === roomId) {
        console.log('[TopicsPanel] Threads updated, refreshing...', data);
        fetchThreads();
      }
    };

    socket.on('threads_updated', handleThreadsUpdated);

    return () => {
      socket.off('threads_updated', handleThreadsUpdated);
    };
  }, [socket, roomId, fetchThreads]);

  // Load thread details
  const loadThreadDetails = async (threadId) => {
    try {
      const response = await apiGet(`/api/threads/${threadId}`);
      if (response.success) {
        return response.thread;
      }
    } catch (err) {
      console.error('[TopicsPanel] Error loading thread details:', err);
    }
    return null;
  };

  // Trigger thread processing
  const handleProcess = async () => {
    if (!roomId) {
      console.warn('[TopicsPanel] Cannot process threads: roomId not available');
      return;
    }
    setIsProcessing(true);
    try {
      const response = await apiPost(`/api/rooms/${roomId}/threads/process`, {});
      if (response.success) {
        console.log('[TopicsPanel] Processing result:', response);
        await fetchThreads();
      }
    } catch (err) {
      console.error('[TopicsPanel] Processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle thread expansion
  const handleThreadToggle = (threadId) => {
    setExpandedThreadId(expandedThreadId === threadId ? null : threadId);
  };

  // Get categories in display order that have threads
  const categoriesWithThreads = CATEGORY_DISPLAY_ORDER.filter(
    cat => threadsByCategory[cat] && threadsByCategory[cat].length > 0
  );

  return (
    <div className="w-80 border-r-2 border-teal-light bg-gray-50 flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-4 border-b-2 border-teal-light bg-teal-lightest">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-base text-teal-dark flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Summaries
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-teal-medium p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Process button */}
        <button
          type="button"
          onClick={handleProcess}
          disabled={isProcessing || loading || !roomId}
          className="w-full px-3 py-2 text-sm bg-teal-medium text-white rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Analyze Conversations</span>
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <svg className="w-8 h-8 text-teal-medium animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              type="button"
              onClick={fetchThreads}
              className="mt-2 text-sm text-teal-medium hover:underline"
            >
              Try again
            </button>
          </div>
        ) : categoriesWithThreads.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-gray-500 text-sm">No conversations analyzed yet.</p>
            <p className="text-gray-400 text-xs mt-1">Click &quot;Analyze Conversations&quot; to group and summarize your messages.</p>
          </div>
        ) : (
          categoriesWithThreads.map(category => (
            <CategorySection
              key={category}
              category={category}
              threads={threadsByCategory[category]}
              expandedThreadId={expandedThreadId}
              onThreadToggle={handleThreadToggle}
              onLoadDetails={loadThreadDetails}
              currentUserEmail={currentUserEmail}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-white text-xs text-gray-500 text-center">
        {totalCount} conversation{totalCount !== 1 ? 's' : ''} analyzed
      </div>
    </div>
  );
}

export default TopicsPanel;
