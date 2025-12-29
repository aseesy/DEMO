/**
 * Message Analyzer - Observer/Mediator Framework Integration
 *
 * This module handles message analysis using the Observer/Mediator framework
 * before sending messages. It implements the traffic control logic:
 * - If action === "STAY_SILENT" → PASS (send message)
 * - If action === "INTERVENE" → Show Observer Card (block message)
 * - If action === "COMMENT" → Show comment (optional)
 *
 * Error Handling Strategy:
 *
 * Current: Fail-open (allow message through on error) with user notification
 * Rationale: Ensure message deliverability even if analysis fails
 *
 * Implementation:
 * - Errors are classified (critical, network, validation, system)
 * - Retryable errors are retried up to 3 times with exponential backoff
 * - Critical/validation errors fail-closed (block message)
 * - Network/system errors fail-open with user warning
 * - All fail-open events are logged for monitoring
 *
 * See: .cursor/feedback/IMPROVEMENT_STRATEGY.md
 */

import { apiPost } from '../apiClient.js';
import { API_BASE_URL } from '../config.js';
import {
  determineStrategy,
  HandlingStrategy,
} from '../services/errorHandling/ErrorHandlingStrategy.js';
import { ErrorNotificationService } from '../services/errorHandling/ErrorNotificationService.js';
import { logErrorToService } from '../services/errorHandling/ErrorLoggingService.js';
import {
  POLITE_REQUEST_PATTERNS,
  POSITIVE_PATTERNS,
  SIMPLE_RESPONSES,
} from '../config/patterns/index.js';

/**
 * Analyze a message using the Observer/Mediator framework
 *
 * @param {string} messageText - The message to analyze
 * @param {Object} senderProfile - Sender context (role, position, resources, etc.)
 * @param {Object} receiverProfile - Receiver context (has_new_partner, income_disparity, etc.)
 * @returns {Promise<Object>} Analysis result with action, escalation, emotion, intervention
 */
