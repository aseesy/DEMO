/**
 * useInputMessage Hook
 *
 * Manages chat input state and typing indicators:
 * - Input message state
 * - Typing indicator emission
 * - Draft analysis debouncing
 */

import React from 'react';

export function useInputMessage({ socketRef, setDraftCoaching }) {
  const [inputMessage, setInputMessage] = React.useState('');
  const [isPreApprovedRewrite, setIsPreApprovedRewrite] = React.useState(false);
  const [originalRewrite, setOriginalRewrite] = React.useState('');

  // Typing timeout ref
  const typingTimeoutRef = React.useRef(null);
  // Draft analysis timeout ref
  const draftAnalysisTimeoutRef = React.useRef(null);

  // Handle input change with typing indicator and draft analysis
  const handleInputChange = React.useCallback(
    e => {
      const value = e.target.value;
      setInputMessage(value);

      if (!socketRef?.current) return;

      // Emit typing indicator
      socketRef.current.emit('typing', { isTyping: true });

      // Clear existing typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', { isTyping: false });
      }, 1000);

      // Request proactive coaching analysis (debounced)
      if (draftAnalysisTimeoutRef.current) {
        clearTimeout(draftAnalysisTimeoutRef.current);
      }

      // Only analyze if message is substantial (at least 10 chars)
      if (value.trim().length >= 10 && socketRef.current?.connected) {
        draftAnalysisTimeoutRef.current = setTimeout(() => {
          socketRef.current?.emit('analyze_draft', { draftText: value.trim() });
        }, 1000); // Wait 1 second after user stops typing
      } else {
        setDraftCoaching?.(null); // Clear coaching if message is too short
      }
    },
    [socketRef, setDraftCoaching]
  );

  // Clear input after sending
  const clearInput = React.useCallback(() => {
    setInputMessage('');
    setIsPreApprovedRewrite(false);
    setOriginalRewrite('');
  }, []);

  // Stop typing indicator
  const stopTyping = React.useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketRef?.current?.emit('typing', { isTyping: false });
  }, [socketRef]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (draftAnalysisTimeoutRef.current) {
        clearTimeout(draftAnalysisTimeoutRef.current);
      }
    };
  }, []);

  return {
    inputMessage,
    setInputMessage,
    isPreApprovedRewrite,
    setIsPreApprovedRewrite,
    originalRewrite,
    setOriginalRewrite,
    handleInputChange,
    clearInput,
    stopTyping,
  };
}

export default useInputMessage;
