/**
 * useScrollManager Hook
 *
 * Manages auto-scroll behavior for chat messages:
 * - Scrolls to bottom on new messages (if near bottom)
 * - Provides scroll utilities
 * - Handles initial load scroll positioning
 */

import React from 'react';

/**
 * Check if user is near bottom of container (within threshold px)
 */
export function isNearBottom(containerRef, threshold = 100) {
  const container = containerRef?.current;
  if (!container) return false;

  const scrollTop = container.scrollTop;
  const scrollHeight = container.scrollHeight;
  const clientHeight = container.clientHeight;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

  return distanceFromBottom < threshold;
}

/**
 * Scroll to bottom of container
 */
export function scrollToBottom(ref, instant = false) {
  ref?.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' });
}

export function useScrollManager({ messagesContainerRef, messagesEndRef }) {
  // Track initial load to prevent scroll animation through history
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  // Scroll to bottom (exposed method)
  const scrollToBottomFn = React.useCallback(
    (instant = false) => {
      scrollToBottom(messagesEndRef, instant);
    },
    [messagesEndRef]
  );

  // Check if should auto-scroll (user near bottom)
  const shouldAutoScroll = React.useCallback(() => {
    if (!messagesEndRef?.current) return false;

    // Find the scrollable container (parent with overflow-y-auto)
    let container = messagesEndRef.current.parentElement;
    while (container) {
      const style = window.getComputedStyle(container);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        break;
      }
      container = container.parentElement;
    }

    if (!container) return false;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Only auto-scroll if within 100px of bottom
    return distanceFromBottom < 100;
  }, [messagesEndRef]);

  // Handle initial scroll after history loads
  const handleInitialScroll = React.useCallback(() => {
    // Set scroll position directly on container for instant positioning
    if (messagesContainerRef?.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    // Also use scrollIntoView as backup
    messagesEndRef?.current?.scrollIntoView({ behavior: 'instant' });

    // Small delay to ensure scroll is complete before revealing
    setTimeout(() => {
      setIsInitialLoad(false);
    }, 50);
  }, [messagesContainerRef, messagesEndRef]);

  return {
    isInitialLoad,
    setIsInitialLoad,
    scrollToBottom: scrollToBottomFn,
    shouldAutoScroll,
    handleInitialScroll,
  };
}

export default useScrollManager;
