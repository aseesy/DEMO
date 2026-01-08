/**
 * Response Validator
 *
 * Validates AI response rewrites and Code Layer analysis.
 *
 * @module liaizen/core/response/validator
 */

const { MESSAGE } = require('../../../infrastructure/config/constants');
const libs = require('../libraryLoader');
const { defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'responseValidator' });

/**
 * Validate and fix rewrites using rewrite validator
 *
 * @param {Object} intervention - { rewrite1, rewrite2 }
 * @param {string} originalText - Original message text
 * @param {Object} languageAnalysis - Language analysis result
 * @returns {Object} Validated/fixed intervention
 */
function validateRewrites(intervention, originalText, languageAnalysis) {
  if (!libs.rewriteValidator) {
    return intervention;
  }

  const validationResult = libs.rewriteValidator.validateIntervention(
    { rewrite1: intervention.rewrite1, rewrite2: intervention.rewrite2 },
    originalText
  );

  if (validationResult.valid) {
    return intervention;
  }

  logger.warn('Rewrite perspective validation failed', {
    rewrite1Valid: validationResult.rewrite1?.valid,
    rewrite2Valid: validationResult.rewrite2?.valid,
    originalMessagePreview: originalText.substring(0, MESSAGE.PREVIEW_LENGTH),
  });

  // Apply fallbacks for failed rewrites
  try {
    const fallbackModule = require('../../analysis/rewriteValidator/fallbacks');
    const fallbacks = fallbackModule.getFallbackRewrites(originalText, languageAnalysis);

    const fixed = { ...intervention };

    if (!validationResult.rewrite1.valid) {
      logger.debug('Applying fallback for rewrite1');
      fixed.rewrite1 = fallbacks.rewrite1;
    }
    if (!validationResult.rewrite2.valid) {
      logger.debug('Applying fallback for rewrite2');
      fixed.rewrite2 = fallbacks.rewrite2;
    }

    logger.debug('Perspective validation applied fallbacks', {
      category: fallbacks.category,
      originalRewrite1Failed: !validationResult.rewrite1.valid,
      originalRewrite2Failed: !validationResult.rewrite2.valid,
    });

    return fixed;
  } catch (err) {
    logger.warn('Failed to apply fallbacks', {
      error: err.message,
      originalMessagePreview: originalText?.substring(0, MESSAGE.PREVIEW_LENGTH),
    });
    return intervention;
  }
}

/**
 * Validate AI response against Code Layer analysis
 *
 * @param {Object} result - AI response
 * @param {Object} parsedMessage - Code Layer parsed message
 */
function validateCodeLayerResponse(result, parsedMessage) {
  if (!libs.codeLayerIntegration || !parsedMessage) {
    return;
  }

  const validation = libs.codeLayerIntegration.validateAIResponse(result, parsedMessage);

  if (!validation.valid && validation.errors.length > 0) {
    logger.warn('Code Layer response validation issues', {
      errors: validation.errors,
      action: result?.action,
    });
  }
}

module.exports = {
  validateRewrites,
  validateCodeLayerResponse,
};
