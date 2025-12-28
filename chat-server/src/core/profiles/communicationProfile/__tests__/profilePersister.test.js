/**
 * Unit Tests: Profile Persister
 *
 * Tests for saving and updating user communication profiles.
 * Updated: 2024-12-23 to use repository pattern instead of direct SQL.
 *
 * Feature: 002-sender-profile-mediation
 */

// Mock the repository before requiring the module
jest.mock('../../../../repositories/postgres', () => {
  const mockUpdateCommunicationPatterns = jest.fn().mockResolvedValue({});
  const mockRecordTrigger = jest.fn().mockResolvedValue({});
  const mockRecordIntervention = jest.fn().mockResolvedValue({
    total_interventions: 1,
    accepted_count: 0,
    rejected_count: 0,
    last_intervention_at: new Date().toISOString(),
  });
  const mockRecordAcceptedRewrite = jest.fn().mockResolvedValue({
    accepted_count: 1,
  });
  const mockGetCommunicationProfile = jest.fn().mockResolvedValue({
    user_id: 'alex',
    successful_rewrites: [],
    intervention_history: {
      total_interventions: 1,
      accepted_count: 1,
      acceptance_rate: 1,
    },
  });

  return {
    PostgresCommunicationRepository: jest.fn().mockImplementation(() => ({
      updateCommunicationPatterns: mockUpdateCommunicationPatterns,
      recordTrigger: mockRecordTrigger,
      recordIntervention: mockRecordIntervention,
      recordAcceptedRewrite: mockRecordAcceptedRewrite,
      getCommunicationProfile: mockGetCommunicationProfile,
    })),
    __mockUpdateCommunicationPatterns: mockUpdateCommunicationPatterns,
    __mockRecordTrigger: mockRecordTrigger,
    __mockRecordIntervention: mockRecordIntervention,
    __mockRecordAcceptedRewrite: mockRecordAcceptedRewrite,
    __mockGetCommunicationProfile: mockGetCommunicationProfile,
  };
});

const profilePersister = require('../profilePersister');
const {
  __mockUpdateCommunicationPatterns,
  __mockRecordTrigger,
  __mockRecordIntervention,
  __mockRecordAcceptedRewrite,
  __mockGetCommunicationProfile,
} = require('../../../../repositories/postgres');

