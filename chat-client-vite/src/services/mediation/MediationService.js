/**
 * MediationService - Pure Service for Frontend Validation
 *
 * Responsibility: Frontend message analysis/mediation ONLY
 *
 * What it does:
 * - Calls backend `/api/mediate/analyze` endpoint
 * - Handles retries with exponential backoff
 * - Returns structured analysis results
 * - Pure functions - no React dependencies
 *
 * What it does NOT do:
 * - ❌ UI state management (delegated to useMessageMediation hook)
 * - ❌ Error notifications (delegated to ErrorNotificationService)
 * - ❌ Error logging (delegated to ErrorLoggingService)
 * - ❌ Context building (delegated to profileBuilder utilities)
 *
 * Architecture:
 *   MediationService (pure service)
 *     ↓ calls
 *   Backend /api/mediate/analyze
 *     ↓ returns
 *   Analysis result (action, escalation, emotion, intervention)
 */

import { apiPost } from '../../apiClient.js';
import {
  determineStrategy,
  HandlingStrategy,
} from '../errorHandling/ErrorHandlingStrategy.js';

/**
 * MediationService
 *
 * Pure service for message analysis/mediation
 * No React dependencies - can be used in hooks, components, or tests
 */
export class MediationService {
  /**
   * Analyze a message using the Observer/Mediator framework
   *
   * This is the frontend pre-check that calls the backend analysis endpoint.
   * The backend performs full analysis with historical context.
   *
   * @param {string} messageText - The message to analyze
   * @param {Object} senderProfile - Sender context (role, position, resources, etc.)
   * @param {Object} receiverProfile - Receiver context (has_new_partner, income_disparity, etc.)
   * @param {Object} options - Analysis options
   * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
   * @returns {Promise<Object>} Analysis result with action, escalation, emotion, intervention
   * @throws {Error} If analysis fails critically (fail-closed errors)
   */
  static async analyze(messageText, senderProfile = {}, receiverProfile = {}, options = {}) {
    const { maxRetries = 3 } = options;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        console.log('🔍 [MediationService] Calling /api/mediate/analyze:', {
          text: messageText.substring(0, 50),
          retryAttempt: retryCount,
        });

        // Call the backend mediation endpoint
        const response = await apiPost('/api/mediate/analyze', {
          text: messageText,
          senderProfile,
          receiverProfile,
        });

        console.log('📥 [MediationService] Received response status:', response.status);

        // Check if the request was successful
        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(`API error: ${response.status} - ${errorText}`);
          error.status = response.status;
          throw error;
        }

        // Parse the JSON response
        const data = await response.json();
        console.log('📊 [MediationService] Analysis result:', {
          action: data.action,
          hasIntervention: !!data.intervention,
        });

        return data;
      } catch (error) {
        // Determine handling strategy based on error classification
        const strategy = determineStrategy(error, retryCount);

        // Retry logic
        if (strategy.strategy === HandlingStrategy.RETRY) {
          console.log(
            `🔄 [MediationService] Retrying analysis (attempt ${retryCount + 1}/${maxRetries}) after ${strategy.retryAfter}ms`
          );
          await new Promise(resolve => setTimeout(resolve, strategy.retryAfter));
          retryCount++;
          continue;
        }

        // Fail-closed: throw error (caller handles blocking)
        if (strategy.strategy === HandlingStrategy.FAIL_CLOSED) {
          console.error('❌ [MediationService] Message blocked due to error:', {
            error: error.message,
            category: strategy.message,
            timestamp: new Date().toISOString(),
            messagePreview: messageText.substring(0, 50),
          });

          // Throw error with strategy info for caller to handle
          const blockedError = new Error(strategy.message || 'Message validation failed');
          blockedError.strategy = strategy;
          blockedError.category = 'fail_closed';
          throw blockedError;
        }

        // Fail-open: return safe default (caller handles allowing message)
        if (strategy.strategy === HandlingStrategy.FAIL_OPEN) {
          console.error('⚠️ [MediationService] Fail-open error:', {
            error: error.message,
            timestamp: new Date().toISOString(),
            messagePreview: messageText.substring(0, 50),
            retryAttempts: retryCount,
          });

          // Return safe default with fail-open flag
          return {
            action: 'STAY_SILENT',
            escalation: { riskLevel: 'low', confidence: 0, reasons: [] },
            emotion: {
              currentEmotion: 'neutral',
              stressLevel: 0,
              stressTrajectory: 'stable',
              emotionalMomentum: 0,
              triggers: [],
              conversationEmotion: 'neutral',
            },
            intervention: null,
            error: error.message,
            failOpen: true, // Flag for tracking
            strategy: strategy, // Include strategy for caller
          };
        }

        // Unexpected strategy - throw error
        throw new Error(`Unexpected error strategy: ${strategy.strategy}`);
      }
    }

    // If we exhausted all retries, fail-open (allow message)
    console.error('⚠️ [MediationService] All retries exhausted, failing open:', {
      retryAttempts: retryCount,
      timestamp: new Date().toISOString(),
      messagePreview: messageText.substring(0, 50),
    });

    return {
      action: 'STAY_SILENT',
      escalation: { riskLevel: 'low', confidence: 0, reasons: [] },
      emotion: {
        currentEmotion: 'neutral',
        stressLevel: 0,
        stressTrajectory: 'stable',
        emotionalMomentum: 0,
        triggers: [],
        conversationEmotion: 'neutral',
      },
      intervention: null,
      error: 'Analysis unavailable after retries',
      failOpen: true,
    };
  }
}

/**
 * Create a MediationService instance (for future instance-based usage)
 * Currently using static methods, but this allows for future extension
 * @returns {MediationService}
 */
export function createMediationService() {
  return new MediationService();
}

