/**
 * profileBuilder.js
 * Pure functions for building sender/receiver profiles for AI mediation.
 * Extracted from useChat.js hook.
 * No React/DOM dependencies.
 */

/**
 * Default sender profile when no context is available
 */
export const DEFAULT_SENDER_PROFILE = {
  role: 'Parent',
  position: 'unknown',
  resources: 'unknown',
  conflict_level: 'unknown',
  abuse_history: 'None',
};

/**
 * Default receiver profile when no context is available
 */
export const DEFAULT_RECEIVER_PROFILE = {
  has_new_partner: false,
  income_disparity: 'unknown',
  distance: 'unknown',
};

/**
 * Build a sender profile from user data
 * @param {Object} userData - User data object
 * @param {Object} userData.profile - User's profile settings
 * @param {Object} userData.coParentInfo - Information about co-parent relationship
 * @returns {Object} Sender profile for AI mediation
 */
export function buildSenderProfile(userData = {}) {
  const profile = userData.profile || {};
  const coParentInfo = userData.coParentInfo || {};

  return {
    role: profile.role || 'Parent',
    position: determinePosition(coParentInfo),
    resources: profile.resources || 'unknown',
    conflict_level: coParentInfo.conflict_level || 'unknown',
    abuse_history: profile.abuse_history || 'None',
    // Additional fields that may be relevant
    communication_style: profile.communication_style || 'unknown',
    stress_level: profile.stress_level || 'unknown',
  };
}

/**
 * Build a receiver profile from contact/co-parent data
 * @param {Object} contactData - Contact data object
 * @param {Object} contactData.coParent - Co-parent contact info
 * @param {Object} contactData.relationship - Relationship details
 * @returns {Object} Receiver profile for AI mediation
 */
export function buildReceiverProfile(contactData = {}) {
  const coParent = contactData.coParent || {};
  const relationship = contactData.relationship || {};

  return {
    has_new_partner: Boolean(coParent.has_new_partner || relationship.new_partner),
    income_disparity: relationship.income_disparity || 'unknown',
    distance: calculateDistance(coParent.address, contactData.userAddress),
    // Additional fields
    custody_arrangement: coParent.custody_arrangement || 'unknown',
    communication_preference: coParent.communication_preference || 'unknown',
  };
}

/**
 * Determine the position/power dynamic in co-parenting relationship
 * @param {Object} coParentInfo - Co-parent relationship info
 * @returns {string} Position assessment
 */
function determinePosition(coParentInfo) {
  if (!coParentInfo) return 'unknown';

  // Position can be derived from custody arrangement, income, etc.
  const custody = coParentInfo.custody_arrangement?.toLowerCase() || '';

  if (custody.includes('primary')) return 'primary_custody';
  if (custody.includes('50/50') || custody.includes('equal')) return 'equal_custody';
  if (custody.includes('visiting') || custody.includes('visitation')) return 'visitation';

  return 'unknown';
}

/**
 * Calculate distance category between two addresses
 * @param {string} address1 - First address
 * @param {string} address2 - Second address
 * @returns {string} Distance category
 */
function calculateDistance(address1, address2) {
  // In a real implementation, this would use geocoding
  // For now, return 'unknown' - can be enhanced with actual distance calculation
  if (!address1 || !address2) return 'unknown';

  // Simple heuristic: check if same city/state
  const normalize = addr => (addr || '').toLowerCase().trim();
  const a1 = normalize(address1);
  const a2 = normalize(address2);

  if (a1 === a2) return 'same_address';
  // More sophisticated comparison would go here

  return 'unknown';
}

/**
 * Build complete mediation context from available data
 * @param {Object} params - Context parameters
 * @param {Object} params.user - Current user data
 * @param {Object} params.contacts - User's contacts
 * @param {Object} params.room - Current chat room
 * @returns {Object} Complete mediation context
 */
export function buildMediationContext({ user = {}, contacts = [], room = {} }) {
  // Find co-parent from contacts
  const coParentContact = contacts.find(
    c => c.relationship === 'My Co-Parent' || c.relationship === 'co-parent'
  );

  // Find children
  const children = contacts.filter(c => c.relationship === 'My Child');

  return {
    sender: buildSenderProfile({
      profile: user.profile,
      coParentInfo: {
        conflict_level: coParentContact?.conflict_level,
        custody_arrangement: coParentContact?.custody_arrangement,
      },
    }),
    receiver: buildReceiverProfile({
      coParent: coParentContact,
      relationship: {
        income_disparity: coParentContact?.income_disparity,
        new_partner: coParentContact?.has_new_partner,
      },
      userAddress: user.profile?.address,
    }),
    context: {
      childCount: children.length,
      childrenNames: children.map(c => c.contact_name).filter(Boolean),
      roomType: room.type || 'private',
      hasLegalMatters: Boolean(coParentContact?.legal_matters),
      hasSafetyConcerns: Boolean(coParentContact?.safety_concerns),
    },
  };
}

/**
 * Merge user profile with default profile
 * Ensures all required fields are present
 * @param {Object} userProfile - User's profile data
 * @param {Object} defaults - Default values
 * @returns {Object} Merged profile
 */
export function mergeWithDefaults(userProfile, defaults) {
  const result = { ...defaults };

  if (userProfile && typeof userProfile === 'object') {
    for (const key of Object.keys(defaults)) {
      if (userProfile[key] !== undefined && userProfile[key] !== null && userProfile[key] !== '') {
        result[key] = userProfile[key];
      }
    }
  }

  return result;
}

/**
 * Create sender profile with defaults
 * @param {Object} userData - Partial user data
 * @returns {Object} Complete sender profile
 */
export function createSenderProfile(userData = {}) {
  return mergeWithDefaults(buildSenderProfile(userData), DEFAULT_SENDER_PROFILE);
}

/**
 * Create receiver profile with defaults
 * @param {Object} contactData - Partial contact data
 * @returns {Object} Complete receiver profile
 */
export function createReceiverProfile(contactData = {}) {
  return mergeWithDefaults(buildReceiverProfile(contactData), DEFAULT_RECEIVER_PROFILE);
}
