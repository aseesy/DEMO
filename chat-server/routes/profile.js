const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { handleServiceError } = require('../middleware/errorHandlers');
const { calculateProfileCompletion } = require('../src/services/profileService');
const validateSchema = require('./auth/validateSchema');
const {
  updateProfileSchema,
  updatePrivacySettingsSchema,
  profileQuerySchema,
} = require('./profile/profileSchemas');

const { defaultLogger: defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'profile',
});

// @di-pattern: injected
// Service will be injected via router.setHelpers
let profileService;

router.setHelpers = function (helpers) {
  profileService = helpers.profileService;
};

/**
 * GET /api/profile/me
 * Gets the complete profile for the currently authenticated user.
 * Query params are optional and validated if provided.
 */
router.get(
  '/me',
  authenticate,
  validateSchema(profileQuerySchema, { validateQuery: true }),
  async (req, res) => {
    try {
      const { userId } = req.user;

      const profileData = await profileService.getComprehensiveProfile(userId);
      const privacySettings = await profileService.getPrivacySettings(userId);

      logger.debug('Returning profile data for user', {
        userId: userId,
        profileData: profileData,
      });
      logger.debug('Returning privacy settings for user', {
        userId: userId,
        privacySettings: privacySettings,
      });

      res.json({
        ...profileData,
        privacySettings,
        isOwnProfile: true, // Always true for /me endpoint
      });
    } catch (error) {
      handleServiceError(error, res);
    }
  }
);

/**
 * PUT /api/profile/me
 * Updates the profile for the currently authenticated user.
 */
router.put('/me', authenticate, validateSchema(updateProfileSchema), async (req, res) => {
  try {
    const { userId } = req.user;
    const updates = req.body;

    logger.debug('DEBUG PUT userId', {
      userId: userId,
    });
    logger.debug('DEBUG PUT updates keys', {
      Object_keys: Object.keys(updates),
    });

    if (!userId) {
      logger.error('DEBUG PUT No userId found in token!');
      return res.status(401).json({ error: 'Invalid authentication token - no user ID.' });
    }

    const updatedProfile = await profileService.updateComprehensiveProfile(
      userId,
      updates,
      calculateProfileCompletion
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      completionPercentage: updatedProfile.profile_completion_percentage,
    });
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * GET /api/profile/privacy/me
 * Gets privacy settings for the currently authenticated user.
 * Query params are optional and validated if provided.
 */
router.get(
  '/privacy/me',
  authenticate,
  validateSchema(profileQuerySchema, { validateQuery: true }),
  async (req, res) => {
    try {
      const { userId } = req.user;

      const privacySettings = await profileService.getPrivacySettings(userId);

      if (!privacySettings) {
        // Return default privacy settings
        return res.json({
          user_id: userId,
          personal_visibility: 'shared',
          work_visibility: 'private',
          health_visibility: 'private',
          financial_visibility: 'private',
          background_visibility: 'shared',
          field_overrides: '{}',
        });
      }

      res.json(privacySettings);
    } catch (error) {
      handleServiceError(error, res);
    }
  }
);

/**
 * PUT /api/profile/privacy/me
 * Updates privacy settings for the currently authenticated user.
 */
router.put('/privacy/me', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const settings = req.body;

    const result = await profileService.updatePrivacySettings(userId, settings);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * GET /api/profile/preview-coparent-view
 * Returns the profile as it would appear to a co-parent (privacy-filtered).
 */
router.get('/preview-coparent-view', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user profile data
    const profile = await profileService.getComprehensiveProfile(userId);

    // Get privacy settings
    const settings = (await profileService.getPrivacySettings(userId)) || {
      personal_visibility: 'shared',
      work_visibility: 'private',
      health_visibility: 'private',
      financial_visibility: 'private',
      background_visibility: 'shared',
      field_overrides: '{}',
    };

    // Define section fields
    const SECTION_FIELDS = {
      personal: [
        'first_name',
        'pronouns',
        'birthdate',
        'language',
        'timezone',
        'phone',
        'city',
        'state',
        'zip',
      ],
      work: [
        'employment_status',
        'employer',
        'work_schedule',
        'schedule_flexibility',
        'commute_time',
        'travel_required',
      ],
      health: [
        'health_physical_conditions',
        'health_physical_limitations',
        'health_mental_conditions',
        'health_mental_treatment',
        'health_mental_history',
        'health_substance_history',
        'health_in_recovery',
        'health_recovery_duration',
      ],
      financial: [
        'finance_income_level',
        'finance_income_stability',
        'finance_employment_benefits',
        'finance_housing_status',
        'finance_housing_type',
        'finance_vehicles',
        'finance_debt_stress',
        'finance_support_paying',
        'finance_support_receiving',
      ],
      background: [
        'background_birthplace',
        'background_raised',
        'background_family_origin',
        'background_culture',
        'background_religion',
        'background_military',
        'background_military_branch',
        'background_military_status',
        'education_level',
        'education_field',
      ],
    };

    // Create filtered profile (as co-parent would see it)
    const filteredProfile = { ...profile };

    // ALWAYS remove health fields (never shared)
    for (const field of SECTION_FIELDS.health) {
      delete filteredProfile[field];
    }

    // ALWAYS remove financial fields (never shared)
    for (const field of SECTION_FIELDS.financial) {
      delete filteredProfile[field];
    }

    // Apply personal visibility
    if (settings.personal_visibility === 'private') {
      // Keep name but hide other personal fields
      for (const field of SECTION_FIELDS.personal) {
        if (field !== 'first_name') {
          delete filteredProfile[field];
        }
      }
    }

    // Apply work visibility
    if (settings.work_visibility === 'private') {
      for (const field of SECTION_FIELDS.work) {
        delete filteredProfile[field];
      }
    }

    // Apply background visibility
    if (settings.background_visibility === 'private') {
      for (const field of SECTION_FIELDS.background) {
        delete filteredProfile[field];
      }
    }

    // Apply field-level overrides
    try {
      const overrides =
        typeof settings.field_overrides === 'string'
          ? JSON.parse(settings.field_overrides)
          : settings.field_overrides || {};

      for (const [field, visibility] of Object.entries(overrides)) {
        if (visibility === 'private') {
          delete filteredProfile[field];
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }

    res.json(filteredProfile);
  } catch (error) {
    handleServiceError(error, res);
  }
});

module.exports = router;
