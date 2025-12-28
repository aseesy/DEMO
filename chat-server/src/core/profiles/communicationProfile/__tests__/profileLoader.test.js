/**
 * Unit Tests: Profile Loader
 *
 * Tests for loading user communication profiles from the database.
 * Updated: 2024-12-23 to use repository pattern instead of direct SQL.
 *
 * Feature: 002-sender-profile-mediation
 */

// Mock the repository before requiring the module
jest.mock('../../../../repositories/postgres', () => {
  const mockGetCommunicationProfile = jest.fn();
  return {
    PostgresCommunicationRepository: jest.fn().mockImplementation(() => ({
      getCommunicationProfile: mockGetCommunicationProfile,
    })),
    __mockGetCommunicationProfile: mockGetCommunicationProfile,
  };
});

const profileLoader = require('../profileLoader');
const { __mockGetCommunicationProfile } = require('../../../../repositories/postgres');

describe('Profile Loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile (new naming)', () => {
    it('should load existing profile from repository', async () => {
      const mockProfile = {
        user_id: 'alex',
        communication_patterns: { tone_tendencies: ['assertive'] },
        triggers: { topics: ['schedule'], phrases: [], intensity: 0.5 },
        successful_rewrites: [],
        intervention_history: { total_interventions: 5 },
        profile_version: 2,
        last_profile_update: '2024-01-01T00:00:00Z',
        is_new: false,
      };

      __mockGetCommunicationProfile.mockResolvedValue(mockProfile);
      const result = await profileLoader.getProfile('alex');

      expect(result.user_id).toBe('alex');
      expect(result.communication_patterns.tone_tendencies).toContain('assertive');
      expect(result.is_new).toBe(false);
    });

    it('should return default profile for new user', async () => {
      const defaultProfile = {
        user_id: 'newuser',
        communication_patterns: { tone_tendencies: [], common_phrases: [], avg_message_length: 0 },
        triggers: { topics: [], phrases: [], intensity: 0 },
        successful_rewrites: [],
        intervention_history: { total_interventions: 0 },
        profile_version: 1,
        is_new: true,
      };

      __mockGetCommunicationProfile.mockResolvedValue(defaultProfile);
      const result = await profileLoader.getProfile('newuser');

      expect(result.user_id).toBe('newuser');
      expect(result.is_new).toBe(true);
      expect(result.communication_patterns.tone_tendencies).toEqual([]);
    });

    it('should return default profile with null user_id when userId is missing', async () => {
      const result = await profileLoader.getProfile(null);

      expect(result.user_id).toBeNull();
      expect(result.is_new).toBe(undefined); // DEFAULT_PROFILE doesn't have is_new
    });

    it('should return default profile with error flag on repository error', async () => {
      __mockGetCommunicationProfile.mockRejectedValue(new Error('Connection failed'));

      const result = await profileLoader.getProfile('alex');

      expect(result.is_new).toBe(true);
      expect(result.load_error).toBe('Connection failed');
    });

    it('should log message for new profiles', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      __mockGetCommunicationProfile.mockResolvedValue({
        user_id: 'newuser',
        is_new: true,
      });

      await profileLoader.getProfile('newuser');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No profile for newuser')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('getProfiles (batch loading)', () => {
    it('should batch load multiple profiles', async () => {
      __mockGetCommunicationProfile
        .mockResolvedValueOnce({ user_id: 'alex', is_new: false })
        .mockResolvedValueOnce({ user_id: 'jordan', is_new: false });

      const result = await profileLoader.getProfiles(['alex', 'jordan']);

      expect(result.size).toBe(2);
      expect(result.has('alex')).toBe(true);
      expect(result.has('jordan')).toBe(true);
    });

    it('should return empty map for empty userIds array', async () => {
      const result = await profileLoader.getProfiles([]);
      expect(result.size).toBe(0);
    });

    it('should return empty map for null userIds', async () => {
      const result = await profileLoader.getProfiles(null);
      expect(result.size).toBe(0);
    });

    it('should handle users with and without profiles', async () => {
      __mockGetCommunicationProfile
        .mockResolvedValueOnce({ user_id: 'alex', is_new: false })
        .mockResolvedValueOnce({ user_id: 'missing', is_new: true });

      const result = await profileLoader.getProfiles(['alex', 'missing']);

      expect(result.size).toBe(2);
      expect(result.get('alex').is_new).toBe(false);
      expect(result.get('missing').is_new).toBe(true);
    });

    it('should normalize all user IDs to lowercase', async () => {
      __mockGetCommunicationProfile.mockResolvedValue({ user_id: 'alex', is_new: true });

      await profileLoader.getProfiles(['Alex', 'JORDAN']);

      // The repository should be called with lowercase userIds
      expect(__mockGetCommunicationProfile).toHaveBeenCalledWith('alex');
      expect(__mockGetCommunicationProfile).toHaveBeenCalledWith('jordan');
    });

    it('should handle repository errors gracefully', async () => {
      __mockGetCommunicationProfile.mockRejectedValue(new Error('Connection failed'));

      const result = await profileLoader.getProfiles(['alex', 'jordan']);

      expect(result.size).toBe(2);
      expect(result.get('alex').load_error).toBe('Connection failed');
      expect(result.get('jordan').load_error).toBe('Connection failed');
    });
  });

  describe('loadProfile (deprecated alias)', () => {
    it('should be an alias for getProfile', () => {
      expect(profileLoader.loadProfile).toBe(profileLoader.getProfile);
    });
  });

  describe('loadProfiles (deprecated alias)', () => {
    it('should be an alias for getProfiles', () => {
      expect(profileLoader.loadProfiles).toBe(profileLoader.getProfiles);
    });
  });

  describe('DEFAULT_PROFILE', () => {
    it('should have correct structure', () => {
      expect(profileLoader.DEFAULT_PROFILE).toHaveProperty('communication_patterns');
      expect(profileLoader.DEFAULT_PROFILE).toHaveProperty('triggers');
      expect(profileLoader.DEFAULT_PROFILE).toHaveProperty('successful_rewrites');
      expect(profileLoader.DEFAULT_PROFILE).toHaveProperty('intervention_history');
      expect(profileLoader.DEFAULT_PROFILE).toHaveProperty('profile_version');
    });

    it('should have empty arrays and objects', () => {
      expect(profileLoader.DEFAULT_PROFILE.communication_patterns.tone_tendencies).toEqual([]);
      expect(profileLoader.DEFAULT_PROFILE.triggers.topics).toEqual([]);
      expect(profileLoader.DEFAULT_PROFILE.successful_rewrites).toEqual([]);
    });

    it('should have zero intervention counts', () => {
      expect(profileLoader.DEFAULT_PROFILE.intervention_history.total_interventions).toBe(0);
      expect(profileLoader.DEFAULT_PROFILE.intervention_history.accepted_count).toBe(0);
      expect(profileLoader.DEFAULT_PROFILE.intervention_history.acceptance_rate).toBe(0);
    });
  });
});
