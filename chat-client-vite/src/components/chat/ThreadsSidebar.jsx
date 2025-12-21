import React from 'react';

/**
 * ThreadsSidebar - Displays conversation threads in a collapsible sidebar
 */
export function ThreadsSidebar({
  threads,
  selectedThreadId,
  setSelectedThreadId,
  setShowThreadsPanel,
  getThreadMessages,
}) {
  return (
    <div className="w-72 border-r-2 border-teal-light bg-white flex flex-col shadow-lg">
      <div className="p-4 border-b-2 border-teal-light flex items-center justify-between bg-teal-lightest">
        <h3 className="font-semibold text-base text-teal-dark">Threads</h3>
        <button
          type="button"
          onClick={() => setShowThreadsPanel(false)}
          className="text-gray-500 hover:text-teal-medium p-1.5 rounded-lg hover:bg-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="p-6 text-sm text-gray-500 text-center">
            <svg
              className="w-12 h-12 text-gray-300 mx-auto mb-3"
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
            <p>No threads yet.</p>
          </div>
        ) : (
          threads.map(thread => (
            <button
              key={thread.id}
              type="button"
              onClick={() => {
                setSelectedThreadId(thread.id === selectedThreadId ? null : thread.id);
                if (thread.id !== selectedThreadId) getThreadMessages(thread.id);
              }}
              className={`w-full text-left p-4 border-b border-gray-100 hover:bg-teal-lightest transition-colors ${
                selectedThreadId === thread.id
                  ? 'bg-teal-lightest border-l-4 border-l-teal-medium'
                  : ''
              }`}
            >
              <div className="font-semibold text-sm text-teal-dark mb-1">{thread.title}</div>
              <div className="text-xs text-gray-500 font-medium">
                {thread.message_count || 0} messages
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default ThreadsSidebar;
