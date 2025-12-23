/**
 * Infrastructure - Cross-cutting concerns
 *
 * Domain-specific code has moved to:
 * - Profile constants → features/profile/constants/
 * - Sync services → services/sync/
 *
 * @module infrastructure
 */

const utils = require('./utils/index');
const logging = require('./logging/index');
const errors = require('./errors/index');
const security = require('./security/index');
const config = require('./config/index');
const validation = require('./validation/index');
const database = require('./database/index');

module.exports = {
  utils,
  logging,
  errors,
  security,
  config,
  validation,
  database,
};
