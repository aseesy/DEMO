/**
 * Profile Helpers Module
 * Feature 010: Comprehensive User Profile System
 *
 * Provides encryption, privacy filtering, completion calculation,
 * and audit logging for the user profile system.
 */

const crypto = require('crypto');

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Fields that require encryption at rest.
 * These contain sensitive health and financial information.
 */
const SENSITIVE_FIELDS = [
  'health_physical_conditions',
  'health_physical_limitations',
  'health_mental_conditions',
  'health_mental_treatment',
  'health_mental_history',
  'health_substance_history',
  'health_in_recovery',
  'health_recovery_duration',
  'finance_income_level',
  'finance_debt_stress',
  'finance_support_paying',
  'finance_support_receiving'
];

/**
 * Fields by section for completion calculation
 */
const PROFILE_SECTIONS = {
  personal: [
    'first_name', 'last_name', 'preferred_name', 'pronouns',
    'birthdate', 'language', 'timezone', 'phone', 'city', 'state', 'zip'
  ],
  work: [
    'employment_status', 'occupation', 'employer', 'work_schedule',
    'schedule_flexibility', 'commute_time', 'travel_required'
  ],
  health: [
    'health_physical_conditions', 'health_physical_limitations',
    'health_mental_conditions', 'health_mental_treatment',
    'health_mental_history', 'health_substance_history',
    'health_in_recovery', 'health_recovery_duration'
  ],
  financial: [
    'finance_income_level', 'finance_income_stability',
    'finance_employment_benefits', 'finance_housing_status',
    'finance_housing_type', 'finance_vehicles', 'finance_debt_stress',
    'finance_support_paying', 'finance_support_receiving'
  ],
  background: [
    'background_birthplace', 'background_raised', 'background_family_origin',
    'background_culture', 'background_religion', 'background_military',
    'background_military_branch', 'background_military_status',
    'education_level', 'education_field'
  ]
};

/**
 * Default privacy settings - health and financial are ALWAYS private
 */
const DEFAULT_PRIVACY_SETTINGS = {
  personal_visibility: 'shared',
  work_visibility: 'private',
  health_visibility: 'private',      // Immutable - always private
  financial_visibility: 'private',   // Immutable - always private
  background_visibility: 'shared',
  field_overrides: '{}'
};

// ============================================================================
// ENCRYPTION FUNCTIONS
// ============================================================================

/**
 * Get encryption key from environment or use default for development.
 * In production, PROFILE_ENCRYPTION_KEY must be set.
 */
function getEncryptionKey() {
  const key = process.env.PROFILE_ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PROFILE_ENCRYPTION_KEY must be set in production');
    }
    // Development fallback - NOT SECURE, only for local testing
    console.warn('⚠️ Using development encryption key - NOT SECURE for production');
    return crypto.createHash('sha256').update('dev-key-not-secure').digest();
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a single value using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted string in format: iv:authTag:ciphertext
 */
function encrypt(text) {
  if (!text) return text;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Format: iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypt a value encrypted with encrypt()
 * @param {string} encryptedText - Encrypted string in format: iv:authTag:ciphertext
 * @returns {string} Decrypted plain text
 */
function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;

  // Check if this looks like encrypted data
  if (!encryptedText.includes(':')) {
    // Not encrypted, return as-is (for backward compatibility)
    return encryptedText;
  }

  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const ciphertext = parts[2];

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    // Return null for corrupted/invalid encrypted data
    return null;
  }
}

/**
 * Encrypt sensitive fields in a profile data object
 * @param {Object} data - Profile data with potential sensitive fields
 * @returns {Object} Profile data with sensitive fields encrypted
 */
function encryptSensitiveFields(data) {
  if (!data) return data;

  const result = { ...data };

  for (const field of SENSITIVE_FIELDS) {
    if (result[field] && typeof result[field] === 'string' && result[field].trim()) {
      result[field] = encrypt(result[field]);
    }
  }

  return result;
}

/**
 * Decrypt sensitive fields in a profile data object
 * @param {Object} data - Profile data with encrypted sensitive fields
 * @returns {Object} Profile data with sensitive fields decrypted
 */
