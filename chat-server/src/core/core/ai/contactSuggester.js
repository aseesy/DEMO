/**
 * Contact Suggester
 *
 * Generates contact suggestion messages using AI.
 *
 * @module liaizen/core/ai/contactSuggester
 */

const openaiClient = require('../client');

/**
 * Generate a contact suggestion message
 *
 * @param {string} detectedName - The detected name
 * @param {string} messageContext - Context from the message
 * @returns {Promise<Object|null>} Suggestion object or null
 */
async function generateContactSuggestion(detectedName, messageContext) {
  if (!openaiClient.isConfigured()) {
    return null;
  }

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
    console.error('Error generating contact suggestion:', error.message);
    return null;
  }
}

module.exports = {
  generateContactSuggestion,
};
