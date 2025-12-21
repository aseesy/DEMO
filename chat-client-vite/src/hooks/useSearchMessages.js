/**
 * useSearchMessages Hook
 *
 * Manages message search functionality:
 * - Search query state
 * - Search results
 * - Jump to message
 * - Search mode toggle
 */

import React from 'react';

export function useSearchMessages({ socketRef, username, setError }) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchTotal, setSearchTotal] = React.useState(0);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchMode, setSearchMode] = React.useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = React.useState(null);

  // Search messages
  const searchMessages = React.useCallback(
    query => {
      if (!socketRef?.current?.connected) {
        setError?.('Not connected to chat server.');
        return;
      }

      setSearchQuery(query);

      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        setSearchTotal(0);
        return;
      }

      setIsSearching(true);
      socketRef.current.emit('search_messages', {
        query: query.trim(),
        limit: 50,
        offset: 0,
      });
    },
    [socketRef, setError]
  );

  // Jump to a specific message
  const jumpToMessage = React.useCallback(
    messageId => {
      if (!socketRef?.current?.connected) {
        setError?.('Not connected to chat server.');
        return;
      }

      socketRef.current.emit('jump_to_message', { messageId });
    },
    [socketRef, setError]
  );

  // Toggle search mode
  const toggleSearchMode = React.useCallback(() => {
    setSearchMode(prev => {
      if (prev) {
        // Exiting search mode - clear search
        setSearchQuery('');
        setSearchResults([]);
        setSearchTotal(0);
      }
      return !prev;
    });
  }, []);

  // Exit search mode and reload current messages
  const exitSearchMode = React.useCallback(() => {
    setSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchTotal(0);
    // Re-join to reload current messages
    if (socketRef?.current?.connected && username) {
      socketRef.current.emit('join', { username });
    }
  }, [socketRef, username]);

  // Handle search results from socket
  const handleSearchResults = React.useCallback(({ messages: results, total }) => {
    setIsSearching(false);
    setSearchResults(results || []);
    setSearchTotal(total || 0);
  }, []);

  // Handle jump to message result from socket
  const handleJumpToMessageResult = React.useCallback(
    ({ messages: contextMsgs, targetMessageId, setMessages }) => {
      if (contextMsgs && contextMsgs.length > 0) {
        setMessages?.(contextMsgs);
        setHighlightedMessageId(targetMessageId);
        setSearchMode(false);

        // Scroll to the highlighted message after render
        setTimeout(() => {
          const messageElement = document.getElementById(`message-${targetMessageId}`);
          if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);

        // Clear highlight after 3 seconds
        setTimeout(() => setHighlightedMessageId(null), 3000);
      }
    },
    []
  );

  return {
    // State
    searchQuery,
    searchResults,
    searchTotal,
    isSearching,
    searchMode,
    highlightedMessageId,

    // Setters for socket event handlers
    setSearchResults,
    setSearchTotal,
    setIsSearching,
    setHighlightedMessageId,
    setSearchMode,

    // Actions
    searchMessages,
    jumpToMessage,
    toggleSearchMode,
    exitSearchMode,

    // Event handlers
    handleSearchResults,
    handleJumpToMessageResult,
  };
}

export default useSearchMessages;
