/**
 * Utils Index
 *
 * Central export for all generic utility functions.
 * These are small, stateless functions that can be used in any project.
 *
 * @module src/utils
 *
 * @example
 * // Import all utilities
 * const utils = require('./src/utils');
 * utils.isValidEmail('user@example.com');
 * utils.generateToken();
 * utils.now();
 *
 * @example
 * // Import specific modules
 * const { isValidEmail } = require('./src/utils/validators');
 * const { generateToken } = require('./src/utils/crypto');
 * const { now, expiresIn } = require('./src/utils/dates');
 */

const validators = require('./validators');
const crypto = require('./crypto');
const dates = require('./dates');

module.exports = {
  // Validators
  ...validators,

  // Crypto
  ...crypto,

  // Dates
  ...dates,

  // Namespaced access
  validators,
  crypto,
  dates,
};