function decryptSensitiveFields(data) {
  if (!data) return data;

  const result = { ...data };

  for (const field of SENSITIVE_FIELDS) {
    if (result[field]) {
      result[field] = decrypt(result[field]);
    }
  }

  return result;
}

// ============================================================================
// PRIVACY FILTERING
// ============================================================================

/**
 * Filter profile data based on privacy settings
 * @param {Object} profile - Full profile data
 * @param {Object} privacySettings - Privacy settings object
 * @param {boolean} isOwnProfile - Whether this is the user viewing their own profile
 * @returns {Object} Filtered profile data
 */
function filterProfileByPrivacy(profile, privacySettings, isOwnProfile) {
  if (!profile) return profile;

  // Own profile - return decrypted data
  if (isOwnProfile) {
    return decryptSensitiveFields(profile);
  }

  // Co-parent view - apply privacy filtering
  const settings = privacySettings || DEFAULT_PRIVACY_SETTINGS;
  const result = { ...profile };

  // Parse field overrides if present
  let fieldOverrides = {};
  try {
    if (settings.field_overrides) {
      fieldOverrides = typeof settings.field_overrides === 'string'
        ? JSON.parse(settings.field_overrides)
        : settings.field_overrides;
    }
  } catch (e) {
    fieldOverrides = {};
  }

  // ALWAYS remove health fields from co-parent view (non-negotiable)
  for (const field of PROFILE_SECTIONS.health) {
    delete result[field];
  }

  // ALWAYS remove financial fields from co-parent view (non-negotiable)
  for (const field of PROFILE_SECTIONS.financial) {
    delete result[field];
  }

  // Apply visibility settings for other sections
  if (settings.personal_visibility === 'private') {
    // Remove personal fields except name (name is always visible)
    for (const field of PROFILE_SECTIONS.personal) {
      if (field !== 'first_name' && field !== 'last_name' && field !== 'preferred_name') {
        delete result[field];
      }
    }
  }

  if (settings.work_visibility === 'private') {
    for (const field of PROFILE_SECTIONS.work) {
      delete result[field];
    }
  }

  if (settings.background_visibility === 'private') {
    for (const field of PROFILE_SECTIONS.background) {
      delete result[field];
    }
  }

  // Apply field-level overrides
  for (const [field, visibility] of Object.entries(fieldOverrides)) {
    if (visibility === 'private') {
      delete result[field];
    }
  }

  return result;
}

/**
 * Get default privacy settings for a new user
 * @returns {Object} Default privacy settings
 */
function getDefaultPrivacySettings() {
  return { ...DEFAULT_PRIVACY_SETTINGS };
}

// ============================================================================
// PROFILE COMPLETION
// ============================================================================

/**
 * Calculate profile completion percentage
 * Each section contributes 20% to the total (5 sections)
 * @param {Object} profile - Profile data
 * @returns {number} Completion percentage (0-100)
 */
function calculateProfileCompletion(profile) {
  if (!profile) return 0;

  let totalScore = 0;

  for (const [sectionName, fields] of Object.entries(PROFILE_SECTIONS)) {
    const filledFields = fields.filter(field => {
      const value = profile[field];
      return value && value.toString().trim().length > 0;
    });

    // Each section is worth 20%
    const sectionScore = (filledFields.length / fields.length) * 20;
    totalScore += sectionScore;
  }

  return Math.round(totalScore);
}

/**
 * Get section completion details
 * @param {Object} profile - Profile data
 * @returns {Object} Section-by-section completion details
 */
function getSectionCompletion(profile) {
  if (!profile) {
    return {
      personal: 0,
      work: 0,
      health: 0,
      financial: 0,
      background: 0,
      overall: 0
    };
  }

  const result = {};

  for (const [sectionName, fields] of Object.entries(PROFILE_SECTIONS)) {
    const filledFields = fields.filter(field => {
      const value = profile[field];
      return value && value.toString().trim().length > 0;
    });

    result[sectionName] = Math.round((filledFields.length / fields.length) * 100);
  }

  result.overall = calculateProfileCompletion(profile);

  return result;
}

/**
 * Get next suggested section to complete
 * @param {Object} profile - Profile data
 * @returns {string|null} Section name or null if all complete
 */
