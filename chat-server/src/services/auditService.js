/**
 * Audit Service
 *
 * Handles audit logging for profile views, changes, and privacy updates.
 * Contains database operations - use for tracking user actions.
 *
 * @module src/services/auditService
 */

const {
  PROFILE_SECTIONS,
  SENSITIVE_FIELDS,
} = require('../features/profile/constants/profileConstants');

const { defaultLogger: defaultLogger } = require('../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'auditService',
});

// ============================================================================
// PROFILE AUDIT LOGGING
// ============================================================================

/**
 * Log a profile view event
 *
 * @param {number} profileUserId - ID of the user whose profile was viewed
 * @param {number} viewerUserId - ID of the user who viewed the profile
 * @param {Object} requestInfo - Request info (ip, user agent)
 * @returns {Promise<void>}
 */
async function logProfileView(profileUserId, viewerUserId, requestInfo = {}) {
  try {
    const dbSafe = require('../../dbSafe');
    await dbSafe.safeInsert('profile_audit_log', {
      user_id: profileUserId,
      action: 'view',
      actor_user_id: viewerUserId,
      ip_address: requestInfo.ip || null,
      user_agent: requestInfo.userAgent || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error logging profile view', {
      message: error.message,
    });
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log profile field changes
 *
 * @param {number} userId - ID of the user whose profile was updated
 * @param {Object} oldProfile - Previous profile data
 * @param {Object} newProfile - New profile data
 * @param {Object} requestInfo - Request info (ip, user agent)
 * @returns {Promise<void>}
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
      ...PROFILE_SECTIONS.background,
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
          old_value: isSensitive ? '[ENCRYPTED]' : oldValue || '',
          new_value: isSensitive ? '[ENCRYPTED]' : newValue || '',
          actor_user_id: userId,
          ip_address: requestInfo.ip || null,
          user_agent: requestInfo.userAgent || null,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    logger.error('Error logging profile changes', {
      message: error.message,
    });
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log a privacy settings change
 *
 * @param {number} userId - ID of the user whose privacy was updated
 * @param {Object} oldSettings - Previous privacy settings
 * @param {Object} newSettings - New privacy settings
 * @param {Object} requestInfo - Request info (ip, user agent)
 * @returns {Promise<void>}
 */
async function logPrivacyChange(userId, oldSettings, newSettings, requestInfo = {}) {
  try {
    const dbSafe = require('../../dbSafe');

    const visibilityFields = ['personal_visibility', 'work_visibility', 'background_visibility'];

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
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    logger.error('Error logging privacy change', {
      message: error.message,
    });
    // Don't throw - audit logging should not break the main flow
  }
}

module.exports = {
  logProfileView,
  logProfileChanges,
  logPrivacyChange,
};
