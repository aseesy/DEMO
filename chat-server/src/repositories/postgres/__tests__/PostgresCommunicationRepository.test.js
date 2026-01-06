/**
 * Unit Tests for PostgresCommunicationRepository
 *
 * Tests the AI communication learning data repository
 * Run with: npm test -- PostgresCommunicationRepository
 */

const { PostgresCommunicationRepository } = require('../PostgresCommunicationRepository');

// Mock the dependencies
jest.mock('../PostgresGenericRepository');
jest.mock('../../../../dbSafe', () => ({
  withTransaction: jest.fn(callback => callback()),
}));

const { PostgresGenericRepository } = require('../PostgresGenericRepository');

describe('PostgresCommunicationRepository', () => {
  let repo;
  let mockRepos;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh mock functions for each test
    mockRepos = {
      profiles: {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue([{ id: 1 }]),
      },
      triggers: {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue([{ id: 1 }]),
      },
      rewrites: {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue([{ id: 1 }]),
      },
      statistics: {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue([{ id: 1 }]),
      },
      users: {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue([{ id: 1 }]),
      },
    };

    // Mock the constructor
    PostgresGenericRepository.mockImplementation(tableName => {
      const tableMap = {
        communication_profiles: mockRepos.profiles,
        communication_triggers: mockRepos.triggers,
        intervention_rewrites: mockRepos.rewrites,
        intervention_statistics: mockRepos.statistics,
        users: mockRepos.users,
      };
      return tableMap[tableName];
    });

    repo = new PostgresCommunicationRepository();
  });

  describe('constructor', () => {
    it('should create repository instances for all tables', () => {
      expect(repo.profiles).toBeDefined();
      expect(repo.triggers).toBeDefined();
      expect(repo.rewrites).toBeDefined();
      expect(repo.statistics).toBeDefined();
      expect(repo.users).toBeDefined();
    });
  });

  describe('_getUserId', () => {
    it('should return null for empty username', async () => {
      const result = await repo._getUserId(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined username', async () => {
      const result = await repo._getUserId(undefined);
      expect(result).toBeNull();
    });

    it('should return user id when user exists', async () => {
      // _getUserId tries email first, then username
      mockRepos.users.findOne
        .mockResolvedValueOnce(null) // Email lookup returns null
        .mockResolvedValueOnce({ id: 123, username: 'testuser' }); // Username lookup succeeds
      const result = await repo._getUserId('TestUser');
      expect(result).toBe(123);
      expect(mockRepos.users.findOne).toHaveBeenCalledWith({ email: 'testuser' });
      expect(mockRepos.users.findOne).toHaveBeenCalledWith({ username: 'testuser' });
    });

    it('should return null when user does not exist', async () => {
      mockRepos.users.findOne.mockResolvedValue(null);
      const result = await repo._getUserId('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getCommunicationProfile', () => {
    it('should return default profile when user not found', async () => {
      mockRepos.users.findOne.mockResolvedValue(null);
      const result = await repo.getCommunicationProfile('nonexistent');

      expect(result.user_id).toBe('nonexistent');
      expect(result.is_new).toBe(true);
      expect(result.communication_patterns.tone_tendencies).toEqual([]);
    });

    it('should return complete profile when user exists with data', async () => {
      mockRepos.users.findOne.mockResolvedValue({ id: 1, username: 'testuser' });
      mockRepos.profiles.findOne.mockResolvedValue({
        tone_tendencies: ['calm', 'direct'],
        avg_message_length: 50,
        vocabulary_complexity: 0.7,
        emoji_usage: 0.1,
        profile_version: 2,
        last_updated: '2024-01-01',
      });
      mockRepos.triggers.find.mockResolvedValue([
        { trigger_type: 'topic', trigger_value: 'money', intensity: 0.8 },
        { trigger_type: 'phrase', trigger_value: 'you always', intensity: 0.9 },
      ]);
      mockRepos.rewrites.find.mockResolvedValue([
        {
          original_text: 'hostile message',
          rewrite_text: 'better message',
          pattern_detected: 'blame',
          created_at: '2024-01-02',
        },
      ]);
      mockRepos.statistics.findOne.mockResolvedValue({
        total_interventions: 10,
        accepted_count: 7,
        rejected_count: 3,
        last_intervention_at: '2024-01-02',
      });

      const result = await repo.getCommunicationProfile('testuser');

      expect(result.user_id).toBe('testuser');
      expect(result.communication_patterns.tone_tendencies).toEqual(['calm', 'direct']);
      expect(result.triggers.topics).toEqual(['money']);
      expect(result.triggers.phrases).toEqual(['you always']);
      expect(result.successful_rewrites).toHaveLength(1);
      expect(result.intervention_history.total_interventions).toBe(10);
      expect(result.intervention_history.acceptance_rate).toBe(0.7);
      expect(result.is_new).toBe(false);
    });

    it('should only return accepted rewrites in successful_rewrites', async () => {
      mockRepos.users.findOne.mockResolvedValue({ id: 1, username: 'testuser' });
      mockRepos.profiles.findOne.mockResolvedValue(null);
      mockRepos.triggers.find.mockResolvedValue([]);
      mockRepos.rewrites.find.mockResolvedValue([
        { original_text: 'test', rewrite_text: 'better', pattern_detected: 'test' },
      ]);
      mockRepos.statistics.findOne.mockResolvedValue(null);

      await repo.getCommunicationProfile('testuser');

      // Verify the find call includes outcome: 'accepted' filter
      expect(mockRepos.rewrites.find).toHaveBeenCalledWith(
        { user_id: 1, outcome: 'accepted' },
        { limit: 50 }
      );
    });
  });

  describe('updateCommunicationPatterns', () => {
    it('should throw error when user not found', async () => {
      mockRepos.users.findOne.mockResolvedValue(null);
      await expect(
        repo.updateCommunicationPatterns('nonexistent', { tone_tendencies: [] })
      ).rejects.toThrow('User not found: nonexistent');
    });

    it('should create new profile when none exists', async () => {
      mockRepos.users.findOne.mockResolvedValue({ id: 1, username: 'testuser' });
      mockRepos.profiles.findOne.mockResolvedValue(null);

      await repo.updateCommunicationPatterns('testuser', {
        tone_tendencies: ['calm'],
        avg_message_length: 30,
      });

      expect(mockRepos.profiles.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          tone_tendencies: ['calm'],
          avg_message_length: 30,
          profile_version: 1,
        })
      );
    });

    it('should update existing profile and increment version', async () => {
      mockRepos.users.findOne.mockResolvedValue({ id: 1, username: 'testuser' });
      mockRepos.profiles.findOne.mockResolvedValue({ profile_version: 2 });

      await repo.updateCommunicationPatterns('testuser', {
        tone_tendencies: ['assertive'],
      });

      expect(mockRepos.profiles.update).toHaveBeenCalledWith(
        { user_id: 1 },
        expect.objectContaining({
          tone_tendencies: ['assertive'],
          profile_version: 3,
        })
      );
    });
  });

  describe('recordTrigger', () => {
    it('should throw error when user not found', async () => {
      mockRepos.users.findOne.mockResolvedValue(null);
      await expect(repo.recordTrigger('nonexistent', 'topic', 'money', 0.8)).rejects.toThrow(
        'User not found: nonexistent'
      );
    });

    it('should create new trigger when none exists', async () => {
      mockRepos.users.findOne.mockResolvedValue({ id: 1, username: 'testuser' });
      mockRepos.triggers.findOne.mockResolvedValue(null);

      await repo.recordTrigger('testuser', 'topic', 'custody', 0.7);

      expect(mockRepos.triggers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          trigger_type: 'topic',
          trigger_value: 'custody',
          intensity: 0.7,
          detection_count: 1,
        })
      );
    });

    it('should update existing trigger with averaged intensity', async () => {
      mockRepos.users.findOne.mockResolvedValue({ id: 1, username: 'testuser' });
      mockRepos.triggers.findOne.mockResolvedValue({
        id: 5,
        intensity: 0.6,
        detection_count: 3,
      });

      await repo.recordTrigger('testuser', 'topic', 'money', 0.8);

      expect(mockRepos.triggers.update).toHaveBeenCalledWith(
        { id: 5 },
        expect.objectContaining({
          intensity: 0.7, // (0.6 + 0.8) / 2
          detection_count: 4,
        })
      );
    });

    it('should cap intensity at 1.0', async () => {
      mockRepos.users.findOne.mockResolvedValue({ id: 1, username: 'testuser' });
      mockRepos.triggers.findOne.mockResolvedValue({
        id: 5,
        intensity: 0.95,
        detection_count: 10,
      });

      await repo.recordTrigger('testuser', 'topic', 'money', 1.0);

      expect(mockRepos.triggers.update).toHaveBeenCalledWith(
        { id: 5 },
        expect.objectContaining({
          intensity: expect.any(Number),
        })
      );
      // Intensity should be capped at 1.0: Math.min(1, (0.95 + 1.0) / 2) = 0.975
      const updateCall = mockRepos.triggers.update.mock.calls[0][1];
      expect(updateCall.intensity).toBeLessThanOrEqual(1);
    });
  });

  describe('recordIntervention', () => {
    it('should throw error when user not found', async () => {
      mockRepos.users.findOne.mockResolvedValue(null);
      await expect(repo.recordIntervention('nonexistent', {})).rejects.toThrow(
        'User not found: nonexistent'
      );
    });

    it('should create new statistics when none exist', async () => {
      mockRepos.users.findOne.mockResolvedValue({ id: 1, username: 'testuser' });
      mockRepos.statistics.findOne
        .mockResolvedValueOnce(null) // First call - no existing stats
        .mockResolvedValueOnce({
          // Second call - return new stats
          user_id: 1,
          total_interventions: 1,
        });

      const result = await repo.recordIntervention('testuser', {});

      expect(mockRepos.statistics.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          total_interventions: 1,
          accepted_count: 0,
          rejected_count: 0,
        })
      );
    });

    it('should update existing statistics', async () => {
      mockRepos.users.findOne.mockResolvedValue({ id: 1, username: 'testuser' });
      mockRepos.statistics.findOne.mockResolvedValue({
        total_interventions: 5,
      });

      await repo.recordIntervention('testuser', {});

      expect(mockRepos.statistics.update).toHaveBeenCalledWith(
        { user_id: 1 },
        expect.objectContaining({
          total_interventions: 6,
        })
      );
    });
  });

  describe('recordAcceptedRewrite', () => {
    it('should throw error when user not found', async () => {
      mockRepos.users.findOne.mockResolvedValue(null);
      await expect(
        repo.recordAcceptedRewrite('nonexistent', { original: 'test', rewrite: 'test' })
      ).rejects.toThrow('User not found: nonexistent');
    });

    it('should create rewrite record and update statistics', async () => {
      mockRepos.users.findOne.mockResolvedValue({ id: 1, username: 'testuser' });
      mockRepos.statistics.findOne.mockResolvedValue({
        accepted_count: 3,
      });

      await repo.recordAcceptedRewrite('testuser', {
        original: 'hostile message',
        rewrite: 'better message',
        tip: 'avoid blame',
        roomId: 'room123',
      });

      expect(mockRepos.rewrites.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          original_text: 'hostile message',
          rewrite_text: 'better message',
          outcome: 'accepted',
          pattern_detected: 'avoid blame',
          room_id: 'room123',
        })
      );

      expect(mockRepos.statistics.update).toHaveBeenCalledWith(
        { user_id: 1 },
        expect.objectContaining({
          accepted_count: 4,
        })
      );
    });

    it('should create statistics if none exist', async () => {
      mockRepos.users.findOne.mockResolvedValue({ id: 1, username: 'testuser' });
      mockRepos.statistics.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ accepted_count: 1 });

      await repo.recordAcceptedRewrite('testuser', {
        original: 'test',
        rewrite: 'better',
      });

      expect(mockRepos.statistics.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          total_interventions: 1,
          accepted_count: 1,
        })
      );
    });
  });

  describe('recordRejectedRewrite', () => {
    it('should throw error when user not found', async () => {
      mockRepos.users.findOne.mockResolvedValue(null);
      await expect(
        repo.recordRejectedRewrite('nonexistent', { original: 'test', rewrite: 'test' })
      ).rejects.toThrow('User not found: nonexistent');
    });

    it('should create rewrite record with rejected outcome', async () => {
      mockRepos.users.findOne.mockResolvedValue({ id: 1, username: 'testuser' });
      mockRepos.statistics.findOne.mockResolvedValue({ rejected_count: 2 });

      await repo.recordRejectedRewrite('testuser', {
        original: 'message',
        rewrite: 'suggested',
        tip: 'tone',
      });

      expect(mockRepos.rewrites.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          outcome: 'rejected',
        })
      );
    });

    it('should update existing statistics with incremented rejected_count', async () => {
      mockRepos.users.findOne.mockResolvedValue({ id: 1, username: 'testuser' });
      mockRepos.statistics.findOne.mockResolvedValue({ rejected_count: 5 });

      await repo.recordRejectedRewrite('testuser', {
        original: 'test',
        rewrite: 'better',
      });

      expect(mockRepos.statistics.update).toHaveBeenCalledWith(
        { user_id: 1 },
        expect.objectContaining({
          rejected_count: 6,
        })
      );
    });

    it('should create statistics if none exist', async () => {
      mockRepos.users.findOne.mockResolvedValue({ id: 1, username: 'testuser' });
      mockRepos.statistics.findOne
        .mockResolvedValueOnce(null) // First call
        .mockResolvedValueOnce({ rejected_count: 1 }); // Second call

      await repo.recordRejectedRewrite('testuser', {
        original: 'test',
        rewrite: 'better',
      });

      expect(mockRepos.statistics.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          total_interventions: 1,
          rejected_count: 1,
          accepted_count: 0,
        })
      );
    });
  });

  describe('_defaultProfile', () => {
    it('should return default structure with null user_id when no username', () => {
      const result = repo._defaultProfile();
      expect(result.user_id).toBeNull();
      expect(result.is_new).toBe(true);
      expect(result.communication_patterns.tone_tendencies).toEqual([]);
    });

    it('should return default structure with lowercase user_id when username provided', () => {
      const result = repo._defaultProfile('TestUser');
      expect(result.user_id).toBe('testuser');
    });
  });
});
