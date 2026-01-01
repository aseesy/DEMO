/**
 * useMessageMediation Hook
 * 
 * Responsibility: Business Logic & Validation ONLY
 * 
 * What it does:
 * - Handles message validation/analysis
 * - Manages draft coaching state
 * - Determines if message should be sent or blocked
 * - Coordinates with AI mediation services
 * 
 * What it does NOT do:
 * - ❌ UI state management (delegated to useMessageUI)
 * - ❌ Network transport (delegated to useMessageTransport)
 * - ❌ Direct socket communication (delegated to useMessageTransport)
 */

import React from 'react';
import { MediationService } from '../../../services/mediation/MediationService.js';
import {
  determineStrategy,
  HandlingStrategy,
} from '../../../services/errorHandling/ErrorHandlingStrategy.js';
import { ErrorNotificationService } from '../../../services/errorHandling/ErrorNotificationService.js';
import { logErrorToService } from '../../../services/errorHandling/ErrorLoggingService.js';

/**
 * useMessageMediation - Manages message validation and mediation logic
 * 
 * @param {Object} options
 * @param {Function} options.setDraftCoaching - Set draft coaching callback
 * @param {Function} options.setError - Set error callback
 * @param {Object} options.senderProfile - Sender profile context
 * @param {Object} options.receiverProfile - Receiver profile context
 * @returns {Object} { validateMessage, shouldSendMessage }
 */
export function useMessageMediation({
  setDraftCoaching,
  setError,
  senderProfile = {},
  receiverProfile = {},
} = {}) {
  // Validate message and determine if it should be sent
  const validateMessage = React.useCallback(
    async messageText => {
      const clean = messageText.trim();
      if (!clean) {
        return {
          shouldSend: false,
          reason: 'empty_message',
          analysis: null,
        };
      }

      // Show "Analyzing..." state
      setDraftCoaching?.({
        analyzing: true,
        riskLevel: 'low',
        shouldSend: false,
      });

      try {
        // Analyze message using MediationService (Phase 3: pure service)
        const analysis = await MediationService.analyze(clean, senderProfile, receiverProfile);

        // Determine if message should be sent based on analysis
        if (analysis.action === 'STAY_SILENT') {
          // Message is safe to send
          setDraftCoaching?.(null);
          return {
            shouldSend: true,
            reason: 'safe_message',
            analysis,
            observerData: null,
          };
        } else if (analysis.action === 'INTERVENE') {
          // Message should be blocked - show intervention
          setDraftCoaching?.({
            analyzing: false,
            riskLevel: analysis.escalation?.riskLevel || 'medium',
            shouldSend: false,
            observerData: analysis.intervention,
            originalText: clean,
            analysis,
          });
          return {
            shouldSend: false,
            reason: 'intervention_required',
            analysis,
            observerData: analysis.intervention,
          };
        } else if (analysis.action === 'COMMENT') {
          // COMMENT action - optional feedback
          setDraftCoaching?.({
            analyzing: false,
            riskLevel: analysis.escalation?.riskLevel || 'low',
            shouldSend: true,
            observerData: analysis.comment,
            originalText: clean,
            analysis,
          });
          return {
            shouldSend: true,
            reason: 'comment_provided',
            analysis,
            observerData: analysis.comment,
          };
        } else {
          // Unknown action or fail-open result
          if (analysis.failOpen) {
            // Fail-open: allow message with warning
            if (analysis.strategy?.notifyUser) {
              ErrorNotificationService.showWarning(
                analysis.strategy.message || 'Analysis temporarily unavailable. Message will be sent without analysis.'
              );
            }

            // Log fail-open event
            if (analysis.strategy?.logError) {
              logErrorToService(new Error(analysis.error || 'Analysis failed'), {
                location: 'useMessageMediation',
                messagePreview: clean.substring(0, 50),
                strategy: 'fail_open',
                category: 'message_validation',
              });
            }

            setDraftCoaching?.(null);
            return {
              shouldSend: true,
              reason: 'fail_open',
              error: analysis.error,
              analysis: null,
              failOpen: true,
            };
          }

          // Unknown action - default to allowing (safe default)
          console.warn('[useMessageMediation] Unknown action:', analysis.action);
          setDraftCoaching?.(null);
          return {
            shouldSend: true,
            reason: 'unknown_action',
            analysis,
            observerData: null,
          };
        }
      } catch (error) {
        console.error('[useMessageMediation] Error during message validation:', error);

        // Check if error has strategy info from MediationService
        const strategy = error.strategy || determineStrategy(error, 0);

        // Log error if needed
        if (strategy.logError) {
          logErrorToService(error, {
            location: 'useMessageMediation',
            messagePreview: clean.substring(0, 50),
            strategy: strategy.strategy,
            category: 'message_validation',
          });
        }

        // Handle based on strategy
        // Note: MediationService throws errors for fail-closed, returns fail-open results
        if (strategy.strategy === HandlingStrategy.FAIL_CLOSED || error.category === 'fail_closed') {
          // Critical/validation errors: block message and notify user
          setDraftCoaching?.({
            analyzing: false,
            riskLevel: 'high',
            shouldSend: false,
            error: strategy.message || error.message || 'Message validation failed. Please try again.',
          });

          if (strategy.notifyUser) {
            ErrorNotificationService.showError(
              strategy.message || error.message || 'Message blocked due to validation failure. Please try again.'
            );
          }

          return {
            shouldSend: false,
            reason: 'validation_failed',
            error: strategy.message || error.message,
            analysis: null,
          };
        } else {
          // Unexpected error - default to fail-closed for safety
          console.error('[useMessageMediation] Unexpected error:', error);
          setDraftCoaching?.({
            analyzing: false,
            riskLevel: 'high',
            shouldSend: false,
            error: 'An unexpected error occurred. Please try again.',
          });
          ErrorNotificationService.showError('An unexpected error occurred. Please try again.');
          return {
            shouldSend: false,
            reason: 'unexpected_error',
            error: 'An unexpected error occurred. Please try again.',
            analysis: null,
          };
        }
      }
    },
    [setDraftCoaching, setError, senderProfile, receiverProfile]
  );

  return {
    validateMessage,
  };
}

export default useMessageMediation;

