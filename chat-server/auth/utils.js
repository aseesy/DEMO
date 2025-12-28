/**
 * Shared Auth Utility Functions
 */
const bcrypt = require('bcrypt');

const RegistrationError = {
  EMAIL_EXISTS: { code: 'REG_001', message: 'Email already exists' },
  INVALID_TOKEN: { code: 'REG_002', message: 'Invalid invitation token' },
  EXPIRED: { code: 'REG_003', message: 'Invitation has expired' },
  ALREADY_ACCEPTED: { code: 'REG_004', message: 'Invitation already accepted' },
  ROOM_FAILED: { code: 'REG_005', message: 'Could not create chat room' },
  CONTACT_FAILED: { code: 'REG_006', message: 'Could not create contacts' },
  DATABASE_ERROR: { code: 'REG_007', message: 'Database error occurred' },
  INVITER_GONE: { code: 'REG_008', message: 'Inviter account no longer exists' },
  USERNAME_FAILED: { code: 'REG_009', message: 'Could not generate unique username' },
};

function createRegistrationError(errorType, details = null) {
  const error = new Error(errorType.message);
  error.code = errorType.code;
  error.details = details;
  return error;
}

async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function comparePassword(password, hash) {
  if (!password || !hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error comparing password:', error);
    return false;
  }
}

function generateUsernameSuffix() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return suffix;
}

module.exports = {
  RegistrationError,
  createRegistrationError,
  hashPassword,
  comparePassword,
  generateUsernameSuffix,
};
