/**
 * Situation Context
 *
 * Builds co-parenting situation and relationship context.
 * Includes graph database relationships and values profiles.
 *
 * @module liaizen/core/contexts/situationContext
 */

const libs = require('../libraryLoader');

/**
 * Build co-parenting situation context from contacts
 *
 * @param {Object} roleContext - { senderId, receiverId }
 * @param {Array} existingContacts - Sender's contacts
 * @param {string} messageText - Current message
 * @returns {Object} { contextString, messageGoal }
 */
function buildCoparentingContext(roleContext, existingContacts, messageText) {
  if (!libs.coparentContext || !roleContext?.senderId) {
    return { contextString: '', messageGoal: null };
  }

  try {
    const situationContext = libs.coparentContext.buildCoparentingContext(
      roleContext.senderId,
      roleContext.receiverId,
      existingContacts,
      null,
      null
    );

    if (!situationContext.hasContext) {
      return { contextString: '', messageGoal: null };
    }

    let contextString = '\n\n' + libs.coparentContext.formatContextForPrompt(situationContext);

    // Extract message goal for targeted rewrites
    const messageGoal = libs.coparentContext.extractMessageGoal(messageText, situationContext);

    if (messageGoal.topic !== 'general') {
      contextString += `\n\nMESSAGE TOPIC DETECTED: ${messageGoal.topic}`;
      if (messageGoal.specificDetail) {
        contextString += ` (mentions: ${messageGoal.specificDetail})`;
      }
      if (messageGoal.goal !== 'unknown') {
        contextString += `\nUNDERLYING GOAL: ${messageGoal.goal}`;
      }
      if (situationContext.childNames.length > 0) {
        contextString += `\nCHILD NAME(S) TO USE IN REWRITES: ${situationContext.childNames.join(', ')}`;
      }
    }

    return { contextString, messageGoal };
  } catch (err) {
    console.warn('⚠️ Situation Context: Failed to build co-parenting context:', err.message);
    return { contextString: '', messageGoal: null };
  }
}

/**
 * Build graph context from Neo4j relationship data
 *
 * @param {Object} roleContext - { senderId, receiverId }
 * @param {Map} participantProfiles - Pre-fetched profiles
 * @param {string} roomId - Room ID
 * @returns {Promise<string>} Formatted graph context string
 */
async function buildGraphContext(roleContext, participantProfiles, roomId) {
  if (!libs.graphContext || !roleContext?.senderId || !roleContext?.receiverId || !roomId) {
    return '';
  }

  try {
    const senderProfile = participantProfiles.get(roleContext.senderId.toLowerCase());
    const receiverProfile = participantProfiles.get(roleContext.receiverId.toLowerCase());

    if (!senderProfile?.id || !receiverProfile?.id) {
      return '';
    }

    const relationshipData = await libs.graphContext.getRelationshipContext(
      senderProfile.id,
      receiverProfile.id,
      roomId
    );

    if (!relationshipData?.formattedContext) {
      return '';
    }

    console.log(
      '📊 Situation Context: Graph context loaded -',
      relationshipData.insights?.healthIndicator || 'unknown',
      'relationship health'
    );

    return `\n\n=== RELATIONSHIP HISTORY (from graph database) ===
${relationshipData.formattedContext}

ATTUNEMENT GUIDANCE: Use this relationship history to calibrate your response. For high-conflict relationships, be extra gentle. For new relationships, provide more foundational guidance. For established relationships with few interventions, acknowledge their progress.`;
  } catch (err) {
    console.warn('⚠️ Situation Context: Failed to build graph context:', err.message);
    return '';
  }
}

/**
 * Build values context (learns from messages)
 *
 * @param {Object} roleContext - { senderId }
 * @param {Map} participantProfiles - Pre-fetched profiles
 * @param {string} messageText - Current message for learning
 * @returns {Promise<string>} Formatted values context
 */
async function buildValuesContext(roleContext, participantProfiles, messageText) {
  if (!libs.valuesProfile || !roleContext?.senderId) {
    return '';
  }

  try {
    const senderProfile = participantProfiles.get(roleContext.senderId.toLowerCase());
    if (!senderProfile?.id) {
      return '';
    }

    // Learn from this message
    await libs.valuesProfile.learnFromMessage(senderProfile.id, messageText);

    // Get formatted context
    const context = await libs.valuesProfile.formatForAI(senderProfile.id);

    if (context) {
      console.log('💡 Situation Context: Values context loaded');
    }

    return context || '';
  } catch (err) {
    console.warn('⚠️ Situation Context: Failed to build values context:', err.message);
    return '';
  }
}

module.exports = {
  buildCoparentingContext,
  buildGraphContext,
  buildValuesContext,
};
