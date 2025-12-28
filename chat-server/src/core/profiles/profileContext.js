/**
 * Profile Context Builder
 *
 * Builds AI-ready context from user profiles for the LiaiZen mediation system.
 * Creates abstracted, privacy-safe summaries for empathetic AI coaching.
 *
 * @module src/liaizen/context/profileContext
 */

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Get pronoun object from pronoun string
 * @private
 */
function getPronoun(pronouns) {
  const pronounMap = {
    'he/him': { subject: 'he', object: 'him', possessive: 'his' },
    'she/her': { subject: 'she', object: 'her', possessive: 'her' },
    'they/them': { subject: 'they', object: 'them', possessive: 'their' },
  };

  return pronounMap[pronouns] || { subject: 'they', object: 'them', possessive: 'their' };
}

/**
 * Build work-related context flags
 * @private
 */
function buildWorkContext(profile) {
  const context = {
    hasWorkInfo: false,
    isUnemployed: false,
    hasFlexibleSchedule: false,
    hasRigidSchedule: false,
    travelsForWork: false,
    longCommute: false,
  };

  if (profile.employment_status) {
    context.hasWorkInfo = true;
    context.isUnemployed = ['unemployed', 'disability'].includes(profile.employment_status);
  }

  if (profile.schedule_flexibility) {
    context.hasFlexibleSchedule = profile.schedule_flexibility === 'high';
    context.hasRigidSchedule = profile.schedule_flexibility === 'low';
  }

  if (profile.travel_required) {
    context.travelsForWork =
      profile.travel_required === 'yes' || profile.travel_required === 'frequent';
  }

  if (profile.commute_time) {
    // Long commute = 60+ minutes
    const commute = parseInt(profile.commute_time, 10);
    context.longCommute = !isNaN(commute) && commute >= 60;
  }

  return context;
}

/**
 * Build health-related context flags (abstracted, no raw data)
 * @private
 */
function buildHealthContext(profile) {
  const context = {
    hasHealthInfo: false,
    hasPhysicalConditions: false,
    hasMentalHealthConsiderations: false,
    isInTreatment: false,
    isInRecovery: false,
    needsExtraPatience: false,
  };

  if (profile.health_physical_conditions) {
    const conditions = profile.health_physical_conditions.toLowerCase();
    context.hasHealthInfo = true;
    context.hasPhysicalConditions =
      !conditions.includes('none') && !conditions.includes('prefer_not');
  }

  if (profile.health_mental_conditions) {
    const conditions = profile.health_mental_conditions.toLowerCase();
    context.hasHealthInfo = true;
    context.hasMentalHealthConsiderations =
      !conditions.includes('none') && !conditions.includes('prefer_not');
  }

  if (profile.health_mental_treatment) {
    context.isInTreatment = ['active_treatment', 'seeking'].includes(
      profile.health_mental_treatment
    );
  }

  if (profile.health_in_recovery === 'yes' || profile.health_substance_history === 'recovery') {
    context.isInRecovery = true;
  }

  // Flag for needing extra patience (multiple stressors)
  const stressorCount = [
    context.hasPhysicalConditions,
    context.hasMentalHealthConsiderations,
    context.isInTreatment,
    context.isInRecovery,
  ].filter(Boolean).length;

  context.needsExtraPatience = stressorCount >= 2;

  return context;
}

/**
 * Build financial-related context flags (abstracted, no raw data)
 * @private
 */
function buildFinancialContext(profile) {
  const context = {
    hasFinancialInfo: false,
    hasFinancialStress: false,
    hasSignificantDebt: false,
    isPayingSupport: false,
    isReceivingSupport: false,
    hasUnstableIncome: false,
  };

  if (profile.finance_debt_stress) {
    context.hasFinancialInfo = true;
    context.hasFinancialStress = ['significant', 'overwhelming'].includes(
      profile.finance_debt_stress
    );
    context.hasSignificantDebt = profile.finance_debt_stress === 'overwhelming';
  }

  if (profile.finance_support_paying) {
    context.isPayingSupport = profile.finance_support_paying === 'yes';
  }

  if (profile.finance_support_receiving) {
    context.isReceivingSupport = profile.finance_support_receiving === 'yes';
  }

  if (profile.finance_income_stability) {
    context.hasUnstableIncome =
      profile.finance_income_stability === 'unstable' ||
      profile.finance_income_stability === 'variable';
  }

  return context;
}

/**
 * Build background-related context flags
 * @private
 */
