/**
 * Prompt Builder
 *
 * Constructs the AI mediation prompt from all context sources.
 * Implements the 1-2-3 Framework: ADDRESS + ONE TIP + TWO REWRITES
 *
 * CONSTITUTION REFERENCE (004-ai-mediation-constitution):
 * All prompts MUST comply with: ../policies/constitution.md
 * Constitution principles are taught via few-shot examples, not embedded in prompt.
 *
 * @module liaizen/core/promptBuilder
 */

const { getFewShotExamples } = require('./prompts/fewShotExamples');

// ============================================================================
// SYSTEM PROMPT (SIMPLIFIED - Constitution moved to few-shot examples)
// ============================================================================

const SYSTEM_PROMPT = `You analyze co-parenting messages and decide: STAY_SILENT, INTERVENE, or COMMENT.

CORE RULES:
1. Language, not emotions - describe phrasing mechanics, never diagnose feelings
2. No diagnostics - never use psychological labels (narcissist, manipulative, etc.)
3. Sender-first - rewrites are what the SENDER could send instead, not receiver responses
4. Child-centric - when children are mentioned, frame around their wellbeing

STAY_SILENT (default) for: polite requests, scheduling, logistics, questions about children, acknowledgments.
INTERVENE only for: clear attacks, blame, contempt, guilt-tripping, weaponizing children.
COMMENT for: brief helpful observations (max 1-2 per conversation).

When INTERVENING, provide JSON with:
- validation: 1-2 sentences normalizing their reaction (specific to their situation)
- refocusQuestions: 3 brief questions to shift from reactivity to responsiveness (from different categories)
- rewrite1 & rewrite2: TWO rewritten versions of their original message (same person, same intent, better words)

JSON only.`;

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

/**
 * Build the main mediation prompt
 *
 * @param {Object} params - All context and message data
 * @returns {string} Complete prompt for AI
 */