export async function analyzeMessage(messageText, senderProfile = {}, receiverProfile = {}) {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      console.log('🔍 Frontend: Calling /api/mediate/analyze with:', {
        text: messageText.substring(0, 50),
        retryAttempt: retryCount,
      });

      // Call the backend mediation endpoint
      // The backend uses the same Observer/Mediator framework from constitution.md
      const response = await apiPost('/api/mediate/analyze', {
        text: messageText,
        senderProfile,
        receiverProfile,
      });

      console.log('📥 Frontend: Received response status:', response.status);

      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`API error: ${response.status} - ${errorText}`);
        error.status = response.status;
        throw error;
      }

      // Parse the JSON response
      const data = await response.json();
      console.log('📊 Frontend: Analysis result:', {
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
          `🔄 Retrying analysis (attempt ${retryCount + 1}/${maxRetries}) after ${strategy.retryAfter}ms`
        );
        await new Promise(resolve => setTimeout(resolve, strategy.retryAfter));
        retryCount++;
        continue;
      }

      // Fail-closed: block message
      if (strategy.strategy === HandlingStrategy.FAIL_CLOSED) {
        console.error('❌ Message blocked due to error:', {
          error: error.message,
          category: strategy.message,
          timestamp: new Date().toISOString(),
          messagePreview: messageText.substring(0, 50),
        });

        if (strategy.notifyUser) {
          ErrorNotificationService.showError(strategy.message);
        }

        if (strategy.logError) {
          // Send to logging service (Sentry, etc.)
          logErrorToService(error, {
            location: 'messageAnalyzer',
            messagePreview: messageText.substring(0, 50),
            retryAttempts: retryCount,
            failOpen: false,
            category: 'fail_closed',
          });
        }

        throw new Error(strategy.message);
      }

      // Fail-open: allow message with warning
      if (strategy.strategy === HandlingStrategy.FAIL_OPEN) {
        console.error('⚠️ Fail-open error:', {
          error: error.message,
          timestamp: new Date().toISOString(),
          messagePreview: messageText.substring(0, 50),
          retryAttempts: retryCount,
        });

        if (strategy.notifyUser) {
          ErrorNotificationService.showWarning(strategy.message);
        }

        if (strategy.logError) {
          // Send to logging service (Sentry, etc.) and track metrics
          logErrorToService(error, {
            location: 'messageAnalyzer',
            messagePreview: messageText.substring(0, 50),
            retryAttempts: retryCount,
            failOpen: true,
            category: 'fail_open',
          });
        }

        // Return safe default
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
        };
      }
    }
  }

  // If we exhausted all retries, fail-open (allow message)
  // This handles the case where all retries failed but we should still allow the message
  console.error('⚠️ All retries exhausted, failing open:', {
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

// Patterns are now imported from config/patterns
// This ensures single source of truth and easier maintenance

/**
 * Quick local check for obviously safe messages - no API call needed
 */
function quickLocalCheck(messageText) {
  const text = messageText.trim();
  const lower = text.toLowerCase();

  // Simple responses
  if (SIMPLE_RESPONSES.includes(lower)) {
    return { shouldSend: true, reason: 'simple_response' };
  }

  // Polite requests
  if (POLITE_REQUEST_PATTERNS.some(p => p.test(text))) {
    return { shouldSend: true, reason: 'polite_request' };
  }

  // Positive messages
  if (POSITIVE_PATTERNS.some(p => p.test(text))) {
    return { shouldSend: true, reason: 'positive_message' };
  }

  // Short logistics (under 50 chars, no hostile patterns)
  const hostilePatterns = /\b(you always|you never|your fault|because of you)\b/i;
  if (text.length < 50 && !hostilePatterns.test(text)) {
    // Check if it's a simple question or statement
    if (/^(what|when|where|can|could|will|would|is|are|do|does|did|have|has)\b/i.test(text)) {
      return { shouldSend: true, reason: 'simple_question' };
    }
  }

  return null; // Needs full analysis
}

/**
 * Traffic Control Logic
 *
 * Determines whether a message should be sent or blocked based on analysis
 *
 * @param {Object} analysis - The analysis result from analyzeMessage
 * @returns {Object} { shouldSend: boolean, reason: string, observerData: Object }
 */
export function shouldSendMessage(analysis) {
  if (!analysis) {
    return { shouldSend: true, reason: 'no_analysis', observerData: null };
  }

  // QUICK_CHECK: Fast local pre-filter (no API call)
  if (analysis.action === 'QUICK_CHECK' && analysis.messageText) {
    const quickResult = quickLocalCheck(analysis.messageText);
    if (quickResult) {
      return { ...quickResult, observerData: null };
    }
    // No quick pass - needs full analysis
    return { shouldSend: false, reason: 'needs_analysis', observerData: null };
  }

  // SCENARIO A: CLEAN - Send the message
  if (analysis.action === 'STAY_SILENT') {
    return {
      shouldSend: true,
      reason: 'clean',
      observerData: null,
    };
  }

  // SCENARIO B: CONFLICT DETECTED - Block and show Observer Card
  if (analysis.action === 'INTERVENE') {
    return {
      shouldSend: false,
      reason: 'intervention_required',
      observerData: {
        axiomsFired: analysis.escalation?.reasons || [],
        explanation: analysis.intervention?.personalMessage || '',
        tip: analysis.intervention?.tip1 || '',
        refocusQuestions: analysis.intervention?.refocusQuestions || [],
        rewrite1: analysis.intervention?.rewrite1 || '',
        rewrite2: analysis.intervention?.rewrite2 || '',
        escalation: analysis.escalation,
        emotion: analysis.emotion,
        originalText: analysis.originalText || '',
      },
    };
  }

  // SCENARIO C: COMMENT - Optional observation (can send or show comment)
  if (analysis.action === 'COMMENT') {
    return {
      shouldSend: true, // Allow sending, but show comment
      reason: 'comment',
      observerData: {
        comment: analysis.intervention?.comment || '',
      },
    };
  }

  // Default: allow sending
  return { shouldSend: true, reason: 'default', observerData: null };
}
