const express = require('express');
const router = express.Router();
const db = require('../dbPostgres');
const { authenticate } = require('../middleware/auth'); // Assuming auth middleware exists

// A helper function to get all profile-related columns from the users table schema
// This avoids manually listing all 40+ columns
const getProfileColumns = async () => {
  const res = await db.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name NOT IN ('id', 'password_hash', 'google_id', 'created_at', 'last_login', 'oauth_provider');
    `);
  return res.rows.map(row => row.column_name);
};

/**
 * GET /api/profile/me
 * Gets the complete profile for the currently authenticated user.
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const { userId } = req.user; // From auth middleware

    // Get user profile data
    const profileColumns = await getProfileColumns();
    const userQuery = await db.query(
      `SELECT ${profileColumns.join(', ')} FROM users WHERE id = $1`,
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    const profileData = userQuery.rows[0];

    // Get privacy settings
    const privacyQuery = await db.query('SELECT * FROM user_profile_privacy WHERE user_id = $1', [
      userId,
    ]);

    const privacySettings = privacyQuery.rows.length > 0 ? privacyQuery.rows[0] : null;

    console.log('DEBUG: Returning profile data for user:', userId, profileData);
    console.log('DEBUG: Returning privacy settings for user:', userId, privacySettings);

    res.json({
      ...profileData,
      privacySettings,
      isOwnProfile: true, // Always true for /me endpoint
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Internal server error while getting profile.' });
  }
});

/**
 * PUT /api/profile/me
 * Updates the profile for the currently authenticated user.
 */
router.put('/me', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const updates = req.body;

    console.log('DEBUG PUT /api/profile/me - userId:', userId);
    console.log('DEBUG PUT /api/profile/me - req.user:', req.user);
    console.log('DEBUG PUT /api/profile/me - updates keys:', Object.keys(updates));

    if (!userId) {
      console.error('DEBUG PUT /api/profile/me - No userId found in token!');
      return res.status(401).json({ error: 'Invalid authentication token - no user ID.' });
    }

    const allProfileColumns = await getProfileColumns();

    // Fields managed by the backend - exclude from user updates
    const backendManagedFields = [
      'profile_last_updated',
      'profile_completion_percentage',
      'currentUsername',
    ];

    // Filter out any keys from the request that are not actual user columns
    // Also exclude backend-managed fields to avoid duplicate column assignments
    const validUpdateKeys = Object.keys(updates).filter(
      key => allProfileColumns.includes(key) && !backendManagedFields.includes(key)
    );

    console.log('DEBUG PUT /api/profile/me - allProfileColumns:', allProfileColumns);
    console.log('DEBUG PUT /api/profile/me - validUpdateKeys:', validUpdateKeys);

    if (validUpdateKeys.length === 0) {
      console.log(
        'DEBUG PUT /api/profile/me - No valid fields! Request keys:',
        Object.keys(updates)
      );
      return res.status(400).json({ error: 'No valid profile fields provided for update.' });
    }

    // Dynamically build the SET part of the SQL query
    const setClauses = validUpdateKeys.map((key, index) => {
      return `"${key}" = $${index + 2}`;
    });

    const updateValues = validUpdateKeys.map(key => updates[key]);

    // Add profile_last_updated timestamp
    setClauses.push(`"profile_last_updated" = $${validUpdateKeys.length + 2}`);
    updateValues.push(new Date());

    // Build RETURNING clause with quoted column names for safety
    const returningColumns = allProfileColumns.map(col => `"${col}"`).join(', ');
    const queryText = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $1 RETURNING ${returningColumns}`;
    const queryValues = [userId, ...updateValues];

    console.log('DEBUG PUT /api/profile/me - Query:', queryText.substring(0, 200) + '...');
    console.log('DEBUG PUT /api/profile/me - Query values count:', queryValues.length);

    const { rows } = await db.query(queryText, queryValues);
    const updatedProfile = rows[0];

    // Recalculate and update completion percentage (simple version)
    const filledCount = allProfileColumns.filter(
      col => updatedProfile[col] != null && updatedProfile[col] !== ''
    ).length;
    const completionPercentage = Math.round((filledCount / allProfileColumns.length) * 100);

    const finalProfileQuery = await db.query(
      'UPDATE users SET profile_completion_percentage = $1 WHERE id = $2 RETURNING profile_completion_percentage',
      [completionPercentage, userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      completionPercentage: finalProfileQuery.rows[0].profile_completion_percentage,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      userId: req.user?.userId,
      updateKeys: Object.keys(req.body || {}),
    });
    res.status(500).json({
      error: 'Internal server error while updating profile.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/profile/privacy/me
 * Gets privacy settings for the currently authenticated user.
 */
router.get('/privacy/me', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;

    const privacyQuery = await db.query('SELECT * FROM user_profile_privacy WHERE user_id = $1', [
      userId,
    ]);

    if (privacyQuery.rows.length === 0) {
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

    res.json(privacyQuery.rows[0]);
  } catch (error) {
    console.error('Error getting privacy settings:', error);
    res.status(500).json({ error: 'Internal server error while getting privacy settings.' });
  }
});

/**
 * PUT /api/profile/privacy/me
 * Updates privacy settings for the currently authenticated user.
 */
router.put('/privacy/me', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      personal_visibility,
      work_visibility,
      health_visibility,
      financial_visibility,
      background_visibility,
      field_overrides,
    } = req.body;

    // Prevent changing health/financial visibility (always private)
    if (health_visibility === 'shared' || financial_visibility === 'shared') {
      return res.status(400).json({
        error: 'Health and financial information must remain private for your safety.',
      });
    }

    // Check if settings already exist
    const existingQuery = await db.query('SELECT id FROM user_profile_privacy WHERE user_id = $1', [
      userId,
    ]);

    const settingsData = {
      personal_visibility: personal_visibility || 'shared',
      work_visibility: work_visibility || 'private',
      health_visibility: 'private', // Force private
      financial_visibility: 'private', // Force private
      background_visibility: background_visibility || 'shared',
      field_overrides:
        typeof field_overrides === 'string'
          ? field_overrides
          : JSON.stringify(field_overrides || {}),
      updated_at: new Date(),
    };

    if (existingQuery.rows.length > 0) {
      // Update existing settings
      await db.query(
        `UPDATE user_profile_privacy SET
                    personal_visibility = $1,
                    work_visibility = $2,
                    health_visibility = $3,
                    financial_visibility = $4,
                    background_visibility = $5,
                    field_overrides = $6,
                    updated_at = $7
                WHERE user_id = $8`,
        [
          settingsData.personal_visibility,
          settingsData.work_visibility,
          settingsData.health_visibility,
          settingsData.financial_visibility,
          settingsData.background_visibility,
          settingsData.field_overrides,
          settingsData.updated_at,
          userId,
        ]
      );
    } else {
      // Insert new settings
      await db.query(
        `INSERT INTO user_profile_privacy
                (user_id, personal_visibility, work_visibility, health_visibility, financial_visibility, background_visibility, field_overrides, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
        [
          userId,
          settingsData.personal_visibility,
          settingsData.work_visibility,
          settingsData.health_visibility,
          settingsData.financial_visibility,
          settingsData.background_visibility,
          settingsData.field_overrides,
          settingsData.updated_at,
        ]
      );
    }

    res.json({ success: true, message: 'Privacy settings updated successfully.' });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ error: 'Internal server error while updating privacy settings.' });
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
    const profileColumns = await getProfileColumns();
    const userQuery = await db.query(
      `SELECT ${profileColumns.join(', ')} FROM users WHERE id = $1`,
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const profile = userQuery.rows[0];

    // Get privacy settings
    const privacyQuery = await db.query('SELECT * FROM user_profile_privacy WHERE user_id = $1', [
      userId,
    ]);

    const settings =
      privacyQuery.rows.length > 0
        ? privacyQuery.rows[0]
        : {
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
    console.error('Error generating co-parent preview:', error);
    res.status(500).json({ error: 'Internal server error while generating preview.' });
  }
});

module.exports = router;
