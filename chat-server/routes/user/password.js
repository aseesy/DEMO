/**
 * User Password Management Routes
 *
 * Actor: Product/UX
 */
const express = require('express');
const router = express.Router();
const { handleServiceError } = require('../../middleware/errorHandlers');
const { profileService } = require('../../src/services');

router.put('/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const result = await profileService.changePassword(username, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

module.exports = router;