function getNextSuggestedSection(profile) {
  const completion = getSectionCompletion(profile);

  // Priority order: personal > work > background > health > financial
  const priority = ['personal', 'work', 'background', 'health', 'financial'];

  for (const section of priority) {
    if (completion[section] < 50) {
      return section;
    }
  }

  // Find any incomplete section
  for (const section of priority) {
    if (completion[section] < 100) {
      return section;
    }
  }

  return null;
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log a profile view event
 * @param {number} profileUserId - ID of the user whose profile was viewed
 * @param {number} viewerUserId - ID of the user who viewed the profile
 * @param {Object} db - Database connection
 * @param {Object} requestInfo - Request info (ip, user agent)
 */
async function logProfileView(profileUserId, viewerUserId, db, requestInfo = {}) {
  try {
    const dbSafe = require('../../dbSafe');
    await dbSafe.safeInsert('profile_audit_log', {
      user_id: profileUserId,
      action: 'view',
      actor_user_id: viewerUserId,
      ip_address: requestInfo.ip || null,
      user_agent: requestInfo.userAgent || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging profile view:', error.message);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log profile field changes
 * @param {number} userId - ID of the user whose profile was updated
 * @param {Object} oldProfile - Previous profile data
 * @param {Object} newProfile - New profile data
 * @param {Object} requestInfo - Request info (ip, user agent)
 */
async function logProfileChanges(userId, oldProfile, newProfile, requestInfo = {}) {
  try {
    const dbSafe = require('../../dbSafe');

    // Find changed fields
    const allFields = [
      ...PROFILE_SECTIONS.personal,
      ...PROFILE_SECTIONS.work,
      ...PROFILE_SECTIONS.health,
      ...PROFILE_SECTIONS.financial,
      ...PROFILE_SECTIONS.background
    ];

    for (const field of allFields) {
      const oldValue = oldProfile[field] || null;
      const newValue = newProfile[field] || null;

      if (oldValue !== newValue) {
        // Don't log actual values for sensitive fields
        const isSensitive = SENSITIVE_FIELDS.includes(field);

        await dbSafe.safeInsert('profile_audit_log', {
          user_id: userId,
          action: 'update',
          field_name: field,
          old_value: isSensitive ? '[ENCRYPTED]' : (oldValue || ''),
          new_value: isSensitive ? '[ENCRYPTED]' : (newValue || ''),
          actor_user_id: userId,
          ip_address: requestInfo.ip || null,
          user_agent: requestInfo.userAgent || null,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error logging profile changes:', error.message);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log a privacy settings change
 * @param {number} userId - ID of the user whose privacy was updated
 * @param {Object} oldSettings - Previous privacy settings
 * @param {Object} newSettings - New privacy settings
 * @param {Object} requestInfo - Request info (ip, user agent)
 */
async function logPrivacyChange(userId, oldSettings, newSettings, requestInfo = {}) {
  try {
    const dbSafe = require('../../dbSafe');

    const visibilityFields = [
      'personal_visibility', 'work_visibility', 'background_visibility'
    ];

    for (const field of visibilityFields) {
      const oldValue = oldSettings[field] || 'private';
      const newValue = newSettings[field] || 'private';

      if (oldValue !== newValue) {
        await dbSafe.safeInsert('profile_audit_log', {
          user_id: userId,
          action: 'privacy_change',
          field_name: field,
          old_value: oldValue,
          new_value: newValue,
          actor_user_id: userId,
          ip_address: requestInfo.ip || null,
          user_agent: requestInfo.userAgent || null,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error logging privacy change:', error.message);
    // Don't throw - audit logging should not break the main flow
  }
}

// ============================================================================
// AI CONTEXT BUILDING
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
      contextSummary: null
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
    contextSummary: null
  };

  // Build a natural language summary
  context.contextSummary = buildContextSummary(context, profile);

  return context;
}

/**
 * Build work-related context flags
 */
function buildWorkContext(profile) {
  const context = {
    hasWorkInfo: false,
    isUnemployed: false,
    hasFlexibleSchedule: false,
    hasRigidSchedule: false,
    travelsForWork: false,
    longCommute: false
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
    context.travelsForWork = profile.travel_required === 'yes' || profile.travel_required === 'frequent';
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
 */
function buildHealthContext(profile) {
  const context = {
    hasHealthInfo: false,
    hasPhysicalConditions: false,
    hasMentalHealthConsiderations: false,
    isInTreatment: false,
    isInRecovery: false,
    needsExtraPatience: false
  };

  if (profile.health_physical_conditions) {
    const conditions = profile.health_physical_conditions.toLowerCase();
    context.hasHealthInfo = true;
    context.hasPhysicalConditions = !conditions.includes('none') && !conditions.includes('prefer_not');
  }

  if (profile.health_mental_conditions) {
    const conditions = profile.health_mental_conditions.toLowerCase();
    context.hasHealthInfo = true;
    context.hasMentalHealthConsiderations = !conditions.includes('none') && !conditions.includes('prefer_not');
  }

  if (profile.health_mental_treatment) {
    context.isInTreatment = ['active_treatment', 'seeking'].includes(profile.health_mental_treatment);
  }

  if (profile.health_in_recovery === 'yes' ||
      profile.health_substance_history === 'recovery') {
    context.isInRecovery = true;
  }

  // Flag for needing extra patience (multiple stressors)
  const stressorCount = [
    context.hasPhysicalConditions,
    context.hasMentalHealthConsiderations,
    context.isInTreatment,
    context.isInRecovery
  ].filter(Boolean).length;

  context.needsExtraPatience = stressorCount >= 2;

  return context;
}

/**
 * Build financial-related context flags (abstracted, no raw data)
 */
function buildFinancialContext(profile) {
  const context = {
    hasFinancialInfo: false,
    hasFinancialStress: false,
    hasSignificantDebt: false,
    isPayingSupport: false,
    isReceivingSupport: false,
    hasUnstableIncome: false
  };

  if (profile.finance_debt_stress) {
    context.hasFinancialInfo = true;
    context.hasFinancialStress = ['significant', 'overwhelming'].includes(profile.finance_debt_stress);
    context.hasSignificantDebt = profile.finance_debt_stress === 'overwhelming';
  }

  if (profile.finance_support_paying) {
    context.isPayingSupport = profile.finance_support_paying === 'yes';
  }

  if (profile.finance_support_receiving) {
    context.isReceivingSupport = profile.finance_support_receiving === 'yes';
  }

  if (profile.finance_income_stability) {
    context.hasUnstableIncome = profile.finance_income_stability === 'unstable' ||
                                 profile.finance_income_stability === 'variable';
  }

  return context;
}

/**
 * Build background-related context flags
 */
function buildBackgroundContext(profile) {
  const context = {
    hasBackgroundInfo: false,
    hasMilitaryBackground: false,
    isActiveDuty: false,
    hasCulturalContext: false,
    hasReligiousContext: false
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
 */
function buildContextSummary(context, profile) {
  const parts = [];
  const name = context.preferredName || 'This person';
  const pronoun = getPronoun(context.pronouns);

  // Work context
  if (context.workContext.hasWorkInfo) {
    if (context.workContext.isUnemployed) {
      parts.push(`${name} is currently not employed, which may affect ${pronoun.possessive} stress levels around financial discussions.`);
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
    parts.push(`${name} is managing multiple personal challenges and may benefit from extra patience and understanding.`);
  } else if (context.healthContext.hasMentalHealthConsiderations) {
    parts.push(`${name} is navigating personal health considerations. Please be mindful in ${pronoun.possessive} coaching.`);
  }

  if (context.healthContext.isInRecovery) {
    parts.push(`${name} is in active recovery and may be particularly sensitive to discussions involving substances.`);
  }

  // Financial context (abstracted - no specifics)
  if (context.financialContext.hasSignificantDebt) {
    parts.push(`${name} is experiencing significant financial stress. Financial discussions may trigger strong reactions.`);
  } else if (context.financialContext.hasFinancialStress) {
    parts.push(`${name} has financial concerns that may affect ${pronoun.possessive} responses to expense-related messages.`);
  }

  // Background context
  if (context.backgroundContext.isActiveDuty) {
    parts.push(`${name} is active duty military, which may affect availability and communication patterns.`);
  } else if (context.backgroundContext.hasMilitaryBackground) {
    parts.push(`${name} has a military background, which may influence ${pronoun.possessive} communication style.`);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(' ');
}

/**
 * Get pronoun object from pronoun string
 */
function getPronoun(pronouns) {
  const pronounMap = {
    'he/him': { subject: 'he', object: 'him', possessive: 'his' },
    'she/her': { subject: 'she', object: 'her', possessive: 'her' },
    'they/them': { subject: 'they', object: 'them', possessive: 'their' }
  };

  return pronounMap[pronouns] || { subject: 'they', object: 'them', possessive: 'their' };
}

/**
 * Build combined context for both sender and receiver
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
    combinedSummary: parts.length > 0 ? parts.join('\n\n') : null
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate profile field values
 * @param {Object} data - Profile data to validate
 * @returns {Object} { valid: boolean, error: string|null }
 */
function validateProfileFields(data) {
  if (!data) {
    return { valid: true };
  }

  // Email validation
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Birthdate validation (ISO format YYYY-MM-DD)
  if (data.birthdate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.birthdate)) {
      return { valid: false, error: 'Invalid birthdate format (use YYYY-MM-DD)' };
    }

    // Age validation (must be 18+)
    const birthDate = new Date(data.birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      return { valid: false, error: 'User must be at least 18 years old' };
    }
  }

  // Text field length validation (500 char limit for short fields)
  const shortTextFields = [
    'preferred_name', 'occupation', 'employer', 'city', 'state', 'zip',
    'phone', 'background_birthplace', 'background_raised', 'education_field'
  ];
  for (const field of shortTextFields) {
    if (data[field] && data[field].length > 500) {
      return { valid: false, error: `${field} must be less than 500 characters` };
    }
  }

  // Long text field validation (2000 char limit)
  const longTextFields = [
    'work_schedule', 'health_physical_limitations', 'health_mental_history',
    'background_family_origin'
  ];
  for (const field of longTextFields) {
    if (data[field] && data[field].length > 2000) {
      return { valid: false, error: `${field} must be less than 2000 characters` };
    }
  }

  // Pronouns validation
  const validPronouns = ['he/him', 'she/her', 'they/them', 'other', ''];
  if (data.pronouns && !validPronouns.includes(data.pronouns)) {
    return { valid: false, error: 'Invalid pronouns value' };
  }

  // Employment status validation
  const validEmploymentStatus = [
    'employed', 'self_employed', 'unemployed', 'student',
    'retired', 'disability', 'homemaker', ''
  ];
  if (data.employment_status && !validEmploymentStatus.includes(data.employment_status)) {
    return { valid: false, error: 'Invalid employment status' };
  }

  // Schedule flexibility validation
  const validFlexibility = ['high', 'medium', 'low', ''];
  if (data.schedule_flexibility && !validFlexibility.includes(data.schedule_flexibility)) {
    return { valid: false, error: 'Invalid schedule flexibility value' };
  }

  // Income level validation
  const validIncomeLevels = [
    'under_25k', '25_50k', '50_75k', '75_100k', 'over_100k', 'prefer_not_say', ''
  ];
  if (data.finance_income_level && !validIncomeLevels.includes(data.finance_income_level)) {
    return { valid: false, error: 'Invalid income level value' };
  }

  // Debt stress validation
  const validDebtStress = ['none', 'manageable', 'significant', 'overwhelming', ''];
  if (data.finance_debt_stress && !validDebtStress.includes(data.finance_debt_stress)) {
    return { valid: false, error: 'Invalid debt stress value' };
  }

  return { valid: true };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Constants
  SENSITIVE_FIELDS,
  PROFILE_SECTIONS,
  DEFAULT_PRIVACY_SETTINGS,

  // Encryption
  encrypt,
  decrypt,
  encryptSensitiveFields,
  decryptSensitiveFields,

  // Privacy
  filterProfileByPrivacy,
  getDefaultPrivacySettings,

  // Completion
  calculateProfileCompletion,
  getSectionCompletion,
  getNextSuggestedSection,

  // Audit Logging
  logProfileView,
  logProfileChanges,
  logPrivacyChange,

  // Validation
  validateProfileFields,

  // AI Context Building
  buildProfileContextForAI,
  buildDualProfileContext
};
