import React, { useState, useMemo } from 'react';

/**
 * Thread category configuration with colors and icons
 */
const THREAD_CATEGORIES = {
  schedule: { label: 'Schedule', color: 'bg-blue-100 text-blue-700', icon: '📅' },
  medical: { label: 'Medical', color: 'bg-red-100 text-red-700', icon: '🏥' },
  education: { label: 'Education', color: 'bg-purple-100 text-purple-700', icon: '📚' },
  finances: { label: 'Finances', color: 'bg-green-100 text-green-700', icon: '💰' },
  activities: { label: 'Activities', color: 'bg-orange-100 text-orange-700', icon: '⚽' },
  travel: { label: 'Travel', color: 'bg-cyan-100 text-cyan-700', icon: '✈️' },
  safety: { label: 'Safety', color: 'bg-yellow-100 text-yellow-800', icon: '🛡️' },
  logistics: { label: 'Logistics', color: 'bg-gray-100 text-gray-700', icon: '📦' },
  'co-parenting': { label: 'Co-Parenting', color: 'bg-teal-100 text-teal-700', icon: '🤝' },
};

/**
 * Category badge component
 */
function CategoryBadge({ category }) {
  const config = THREAD_CATEGORIES[category] || THREAD_CATEGORIES.logistics;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Organize threads into hierarchy (root threads with their sub-threads)
 */
function organizeThreadHierarchy(threads) {
  const rootThreads = [];
  const subThreadsByParent = {};

  // Separate root threads and sub-threads
  threads.forEach(thread => {
    if (!thread.parent_thread_id) {
      rootThreads.push(thread);
    } else {
      if (!subThreadsByParent[thread.parent_thread_id]) {
        subThreadsByParent[thread.parent_thread_id] = [];
      }
      subThreadsByParent[thread.parent_thread_id].push(thread);
    }
  });

  // Build hierarchy
  const result = [];
  rootThreads.forEach(root => {
    result.push(root);
    const subs = subThreadsByParent[root.id] || [];
    // Sort sub-threads by updated_at desc
    subs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    subs.forEach(sub => result.push(sub));
  });

  return result;
}

/**
 * ThreadsSidebar - Displays conversation threads in a collapsible sidebar
 * Supports categories and hierarchical thread display
 */
export function ThreadsSidebar({
  threads,
  selectedThreadId,
  setSelectedThreadId,
  setShowThreadsPanel,
  getThreadMessages,
}) {
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Filter and organize threads
  const displayThreads = useMemo(() => {
    let filtered = threads;
    if (categoryFilter !== 'all') {
      filtered = threads.filter(t => t.category === categoryFilter);
    }
    return organizeThreadHierarchy(filtered);
  }, [threads, categoryFilter]);

  // Get unique categories from threads
  const availableCategories = useMemo(() => {
    const cats = new Set(threads.map(t => t.category).filter(Boolean));
    return Array.from(cats);
  }, [threads]);

  return (
    <div className="w-80 border-r-2 border-teal-light bg-white flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-4 border-b-2 border-teal-light bg-teal-lightest">
        <div className="flex items-center justify-between mb-3">
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

        {/* Category filter */}
        {availableCategories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-medium"
          >
            <option value="all">All Categories</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>
                {THREAD_CATEGORIES[cat]?.icon} {THREAD_CATEGORIES[cat]?.label || cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        {displayThreads.length === 0 ? (
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
            <p>{categoryFilter === 'all' ? 'No threads yet.' : 'No threads in this category.'}</p>
          </div>
        ) : (
          displayThreads.map(thread => {
            const isSubThread = thread.depth > 0 || thread.parent_thread_id;
            const indentClass = isSubThread ? 'pl-8' : '';

            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => {
                  setSelectedThreadId(thread.id === selectedThreadId ? null : thread.id);
                  if (thread.id !== selectedThreadId) getThreadMessages(thread.id);
                }}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-teal-lightest transition-colors ${indentClass} ${
                  selectedThreadId === thread.id
                    ? 'bg-teal-lightest border-l-4 border-l-teal-medium'
                    : ''
                }`}
              >
                {/* Sub-thread indicator */}
                {isSubThread && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Sub-thread</span>
                  </div>
                )}

                {/* Thread title */}
                <div className="font-semibold text-sm text-teal-dark mb-2">{thread.title}</div>

                {/* Category badge and message count */}
                <div className="flex items-center justify-between gap-2">
                  {thread.category && <CategoryBadge category={thread.category} />}
                  <div className="text-xs text-gray-500 font-medium">
                    {thread.message_count || 0} msgs
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer with thread count */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-center">
        {threads.length} thread{threads.length !== 1 ? 's' : ''} total
      </div>
    </div>
  );
}

export default ThreadsSidebar;
