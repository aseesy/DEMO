/**
 * ProfileService Unit Tests
 *
 * Tests ProfileService methods in isolation with mocked repositories.
 */

/* eslint-env jest */

const { ProfileService } = require('../../src/services/profile/profileService');
const { NotFoundError, ValidationError } = require('../../src/services/errors');
const { mockRepository } = require('../utils/serviceMocks');

describe('ProfileService', () => {
  let profileService;
  let mockUserRepository;
  let mockContactRepository;
  let mockProfileRepository;
  let mockPrivacyRepository;

  beforeEach(() => {
    // Create mock repositories
    mockUserRepository = mockRepository();
    mockContactRepository = mockRepository();
    mockProfileRepository = mockRepository();
    mockPrivacyRepository = mockRepository();

    // Create service instance with mocked repositories
    profileService = new ProfileService();
    profileService.userRepository = mockUserRepository;
    profileService.contactRepository = mockContactRepository;
    profileService.profileRepository = mockProfileRepository;
    profileService.privacyRepository = mockPrivacyRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Note: getProfileColumns was removed during refactoring
  // ProfileService now uses repositories which handle column management
  // These tests are skipped as the method no longer exists
  describe.skip('getProfileColumns', () => {
    it('should return array of profile column names', async () => {
      // Method removed - ProfileService now uses repositories
    });

    it('should exclude system fields', async () => {
      // Method removed - ProfileService now uses repositories
    });
  });

  describe('getComprehensiveProfile', () => {
    it('should return complete profile for valid userId', async () => {
      const userId = 1;
      const mockUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      };

      const mockProfileData = {
        personal_visibility: 'shared',
        work_visibility: 'private',
      };

      // Mock repository methods
      mockUserRepository.findById.mockResolvedValue(mockUser);
      profileService.profileRepository.getCompleteProfile = jest.fn().mockResolvedValue(mockProfileData);

      const result = await profileService.getComprehensiveProfile(userId);

      expect(result).toMatchObject({
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      });
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw ValidationError for missing userId', async () => {
      await expect(profileService.getComprehensiveProfile(null)).rejects.toThrow(
        ValidationError
      );
      await expect(profileService.getComprehensiveProfile(undefined)).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw NotFoundError when profile not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(profileService.getComprehensiveProfile(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPrivacySettings', () => {
    it('should return privacy settings for valid userId', async () => {
      const userId = 1;
      const mockSettings = {
        user_id: userId,
        personal_visibility: 'shared',
        work_visibility: 'private',
      };

      profileService.privacyRepository.findOne = jest.fn().mockResolvedValue(mockSettings);

      const result = await profileService.getPrivacySettings(userId);

      expect(result).toEqual(mockSettings);
      expect(profileService.privacyRepository.findOne).toHaveBeenCalledWith({
        user_id: userId,
      });
    });

    it('should return null when privacy settings not found', async () => {
      profileService.privacyRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await profileService.getPrivacySettings(1);

      expect(result).toBeNull();
    });

    it('should throw ValidationError for missing userId', async () => {
      await expect(profileService.getPrivacySettings(null)).rejects.toThrow(ValidationError);
    });
  });

  describe('updateComprehensiveProfile', () => {
    it('should update profile successfully', async () => {
      const userId = 1;
      const updates = {
        first_name: 'Updated',
        last_name: 'Name',
        phone: '555-1234',
      };

      const mockUser = {
        id: userId,
        username: 'testuser',
        first_name: 'Updated',
        last_name: 'Name',
        phone: '555-1234',
      };

      const calculateCompletion = jest.fn().mockReturnValue(60);

      // Mock repository methods - updateComprehensiveProfile flow:
      // 1. findById to check user exists
      // 2. updateById for user table fields
      // 3. updateProfile for profile table fields
      // 4. getComprehensiveProfile to get full profile
      // 5. updateById again if completion % changed
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updateById = jest
        .fn()
        .mockResolvedValueOnce(mockUser) // First update (user fields)
        .mockResolvedValueOnce({ ...mockUser, profile_completion_percentage: 60 }); // Second update (completion)
      profileService.profileRepository.updateProfile = jest.fn().mockResolvedValue(undefined);
      profileService.profileRepository.getCompleteProfile = jest.fn().mockResolvedValue({
        ...mockUser,
        ...updates,
        profile_completion_percentage: 50, // Different from calculated
      });

      const result = await profileService.updateComprehensiveProfile(
        userId,
        updates,
        calculateCompletion
      );

      expect(result).toMatchObject({
        first_name: 'Updated',
        last_name: 'Name',
        phone: '555-1234',
      });
      expect(calculateCompletion).toHaveBeenCalled();
      expect(mockUserRepository.updateById).toHaveBeenCalledTimes(2); // User fields + completion
    });

    it('should filter out backend-managed fields', async () => {
      const userId = 1;
      const updates = {
        first_name: 'Updated',
        profile_completion_percentage: 100, // Should be ignored
        profile_last_updated: new Date(), // Should be ignored
      };

      const mockUser = { id: userId, username: 'testuser' };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      profileService.profileRepository.updateProfile = jest.fn().mockResolvedValue(undefined);
      mockUserRepository.updateById = jest.fn().mockResolvedValue(mockUser);
      profileService.profileRepository.getCompleteProfile = jest.fn().mockResolvedValue({
        first_name: 'Updated',
      });

      await profileService.updateComprehensiveProfile(userId, updates, jest.fn());

      // Verify backend-managed fields are filtered out from user updates
      const userUpdateCall = mockUserRepository.updateById.mock.calls[0];
      const userUpdateData = userUpdateCall[1];
      expect(userUpdateData).not.toHaveProperty('profile_completion_percentage');
      expect(userUpdateData).toHaveProperty('first_name', 'Updated');
    });

    it('should throw ValidationError for invalid updates', async () => {
      await expect(
        profileService.updateComprehensiveProfile(1, null, jest.fn())
      ).rejects.toThrow(ValidationError);

      await expect(
        profileService.updateComprehensiveProfile(1, {}, jest.fn())
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        profileService.updateComprehensiveProfile(999, { first_name: 'Test' }, jest.fn())
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle profile-only fields', async () => {
      const userId = 1;
      const updates = {
        preferred_name: 'Test', // Profile table field, not user table
      };

      const mockUser = { id: userId, username: 'testuser' };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      profileService.profileRepository.updateProfile = jest.fn().mockResolvedValue(undefined);
      profileService.profileRepository.getCompleteProfile = jest.fn().mockResolvedValue({
        ...mockUser,
        preferred_name: 'Test',
      });

      const result = await profileService.updateComprehensiveProfile(userId, updates, jest.fn());

      expect(profileService.profileRepository.updateProfile).toHaveBeenCalledWith(
        userId,
        updates
      );
      expect(result).toMatchObject({ preferred_name: 'Test' });
    });
  });

  describe('updatePrivacySettings', () => {
    it('should update existing privacy settings', async () => {
      const userId = 1;
      const settings = {
        personal_visibility: 'private',
        work_visibility: 'shared',
      };

      const existingSettings = { id: 1, user_id: userId };
      profileService.privacyRepository.findOne = jest.fn().mockResolvedValue(existingSettings);
      profileService.privacyRepository.update = jest.fn().mockResolvedValue({
        ...existingSettings,
        ...settings,
      });

      const result = await profileService.updatePrivacySettings(userId, settings);

      expect(result).toMatchObject({
        success: true,
        message: 'Privacy settings updated successfully.',
      });
      expect(profileService.privacyRepository.update).toHaveBeenCalled();
    });

    it('should create new privacy settings if not exists', async () => {
      const userId = 1;
      const settings = {
        personal_visibility: 'shared',
      };

      profileService.privacyRepository.findOne = jest.fn().mockResolvedValue(null);
      profileService.privacyRepository.create = jest.fn().mockResolvedValue({
        user_id: userId,
        ...settings,
      });

      const result = await profileService.updatePrivacySettings(userId, settings);

      expect(result.success).toBe(true);
      expect(profileService.privacyRepository.create).toHaveBeenCalled();
    });

    it('should force health and financial visibility to private', async () => {
      const userId = 1;
      const settings = {
        health_visibility: 'shared', // Should be forced to private
        financial_visibility: 'shared', // Should be forced to private
        personal_visibility: 'shared',
      };

      profileService.privacyRepository.findOne = jest.fn().mockResolvedValue(null);
      profileService.privacyRepository.create = jest.fn().mockResolvedValue({
        user_id: userId,
        health_visibility: 'private',
        financial_visibility: 'private',
        personal_visibility: 'shared',
      });

      const result = await profileService.updatePrivacySettings(userId, settings);

      expect(result.success).toBe(true);
      // Verify that health and financial were forced to private
      const createCall = profileService.privacyRepository.create.mock.calls[0][0];
      expect(createCall.health_visibility).toBe('private');
      expect(createCall.financial_visibility).toBe('private');
    });

    it('should throw ValidationError for missing userId', async () => {
      await expect(profileService.updatePrivacySettings(null, {})).rejects.toThrow(
        ValidationError
      );
    });
  });
});