describe('Profile Persister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should update profile with communication_patterns', async () => {
      __mockGetCommunicationProfile.mockResolvedValue({
        user_id: 'alex',
        communication_patterns: { tone_tendencies: ['assertive'] },
      });

      await profilePersister.updateProfile('alex', {
        communication_patterns: { tone_tendencies: ['assertive'] },
      });

      expect(__mockUpdateCommunicationPatterns).toHaveBeenCalledWith('alex', {
        tone_tendencies: ['assertive'],
      });
    });

    it('should update profile with triggers', async () => {
      __mockGetCommunicationProfile.mockResolvedValue({
        user_id: 'alex',
        triggers: { topics: ['schedule'], phrases: [] },
      });

      await profilePersister.updateProfile('alex', {
        triggers: {
          topics: ['schedule', 'money'],
          phrases: ['you always'],
          intensity: 0.7,
        },
      });

      // Should call recordTrigger for each topic and phrase
      expect(__mockRecordTrigger).toHaveBeenCalledWith('alex', 'topic', 'schedule', 0.7);
      expect(__mockRecordTrigger).toHaveBeenCalledWith('alex', 'topic', 'money', 0.7);
      expect(__mockRecordTrigger).toHaveBeenCalledWith('alex', 'phrase', 'you always', 0.7);
    });

    it('should throw error for missing userId', async () => {
      await expect(
        profilePersister.updateProfile(null, { communication_patterns: {} })
      ).rejects.toThrow('userId is required');
    });

    it('should return the updated profile', async () => {
      __mockGetCommunicationProfile.mockResolvedValue({
        user_id: 'alex',
        communication_patterns: { tone_tendencies: ['calm'] },
        is_new: false,
      });

      const result = await profilePersister.updateProfile('alex', {
        communication_patterns: { tone_tendencies: ['calm'] },
      });

      expect(result.user_id).toBe('alex');
      expect(result.is_new).toBe(false);
    });

    it('should handle empty updates gracefully', async () => {
      __mockGetCommunicationProfile.mockResolvedValue({ user_id: 'alex' });

      const result = await profilePersister.updateProfile('alex', {});

      // No repository methods should be called for empty updates
      expect(__mockUpdateCommunicationPatterns).not.toHaveBeenCalled();
      expect(__mockRecordTrigger).not.toHaveBeenCalled();
    });

    it('should log success message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      __mockGetCommunicationProfile.mockResolvedValue({ user_id: 'alex' });

      await profilePersister.updateProfile('alex', {
        communication_patterns: { tone_tendencies: [] },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updated profile for alex')
      );
      consoleSpy.mockRestore();
    });

    it('should handle repository errors', async () => {
      __mockUpdateCommunicationPatterns.mockRejectedValue(new Error('Connection failed'));

      await expect(
        profilePersister.updateProfile('alex', { communication_patterns: {} })
      ).rejects.toThrow('Connection failed');
    });
  });

  describe('recordIntervention', () => {
    it('should record intervention and return updated history', async () => {
      __mockRecordIntervention.mockResolvedValue({
        total_interventions: 5,
        accepted_count: 3,
        rejected_count: 2,
        last_intervention_at: '2024-01-01T00:00:00Z',
      });

      const result = await profilePersister.recordIntervention('alex', {
        type: 'suggestion',
        escalation_level: 'low',
      });

      expect(result.total_interventions).toBe(5);
      expect(result.accepted_count).toBe(3);
      expect(result.acceptance_rate).toBe(0.6); // 3/5
      expect(__mockRecordIntervention).toHaveBeenCalledWith('alex', {
        type: 'suggestion',
        escalation_level: 'low',
      });
    });

    it('should calculate acceptance_rate correctly', async () => {
      __mockRecordIntervention.mockResolvedValue({
        total_interventions: 10,
        accepted_count: 7,
        rejected_count: 3,
        last_intervention_at: '2024-01-01T00:00:00Z',
      });

      const result = await profilePersister.recordIntervention('alex', {});

      expect(result.acceptance_rate).toBe(0.7);
    });

    it('should handle zero interventions', async () => {
      __mockRecordIntervention.mockResolvedValue({
        total_interventions: 0,
        accepted_count: 0,
        rejected_count: 0,
      });

      const result = await profilePersister.recordIntervention('alex', {});

      expect(result.acceptance_rate).toBe(0);
    });

    it('should throw error for missing userId', async () => {
      await expect(profilePersister.recordIntervention(null, {})).rejects.toThrow(
        'userId is required'
      );
    });

    it('should log success message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      __mockRecordIntervention.mockResolvedValue({
        total_interventions: 3,
        accepted_count: 1,
        rejected_count: 2,
      });

      await profilePersister.recordIntervention('alex', {});

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Recorded intervention for alex (total: 3)')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('recordAcceptedRewrite', () => {
    it('should record accepted rewrite and return updated data', async () => {
      __mockRecordAcceptedRewrite.mockResolvedValue({ accepted_count: 3 });
      __mockGetCommunicationProfile.mockResolvedValue({
        successful_rewrites: [
          { original: 'test', rewrite: 'better', accepted_at: '2024-01-01' },
        ],
        intervention_history: {
          total_interventions: 5,
          accepted_count: 3,
          acceptance_rate: 0.6,
        },
      });

      const result = await profilePersister.recordAcceptedRewrite('alex', {
        original: 'You never listen',
        rewrite: 'I feel unheard when...',
        tip: 'Use I-statements',
      });

      expect(result.successful_rewrites).toHaveLength(1);
      expect(result.intervention_history.accepted_count).toBe(3);
      expect(__mockRecordAcceptedRewrite).toHaveBeenCalledWith('alex', {
        original: 'You never listen',
        rewrite: 'I feel unheard when...',
        tip: 'Use I-statements',
      });
    });

    it('should throw error for missing userId', async () => {
      await expect(
        profilePersister.recordAcceptedRewrite(null, { original: 'test', rewrite: 'test' })
      ).rejects.toThrow('userId is required');
    });

    it('should log success message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      __mockRecordAcceptedRewrite.mockResolvedValue({ accepted_count: 5 });
      __mockGetCommunicationProfile.mockResolvedValue({
        successful_rewrites: [],
        intervention_history: {},
      });

      await profilePersister.recordAcceptedRewrite('alex', {
        original: 'test',
        rewrite: 'better',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Recorded accepted rewrite for alex (total accepted: 5)')
      );
      consoleSpy.mockRestore();
    });

    it('should handle repository errors', async () => {
      __mockRecordAcceptedRewrite.mockRejectedValue(new Error('Connection failed'));

      await expect(
        profilePersister.recordAcceptedRewrite('alex', { original: 'test', rewrite: 'test' })
      ).rejects.toThrow('Connection failed');
    });
  });
});
