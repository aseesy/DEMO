/**
 * useChatContextValue Hook
 *
 * Creates the context value object with all state and functions.
 * This centralizes the context value creation logic.
 */

import React from 'react';

/**
 * Hook for creating chat context value
 * @param {Object} params - All state and functions needed for context
 * @returns {Object} Context value object
 */
export function useChatContextValue({
  socketRef,
  isConnected,
  isJoined,
  error,
  messages,
  inputMessage,
  setInputMessage,
  sendMessage,
  handleInputChange,
  removeMessages,
  flagMessage,
  messagesEndRef,
  messagesContainerRef,
  pendingMessages,
  messageStatuses,
  draftCoaching,
  setDraftCoaching,
  isPreApprovedRewrite,
  setIsPreApprovedRewrite,
  originalRewrite,
  setOriginalRewrite,
  threads,
  threadMessages,
  isLoadingThreadMessages,
  selectedThreadId,
  setSelectedThreadId,
  createThread,
  getThreads,
  getThreadMessages,
  addToThread,
  typingUsers,
  loadOlderMessages,
  isLoadingOlder,
  hasMoreMessages,
  searchMessages,
  searchQuery,
  searchResults,
  searchTotal,
  isSearching,
  searchMode,
  toggleSearchMode,
  exitSearchMode,
  jumpToMessage,
  highlightedMessageId,
  isInitialLoad,
  unreadCount,
  setUnreadCount,
  hasMeanMessage,
}) {
  const value = React.useMemo(
    () => ({
      // Connection
      socket: socketRef.current,
      isConnected,
      isJoined,
      error,

      // Messages
      messages,
      inputMessage,
      setInputMessage,
      sendMessage,
      handleInputChange,
      removeMessages,
      flagMessage,
      messagesEndRef,
      messagesContainerRef,

      // Message tracking
      pendingMessages,
      messageStatuses,

      // Draft coaching
      draftCoaching,
      setDraftCoaching,
      isPreApprovedRewrite,
      setIsPreApprovedRewrite,
      originalRewrite,
      setOriginalRewrite,

      // Threads
      threads,
      threadMessages,
      isLoadingThreadMessages,
      selectedThreadId,
      setSelectedThreadId,
      createThread,
      getThreads,
      getThreadMessages,
      addToThread,

      // Typing
      typingUsers,

      // Pagination
      loadOlderMessages,
      isLoadingOlder,
      hasMoreMessages,

      // Search
      searchMessages,
      searchQuery,
      searchResults,
      searchTotal,
      isSearching,
      searchMode,
      toggleSearchMode,
      exitSearchMode,
      jumpToMessage,
      highlightedMessageId,

      // UI state
      isInitialLoad,
      unreadCount,
      setUnreadCount,
      hasMeanMessage,
    }),
    [
      socketRef,
      isConnected,
      isJoined,
      error,
      messages,
      inputMessage,
      sendMessage,
      handleInputChange,
      removeMessages,
      flagMessage,
      pendingMessages,
      messageStatuses,
      draftCoaching,
      isPreApprovedRewrite,
      originalRewrite,
      threads,
      threadMessages,
      isLoadingThreadMessages,
      selectedThreadId,
      createThread,
      getThreads,
      getThreadMessages,
      addToThread,
      typingUsers,
      loadOlderMessages,
      isLoadingOlder,
      hasMoreMessages,
      searchMessages,
      searchQuery,
      searchResults,
      searchTotal,
      isSearching,
      searchMode,
      toggleSearchMode,
      exitSearchMode,
      jumpToMessage,
      highlightedMessageId,
      isInitialLoad,
      unreadCount,
      hasMeanMessage,
    ]
  );

  return value;
}

