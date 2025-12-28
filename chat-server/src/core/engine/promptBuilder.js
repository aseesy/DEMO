/**
 * Prompt Builder
 *
 * Constructs the AI mediation prompt from all context sources.
 * Implements the 1-2-3 Framework: ADDRESS + ONE TIP + TWO REWRITES
 *
 * CONSTITUTION REFERENCE (004-ai-mediation-constitution):
 * All prompts MUST comply with: ../policies/constitution.md
 *
 * @module liaizen/core/promptBuilder
 */

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You analyze co-parenting messages. When intervening, provide: (1) validation - show deep understanding of their SPECIFIC situation with concrete details, child names, and context (attuned and empathetic), (2) insight - explain WHY their approach won't work and WHAT would work better, (3) two rewrites - these are REWRITTEN VERSIONS of the sender's original message. The sender wants to say the SAME THING but more constructively. If the original says "You never let me..." the rewrite might be "I'd like to...". Same person, same intent, better words. NEVER write a response TO the message. JSON only.`;

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
  taskContextForAI,
  flaggedMessagesContext,
}) {
  // Build relationship context
  const relationshipContext = contactContextForAI
    ? `\n\nRELATIONSHIP CONTEXT:\n${contactContextForAI}\n\nIMPORTANT: ${senderDisplayName} is messaging ${receiverDisplayName} (their co-parent). Only reference contacts that are RELEVANT to the current message. If a contact wasn't involved in the situation being discussed, don't mention them. These two people share children but are no longer together.${insightsString || ''}${taskContextForAI ? `\n\nACTIVE PARENTING TASKS:\n${taskContextForAI}` : ''}${flaggedMessagesContext || ''}`
    : `\n\nRELATIONSHIP CONTEXT:\n${senderDisplayName} is messaging ${receiverDisplayName}. These are co-parents sharing children but no longer together.${insightsString || ''}${taskContextForAI ? `\n\nACTIVE PARENTING TASKS:\n${taskContextForAI}` : ''}${flaggedMessagesContext || ''}`;

  return `Analyze this co-parenting message. Decide: STAY_SILENT, INTERVENE, or COMMENT.

STAY_SILENT (default): Allow these WITHOUT intervention:
- Polite requests ("I was wondering if...", "Could I...", "Would it be okay...")
- Custody exchange requests (asking to swap time, take the child somewhere)
- Scheduling and logistics
- Questions about the child
- Imperfect but non-hostile phrasing
- Acknowledgments of the other parent's time ("I know it's your night but...")

INTERVENE: ONLY for messages that clearly attack, blame, use contempt, guilt-trip, or weaponize the child.
When in doubt, STAY_SILENT. A polite request should NEVER trigger intervention.

MESSAGE FROM ${senderDisplayName}: "${messageText}"

${relationshipContext}
${graphContextString || ''}
${valuesContextString || ''}
${userIntelligenceContextString || ''}
${receiverIntelligenceContextString || ''}
${profileContextString || ''}
${coparentingContextString || ''}
${messageHistory ? `Recent messages:\n${messageHistory}\n` : ''}
${codeLayerPromptSection || ''}
${voiceSignatureSection ? `\n${voiceSignatureSection}\n` : ''}
${conversationPatternsSection ? `\n${conversationPatternsSection}\n` : ''}
${interventionLearningSection ? `\n${interventionLearningSection}\n` : ''}
${roleAwarePromptSection ? `\n${roleAwarePromptSection}\n` : ''}

IF YOU INTERVENE, provide THREE parts:

