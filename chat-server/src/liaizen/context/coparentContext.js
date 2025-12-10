/**
 * Co-Parent Context Module
 *
 * Builds rich situational context for AI mediation by extracting
 * co-parenting dynamics from the database:
 * - Child ages and custody arrangements
 * - Separation duration and conflict history
 * - Relationship dynamics (new partners, friction areas)
 * - Safety concerns and sensitive topics
 *
 * This context helps the AI provide SPECIFIC, SITUATIONAL coaching
 * rather than generic advice.
 *
 * @module context/coparentContext
 * @version 1.0.0
 */

'use strict';

// ============================================================================
// CONTEXT EXTRACTION
// ============================================================================

/**
 * Calculate months since a date
 * @param {string} dateStr - ISO date string or YYYY-MM-DD
 * @returns {number|null} Months since date, or null if invalid
 */
function monthsSince(dateStr) {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    const now = new Date();
    const months = (now.getFullYear() - date.getFullYear()) * 12 +
                   (now.getMonth() - date.getMonth());
    return Math.max(0, months);
  } catch {
    return null;
  }
}

/**
 * Calculate age from birthdate
 * @param {string} birthdate - ISO date string or YYYY-MM-DD
 * @returns {number|null} Age in years, or null if invalid
 */
function calculateAge(birthdate) {
  if (!birthdate) return null;

  try {
    const birth = new Date(birthdate);
    if (isNaN(birth.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }

    return Math.max(0, age);
  } catch {
    return null;
  }
}

/**
 * Build child context from contacts
 * @param {Array} contacts - User's contacts
 * @returns {Object} Child context
 */
function buildChildContext(contacts) {
  const children = contacts.filter(c => c.relationship === 'child');

  if (children.length === 0) {
    return {
      hasChildren: false,
      childNames: [],
      childAges: [],
      childAgeRange: null,
      custodyArrangement: null
    };
  }

  const childNames = children.map(c => c.name).filter(Boolean);
  const childAges = children
    .map(c => c.child_age || calculateAge(c.child_birthdate))
    .filter(age => age !== null);

  // Get custody arrangement from first child (usually same for all)
  const custodyArrangement = children.find(c => c.custody_arrangement)?.custody_arrangement;

  // Determine age range description
  let childAgeRange = null;
  if (childAges.length > 0) {
    const minAge = Math.min(...childAges);
    const maxAge = Math.max(...childAges);

    if (minAge <= 5) childAgeRange = 'young_children';
    else if (minAge <= 12) childAgeRange = 'school_age';
    else if (minAge <= 17) childAgeRange = 'teenagers';
    else childAgeRange = 'adult_children';
  }

  return {
    hasChildren: true,
    childNames,
    childAges,
    childAgeRange,
    custodyArrangement: normalizeCustodyArrangement(custodyArrangement)
  };
}

/**
 * Normalize custody arrangement to standard values
 */
function normalizeCustodyArrangement(arrangement) {
  if (!arrangement) return 'unknown';

  const lower = arrangement.toLowerCase();

  if (lower.includes('50') || lower.includes('equal') || lower.includes('shared')) {
    return 'equal_shared';
  }
  if (lower.includes('primary') && lower.includes('sender')) {
    return 'sender_primary';
  }
  if (lower.includes('primary') && lower.includes('other')) {
    return 'receiver_primary';
  }
  if (lower.includes('primary')) {
    return 'one_primary';
  }
  if (lower.includes('visit') || lower.includes('weekend')) {
    return 'visitation';
  }

  return 'other';
}

/**
 * Build co-parent relationship context
 * @param {Array} contacts - User's contacts
 * @returns {Object} Co-parent context
 */
function buildCoparentRelationshipContext(contacts) {
  // Find the co-parent contact
  const coparent = contacts.find(c => c.relationship === 'coparent');

  if (!coparent) {
    return {
      hasCoparentInfo: false,
      separationMonths: null,
      separationPhase: null,
      frictionAreas: [],
      hasLegalMatters: false,
      hasSafetyConcerns: false,
      hasSubstanceConcerns: false,
      communicationChallenges: []
    };
  }

  const separationMonths = monthsSince(coparent.separation_date);

  // Determine separation phase
  let separationPhase = 'unknown';
  if (separationMonths !== null) {
    if (separationMonths < 6) separationPhase = 'very_recent';
    else if (separationMonths < 12) separationPhase = 'recent';
    else if (separationMonths < 24) separationPhase = 'adjusting';
    else if (separationMonths < 60) separationPhase = 'established';
    else separationPhase = 'long_term';
  }

  // Extract friction areas
  const frictionAreas = extractFrictionAreas(coparent);

  // Extract communication challenges
  const communicationChallenges = extractCommunicationChallenges(coparent);

  return {
    hasCoparentInfo: true,
    separationMonths,
    separationPhase,
    frictionAreas,
    hasLegalMatters: Boolean(coparent.legal_matters && coparent.legal_matters.trim()),
    hasSafetyConcerns: Boolean(coparent.safety_concerns && coparent.safety_concerns.trim()),
    hasSubstanceConcerns: Boolean(coparent.substance_mental_health && coparent.substance_mental_health.trim()),
    hasAbuseConcerns: Boolean(coparent.neglect_abuse_concerns && coparent.neglect_abuse_concerns.trim()),
    communicationChallenges
  };
}

/**
 * Extract friction areas from co-parent contact
 */
function extractFrictionAreas(coparent) {
  const areas = [];
  const text = `${coparent.difficult_aspects || ''} ${coparent.friction_situations || ''}`.toLowerCase();

  if (text.includes('money') || text.includes('financ') || text.includes('support') || text.includes('expense')) {
    areas.push('financial');
  }
  if (text.includes('schedule') || text.includes('time') || text.includes('pickup') || text.includes('drop')) {
    areas.push('scheduling');
  }
  if (text.includes('partner') || text.includes('girlfriend') || text.includes('boyfriend') || text.includes('dating')) {
    areas.push('new_partners');
  }
  if (text.includes('parent') || text.includes('discipline') || text.includes('rules')) {
    areas.push('parenting_styles');
  }
  if (text.includes('communication') || text.includes('talk') || text.includes('respond')) {
    areas.push('communication');
  }
  if (text.includes('court') || text.includes('legal') || text.includes('lawyer') || text.includes('custody')) {
    areas.push('legal');
  }
  if (text.includes('family') || text.includes('grandparent') || text.includes('in-law')) {
    areas.push('extended_family');
  }

  return areas;
}

/**
 * Extract communication challenges
 */
function extractCommunicationChallenges(coparent) {
  const challenges = [];
  const text = (coparent.communication_challenges || '').toLowerCase();

  if (text.includes('ignore') || text.includes('respond') || text.includes('silent')) {
    challenges.push('unresponsive');
  }
  if (text.includes('angry') || text.includes('hostile') || text.includes('attack')) {
    challenges.push('hostile');
  }
  if (text.includes('manipulat') || text.includes('twist') || text.includes('lie')) {
    challenges.push('manipulation');
  }
  if (text.includes('blame') || text.includes('fault') || text.includes('accuse')) {
    challenges.push('blame');
  }
  if (text.includes('control') || text.includes('demand') || text.includes('dictate')) {
    challenges.push('controlling');
  }

  return challenges;
}

/**
 * Check for new partner dynamics
 * @param {Array} contacts - User's contacts
 * @returns {Object} Partner context
 */
function buildPartnerContext(contacts) {
  // Look for partner relationships
  const senderPartner = contacts.find(c =>
    c.relationship === 'partner' || c.relationship === 'spouse'
  );

  // Co-parent's partner info might be in notes or additional contacts
  // For now, check if "new partner" is mentioned as a friction area
  const coparent = contacts.find(c => c.relationship === 'coparent');
  const receiverHasPartner = coparent?.friction_situations?.toLowerCase().includes('partner') ||
                              coparent?.difficult_aspects?.toLowerCase().includes('partner');

  return {
    senderHasNewPartner: Boolean(senderPartner),
    receiverMayHaveNewPartner: receiverHasPartner
  };
}

// ============================================================================
// MAIN CONTEXT BUILDER
// ============================================================================

/**
 * Build complete co-parenting context for AI mediation
 *
 * @param {string} senderId - Sender's user ID or username
 * @param {string} receiverId - Receiver's user ID or username
 * @param {Array} senderContacts - Sender's contacts from database
 * @param {Object} senderProfile - Sender's user profile (optional)
 * @param {Object} receiverProfile - Receiver's user profile (optional)
 * @returns {Object} Complete co-parenting context
 */
function buildCoparentingContext(senderId, receiverId, senderContacts = [], senderProfile = null, receiverProfile = null) {
  const childContext = buildChildContext(senderContacts);
  const coparentContext = buildCoparentRelationshipContext(senderContacts);
  const partnerContext = buildPartnerContext(senderContacts);

  // Estimate conflict level from available data
  let conflictLevel = 'unknown';
  if (coparentContext.hasCoparentInfo) {
    const severity = [
      coparentContext.hasLegalMatters,
      coparentContext.hasSafetyConcerns,
      coparentContext.hasAbuseConcerns,
      coparentContext.hasSubstanceConcerns,
      coparentContext.communicationChallenges.includes('hostile'),
      coparentContext.frictionAreas.length > 3
    ].filter(Boolean).length;

    if (severity >= 3) conflictLevel = 'high';
    else if (severity >= 1) conflictLevel = 'moderate';
    else conflictLevel = 'low';
  }

  return {
    // IDs
    senderId,
    receiverId,

    // Child context
    ...childContext,

    // Co-parent relationship
    separationMonths: coparentContext.separationMonths,
    separationPhase: coparentContext.separationPhase,
    conflictLevel,
    frictionAreas: coparentContext.frictionAreas,
    communicationChallenges: coparentContext.communicationChallenges,

    // Sensitive flags (abstracted - no details)
    hasLegalMatters: coparentContext.hasLegalMatters,
    hasSafetyConcerns: coparentContext.hasSafetyConcerns,
    hasSubstanceConcerns: coparentContext.hasSubstanceConcerns,
    hasAbuseConcerns: coparentContext.hasAbuseConcerns,

    // Partner dynamics
    senderHasNewPartner: partnerContext.senderHasNewPartner,
    receiverMayHaveNewPartner: partnerContext.receiverMayHaveNewPartner,

    // Meta
    hasContext: childContext.hasChildren || coparentContext.hasCoparentInfo
  };
}

// ============================================================================
// AI PROMPT FORMATTING
// ============================================================================

/**
 * Format co-parenting context for AI prompt
 * Creates a structured summary the AI can use for situational coaching
 *
 * @param {Object} context - From buildCoparentingContext()
 * @returns {string} Formatted context for AI prompt
 */
function formatContextForPrompt(context) {
  if (!context || !context.hasContext) {
    return '';
  }

  const sections = [];
  sections.push('=== CO-PARENTING SITUATION CONTEXT ===');
  sections.push('Use this context to provide SPECIFIC, SITUATIONAL coaching.\n');

  // Children
  if (context.hasChildren) {
    sections.push('CHILDREN:');
    if (context.childNames.length > 0) {
      sections.push(`  Names: ${context.childNames.join(', ')}`);
    }
    if (context.childAges.length > 0) {
      sections.push(`  Ages: ${context.childAges.join(', ')}`);
    }
    if (context.custodyArrangement && context.custodyArrangement !== 'unknown') {
      const arrangementDesc = {
        'equal_shared': '50/50 shared custody',
        'sender_primary': 'Sender has primary custody',
        'receiver_primary': 'Co-parent has primary custody',
        'one_primary': 'One parent has primary custody',
        'visitation': 'Visitation arrangement'
      }[context.custodyArrangement] || context.custodyArrangement;
      sections.push(`  Custody: ${arrangementDesc}`);
    }
    sections.push('');
  }

  // Separation
  if (context.separationPhase && context.separationPhase !== 'unknown') {
    const phaseDesc = {
      'very_recent': 'Very recent separation (< 6 months) - emotions likely still raw',
      'recent': 'Recent separation (6-12 months) - still adjusting',
      'adjusting': 'Adjusting phase (1-2 years) - patterns forming',
      'established': 'Established co-parenting (2-5 years)',
      'long_term': 'Long-term co-parenting (5+ years)'
    }[context.separationPhase];
    sections.push(`SEPARATION PHASE: ${phaseDesc}`);
    sections.push('');
  }

  // Conflict and friction
  if (context.conflictLevel && context.conflictLevel !== 'unknown') {
    sections.push(`CONFLICT LEVEL: ${context.conflictLevel.toUpperCase()}`);
  }

  if (context.frictionAreas.length > 0) {
    const frictionDesc = {
      'financial': 'Money/expenses/child support',
      'scheduling': 'Pickup/dropoff/schedule changes',
      'new_partners': 'New romantic partners',
      'parenting_styles': 'Different parenting approaches',
      'communication': 'Communication patterns',
      'legal': 'Court/custody/legal matters',
      'extended_family': 'In-laws/grandparents/family'
    };
    const areas = context.frictionAreas.map(a => frictionDesc[a] || a);
    sections.push(`KNOWN FRICTION AREAS: ${areas.join(', ')}`);
  }

  // Sensitive flags (no details, just awareness)
  const sensitiveFlags = [];
  if (context.hasLegalMatters) sensitiveFlags.push('active legal matters');
  if (context.hasSafetyConcerns) sensitiveFlags.push('safety concerns noted');
  if (context.hasAbuseConcerns) sensitiveFlags.push('abuse/neglect concerns');
  if (context.hasSubstanceConcerns) sensitiveFlags.push('substance/mental health factors');

  if (sensitiveFlags.length > 0) {
    sections.push(`\nSENSITIVE FACTORS: ${sensitiveFlags.join(', ')}`);
    sections.push('(Approach with extra care - avoid escalation)');
  }

  // Partner dynamics
  if (context.senderHasNewPartner || context.receiverMayHaveNewPartner) {
    sections.push('\nPARTNER DYNAMICS:');
    if (context.senderHasNewPartner) sections.push('  - Sender has a new partner');
    if (context.receiverMayHaveNewPartner) sections.push('  - Co-parent may have new partner (friction point)');
  }

  // Coaching guidance based on context
  sections.push('\n---');
  sections.push('Use the above context to:');
  sections.push('1. Reference their SPECIFIC situation in personalMessage');
  sections.push('2. Tailor rewrites to their actual children/custody arrangement');
  sections.push('3. Acknowledge known friction areas without escalating');
  sections.push('4. Be extra careful with sensitive factors present');

  return sections.join('\n');
}

/**
 * Extract the sender's GOAL from a message using context
 *
 * @param {string} messageText - The message text
 * @param {Object} context - Co-parenting context
 * @returns {Object} Extracted goal information
 */
function extractMessageGoal(messageText, context) {
  const text = messageText.toLowerCase();

  // Topic detection
  let topic = 'general';
  let specificDetail = null;

  // Time/schedule related
  if (text.includes('time') || text.includes('pickup') || text.includes('drop') ||
      text.includes('schedule') || text.includes('pm') || text.includes('am') ||
      text.includes('court order')) {
    topic = 'scheduling';

    // Extract specific time mention
    const timeMatch = text.match(/\d{1,2}:?\d{0,2}\s*(am|pm)?/i);
    if (timeMatch) specificDetail = timeMatch[0];
  }

  // Money related
  if (text.includes('money') || text.includes('pay') || text.includes('owe') ||
      text.includes('expense') || text.includes('support') || text.includes('cost')) {
    topic = 'financial';
  }

  // Parenting/child related
  if (text.includes('school') || text.includes('homework') || text.includes('bedtime') ||
      text.includes('sick') || text.includes('doctor') || text.includes('discipline')) {
    topic = 'parenting';
  }

  // Third party (grandparents, new partners)
  if (text.includes('mom') || text.includes('dad') || text.includes('mother') ||
      text.includes('father') || text.includes('grandma') || text.includes('grandpa')) {
    topic = 'extended_family';
  }

  // Determine underlying goal
  let goal = 'unknown';
  if (text.includes('need') || text.includes('want') || text.includes('can you') ||
      text.includes('please') || text.includes('?')) {
    goal = 'request';
  } else if (text.includes('you') && (text.includes('always') || text.includes('never') ||
             text.includes('stop') || text.includes('pathetic') || text.includes('power'))) {
    goal = 'vent_frustration';
  } else if (text.includes('court') || text.includes('order') || text.includes('legal')) {
    goal = 'assert_boundary';
  }

  return {
    topic,
    goal,
    specificDetail,
    childNames: context.childNames || [],
    frictionMatch: context.frictionAreas?.includes(topic)
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main builders
  buildCoparentingContext,
  formatContextForPrompt,
  extractMessageGoal,

  // Sub-builders (for testing)
  buildChildContext,
  buildCoparentRelationshipContext,
  buildPartnerContext,

  // Utilities
  monthsSince,
  calculateAge
};
