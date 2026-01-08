/**
 * Contact Suggester
 *
 * Generates contact suggestion messages using AI.
 * NOTE: This should be user-triggered only (via API endpoint), not automatic.
 * Automatic suggestions removed to reduce costs.
 *
 * @module liaizen/core/ai/contactSuggester
 */

const openaiClient = require('../client');
const { isEnabled } = require('../../../infrastructure/config/featureFlags');
const { defaultLogger } = require('../../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'contactSuggester' });

/**
 * Generate a contact suggestion message
 *
 * @param {string} detectedName - The detected name
 * @param {string} messageContext - Context from the message
 * @returns {Promise<Object|null>} Suggestion object or null
 */
async function generateContactSuggestion(detectedName, messageContext) {
  // Only generate suggestions if feature flag is enabled (user-triggered)
  if (!isEnabled('AI_CONTACT_SUGGESTIONS')) {
    logger.debug('Contact suggestions disabled (feature flag)', {
      detectedName,
    });
    return null;
  }

  if (!openaiClient.isConfigured()) {
    logger.debug('OpenAI not configured, skipping contact suggestion');
    return null;
  }

  logger.debug('Generating contact suggestion', {
    detectedName,
    contextPreview: messageContext?.substring(0, 50),
  });

  try {
    const prompt = `Generate a brief, friendly message asking if user wants to add "${detectedName}" to contacts. Context: "${messageContext}"

Respond with ONLY the message text (1-2 sentences), no quotes.`;

    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Generate brief, friendly contact suggestion messages.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 60,
      temperature: 0.5,
    });

    const suggestionText = completion.choices[0].message.content.trim().replace(/^["']|["']$/g, '');

    return {
      type: 'contact_suggestion',
      detectedName,
      suggestionText,
      messageContext,
    };
  } catch (error) {
    logger.error('Error generating contact suggestion', {
      error: error.message,
      detectedName,
    });
    return null;
  }
}

module.exports = {
  generateContactSuggestion,
};
