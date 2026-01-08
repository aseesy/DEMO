/**
 * Intervene Action Handler
 *
 * Handles INTERVENE action - blocks message and provides rewrites.
 *
 * @module liaizen/core/response/handlers/InterveneHandler
 */

const { MESSAGE } = require('../../../../infrastructure/config/constants');
const { defaultLogger } = require('../../../infrastructure/logging/logger');
const { ActionHandler } = require('./ActionHandler');

const logger = defaultLogger.child({ module: 'interveneHandler' });
const { validateInterventionFields } = require('../parser');
const { validateRewrites, validateCodeLayerResponse } = require('../validator');
const { recordToProfile, updateGraphMetrics, recordToHistory } = require('../recorder');
const { buildInterventionResult, buildSafetyFallback } = require('../resultBuilder');

/**
 * Handler for INTERVENE action
 * Validates intervention, records to profiles, and returns intervention result
 */
class InterveneHandler extends ActionHandler {
  /**
   * Process INTERVENE action
   *
   * @param {Object} context - Processing context
   * @param {Object} context.result - Parsed AI response
   * @param {Object} context.message - Original message
   * @param {Object} context.roleContext - Role context
   * @param {Map} context.participantProfiles - Participant profiles
   * @param {string} context.roomId - Room ID
   * @param {Object} context.policyState - Policy state
   * @param {Object} context.parsedMessage - Code Layer parsed message
   * @param {Object} context.languageAnalysis - Language analysis
   * @returns {Promise<Object>} Intervention result or safety fallback
   */
  async process(context) {
    const {
      result,
      message,
      roleContext,
      participantProfiles,
      roomId,
      policyState,
      parsedMessage,
      languageAnalysis,
    } = context;

    const intervention = result.intervention || {};

    // Validate required fields
    const fieldValidation = validateInterventionFields(intervention);
    if (!fieldValidation.valid) {
      logger.error('INTERVENE action missing required fields, using safety fallback', {
        missingFields: fieldValidation.missing,
        messagePreview: message.text?.substring(0, MESSAGE.PREVIEW_LENGTH),
      });
      return buildSafetyFallback();
    }

    // Validate rewrites
    const validatedIntervention = validateRewrites(intervention, message.text, languageAnalysis);

    // Validate Code Layer response
    validateCodeLayerResponse(result, parsedMessage);

    logger.debug('INTERVENE action - blocking message', {
      action: 'INTERVENE',
      riskLevel: result.escalation?.riskLevel,
      confidence: result.escalation?.confidence,
      messagePreview: message.text?.substring(0, MESSAGE.PREVIEW_LENGTH),
      hasAllFields: true,
    });

    // Record to history
    recordToHistory(policyState, result);

    // Record to profile and graph (async, non-blocking)
    recordToProfile(roleContext, result, message.text);
    updateGraphMetrics(roleContext, participantProfiles, roomId);

    return buildInterventionResult({
      intervention: validatedIntervention,
      message,
      result,
      parsedMessage,
    });
  }
}

module.exports = { InterveneHandler };
