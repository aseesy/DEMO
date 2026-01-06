import React from 'react';

/**
 * MessageSearch Component
 *
 * Provides a search interface for finding messages in conversation history.
 * Features:
 * - Search input with real-time results
 * - Result list with message previews
 * - Click to jump to message in context
 * - Close button to exit search mode
 *
 * @param {boolean} hideHeader - When true, hides the search header (for desktop where
 *                               Navigation already has the search input)
 */
export function MessageSearch({
  searchQuery,
  searchResults,
  searchTotal,
  isSearching,
  onSearch,
  onJumpToMessage,
  onClose,
  hideHeader = false,
}) {
  const inputRef = React.useRef(null);
  const [localQuery, setLocalQuery] = React.useState(searchQuery || '');
  const searchTimeoutRef = React.useRef(null);

  // Focus input on mount
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  const handleInputChange = e => {
    const value = e.target.value;
    setLocalQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);
  };

  // Format timestamp for display
  const formatDate = timestamp => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Highlight search term in text
  const highlightText = (text, query) => {
    if (!query || query.length < 2) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-gray-900 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Search Header - hidden on desktop where Navigation has the search input */}
      {!hideHeader && (
        <div className="flex items-center gap-3 p-3 border-b border-gray-100">
          {/* Search Icon */}
          <svg
            className="w-5 h-5 text-gray-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            placeholder="messages..."
            className="flex-1 text-sm border-none outline-none bg-transparent placeholder-gray-400"
          />

          {/* Loading Indicator */}
          {isSearching && (
            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          )}

          {/* Result Count */}
          {!isSearching && searchTotal > 0 && (
            <span className="text-xs text-gray-500 shrink-0">
              {searchTotal} result{searchTotal !== 1 ? 's' : ''}
            </span>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Close search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Compact header for desktop - just shows result count and close button */}
      {hideHeader && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Search Results</span>
            {isSearching && (
              <div className="w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            )}
            {!isSearching && searchTotal > 0 && (
              <span className="text-xs text-gray-500">
                ({searchTotal} result{searchTotal !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Close search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="max-h-64 overflow-y-auto">
          {searchResults.map(result => (
            <button
              key={result.id}
              onClick={() => onJumpToMessage(result.id)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-teal-700 shrink-0">
                  {result.displayName || result.sender?.first_name || result.sender?.email || 'Unknown'}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {formatDate(result.timestamp)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {highlightText(result.text, localQuery)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isSearching && localQuery.length >= 2 && searchResults.length === 0 && (
        <div className="p-4 text-center text-sm text-gray-500">
          No messages found for "{localQuery}"
        </div>
      )}

      {/* Hint */}
      {localQuery.length < 2 && localQuery.length > 0 && (
        <div className="p-3 text-center text-xs text-gray-400">
          Type at least 2 characters to search
        </div>
      )}
    </div>
  );
}

export default MessageSearch;
