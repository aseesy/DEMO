/**
 * useInputHandling Hook
 *
 * Orchestrates input handling by combining:
 * - useInputChange - Basic input state updates
 * - useTypingIndicator - Typing indicator logic
 * - useDraftAnalysis - Draft analysis logic
 */

import React from 'react';
import { useInputChange } from './useInputChange.js';
import { useTypingIndicator } from './useTypingIndicator.js';
import { useDraftAnalysis } from './useDraftAnalysis.js';

/**
 * Hook for handling input changes (orchestrator)
 * @param {Object} params
 * @param {Object} params.socketRef - Socket ref
 * @param {Function} params.setInputMessage - Set input message
 * @param {Function} params.setDraftCoaching - Set draft coaching
 * @param {Object} params.typingTimeoutRef - Typing timeout ref (optional, will create if not provided)
 * @returns {Object} { handleInputChange, typingTimeoutRef, draftAnalysisTimeoutRef }
 */
export function useInputHandling({ socketRef, setInputMessage, setDraftCoaching, typingTimeoutRef: providedTypingTimeoutRef }) {
  const { handleInputChange: baseHandleInputChange } = useInputChange(setInputMessage);
  const { emitTyping, typingTimeoutRef } = useTypingIndicator(socketRef, providedTypingTimeoutRef);
  const { analyzeDraft, draftAnalysisTimeoutRef } = useDraftAnalysis(socketRef, setDraftCoaching);

  const handleInputChange = React.useCallback(
    e => {
      const value = e.target.value;
      baseHandleInputChange(e);
      
      if (socketRef.current) {
        emitTyping(true);
        analyzeDraft(value);
      }
    },
    [baseHandleInputChange, socketRef, emitTyping, analyzeDraft]
  );

  return { handleInputChange, typingTimeoutRef, draftAnalysisTimeoutRef };
}

