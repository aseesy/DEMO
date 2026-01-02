/**
 * Profile Validation Module
 *
 * Single Responsibility: Validate profile field values.
 *
 * Ensures data integrity and format compliance for profile fields.
 */

/**
 * Validate profile field values
 *
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
    'preferred_name',
    'occupation',
    'employer',
    'city',
    'state',
    'zip',
    'phone',
    'background_birthplace',
    'background_raised',
    'education_field',
  ];
  for (const field of shortTextFields) {
    if (data[field] && data[field].length > 500) {
      return { valid: false, error: `${field} must be less than 500 characters` };
    }
  }

  // Long text field validation (2000 char limit)
  const longTextFields = [
    'work_schedule',
    'health_physical_limitations',
    'health_mental_history',
    'background_family_origin',
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
    'employed',
    'self_employed',
    'unemployed',
    'student',
    'retired',
    'disability',
    'homemaker',
    '',
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
    'under_25k',
    '25_50k',
    '50_75k',
    '75_100k',
    'over_100k',
    'prefer_not_say',
    '',
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

module.exports = {
  validateProfileFields,
};