function buildBackgroundContext(profile) {
  const context = {
    hasBackgroundInfo: false,
    hasMilitaryBackground: false,
    isActiveDuty: false,
    hasCulturalContext: false,
    hasReligiousContext: false,
  };

  if (profile.background_military === 'yes' || profile.background_military === 'family') {
    context.hasBackgroundInfo = true;
    context.hasMilitaryBackground = true;
    context.isActiveDuty = profile.background_military_status === 'active_duty';
  }

  if (profile.background_culture && profile.background_culture.trim()) {
    context.hasBackgroundInfo = true;
    context.hasCulturalContext = true;
  }

  if (profile.background_religion && profile.background_religion.trim()) {
    context.hasBackgroundInfo = true;
    context.hasReligiousContext = true;
  }

  return context;
}

/**
 * Build natural language context summary for AI prompt
 * @private
 */
function buildContextSummary(context, profile) {
  const parts = [];
  const name = context.preferredName || 'This person';
  const pronoun = getPronoun(context.pronouns);

  // Work context
  if (context.workContext.hasWorkInfo) {
    if (context.workContext.isUnemployed) {
      parts.push(
        `${name} is currently not employed, which may affect ${pronoun.possessive} stress levels around financial discussions.`
      );
    }
    if (context.workContext.hasRigidSchedule) {
      parts.push(`${name} has a rigid work schedule with limited flexibility.`);
    }
    if (context.workContext.travelsForWork) {
      parts.push(`${name} travels frequently for work, which may affect scheduling.`);
    }
  }

  // Health context (abstracted - no specifics)
  if (context.healthContext.needsExtraPatience) {
    parts.push(
      `${name} is managing multiple personal challenges and may benefit from extra patience and understanding.`
    );
  } else if (context.healthContext.hasMentalHealthConsiderations) {
    parts.push(
      `${name} is navigating personal health considerations. Please be mindful in ${pronoun.possessive} coaching.`
    );
  }

  if (context.healthContext.isInRecovery) {
    parts.push(
      `${name} is in active recovery and may be particularly sensitive to discussions involving substances.`
    );
  }

  // Financial context (abstracted - no specifics)
  if (context.financialContext.hasSignificantDebt) {
    parts.push(
      `${name} is experiencing significant financial stress. Financial discussions may trigger strong reactions.`
    );
  } else if (context.financialContext.hasFinancialStress) {
    parts.push(
      `${name} has financial concerns that may affect ${pronoun.possessive} responses to expense-related messages.`
    );
  }

  // Background context
  if (context.backgroundContext.isActiveDuty) {
    parts.push(
      `${name} is active duty military, which may affect availability and communication patterns.`
    );
  } else if (context.backgroundContext.hasMilitaryBackground) {
    parts.push(
      `${name} has a military background, which may influence ${pronoun.possessive} communication style.`
    );
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(' ');
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Build profile context for AI mediation.
 * Creates a structured summary that the AI can use to provide
 * empathetic, context-aware coaching without revealing raw data.
 *
 * @param {Object} profile - User profile data (decrypted)
 * @param {string} role - 'sender' or 'receiver'
 * @returns {Object} AI-ready context object
 */
function buildProfileContextForAI(profile, role = 'sender') {
  if (!profile) {
    return {
      role,
      hasProfile: false,
      contextSummary: null,
    };
  }

  const context = {
    role,
    hasProfile: true,
    // Basic identifiers (for personalization)
    preferredName: profile.preferred_name || profile.first_name || null,
    pronouns: profile.pronouns || null,

    // Work/Schedule context (affects availability, stress)
    workContext: buildWorkContext(profile),

    // Health context (affects sensitivity, understanding)
    healthContext: buildHealthContext(profile),

    // Financial context (affects stress levels, decision capacity)
    financialContext: buildFinancialContext(profile),

    // Background context (affects communication style, values)
    backgroundContext: buildBackgroundContext(profile),

    // Summary for AI prompt
    contextSummary: null,
  };

  // Build a natural language summary
  context.contextSummary = buildContextSummary(context, profile);

  return context;
}

/**
 * Build combined context for both sender and receiver
 *
 * @param {Object} senderProfile - Sender's profile data
 * @param {Object} receiverProfile - Receiver's profile data
 * @returns {Object} Combined context for AI
 */
function buildDualProfileContext(senderProfile, receiverProfile) {
  const senderContext = buildProfileContextForAI(senderProfile, 'sender');
  const receiverContext = buildProfileContextForAI(receiverProfile, 'receiver');

  // Build combined summary
  const parts = [];

  if (senderContext.contextSummary) {
    parts.push('**Sender Context:**');
    parts.push(senderContext.contextSummary);
  }

  if (receiverContext.contextSummary) {
    parts.push('**Receiver Context:**');
    parts.push(receiverContext.contextSummary);
  }

  return {
    sender: senderContext,
    receiver: receiverContext,
    hasSenderContext: senderContext.hasProfile && senderContext.contextSummary,
    hasReceiverContext: receiverContext.hasProfile && receiverContext.contextSummary,
    combinedSummary: parts.length > 0 ? parts.join('\n\n') : null,
  };
}

module.exports = {
  buildProfileContextForAI,
  buildDualProfileContext,
};