function buildMediationPrompt({
  messageText,
  senderDisplayName,
  receiverDisplayName,
  messageHistory,
  contactContextForAI,
  graphContextString,
  valuesContextString,
  userIntelligenceContextString,
  receiverIntelligenceContextString,
  profileContextString,
  coparentingContextString,
  codeLayerPromptSection,
  voiceSignatureSection,
  conversationPatternsSection,
  interventionLearningSection,
  roleAwarePromptSection,
  insightsString,
  humanUnderstandingString,
  taskContextForAI,
  flaggedMessagesContext,
  dualBrainContextString,
  threadContext = null,
}) {
  // Build thread context section if message is in a thread
  const threadContextSection = threadContext
    ? `\n\nTHREAD CONTEXT:\nThis message is being sent in the thread "${threadContext}". Threads help organize conversations by topic (medical, education, schedule, etc.). When providing coaching, acknowledge that this is part of an ongoing thread discussion. If the thread category is relevant (e.g., medical, safety), consider that context when crafting your response.`
    : '';

  // Build relationship context
  const relationshipContext = contactContextForAI
    ? `\n\nRELATIONSHIP CONTEXT:\n${contactContextForAI}\n\nIMPORTANT: ${senderDisplayName} is messaging ${receiverDisplayName} (their co-parent). Only reference contacts that are RELEVANT to the current message. If a contact wasn't involved in the situation being discussed, don't mention them. These two people share children but are no longer together.${insightsString || ''}${taskContextForAI ? `\n\nACTIVE PARENTING TASKS:\n${taskContextForAI}` : ''}${flaggedMessagesContext || ''}${threadContextSection}`
    : `\n\nRELATIONSHIP CONTEXT:\n${senderDisplayName} is messaging ${receiverDisplayName}. These are co-parents sharing children but no longer together.${insightsString || ''}${taskContextForAI ? `\n\nACTIVE PARENTING TASKS:\n${taskContextForAI}` : ''}${flaggedMessagesContext || ''}${threadContextSection}`;

  // Get few-shot examples (1 intervention, 1 stay silent) - only include when needed
  // Few-shot examples are more efficient than verbose instructions but still cost tokens
  // Only include if this is likely an intervention case (can be optimized further)
  const fewShotExamples = getFewShotExamples(1);

  return `Analyze this co-parenting message. Decide: STAY_SILENT, INTERVENE, or COMMENT.

${fewShotExamples}

---

CURRENT MESSAGE FROM ${senderDisplayName}: "${messageText}"

${humanUnderstandingString ? `\n${humanUnderstandingString}\n` : ''}
${dualBrainContextString ? `\n=== DUAL-BRAIN CONTEXT (Narrative Memory + Social Map) ===\n${dualBrainContextString}\n` : ''}
${relationshipContext}
${graphContextString || ''}
${valuesContextString || ''}
${userIntelligenceContextString || ''}
${receiverIntelligenceContextString || ''}
${profileContextString || ''}
${coparentingContextString || ''}
${
  messageHistory
    ? `\n=== CONVERSATION HISTORY (READ CAREFULLY FOR SITUATION CONTEXT) ===
${messageHistory}

⚠️ CRITICAL: Extract SPECIFIC situational details from this conversation history:
- What specific event or situation is being discussed? (e.g., "late pickup last Tuesday", "doctor appointment for Emma", "missed soccer practice")
- What child names are mentioned? Use these EXACT names in your validation and rewrites
- What specific dates, times, or events occurred? Reference these concretely
- What has been the back-and-forth pattern? What responses have already been given?
- What underlying issue is being discussed? (scheduling, health, school, behavior, etc.)

Your validation and rewrites MUST reference these SPECIFIC details from the conversation - don't use generic placeholders.
\n`
    : ''
}
${codeLayerPromptSection || ''}
${voiceSignatureSection ? `\n${voiceSignatureSection}\n` : ''}
${conversationPatternsSection ? `\n${conversationPatternsSection}\n` : ''}
${interventionLearningSection ? `\n${interventionLearningSection}\n` : ''}
${roleAwarePromptSection ? `\n${roleAwarePromptSection}\n` : ''}

INSTRUCTIONS:
- Use context above to make validation and rewrites specific (child names, events, details)
- validation: 1-2 sentences normalizing their reaction (specific to their situation)
- refocusQuestions: 3 brief questions from different categories (awareness, intention, context, assumption-challenging, consequence, relational, message-testing)
- rewrite1 & rewrite2: TWO rewritten versions of their original message (same person, same intent, better words - NOT receiver responses)

Respond with JSON only:
{
  "action": "STAY_SILENT|INTERVENE|COMMENT",
  "escalation": {"riskLevel": "low|medium|high", "confidence": 0-100, "reasons": []},
  "emotion": {"currentEmotion": "neutral|frustrated|defensive", "stressLevel": 0-100},
  "intervention": {
    "validation": "Show deep understanding of their SPECIFIC situation — name the child, reference the concrete details, connect to their context. Make them feel truly seen and understood. Attuned, contextual, empathetic.",
    "refocusQuestions": ["Question 1 from different category", "Question 2 from different category", "Question 3 from different category"],
    "rewrite1": "Acknowledge + child's experience + solution + collaborative question",
    "rewrite2": "Different approach, same pattern: acknowledge, experience, solution, question"
  }
}`;
}

/**
 * Build profile context string for prompt
 *
 * @param {Object} profileContext - Profile context with combined summary
 * @returns {string} Formatted profile context for prompt
 */
function formatProfileContextForPrompt(profileContext) {
  if (!profileContext?.combinedSummary) {
    return '';
  }

  return `\n\n=== PARTICIPANT CONTEXT (for empathetic coaching) ===
${profileContext.combinedSummary}

COACHING GUIDANCE: Use this context to provide more understanding coaching. If a sender is under financial stress, be gentle when coaching messages about expenses. If someone is in recovery, be mindful about discussions involving substances. This context helps you coach with empathy.`;
}

/**
 * Build insights string for prompt
 *
 * @param {Object} insights - Relationship insights
 * @returns {string} Formatted insights for prompt
 */
function formatInsightsForPrompt(insights) {
  if (!insights) {
    return '';
  }

  return `\n\nLEARNED RELATIONSHIP INSIGHTS:
- Communication style: ${insights.communicationStyle || 'Not yet learned'}
- Common topics: ${insights.commonTopics?.join(', ') || 'Not yet learned'}
- Tension points: ${insights.tensionPoints?.join(', ') || 'None identified'}
- Positive patterns: ${insights.positivePatterns?.join(', ') || 'Not yet identified'}`;
}

module.exports = {
  SYSTEM_PROMPT,
  buildMediationPrompt,
  formatProfileContextForPrompt,
  formatInsightsForPrompt,
};
