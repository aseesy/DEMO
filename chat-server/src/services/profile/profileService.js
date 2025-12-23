/**
 * Profile Service
 *
 * Actor: Product/UX (user profile management)
 * Responsibility: User profile CRUD, password management, onboarding status
 *
 * Consolidates profile-related business logic from user routes.
 */

const { BaseService } = require('../BaseService');
const { NotFoundError, ValidationError, AuthenticationError } = require('../errors');
const {
  PostgresUserRepository,
  PostgresContactRepository,
  PostgresProfileRepository,
  PostgresGenericRepository,
} = require('../../repositories');
const { ensureProfileColumnsExist } = require('../../infrastructure/database/schema');
const { withRetry } = require('../../../utils/dbRetry');

/**
 * Extract profile data from a user object
 * @param {Object} user - User record from database
 * @returns {Object} Profile data
 */
function extractProfileData(user) {
  return {
    username: user.username,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    address: user.address,
    timezone: user.timezone,
    profilePictureUrl: user.profile_picture_url,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

/**
 * Format profile data for SQL update
 * @param {Object} profileData - Profile data from client
 * @returns {Object} Formatted data with snake_case keys
 */
function formatProfileForUpdate(profileData) {
  const mapping = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone',
    address: 'address',
    timezone: 'timezone',
    profilePictureUrl: 'profile_picture_url',
  };

  const result = {};
  for (const [camelCase, snakeCase] of Object.entries(mapping)) {
    if (profileData[camelCase] !== undefined) {
      result[snakeCase] = profileData[camelCase];
    }
  }
  return result;
}

class ProfileService extends BaseService {
  constructor() {
    // Use user repository instead of direct table access
    super(null, new PostgresUserRepository());
    this.userRepository = this.repository; // Alias for clarity
    this.contactRepository = new PostgresContactRepository();
    this.profileRepository = new PostgresProfileRepository();
    this.privacyRepository = new PostgresGenericRepository('user_profile_privacy');
    this.auth = null; // Injected via setAuth
  }

  /**
   * Set the auth instance (injected from server.js)
   */
  setAuth(auth) {
    this.auth = auth;
  }

  /**
   * Get user profile by username
   * @param {string} username - Username
   * @returns {Promise<Object>} Profile data
   */
  async getProfile(username) {
    if (!username) {
      throw new ValidationError('Username is required', 'username');
    }

    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      throw new NotFoundError('User', username);
    }

    const profile = extractProfileData(user);

    return {
      success: true,
      profile,
    };
  }

  /**
   * Update user profile
   * @param {string} username - Username
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Update result
   */
  async updateProfile(username, profileData) {
    if (!username) {
      throw new ValidationError('Username is required', 'username');
    }
    if (!profileData) {
      throw new ValidationError('Profile data is required', 'profileData');
    }

    // Ensure schema has all profile columns
    await ensureProfileColumnsExist();

    const updateData = formatProfileForUpdate(profileData);

    return withRetry(
      async () => {
        await this.query(
          `UPDATE users SET ${Object.keys(updateData)
            .map((k, i) => `${k} = $${i + 2}`)
            .join(', ')} WHERE LOWER(username) = LOWER($1)`,
          [username, ...Object.values(updateData)]
        );

        return {
          success: true,
          message: 'Profile updated',
        };
      },
      {
        operationName: 'updateProfile',
        context: { username },
      }
    );
  }

  /**
   * Change user password
   * @param {string} username - Username
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Change result
   */
  async changePassword(username, currentPassword, newPassword) {
    if (!username) {
      throw new ValidationError('Username is required', 'username');
    }
    if (!currentPassword) {
      throw new ValidationError('Current password is required', 'currentPassword');
    }
    if (!newPassword) {
      throw new ValidationError('New password is required', 'newPassword');
    }
    if (newPassword.length < 10) {
      throw new ValidationError('Password must be at least 10 characters', 'newPassword');
    }

    // Verify current password
    const user = await this.auth.authenticateUser(username, currentPassword);
    if (!user) {
      throw new AuthenticationError('Invalid current password');
    }

    // Hash and update new password
    const hashedPassword = await this.auth.hashPassword(newPassword);
    await this.userRepository.updatePassword(user.id, hashedPassword);

    return {
      success: true,
      message: 'Password changed',
    };
  }

  /**
   * Get user onboarding status
   * @param {string} username - Username
   * @returns {Promise<Object>} Onboarding status
   */
  async getOnboardingStatus(username) {
    if (!username) {
      throw new ValidationError('Username is required', 'username');
    }

    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      throw new NotFoundError('User', username);
    }

    // Check if profile is complete
    const profileComplete = !!(user.first_name || user.last_name || user.email);

    // Check for co-parent contact
    const coparent = await this.contactRepository.findByRelationship(user.id, 'co-parent');
    const hasCoparent = !!coparent;

    // Check for children
    const contacts = await this.contactRepository.getRelationships(user.id);
    const hasChildren = contacts.some(c => c.relationship?.toLowerCase().includes('child'));

    // Check for shared room (connected with co-parent)
    const { PostgresRoomRepository } = require('../../repositories');
    const roomRepository = new PostgresRoomRepository();
    const sharedRooms = await roomRepository.findSharedRooms(user.id);
    const isConnected = sharedRooms.length > 0;

    return {
      profileComplete,
      hasCoparent,
      isConnected,
      hasChildren,
      showDashboard: !profileComplete || !hasCoparent || !hasChildren,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPREHENSIVE PROFILE (Normalized Tables)
  // These methods work with the new normalized profile tables
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get comprehensive profile from normalized tables
   * Combines data from users table with normalized profile tables
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Complete profile data
   */
  async getComprehensiveProfile(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required', 'userId');
    }

    // Get base user info
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Get profile data from normalized tables
    const profileData = await this.profileRepository.getCompleteProfile(userId);

    // Merge user identity fields with profile data
    return {
      // Identity from users table (auth-related)
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      display_name: user.display_name,
      profile_picture_url: user.profile_picture_url,
      profile_completion_percentage: user.profile_completion_percentage || 0,
      profile_last_updated: user.profile_last_updated,
      created_at: user.created_at,
      // Normalized profile data
      ...(profileData || {}),
    };
  }

  /**
   * Update comprehensive profile to normalized tables
   * Routes updates to appropriate tables based on field names
   *
   * @param {number} userId - User ID
   * @param {Object} updates - Profile updates
   * @param {Function} calculateCompletion - Function to calculate completion %
   * @returns {Promise<Object>} Updated profile with completion percentage
   */
  async updateComprehensiveProfile(userId, updates, calculateCompletion) {
    if (!userId) {
      throw new ValidationError('User ID is required', 'userId');
    }
    if (!updates || Object.keys(updates).length === 0) {
      throw new ValidationError('Updates are required', 'updates');
    }

    return withRetry(
      async () => {
        // Separate user table fields from profile table fields
        const userTableFields = [
          'first_name',
          'last_name',
          'email',
          'display_name',
          'phone',
          'profile_picture_url',
        ];

        const userUpdates = {};
        const profileUpdates = {};

        for (const [key, value] of Object.entries(updates)) {
          if (userTableFields.includes(key)) {
            userUpdates[key] = value;
          } else {
            profileUpdates[key] = value;
          }
        }

        // Update users table if needed
        if (Object.keys(userUpdates).length > 0) {
          userUpdates.profile_last_updated = new Date().toISOString();
          await this.userRepository.updateById(userId, userUpdates);
        }

        // Update normalized profile tables
        if (Object.keys(profileUpdates).length > 0) {
          await this.profileRepository.updateProfile(userId, profileUpdates);
        }

        // Calculate and update completion percentage
        const fullProfile = await this.getComprehensiveProfile(userId);
        const completionPercentage = calculateCompletion
          ? calculateCompletion(fullProfile)
          : 0;

        if (completionPercentage !== fullProfile.profile_completion_percentage) {
          await this.userRepository.updateById(userId, {
            profile_completion_percentage: completionPercentage,
          });
        }

        return {
          ...fullProfile,
          profile_completion_percentage: completionPercentage,
        };
      },
      {
        operationName: 'updateComprehensiveProfile',
        context: { userId },
      }
    );
  }

  /**
   * Get privacy settings for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Privacy settings or null
   */
  async getPrivacySettings(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required', 'userId');
    }

    return this.privacyRepository.findOne({ user_id: userId });
  }

  /**
   * Update privacy settings for a user
   *
   * @param {number} userId - User ID
   * @param {Object} settings - Privacy settings to update
   * @returns {Promise<Object>} Updated privacy settings
   */
  async updatePrivacySettings(userId, settings) {
    if (!userId) {
      throw new ValidationError('User ID is required', 'userId');
    }
    if (!settings) {
      throw new ValidationError('Settings are required', 'settings');
    }

    // Health and financial are ALWAYS private (immutable)
    settings.health_visibility = 'private';
    settings.financial_visibility = 'private';
    settings.updated_at = new Date().toISOString();

    const existing = await this.privacyRepository.findOne({ user_id: userId });

    if (existing) {
      await this.privacyRepository.update({ user_id: userId }, settings);
    } else {
      await this.privacyRepository.create({
        user_id: userId,
        ...settings,
        created_at: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: 'Privacy settings updated successfully.',
    };
  }
}

// Export singleton instance
const profileService = new ProfileService();

module.exports = { profileService, ProfileService };
