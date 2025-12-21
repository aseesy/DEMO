import React from 'react';

/**
 * useMessageFlaggingModal - Manages message flagging state
 * 
 * Encapsulates state for the message flagging modal:
 * - The message being flagged
 * - The flag reason
 * 
 * This hook owns the flagging modal's state, following SRP.
 * 
 * @returns {Object} Message flagging modal state and handlers
 * @returns {Object|null} returns.flaggingMessage - Message being flagged
 * @returns {Function} returns.setFlaggingMessage - Set message to flag
 * @returns {string} returns.flagReason - Reason for flagging
 * @returns {Function} returns.setFlagReason - Set flag reason
 */
export function useMessageFlaggingModal() {
  const [flaggingMessage, setFlaggingMessage] = React.useState(null);
  const [flagReason, setFlagReason] = React.useState('');

  return {
    flaggingMessage,
    setFlaggingMessage,
    flagReason,
    setFlagReason,
  };
}

