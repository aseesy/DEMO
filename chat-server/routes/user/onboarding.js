/**
 * User Onboarding Routes
 *
 * Actor: Product/UX
 */
const express = require('express');
const router = express.Router();
const { handleServiceError } = require('../../middleware/errorHandlers');
const { profileService } = require('../../src/services');

router.get('/onboarding-status', async (req, res) => {
  try {
    const result = await profileService.getOnboardingStatus(req.query.username);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

module.exports = router;
