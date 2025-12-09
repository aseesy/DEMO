/**
 * User Routes
 *
 * Handles user profile management, privacy settings, and onboarding status.
 * Feature 010: Comprehensive User Profile System
 * Extracted from server.js for better maintainability.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const dbSafe = require('../dbSafe');
const db = require('../dbPostgres');
const auth = require('../auth');
const profileHelpers = require('../src/utils/profileHelpers');
const { ensureProfileColumnsExist, clearColumnCache } = require('../src/utils/schema');

// Helper references - set from server.js
let JWT_SECRET;
let autoCompleteOnboardingTasks;

router.setHelpers = function(helpers) {
  JWT_SECRET = helpers.JWT_SECRET;
  autoCompleteOnboardingTasks = helpers.autoCompleteOnboardingTasks;
};

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * GET /api/user/onboarding-status
 * Get onboarding/dashboard status
 */
router.get('/onboarding-status', async (req, res) => {
  try {
    const username = req.query.username || req.body.username;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Check if profile is complete (has at least first_name or last_name)
    const profileComplete = !!(user.first_name || user.last_name || user.email);

    // Check if has co-parent contact
    const coparentResult = await dbSafe.safeSelect('contacts', {
      user_id: user.id,
      relationship: 'co-parent'
    }, { limit: 1 });
    const hasCoparent = dbSafe.parseResult(coparentResult).length > 0;

    // Check if has children in contacts (relationship includes "child" or "children")
    const childrenResult = await dbSafe.safeSelect('contacts', {
      user_id: user.id
    });
    const allContacts = dbSafe.parseResult(childrenResult);
    const hasChildren = allContacts.some(c =>
      c.relationship && (
        c.relationship.toLowerCase().includes('child') ||
        c.relationship.toLowerCase().includes('son') ||
        c.relationship.toLowerCase().includes('daughter')
      )
    );

    // Check if user is in shared room (co-parent connected)
    // Use safeExec for complex query - user.id is already validated as integer
    const sharedRoomQuery = `
      SELECT COUNT(rm2.user_id) as member_count
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
      LEFT JOIN room_members rm2 ON r.id = rm2.room_id
      WHERE rm.user_id = ${parseInt(user.id)}
      GROUP BY r.id
      HAVING member_count > 1
      LIMIT 1
    `;
    const sharedRoomResult = db.exec(sharedRoomQuery);
    const isConnected = sharedRoomResult.length > 0 && sharedRoomResult[0].values.length > 0;

    res.json({
      profileComplete,
      hasCoparent,
      isConnected,
      hasChildren,
      showDashboard: !profileComplete || !hasCoparent || !hasChildren
    });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/profile
 * Get current user's profile (with privacy filtering for co-parent views)
 */
router.get('/profile', async (req, res) => {
  try {
    // Get username from JWT token if authenticated, otherwise from query/body
    let username = req.query.username || req.body.username;
    let requestingUsername = req.query.requestingUsername || req.body.requestingUsername;

    // If no username provided, try to get from JWT token
    if (!username) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, JWT_SECRET);
          username = decoded.username;
          requestingUsername = decoded.username; // User viewing their own profile
        } catch (err) {
          // Token invalid, fall through to error
        }
      }
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required or provide valid authorization token' });
    }

    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Determine if this is the user viewing their own profile
    const isOwnProfile = !requestingUsername ||
      requestingUsername.toLowerCase() === username.toLowerCase();

    // Load privacy settings
    const privacyResult = await dbSafe.safeSelect('user_profile_privacy', { user_id: user.id }, { limit: 1 });
    const privacyRows = dbSafe.parseResult(privacyResult);

    const privacySettings = privacyRows[0] || profileHelpers.getDefaultPrivacySettings();

    // Build base profile object with all fields
    const baseProfile = {
      // Core fields
      username: user.username,
      email: user.email || null,

      // Personal information
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      display_name: user.display_name || null,
      preferred_name: user.preferred_name || null,
      pronouns: user.pronouns || null,
      birthdate: user.birthdate || null,
      language: user.language || 'en',
      timezone: user.timezone || null,
      phone: user.phone || null,
      city: user.city || null,
      state: user.state || null,
      zip: user.zip || null,
      address: user.address || null,

      // Work & Schedule
      employment_status: user.employment_status || null,
      occupation: user.occupation || null,
      employer: user.employer || null,
      work_schedule: user.work_schedule || null,
      schedule_flexibility: user.schedule_flexibility || null,
      commute_time: user.commute_time || null,
      travel_required: user.travel_required || null,

      // Health & Wellbeing (encrypted in database)
      health_physical_conditions: user.health_physical_conditions || null,
      health_physical_limitations: user.health_physical_limitations || null,
      health_mental_conditions: user.health_mental_conditions || null,
      health_mental_treatment: user.health_mental_treatment || null,
      health_mental_history: user.health_mental_history || null,
      health_substance_history: user.health_substance_history || null,
      health_in_recovery: user.health_in_recovery || null,
      health_recovery_duration: user.health_recovery_duration || null,

      // Financial Context (encrypted in database)
      finance_income_level: user.finance_income_level || null,
      finance_income_stability: user.finance_income_stability || null,
      finance_employment_benefits: user.finance_employment_benefits || null,
      finance_housing_status: user.finance_housing_status || null,
      finance_housing_type: user.finance_housing_type || null,
      finance_vehicles: user.finance_vehicles || null,
      finance_debt_stress: user.finance_debt_stress || null,
      finance_support_paying: user.finance_support_paying || null,
      finance_support_receiving: user.finance_support_receiving || null,

      // Background & Education
      background_birthplace: user.background_birthplace || null,
      background_raised: user.background_raised || null,
      background_family_origin: user.background_family_origin || null,
      background_culture: user.background_culture || null,
      background_religion: user.background_religion || null,
      background_military: user.background_military || null,
      background_military_branch: user.background_military_branch || null,
      background_military_status: user.background_military_status || null,
      education_level: user.education_level || null,
      education_field: user.education_field || null,

      // Existing fields
      additional_context: user.additional_context || null,
      profile_picture: user.profile_picture || null,
      household_members: user.household_members || null,
      communication_style: user.communication_style || null,
      communication_triggers: user.communication_triggers || null,
      communication_goals: user.communication_goals || null,

      // Profile metadata
      profile_completion_percentage: user.profile_completion_percentage || 0,
      profile_last_updated: user.profile_last_updated || null
    };

    // Apply privacy filtering
    const filteredProfile = profileHelpers.filterProfileByPrivacy(
      baseProfile,
      privacySettings,
      isOwnProfile
    );

    // Calculate completion if not set
    if (!filteredProfile.profile_completion_percentage) {
      filteredProfile.profile_completion_percentage = profileHelpers.calculateProfileCompletion(baseProfile);
    }

    // Log profile view if viewing co-parent's profile
    if (!isOwnProfile && requestingUsername) {
      const requestingUserResult = await dbSafe.safeSelect('users', { username: requestingUsername.toLowerCase() }, { limit: 1 });
      const requestingUsers = dbSafe.parseResult(requestingUserResult);
      if (requestingUsers.length > 0) {
        await profileHelpers.logProfileView(user.id, requestingUsers[0].id, db, {
          ip: req.ip,
          userAgent: req.get('user-agent')
        });
      }
    }

    // Add isOwnProfile flag and privacy settings (only for own profile)
    res.json({
      ...filteredProfile,
      isOwnProfile,
      privacySettings: isOwnProfile ? privacySettings : null
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/user/profile
 * Update current user's profile
 */
router.put('/profile', async (req, res) => {
  try {
    // Check if request body was parsed correctly
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body. Request may be too large.' });
    }

    const { currentUsername, username, email, first_name, last_name, display_name, address, additional_context, profile_picture, household_members, occupation, communication_style, communication_triggers, communication_goals } = req.body;

    // Debug logging
    console.log('Profile update request:', {
      currentUsername,
      hasCommunicationStyle: communication_style !== undefined,
      hasCommunicationTriggers: communication_triggers !== undefined,
      hasCommunicationGoals: communication_goals !== undefined,
      requestBodySize: JSON.stringify(req.body).length
    });

    // Use currentUsername to find the user, fallback to username, then JWT token
    let lookupUsername = currentUsername || username;

    // If no username provided, try to get from JWT token
    if (!lookupUsername) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, JWT_SECRET);
          lookupUsername = decoded.username;
        } catch (err) {
          // Token invalid, fall through to error
        }
      }
    }

    if (!lookupUsername) {
      return res.status(400).json({ error: 'Username is required or provide valid authorization token' });
    }

    // Get user ID using current username (to find the user)
    const userResult = await dbSafe.safeSelect('users', { username: lookupUsername.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;
    const dbUsername = users[0].username;

    // Build update object with only provided fields
    const updateData = {};

    // Handle username update if provided and different
    const newUsername = username ? username.trim() : null;
    if (newUsername && newUsername.toLowerCase() !== dbUsername.toLowerCase()) {
      // Validate username length
      if (newUsername.length < 2 || newUsername.length > 20) {
        return res.status(400).json({ error: 'Username must be between 2 and 20 characters' });
      }

      // Check username uniqueness (case-insensitive)
      const usernameCheck = await dbSafe.safeSelect('users', { username: newUsername.toLowerCase() }, { limit: 1 });
      const existingUsers = dbSafe.parseResult(usernameCheck);
      if (existingUsers.length > 0 && existingUsers[0].id !== userId) {
        return res.status(400).json({ error: 'Username already in use' });
      }

      updateData.username = newUsername.toLowerCase();
    }

    if (email !== undefined) {
      const trimmedEmail = email ? email.trim().toLowerCase() : null;
      if (trimmedEmail) {
        // Validate email format
        if (!isValidEmail(trimmedEmail)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }
      }
      updateData.email = trimmedEmail;
    }

    // Field length limits to prevent database issues
    const MAX_FIELD_LENGTHS = {
      first_name: 100,
      last_name: 100,
      display_name: 100,
      address: 500,
      additional_context: 2000,
      profile_picture: 500000, // base64 images can be large
      household_members: 1000,
      occupation: 200,
      communication_style: 1000,
      communication_triggers: 1000,
      communication_goals: 1000
    };

    if (first_name !== undefined) {
      const trimmed = first_name != null ? String(first_name).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.first_name) {
        return res.status(400).json({ error: `First name must be ${MAX_FIELD_LENGTHS.first_name} characters or less` });
      }
      updateData.first_name = trimmed;
    }
    if (last_name !== undefined) {
      const trimmed = last_name != null ? String(last_name).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.last_name) {
        return res.status(400).json({ error: `Last name must be ${MAX_FIELD_LENGTHS.last_name} characters or less` });
      }
      updateData.last_name = trimmed;
    }
    if (display_name !== undefined) {
      const trimmed = display_name != null ? String(display_name).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.display_name) {
        return res.status(400).json({ error: `Display name must be ${MAX_FIELD_LENGTHS.display_name} characters or less` });
      }
      updateData.display_name = trimmed;
    }
    if (address !== undefined) {
      const trimmed = address != null ? String(address).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.address) {
        return res.status(400).json({ error: `Address must be ${MAX_FIELD_LENGTHS.address} characters or less` });
      }
      updateData.address = trimmed;
    }
    if (additional_context !== undefined) {
      const trimmed = additional_context != null ? String(additional_context).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.additional_context) {
        return res.status(400).json({ error: `Additional context must be ${MAX_FIELD_LENGTHS.additional_context} characters or less` });
      }
      updateData.additional_context = trimmed;
    }
    if (profile_picture !== undefined) {
      // Profile picture can be null/empty to clear, or a base64 string/URL
      const trimmed = profile_picture != null ? String(profile_picture) : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.profile_picture) {
        return res.status(400).json({ error: 'Profile picture is too large. Please use a smaller image.' });
      }
      updateData.profile_picture = trimmed;
    }
    if (household_members !== undefined) {
      const trimmed = household_members != null ? String(household_members).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.household_members) {
        return res.status(400).json({ error: `Household members must be ${MAX_FIELD_LENGTHS.household_members} characters or less` });
      }
      updateData.household_members = trimmed;
    }
    if (occupation !== undefined) {
      const trimmed = occupation != null ? String(occupation).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.occupation) {
        return res.status(400).json({ error: `Occupation must be ${MAX_FIELD_LENGTHS.occupation} characters or less` });
      }
      updateData.occupation = trimmed;
    }
    if (communication_style !== undefined) {
      const trimmed = communication_style != null ? String(communication_style).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.communication_style) {
        return res.status(400).json({ error: `Communication style must be ${MAX_FIELD_LENGTHS.communication_style} characters or less` });
      }
      updateData.communication_style = trimmed;
    }
    if (communication_triggers !== undefined) {
      const trimmed = communication_triggers != null ? String(communication_triggers).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.communication_triggers) {
        return res.status(400).json({ error: `Communication triggers must be ${MAX_FIELD_LENGTHS.communication_triggers} characters or less` });
      }
      updateData.communication_triggers = trimmed;
    }
    if (communication_goals !== undefined) {
      const trimmed = communication_goals != null ? String(communication_goals).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.communication_goals) {
        return res.status(400).json({ error: `Communication goals must be ${MAX_FIELD_LENGTHS.communication_goals} characters or less` });
      }
      updateData.communication_goals = trimmed;
    }

    // Feature 010: Comprehensive User Profile System - Handle new profile fields
    // Define all new profile fields from Feature 010
    const newProfileFields = [
      // Personal Information
      'preferred_name', 'pronouns', 'birthdate', 'language', 'timezone',
      'phone', 'city', 'state', 'zip',
      // Work & Schedule
      'employment_status', 'employer', 'work_schedule', 'schedule_flexibility',
      'commute_time', 'travel_required',
      // Health & Wellbeing
      'health_physical_conditions', 'health_physical_limitations',
      'health_mental_conditions', 'health_mental_treatment', 'health_mental_history',
      'health_substance_history', 'health_in_recovery', 'health_recovery_duration',
      // Financial Context
      'finance_income_level', 'finance_income_stability', 'finance_employment_benefits',
      'finance_housing_status', 'finance_housing_type', 'finance_vehicles',
      'finance_debt_stress', 'finance_support_paying', 'finance_support_receiving',
      // Background & Education
      'background_birthplace', 'background_raised', 'background_family_origin',
      'background_culture', 'background_religion', 'background_military',
      'background_military_branch', 'background_military_status',
      'education_level', 'education_field'
    ];

    // Extract new profile fields from request body
    const newFieldData = {};
    for (const field of newProfileFields) {
      if (req.body[field] !== undefined) {
        const value = req.body[field];
        newFieldData[field] = value != null ? String(value).trim() : null;
      }
    }

    // Validate new profile fields using profileHelpers
    if (Object.keys(newFieldData).length > 0) {
      const validation = profileHelpers.validateProfileFields(newFieldData);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      // Encrypt sensitive fields before adding to updateData
      const encryptedData = profileHelpers.encryptSensitiveFields(newFieldData);

      // Add all new fields to updateData
      Object.assign(updateData, encryptedData);
    }

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== users[0].email) {
      const emailCheck = await dbSafe.safeSelect('users', { email: updateData.email }, { limit: 1 });
      const existingUsers = dbSafe.parseResult(emailCheck);
      if (existingUsers.length > 0 && existingUsers[0].id !== userId) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Log what we're about to update
    console.log('Updating user profile:', {
      userId,
      updateDataKeys: Object.keys(updateData),
      updateData: updateData
    });

    // Runtime safety net: Ensure required columns exist before updating
    try {
      await ensureProfileColumnsExist();
    } catch (schemaError) {
      console.error('Error ensuring profile columns exist:', schemaError);
      // Log but don't fail - migration should handle this, but we continue as safety net
    }

    try {
      await dbSafe.safeUpdate('users', updateData, { id: userId });
    } catch (updateError) {
      // Check if error is due to missing column
      if (updateError.message && updateError.message.includes('does not exist')) {
        console.error('Database schema error detected:', updateError.message);
        console.log('Attempting to create missing columns and retry...');

        // Try to ensure columns exist again (force refresh cache)
        try {
          clearColumnCache();
          await ensureProfileColumnsExist();

          // Retry the update
          await dbSafe.safeUpdate('users', updateData, { id: userId });
          console.log('Profile update succeeded after creating missing columns');
        } catch (retryError) {
          console.error('Failed to fix schema and retry:', retryError);
          return res.status(500).json({
            error: 'Profile save failed. Please refresh the page and try again. If the problem persists, contact support.',
            details: process.env.NODE_ENV === 'development' ? retryError.message : undefined
          });
        }
      } else {
        // Re-throw if it's a different error
        throw updateError;
      }
    }

    console.log('Profile updated successfully for user:', userId);

    // Auto-complete onboarding tasks if conditions are met
    if (autoCompleteOnboardingTasks) {
      try {
        await autoCompleteOnboardingTasks(userId);
      } catch (error) {
        console.error('Error auto-completing onboarding tasks:', error);
        // Don't fail profile update if this fails
      }
    }

    // Return updated username if it was changed
    const updatedUsername = updateData.username || dbUsername;

    // Feature 010: Calculate and update profile completion percentage
    let completionPercentage = 0;
    try {
      // Fetch updated user profile for completion calculation
      const updatedUserResult = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
      const updatedUsers = dbSafe.parseResult(updatedUserResult);
      if (updatedUsers.length > 0) {
        completionPercentage = profileHelpers.calculateProfileCompletion(updatedUsers[0]);

        // Update completion percentage in database
        await dbSafe.safeUpdate('users', {
          profile_completion_percentage: completionPercentage,
          profile_last_updated: new Date().toISOString()
        }, { id: userId });

        // Log profile changes to audit log (async, don't wait)
        if (Object.keys(newFieldData).length > 0) {
          profileHelpers.logProfileChanges(userId, users[0], newFieldData, {
            ip: req.ip,
            userAgent: req.get('user-agent')
          }).catch(err => console.error('Audit log error:', err));
        }
      }
    } catch (completionError) {
      console.error('Error calculating completion:', completionError);
      // Don't fail the main update
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      username: updatedUsername,
      completionPercentage
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    console.error('Error stack:', error.stack);

    // Check if error is related to missing columns
    if (error.message && error.message.includes('does not exist')) {
      return res.status(500).json({
        error: 'Profile save failed. Please refresh the page and try again. If the problem persists, contact support.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Return more detailed error for Safari
    res.status(500).json({
      error: error.message || 'Failed to update profile',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * PUT /api/user/password
 * Update password
 */
router.put('/password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Username, current password, and new password are required' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters' });
    }

    // Authenticate with current password
    const user = await auth.authenticateUser(username, currentPassword);
    if (!user) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    const newPasswordHash = await auth.hashPassword(newPassword);
    await dbSafe.safeUpdate('users', { password_hash: newPasswordHash }, { id: user.id });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/profile/privacy
 * Get privacy settings for current user
 */
router.get('/profile/privacy', async (req, res) => {
  try {
    let username = req.query.username || req.body.username;

    // If no username provided, try to get from JWT token
    if (!username) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, JWT_SECRET);
          username = decoded.username;
        } catch (err) {
          // Token invalid, fall through to error
        }
      }
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required or provide valid authorization token' });
    }

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Get privacy settings
    const privacyResult = await dbSafe.safeSelect('user_profile_privacy', { user_id: userId }, { limit: 1 });
    const privacyRows = dbSafe.parseResult(privacyResult);

    const settings = privacyRows[0] || profileHelpers.getDefaultPrivacySettings();

    res.json(settings);
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/user/profile/privacy
 * Update privacy settings for current user
 */
router.put('/profile/privacy', async (req, res) => {
  try {
    let { username, personal_visibility, work_visibility, background_visibility, health_visibility, financial_visibility, field_overrides } = req.body;

    // If no username provided, try to get from JWT token
    if (!username) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, JWT_SECRET);
          username = decoded.username;
        } catch (err) {
          // Token invalid, fall through to error
        }
      }
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required or provide valid authorization token' });
    }

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // SECURITY: Prevent changing health/financial visibility (always private)
    if (health_visibility === 'shared' || financial_visibility === 'shared') {
      return res.status(400).json({
        error: 'Health and financial information must remain private for your safety'
      });
    }

    // Build settings update
    const settingsData = {
      personal_visibility: personal_visibility || 'shared',
      work_visibility: work_visibility || 'private',
      health_visibility: 'private', // Force private - immutable
      financial_visibility: 'private', // Force private - immutable
      background_visibility: background_visibility || 'shared',
      field_overrides: field_overrides ? JSON.stringify(field_overrides) : '{}',
      updated_at: new Date().toISOString()
    };

    // Check if settings exist
    const existingResult = await dbSafe.safeSelect('user_profile_privacy', { user_id: userId }, { limit: 1 });
    const existing = dbSafe.parseResult(existingResult);

    if (existing.length > 0) {
      // Update existing settings
      await dbSafe.safeUpdate('user_profile_privacy', settingsData, { user_id: userId });

      // Log privacy change
      await profileHelpers.logPrivacyChange(userId, existing[0], settingsData, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    } else {
      // Insert new settings
      await dbSafe.safeInsert('user_profile_privacy', {
        user_id: userId,
        ...settingsData,
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Privacy settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/profile/preview-coparent-view
 * Preview how profile appears to co-parent (privacy-filtered view)
 */
router.get('/profile/preview-coparent-view', async (req, res) => {
  try {
    let username = req.query.username || req.body.username;

    // If no username provided, try to get from JWT token
    if (!username) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, JWT_SECRET);
          username = decoded.username;
        } catch (err) {
          // Token invalid, fall through to error
        }
      }
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required or provide valid authorization token' });
    }

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get privacy settings
    const privacyResult = await dbSafe.safeSelect('user_profile_privacy', { user_id: user.id }, { limit: 1 });
    const privacyRows = dbSafe.parseResult(privacyResult);

    const privacySettings = privacyRows[0] || profileHelpers.getDefaultPrivacySettings();

    // Build full profile
    const baseProfile = {
      username: user.username,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      display_name: user.display_name || null,
      preferred_name: user.preferred_name || null,
      pronouns: user.pronouns || null,
      birthdate: user.birthdate || null,
      language: user.language || 'en',
      timezone: user.timezone || null,
      phone: user.phone || null,
      city: user.city || null,
      state: user.state || null,
      zip: user.zip || null,
      address: user.address || null,
      employment_status: user.employment_status || null,
      occupation: user.occupation || null,
      employer: user.employer || null,
      work_schedule: user.work_schedule || null,
      schedule_flexibility: user.schedule_flexibility || null,
      commute_time: user.commute_time || null,
      travel_required: user.travel_required || null,
      health_physical_conditions: user.health_physical_conditions || null,
      health_physical_limitations: user.health_physical_limitations || null,
      health_mental_conditions: user.health_mental_conditions || null,
      health_mental_treatment: user.health_mental_treatment || null,
      health_mental_history: user.health_mental_history || null,
      health_substance_history: user.health_substance_history || null,
      health_in_recovery: user.health_in_recovery || null,
      health_recovery_duration: user.health_recovery_duration || null,
      finance_income_level: user.finance_income_level || null,
      finance_income_stability: user.finance_income_stability || null,
      finance_employment_benefits: user.finance_employment_benefits || null,
      finance_housing_status: user.finance_housing_status || null,
      finance_housing_type: user.finance_housing_type || null,
      finance_vehicles: user.finance_vehicles || null,
      finance_debt_stress: user.finance_debt_stress || null,
      finance_support_paying: user.finance_support_paying || null,
      finance_support_receiving: user.finance_support_receiving || null,
      background_birthplace: user.background_birthplace || null,
      background_raised: user.background_raised || null,
      background_family_origin: user.background_family_origin || null,
      background_culture: user.background_culture || null,
      background_religion: user.background_religion || null,
      background_military: user.background_military || null,
      background_military_branch: user.background_military_branch || null,
      background_military_status: user.background_military_status || null,
      education_level: user.education_level || null,
      education_field: user.education_field || null,
      profile_picture: user.profile_picture || null
    };

    // Apply privacy filtering as if viewing as co-parent (isOwnProfile = false)
    const filteredProfile = profileHelpers.filterProfileByPrivacy(
      baseProfile,
      privacySettings,
      false // This is a preview of co-parent view
    );

    res.json({
      ...filteredProfile,
      _preview_notice: 'This is how your co-parent sees your profile'
    });
  } catch (error) {
    console.error('Error generating profile preview:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/profile/completion
 * Get profile completion status with section breakdown
 */
router.get('/profile/completion', async (req, res) => {
  try {
    let username = req.query.username || req.body.username;

    // If no username provided, try to get from JWT token
    if (!username) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, JWT_SECRET);
          username = decoded.username;
        } catch (err) {
          // Token invalid, fall through to error
        }
      }
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required or provide valid authorization token' });
    }

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get section-by-section completion
    const sectionCompletion = profileHelpers.getSectionCompletion(user);
    const nextSuggestion = profileHelpers.getNextSuggestedSection(user);

    res.json({
      overall: sectionCompletion.overall,
      sections: {
        personal: sectionCompletion.personal,
        work: sectionCompletion.work,
        health: sectionCompletion.health,
        financial: sectionCompletion.financial,
        background: sectionCompletion.background
      },
      nextSuggestedSection: nextSuggestion,
      isComplete: sectionCompletion.overall >= 100
    });
  } catch (error) {
    console.error('Error fetching completion status:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
