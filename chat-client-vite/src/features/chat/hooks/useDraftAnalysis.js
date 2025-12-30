/**
 * useDraftAnalysis Hook
 *
 * Handles draft analysis logic:
 * - Quick message checks
 * - Full draft analysis via socket
 */

import React from 'react';

/**
 * Hook for handling draft analysis
 * @param {Object} socketRef - Socket ref
 * @param {Function} setDraftCoaching - Set draft coaching function
 * @returns {Object} { analyzeDraft, draftAnalysisTimeoutRef }
 */
export function useDraftAnalysis(socketRef, setDraftCoaching) {
  const draftAnalysisTimeoutRef = React.useRef(null);
  const lastAnalyzedTextRef = React.useRef(''); // Track last analyzed text to avoid redundant analysis

  const analyzeDraft = React.useCallback(
    (text) => {
      if (draftAnalysisTimeoutRef.current) clearTimeout(draftAnalysisTimeoutRef.current);

      const trimmed = text.trim();

      // Quick local check - if message passes fast filters, mark as analyzed
      if (trimmed.length >= 3) {
        import('../../../utils/messageAnalyzer.js').then(({ shouldSendMessage }) => {
          const quickCheck = shouldSendMessage({ action: 'QUICK_CHECK', messageText: trimmed });
          if (quickCheck.shouldSend) {
            // Message passes quick check - cache it as analyzed
            lastAnalyzedTextRef.current = trimmed;
            setDraftCoaching(null); // Clear any previous coaching
          } else if (trimmed.length >= 10 && socketRef.current?.connected) {
            // Needs full analysis - send to server after delay
            draftAnalysisTimeoutRef.current = setTimeout(() => {
              socketRef.current?.emit('analyze_draft', { draftText: trimmed });
              lastAnalyzedTextRef.current = trimmed; // Track what we analyzed
            }, 800); // Reduced from 1000ms for faster feedback
          }
        });
      } else {
        setDraftCoaching(null);
        lastAnalyzedTextRef.current = '';
      }
    },
    [socketRef, setDraftCoaching]
  );

  return { analyzeDraft, draftAnalysisTimeoutRef };
}

