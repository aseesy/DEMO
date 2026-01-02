/**
 * Profile Completion Module
 *
 * Single Responsibility: Calculate profile completion percentage and section details.
 *
 * Provides completion metrics for onboarding and profile quality tracking.
 */

const { PROFILE_SECTIONS } = require('./constants');

/**
 * Calculate profile completion percentage
 * Each section contributes 20% to the total (5 sections)
 *
 * @param {Object} profile - Profile data
 * @returns {number} Completion percentage (0-100)
 */
function calculateProfileCompletion(profile) {
  if (!profile) return 0;

  let totalScore = 0;

  for (const [, fields] of Object.entries(PROFILE_SECTIONS)) {
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
 *
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
      overall: 0,
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
 *
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

module.exports = {
  calculateProfileCompletion,
  getSectionCompletion,
  getNextSuggestedSection,
};