1. validation: 1-2 sentences that normalize the reaction without taking sides.

   PRINCIPLES (guide your response, don't copy phrases):
   - Normalize: This is a natural response, not a flaw
   - Externalize: Frame as brain/body reaction, not "you being crazy"
   - Universalize: All humans respond this way, not just them
   - Depersonalize: About the nervous system, not the other person being evil
   - No "I" statements, no therapeutic language, no agreeing they're right

   Make it specific to THEIR situation — varied, contextual, relevant to what they said.

2. refocusQuestions: THREE brief, compassionate questions to shift from reactivity to responsiveness.

   PURPOSE: When upset, the emotional brain is in overdrive. These questions gently engage the prefrontal cortex to create space between feeling and reaction. They replace certainty with curiosity — not to excuse harmful behavior, but to communicate in a way that's more likely to be heard.

   ⚠️ CRITICAL: CUSTOMIZE each question to their SPECIFIC situation. Don't use generic templates — rewrite each question to reference what they actually said, the specific person, the actual circumstance.

   PICK 3 QUESTIONS FROM DIFFERENT CATEGORIES AND CUSTOMIZE THEM:

   🔍 AWARENESS (notice emotional state without judgment):
   - "Is this more about being hurt or being scared?"
   - "What are you feeling underneath the anger?"
   Why: Naming emotions reduces their intensity (affect labeling).

   🎯 INTENTION (clarify what they truly want):
   - "What do you really need from them right now?"
   - "What outcome would actually help here?"
   - "Are you trying to be heard, or trying to hurt?"
   Why: Shifts from blame/venting toward purposeful communication.

   🌍 CONTEXT & CIRCUMSTANCE (what else might be true?):
   - "What pressures might they be under that you don't see?"
   - "Could this be about their situation — not about you?"
   - "Is it possible they're doing the best they can right now?"
   Why: Shifts from "They did this TO me" to "They did this IN THE MIDDLE OF their own struggle."

   🧩 ASSUMPTION-CHALLENGING (am I mistaking my story for truth?):
   - "What evidence do you actually have about their intent?"
   - "Are you assuming malice where there might be stress or misunderstanding?"
   - "If you gave them the benefit of the doubt, what's a kinder explanation?"
   Why: Exposes the mind's tendency to fill gaps with negative narratives — invites curiosity instead.

   ⏳ CONSEQUENCE (how will this play out long-term?):
   - "Will this matter in a week? A month?"
   - "Is being 'right' more important than preserving this relationship?"
   - "What kind of co-parent do you want to be in this moment?"
   Why: Connects present reactions to deeper values and long-term well-being.

   🤝 SYSTEMIC & RELATIONAL (how do we both play a role?):
   - "Have you contributed to this tension — even unintentionally?"
   - "Are there patterns here that go beyond this one incident?"
   - "What if this isn't about blame — but about unmet needs on both sides?"
   Why: Moves from "me vs them" to "us vs the problem."

   🗣️ MESSAGE-TESTING (filter before sending):
   - "Will this bring you closer or push you apart?"
   - "Would you feel respected if someone said this to you?"
   Why: Creates a pause for editing emotional impulses into constructive language.

   CUSTOMIZATION EXAMPLES:
   - Generic: "What pressures might they be under?"
   - Customized: "Could the late pickup be about work stress you don't see?"

   - Generic: "What do you really need?"
   - Customized: "Do you need them to apologize, or just acknowledge the impact?"

   - Generic: "Is being right more important than the relationship?"
   - Customized: "Is proving they forgot more important than planning the next birthday together?"

   CRITICAL RULES:
   - CUSTOMIZE each question to their specific message and situation
   - Questions must probe what the user HASN'T already expressed
   - Keep questions SHORT and GROUNDING
   - Be COMPASSIONATE, not critical
   - Pick from DIFFERENT categories to open multiple angles

   BAD EXAMPLES:
   ❌ Generic questions copied from templates
   ❌ "How did that make you feel?" (if they already expressed feelings)
   ❌ "Why are you upset?" (too clinical, pressuring)
   ❌ Questions that add guilt or self-criticism
   ❌ Three questions from the same category

3. rewrite1 and rewrite2: These are REWRITTEN VERSIONS of the sender's original message.

   ⚠️ CRITICAL: The sender (${senderDisplayName}) wants to express the SAME THING differently.

   EXAMPLE:
   - Original: "You never let me see the kids on time!"
   - CORRECT rewrite: "I'd really appreciate sticking to the schedule so I can make the most of my time with them."
   - WRONG (this is a response, NOT a rewrite): "I understand you want more time. Let's discuss the schedule."

   The rewrite must:
   - Express the SAME concern/request as the original
   - Be something ${senderDisplayName} would send INSTEAD of their original
   - NOT be what ${receiverDisplayName} would reply back

   RULES:
   - The rewrite IS ${senderDisplayName} speaking — same person, same concern, better delivery
   - If original asks "can I take Vira to a movie?" rewrite also asks about taking Vira to a movie
   - If original complains about schedule, rewrite also addresses schedule (but constructively)
   - DO NOT write a response to the message (that would be ${receiverDisplayName}'s reply)
   - DO NOT start with "I understand you..." or "I hear that you..." (those are receiver responses)
   - Only mention people who are RELEVANT to the situation
   - Use child names when discussing their experiences
   - FOCUS ON THE CHILD'S SPECIFIC EXPERIENCE, not abstract principles
     - "She says her tummy hurts after" NOT "healthy eating is important"
     - "He had trouble sleeping" NOT "consistent bedtimes matter"
   - Sound like a real person — NOT corporate or preachy

   VARY THE APPROACH — pick TWO DIFFERENT strategies for rewrite1 and rewrite2:
   A) ACKNOWLEDGMENT FIRST: Start with something positive, then concern
   B) CHILD'S VOICE: Lead with what the child said/experienced
   C) PRACTICAL OFFER: Offer a specific alternative or solution
   D) SIMPLE & DIRECT: Just state the concern without extra padding
   E) CURIOUS QUESTION: Frame as genuinely wondering, not accusing

   GOOD EXAMPLES (note: different approaches):
   - [A] "Thanks for handling dinner. She mentioned her tummy hurt after — any chance we could mix in something lighter sometimes?"
   - [B] "She told me her stomach felt off after eating. Maybe less McDonald's would help?"
   - [C] "I can prep some easy meals for your nights if that helps? She's been getting tummy aches."
   - [D] "McDonald's seems to upset her stomach. Can we try something else?"
   - [E] "Has she mentioned anything about how her tummy feels after fast food?"

   BAD EXAMPLES:
   ❌ "Per our agreement, pickup was scheduled for 7:30" (corporate/legal)
   ❌ "Healthy eating is important for children" (preachy/abstract)
   ❌ Mentioning people not involved in the situation (if discussing child's meal, don't mention other contacts)
   ❌ "I would appreciate if you could..." (stiff)
   ❌ Two rewrites that are basically the same with minor word changes

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
