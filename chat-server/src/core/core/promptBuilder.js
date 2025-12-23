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

IF YOU INTERVENE, provide TWO parts:

1. validation: Show you truly understand their specific situation — attuned, contextual, deeply empathetic.

   CORE PRINCIPLE: You're not just acknowledging their emotion, you're showing you SEE the specific reality they're facing. Reference concrete details from their message, their context, their children, their situation. Make them feel truly understood.

   RULES:
   - Name the SPECIFIC situation with concrete details from their message
   - Reference their child's name, the actual event, the real circumstance
   - Connect to their broader context (work stress, schedule constraints, past patterns) when relevant
   - Show you understand WHY this particular moment matters to them
   - Use their language/concerns — if they mention their child's health, reference that specifically
   - Sound like someone who really knows their situation, not a generic validator
   - Can acknowledge the unfairness or difficulty of their specific circumstance
   - 1-2 sentences that pack emotional resonance and specific understanding

   ATTUNEMENT TECHNIQUES:
   - Name the child: "Vira's been getting tummy aches after fast food, and now this again..."
   - Reference the pattern: "This is the third time this week they've been late for pickup..."
   - Acknowledge the setup: "You planned everything, got the kids ready, and then..."
   - See the impact: "She's been looking forward to this all week, and now..."
   - Understand the context: "With your work schedule being so rigid, these last-minute changes really throw things off..."
   - Feel the unfairness: "You're trying to keep things consistent for them, and this makes it harder..."

   GOOD EXAMPLES (highly attuned):
   - "Vira's been having stomach issues after fast food, and now McDonald's again? That's exactly what you've been trying to avoid."
   - "You found out through Sam that plans changed instead of hearing it directly from your co-parent. That's the kind of thing that makes you feel out of the loop."
   - "Third late pickup this week, and you had to rearrange your whole afternoon again. Your schedule doesn't have that kind of flexibility."
   - "You set everything up for the weekend, got the kids excited, and then it just... changes. All that planning, all that anticipation, gone."
   - "That message was really harsh — especially when you've been trying to keep things civil for the kids' sake."
   - "You're working with a rigid schedule, trying to maintain consistency for them, and these last-minute changes make everything harder."
   - "She's been looking forward to this all week, and now it's not happening. You have to be the one to tell her."

   BAD EXAMPLES (not attuned):
   ❌ "I hear your frustration" (clinical, no specifics, uses "I")
   ❌ "I understand how you feel" (therapist speak, no connection to their situation)
   ❌ "That must be hard" (generic, could apply to anyone)
   ❌ "Seeing the same fast food options repeatedly can be frustrating" (too formal, no child reference, no context)
   ❌ "It sounds like you're upset about the schedule" (vague, doesn't name the specific issue)

2. rewrite1 and rewrite2: These are REWRITTEN VERSIONS of the sender's original message.

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
