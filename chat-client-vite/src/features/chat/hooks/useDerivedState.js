/**
 * useDerivedState Hook
 *
 * Computes derived state from messages and other data:
 * - hasMeanMessage: Whether any message is flagged as mean
 */

import React from 'react';

/**
 * Hook for computing derived state
 * @param {Array} messages - Array of messages
 * @param {string} username - Current username
 * @returns {Object} Derived state values
 */
export function useDerivedState(messages, username) {
  // Helper to extract email from message (supports both new and legacy structures)
  const getMessageEmail = React.useCallback(msg => {
    return (msg.sender?.email || msg.user_email || msg.email || msg.username || '').toLowerCase();
  }, []);

  // Compute hasMeanMessage for Navigation
  const hasMeanMessage = React.useMemo(() => {
    const normalizedUsername = (username || '').toLowerCase();
    return messages.some(msg => {
      const msgEmail = getMessageEmail(msg);
      return (
        msgEmail === normalizedUsername &&
        msg.user_flagged_by &&
        Array.isArray(msg.user_flagged_by) &&
        msg.user_flagged_by.length > 0
      );
    });
  }, [messages, username, getMessageEmail]);

  return { hasMeanMessage };
}
