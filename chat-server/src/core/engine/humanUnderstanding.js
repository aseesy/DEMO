/**
 * Human Understanding Module
 *
 * Generates deep insights about human psychology, relationships, and communication
 * that inform impactful intervention responses.
 *
 * This module creates understanding FIRST, then uses that understanding to generate
 * responses - rather than just following prompt templates.
 *
 * Key Principle: Generate genuine insights about human nature that inform
 * compassionate, contextually-aware responses.
 *
 * @module liaizen/core/humanUnderstanding
 */

const openaiClient = require('./client');
const { AI } = require('../../infrastructure/config/constants');
const { defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'humanUnderstanding' });

/**
 * Generate deep human understanding insights for a message situation
 *
 * This creates understanding BEFORE crafting a response, allowing the mediator
 * to draw from genuine psychological insight rather than just following prompts.
 *
 * @param {Object} params - Context for understanding generation
 * @param {string} params.messageText - The message being analyzed
 * @param {string} params.senderDisplayName - Sender's display name
 * @param {string} params.receiverDisplayName - Receiver's display name
 * @param {string} params.messageHistory - Recent conversation history
 * @param {string} params.relationshipContext - Relationship and contact context
 * @param {Object} params.senderProfile - Sender's profile information
 * @param {Object} params.receiverProfile - Receiver's profile information
 * @param {string} params.roleContext - Additional role context
 * @returns {Promise<Object>} Human understanding insights
 */
async function generateHumanUnderstanding({
  messageText,
  senderDisplayName,
  receiverDisplayName,
  messageHistory,
  relationshipContext,
  senderProfile,
  receiverProfile,
  roleContext,
}) {
  // Skip if OpenAI not configured
  if (!openaiClient.isConfigured()) {
    return null;
  }

  try {
    const understandingPrompt = `You are a wise observer of human nature, communication patterns, and relationship dynamics. Your role is to generate DEEP UNDERSTANDING about what's happening beneath the surface in this situation.

Your insights will inform a communication coach who helps people express themselves better. Generate genuine understanding - not just analysis, but perspective on human nature.

CONTEXT:
- Message from ${senderDisplayName} to ${receiverDisplayName}: "${messageText}"
${relationshipContext ? `\n\nRELATIONSHIP & SITUATION CONTEXT:\n${relationshipContext}` : ''}
${messageHistory ? `\n\nCONVERSATION HISTORY:\n${messageHistory}\n\n⚠️ ANALYZE THIS HISTORY: What specific situation, events, or issues are being discussed? What child names, dates, or concrete details are mentioned? What pattern has emerged in the conversation?` : ''}

GENERATE INSIGHTS ABOUT:

1. **Human Nature Perspective**: What universal human tendencies are at play here? What do humans typically need/feel/react when in this situation? Frame this as understanding of human nature, not diagnosis.

2. **Relational Dynamics**: What's happening between these two people? What patterns or dynamics are visible? Think about power, vulnerability, protection, connection needs.

3. **Underlying Needs**: What genuine needs is the sender trying to meet? What might they really be asking for (even if poorly expressed)? What need is driving this reaction?

4. **Context Factors**: What circumstances, pressures, or experiences might be influencing both people? What else might be true beyond what's visible?

5. **Communication Breakdown**: Why did this message form the way it did? What communication patterns or language choices led to this phrasing? What underlying need might they be trying to express (even if poorly worded)?

6. **Path Forward**: What kind of understanding would help the sender? What perspective shift could make a difference? How can they express their underlying need in a way that gets met?

IMPORTANT PRINCIPLES:
- Frame as understanding of human nature and communication patterns, not as emotional diagnosis or labeling
- Be compassionate and non-judgmental
- Focus on universal human experiences, needs, and communication mechanics
- Think about what's beneath the surface in terms of needs and patterns, not emotional states
- Consider both people's perspectives without taking sides
- Ground insights in communication theory and language mechanics
- Avoid clinical terminology, pathologizing, or emotional diagnosis
- Describe communication patterns and needs, not feelings or mental states

Respond with a JSON object:
{
  "humanNature": "Insights about universal human tendencies at play",
  "relationalDynamics": "Understanding of what's happening between these people",
  "underlyingNeeds": "What genuine needs the sender is trying to meet",
  "contextFactors": "Circumstances, pressures, experiences influencing both people",
  "communicationBreakdown": "Why this message formed the way it did",
  "pathForward": "What understanding or perspective shift would help"
}`;

    const completion = await openaiClient.createChatCompletion({
      model: AI.DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a wise observer of human nature and relationships. Generate deep, compassionate insights about what drives human communication and behavior. Your insights inform communication coaching that helps people express themselves better.',
        },
        { role: 'user', content: understandingPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.7, // Slightly higher temperature for more creative, insightful responses
    });

    const responseText = completion.choices[0].message.content.trim();

    // Try to extract JSON from response (handle markdown code blocks)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const insights = JSON.parse(jsonText);

    logger.debug('Generated deep human understanding insights');
    return insights;
  } catch (error) {
    logger.error('Failed to generate human understanding insights', {
      error: error.message,
      stack: error.stack,
      responseData: error.response?.data
        ? JSON.stringify(error.response.data).substring(0, 200)
        : undefined,
    });
    // Return null on error - system can continue without understanding layer
    // This is non-critical, so we fail gracefully
    return null;
  }
}

/**
 * Format human understanding insights for inclusion in mediation prompt
 *
 * @param {Object} insights - Human understanding insights object
 * @returns {string} Formatted insights string for prompt
 */
function formatUnderstandingForPrompt(insights) {
  if (!insights) {
    return '';
  }

  return `
╔════════════════════════════════════════════════════════════════╗
║         DEEP HUMAN UNDERSTANDING - USE THIS FIRST              ║
╚════════════════════════════════════════════════════════════════╝

⚠️ CRITICAL: The insights below are GENERATED understanding about human nature, 
not templated instructions. You MUST draw from these specific insights when crafting 
your validation, questions, and rewrites. Do not use generic responses - reference 
the specific dynamics, needs, and context factors described here.

HUMAN NATURE PERSPECTIVE:
${insights.humanNature || 'Not available'}

RELATIONAL DYNAMICS:
${insights.relationalDynamics || 'Not available'}

UNDERLYING NEEDS (use these to inform rewrites):
${insights.underlyingNeeds || 'Not available'}

CONTEXT FACTORS (consider these in validation):
${insights.contextFactors || 'Not available'}

COMMUNICATION BREAKDOWN (explain this in validation):
${insights.communicationBreakdown || 'Not available'}

PATH FORWARD (use this to guide rewrites):
${insights.pathForward || 'Not available'}

⚡ REQUIREMENTS FOR YOUR RESPONSE:
- Validation MUST reference specific dynamics or needs from above (not generic)
- Questions MUST probe the underlying needs or context factors identified above
- Rewrites MUST address the underlying need revealed above, not just rephrase the surface message
- Your entire response should feel informed by this deep understanding, not templated

If you ignore these insights and use generic templates, your response will fail to be impactful.`;
}

module.exports = {
  generateHumanUnderstanding,
  formatUnderstandingForPrompt,
};
