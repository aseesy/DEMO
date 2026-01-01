/**
 * User Routes - Modular Entry Point
 * @di-pattern: injected
 *
 * Actor: Product/UX
 */
const express = require('express');
const router = express.Router();

const { profileService } = require('../src/services');
const profileRoutes = require('./user/profile');
const passwordRoutes = require('./user/password');
const onboardingRoutes = require('./user/onboarding');

router.use('/', profileRoutes);
router.use('/', passwordRoutes);
router.use('/', onboardingRoutes);

router.setHelpers = function (helpers) {
  // Inject auth into profile service for password operations
  if (helpers.auth) {
    profileService.setAuth(helpers.auth);
  }
};

module.exports = router;
