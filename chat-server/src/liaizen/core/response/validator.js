/**
 * Response Validator
 *
 * Validates AI response rewrites and Code Layer analysis.
 *
 * @module liaizen/core/response/validator
 */

const { MESSAGE } = require('../../../utils/constants');
const libs = require('../libraryLoader');

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

  console.warn('⚠️ Validator: Rewrite perspective validation failed:', {
    rewrite1: validationResult.rewrite1,
    rewrite2: validationResult.rewrite2,
    originalMessage: originalText.substring(0, MESSAGE.PREVIEW_LENGTH),
  });

  // Apply fallbacks for failed rewrites
  try {
    const fallbackModule = require('../../analysis/rewrite-validator/fallbacks');
    const fallbacks = fallbackModule.getFallbackRewrites(originalText, languageAnalysis);

    const fixed = { ...intervention };

    if (!validationResult.rewrite1.valid) {
      console.log('📝 Applying fallback for rewrite1');
      fixed.rewrite1 = fallbacks.rewrite1;
    }
    if (!validationResult.rewrite2.valid) {
      console.log('📝 Applying fallback for rewrite2');
      fixed.rewrite2 = fallbacks.rewrite2;
    }

    console.log('📊 Perspective validation applied fallbacks:', {
      category: fallbacks.category,
      originalRewrite1Failed: !validationResult.rewrite1.valid,
      originalRewrite2Failed: !validationResult.rewrite2.valid,
    });

    return fixed;
  } catch (err) {
    console.warn('⚠️ Validator: Failed to apply fallbacks:', err.message);
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
    console.warn('⚠️ Validator: Code Layer response validation issues:');
    validation.errors.forEach(err => console.warn(`   - ${err}`));
  }
}

module.exports = {
  validateRewrites,
  validateCodeLayerResponse,
};
