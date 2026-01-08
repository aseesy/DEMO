/**
 * Password Validation Utility
 *
 * Follows NIST SP 800-63B guidelines for user-friendly, secure passwords:
 * - Minimum 10 characters (length is the primary security factor)
 * - NO complexity requirements (they don't improve security, just frustrate users)
 * - Block common/breached passwords
 * - Allow all characters including spaces
 *
 * This approach:
 * - Encourages passphrases ("correct horse battery staple")
 * - Works with password managers
 * - Reduces user friction
 * - Actually prevents weak passwords through blocklist
 */

// Common passwords to block (top passwords from breach databases)
const BLOCKED_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '123456',
  '12345678',
  '123456789',
  'qwerty',
  'abc123',
  'monkey',
  'master',
  'dragon',
  'letmein',
  'login',
  'welcome',
  'shadow',
  'sunshine',
  'princess',
  'football',
  'baseball',
  'iloveyou',
  'trustno1',
  'superman',
  'batman',
  'passw0rd',
  'admin',
  'qwerty123',
  'welcome1',
  'p@ssw0rd',
  'pass1234',
  'test1234',
  'guest',
  'changeme',
  'default',
  'secret',
  'asdf1234',
  'zxcvbnm',
  'qwertyuiop',
  '1234567890',
  '0987654321',
  'abcdefgh',
  'password!',
  'coparent',
  'liaizen',
]);

const PASSWORD_REQUIREMENTS = {
  minLength: 10,
  maxLength: 128,
  requireLowercase: false,
  requireUppercase: false,
  requireNumber: false,
  requireSpecial: false,
  blockCommon: true,
};

/**
 * Check if password is in the blocked list
 */
function isBlockedPassword(password) {
  if (!password) return false;
  const normalized = password.toLowerCase().trim();
  return BLOCKED_PASSWORDS.has(normalized);
}

/**
 * Check if password contains email local-part or app name
 * Follows NIST guidance: block context-specific words (username and derivatives)
 * @param {string} password - Password to check
 * @param {string} email - User's email address (optional)
 * @returns {string|null} Error message if blocked, null otherwise
 */
function containsContextSpecificWords(password, email = null) {
  if (!password) return null;

  const passwordLower = password.toLowerCase();

  // Block app name
  const appName = 'liaizen';
  if (passwordLower.includes(appName)) {
    return 'Password cannot contain the application name';
  }

  // Block email local-part (before @) if email provided
  if (email) {
    const localPart = email.split('@')[0].toLowerCase();
    if (localPart && localPart.length >= 3 && passwordLower.includes(localPart)) {
      return 'Password cannot contain your email username';
    }
  }

  return null;
}

/**
 * Validate password against security requirements
 * @param {string} password - Password to validate
 * @param {string} email - User's email address (optional, for context-specific checks)
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 */
function validatePassword(password, email = null) {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must be less than ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }

  if (PASSWORD_REQUIREMENTS.blockCommon && isBlockedPassword(password)) {
    errors.push('This password is too common. Please choose something more unique.');
  }

  // Block context-specific words (email local-part, app name)
  const contextError = containsContextSpecificWords(password, email);
  if (contextError) {
    errors.push(contextError);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get a user-friendly error message for invalid passwords
 * @param {string} password - Password to validate
 * @param {string} email - User's email address (optional, for context-specific checks)
 * @returns {string|null} Error message or null if valid
 */
function getPasswordError(password, email = null) {
  const result = validatePassword(password, email);
  if (result.valid) {
    return null;
  }
  return result.errors[0];
}

/**
 * Get password requirements as a formatted string for display
 * @returns {string} Formatted requirements
 */
function getPasswordRequirements() {
  return `At least ${PASSWORD_REQUIREMENTS.minLength} characters`;
}

/**
 * Check password strength (for UI feedback)
 * Based on length and character variety - encourages longer passwords
 * @param {string} password - Password to check
 * @returns {{ score: number, label: string, feedback: string }} Strength info
 */
function checkPasswordStrength(password) {
  if (!password) return { score: 0, label: 'Empty', feedback: '' };

  let score = 0;
  let feedback = '';

  // Length is the primary factor (NIST recommendation)
  if (password.length >= 10) score += 1;
  if (password.length >= 14) score += 1;
  if (password.length >= 18) score += 1;
  if (password.length >= 22) score += 1;

  // Bonus for variety (not required, just encouraged)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const varietyCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (varietyCount >= 3) score += 1;

  // Normalize to 0-4
  score = Math.min(4, score);

  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];

  // Helpful feedback
  if (score < 2) {
    feedback = 'Try a longer password or a memorable phrase';
  } else if (score < 4) {
    feedback = 'Good! A few more characters would make it even stronger';
  } else {
    feedback = 'Great password!';
  }

  // Check for common patterns
  if (isBlockedPassword(password)) {
    return { score: 0, label: 'Too Common', feedback: 'This is a commonly used password' };
  }

  return {
    score,
    label: labels[score],
    feedback,
  };
}

/**
 * Get structured password requirements for frontend display
 * Simplified - just length requirement, no complexity
 */
function getPasswordRequirementsStructured() {
  return {
    minLength: PASSWORD_REQUIREMENTS.minLength,
    rules: [
      {
        id: 'length',
        label: `At least ${PASSWORD_REQUIREMENTS.minLength} characters`,
        test: pw => pw && pw.length >= PASSWORD_REQUIREMENTS.minLength,
      },
      {
        id: 'not-common',
        label: 'Not a commonly used password',
        test: pw => !isBlockedPassword(pw),
      },
    ],
  };
}

/**
 * Validate password and return detailed status for each requirement
 * @param {string} password - Password to validate
 * @returns {{ valid: boolean, requirements: Array<{id: string, label: string, met: boolean}> }}
 */
function validatePasswordDetailed(password) {
  const structured = getPasswordRequirementsStructured();
  const requirements = structured.rules.map(rule => ({
    id: rule.id,
    label: rule.label,
    met: Boolean(rule.test(password || '')),
  }));

  return {
    valid: requirements.every(r => r.met),
    minLength: structured.minLength,
    requirements,
  };
}

module.exports = {
  PASSWORD_REQUIREMENTS,
  BLOCKED_PASSWORDS,
  validatePassword,
  getPasswordError,
  getPasswordRequirements,
  getPasswordRequirementsStructured,
  validatePasswordDetailed,
  checkPasswordStrength,
  isBlockedPassword,
  containsContextSpecificWords,
};
