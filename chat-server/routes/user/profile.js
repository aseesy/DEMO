/**
 * User Profile Routes
 *
 * Actor: Product/UX
 */
const express = require('express');
const router = express.Router();
const { handleServiceError } = require('../../middleware/errorHandlers');
const { profileService } = require('../../src/services');

router.get('/profile', async (req, res) => {
  try {
    const result = await profileService.getProfile(req.query.username);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { username, profileData } = req.body;
    const result = await profileService.updateProfile(username, profileData);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

module.exports = router;
