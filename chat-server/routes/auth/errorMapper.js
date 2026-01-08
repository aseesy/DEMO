/**
 * Error Mapping for Registration Operations
 * 
 * Standardizes PostgreSQL error handling for signup/register flows.
 * Maps database errors to user-friendly, non-leaky error responses.
 */

const { RegistrationError, createRegistrationError } = require('../../auth/utils');

/**
 * Map PostgreSQL error to registration error response
 * @param {Error} error - The error to map
 * @returns {{ type: string, status: number, body: Object, code: string }}
 */
function mapPostgresErrorToRegistrationError(error) {
  // Check for email exists error (unique constraint violation)
  // PostgreSQL error code 23505 = unique_violation
  if (error.code === '23505' && error.constraint?.includes('email')) {
    return {
      type: 'EMAIL_EXISTS',
      status: 409,
      code: 'REG_001',
      body: { error: 'Email already exists', code: 'REG_001' },
    };
  }

  // Check for RegistrationError instances (custom errors)
  if (error.code === 'EMAIL_EXISTS' || error.message === 'Email already exists') {
    return {
      type: 'EMAIL_EXISTS',
      status: 409,
      code: 'REG_001',
      body: { error: 'Email already exists', code: 'REG_001' },
    };
  }

  // For all other errors (unknown/internal), return generic 500
  // NEVER leak error.message as it may contain DB details
  return {
    type: 'INTERNAL',
    status: 500,
    code: 'GEN_500',
    body: { error: 'Internal server error', code: 'GEN_500' },
  };
}

module.exports = {
  mapPostgresErrorToRegistrationError,
};
