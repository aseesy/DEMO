/**
 * Unit Tests: Profile Persister
 *
 * Tests for saving and updating user communication profiles.
 * Uses mock database for isolation.
 *
 * Feature: 002-sender-profile-mediation
 */

const profilePersister = require('../profilePersister');

describe('Profile Persister', () => {
  // Mock database
  const createMockDb = (returnRows = []) => ({
    query: jest.fn().mockResolvedValue({
      rows: returnRows,
      rowCount: returnRows.length,
    }),
  });

  describe('updateProfile', () => {
    it('should update profile with communication_patterns', async () => {
      const db = createMockDb([{ user_id: 'alex' }]);

      await profilePersister.updateProfile(
        'alex',
        {
          communication_patterns: { tone_tendencies: ['assertive'] },
        },
        db
      );

      expect(db.query).toHaveBeenCalled();
      const callArgs = db.query.mock.calls[0];
      expect(callArgs[0]).toContain('communication_patterns');
    });

    it('should update profile with triggers', async () => {
      const db = createMockDb([{ user_id: 'alex' }]);

      await profilePersister.updateProfile(
        'alex',
        {
          triggers: { topics: ['schedule'] },
        },
        db
      );

      expect(db.query).toHaveBeenCalled();
      const callArgs = db.query.mock.calls[0];
      expect(callArgs[0]).toContain('triggers');
    });

    it('should normalize user ID to lowercase', async () => {
      const db = createMockDb([{ user_id: 'alex' }]);

      await profilePersister.updateProfile(
        'ALEX',
        {
          communication_patterns: {},
        },
        db
      );

      const callArgs = db.query.mock.calls[0];
      expect(callArgs[1][0]).toBe('alex');
    });

    it('should throw error for missing userId', async () => {
      const db = createMockDb([]);

      await expect(
        profilePersister.updateProfile(null, { communication_patterns: {} }, db)
      ).rejects.toThrow('userId is required');
    });

    it('should still update timestamp when given empty updates', async () => {
      const db = createMockDb([{ user_id: 'alex' }]);

      const result = await profilePersister.updateProfile('alex', {}, db);

      // Even with empty updates, timestamp and version are always updated
      expect(db.query).toHaveBeenCalled();
      const callArgs = db.query.mock.calls[0];
      expect(callArgs[0]).toContain('last_profile_update');
    });

    it('should always update last_profile_update timestamp', async () => {
      const db = createMockDb([{ user_id: 'alex' }]);

      await profilePersister.updateProfile(
        'alex',
        {
          communication_patterns: {},
        },
        db
      );

      const callArgs = db.query.mock.calls[0];
      expect(callArgs[0]).toContain('last_profile_update');
    });

    it('should increment profile_version', async () => {
      const db = createMockDb([{ user_id: 'alex' }]);

      await profilePersister.updateProfile(
        'alex',
        {
          communication_patterns: {},
        },
        db
      );

      const callArgs = db.query.mock.calls[0];
      expect(callArgs[0]).toContain('profile_version = COALESCE(profile_version, 0) + 1');
    });

    it('should handle database errors', async () => {
      const db = {
        query: jest.fn().mockRejectedValue(new Error('Connection failed')),
      };

      await expect(
        profilePersister.updateProfile('alex', { communication_patterns: {} }, db)
      ).rejects.toThrow('Connection failed');
    });
  });

  describe('recordIntervention', () => {
    it('should create new intervention history for user without history', async () => {
      const db = createMockDb([]);
      // First query returns no existing history
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      // Second query is the upsert
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await profilePersister.recordIntervention(
        'alex',
        {
          type: 'suggestion',
          escalation_level: 'low',
          original_message: 'Test message',
        },
        db
      );

      expect(result.total_interventions).toBe(1);
    });

    it('should increment intervention count for existing history', async () => {
      const existingHistory = {
        total_interventions: 5,
        accepted_count: 3,
        recent_interventions: [],
      };

      const db = createMockDb([{ intervention_history: existingHistory }]);
      // First query returns existing history
      db.query.mockResolvedValueOnce({
        rows: [{ intervention_history: existingHistory }],
        rowCount: 1,
      });
      // Second query is the upsert
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await profilePersister.recordIntervention(
        'alex',
        {
          type: 'suggestion',
        },
        db
      );

      expect(result.total_interventions).toBe(6);
    });

    it('should add intervention to recent_interventions', async () => {
      const db = createMockDb([]);
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await profilePersister.recordIntervention(
        'alex',
        {
          type: 'rewrite',
          escalation_level: 'medium',
          original_message: 'Test message preview here',
        },
        db
      );

      expect(result.recent_interventions).toHaveLength(1);
      expect(result.recent_interventions[0].type).toBe('rewrite');
      expect(result.recent_interventions[0].escalation_level).toBe('medium');
    });

    it('should limit recent_interventions to 20', async () => {
      const existingHistory = {
        total_interventions: 20,
        recent_interventions: Array(20).fill({ type: 'old' }),
      };

      const db = createMockDb([{ intervention_history: existingHistory }]);
      db.query.mockResolvedValueOnce({
        rows: [{ intervention_history: existingHistory }],
        rowCount: 1,
      });
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await profilePersister.recordIntervention(
        'alex',
        {
          type: 'new',
        },
        db
      );

      expect(result.recent_interventions).toHaveLength(20);
      expect(result.recent_interventions[0].type).toBe('new');
    });

    it('should normalize user ID to lowercase', async () => {
      const db = createMockDb([]);
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await profilePersister.recordIntervention('ALEX', { type: 'test' }, db);

      expect(db.query.mock.calls[0][1][0]).toBe('alex');
    });

    it('should throw error for missing userId', async () => {
      const db = createMockDb([]);

      await expect(profilePersister.recordIntervention(null, {}, db)).rejects.toThrow(
        'userId is required'
      );
    });

    it('should handle JSON string history', async () => {
      const historyJson = JSON.stringify({
        total_interventions: 2,
        recent_interventions: [],
      });

      const db = createMockDb([{ intervention_history: historyJson }]);
      db.query.mockResolvedValueOnce({
        rows: [{ intervention_history: historyJson }],
        rowCount: 1,
      });
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await profilePersister.recordIntervention('alex', {}, db);

      expect(result.total_interventions).toBe(3);
    });
  });

  describe('recordAcceptedRewrite', () => {
    it('should add rewrite to successful_rewrites', async () => {
      const db = createMockDb([]);
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await profilePersister.recordAcceptedRewrite(
        'alex',
        {
          original: 'You never listen',
          rewrite: 'I feel unheard when...',
          tip: 'Use I-statements',
        },
        db
      );

      expect(result.successful_rewrites).toHaveLength(1);
      expect(result.successful_rewrites[0].original).toBe('You never listen');
      expect(result.successful_rewrites[0].rewrite).toBe('I feel unheard when...');
    });

    it('should increment accepted_count', async () => {
      const existingHistory = {
        total_interventions: 5,
        accepted_count: 2,
        acceptance_rate: 0.4,
      };

      const db = createMockDb([]);
      db.query.mockResolvedValueOnce({
        rows: [{ intervention_history: existingHistory, successful_rewrites: [] }],
        rowCount: 1,
      });
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await profilePersister.recordAcceptedRewrite(
        'alex',
        {
          original: 'test',
          rewrite: 'test',
        },
        db
      );

      expect(result.intervention_history.accepted_count).toBe(3);
    });

    it('should recalculate acceptance_rate', async () => {
      const existingHistory = {
        total_interventions: 10,
        accepted_count: 4,
        acceptance_rate: 0.4,
      };

      const db = createMockDb([]);
      db.query.mockResolvedValueOnce({
        rows: [{ intervention_history: existingHistory, successful_rewrites: [] }],
        rowCount: 1,
      });
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await profilePersister.recordAcceptedRewrite(
        'alex',
        {
          original: 'test',
          rewrite: 'test',
        },
        db
      );

      expect(result.intervention_history.acceptance_rate).toBe(0.5); // 5/10
    });

    it('should limit successful_rewrites to 50', async () => {
      const existingRewrites = Array(50).fill({ original: 'old' });

      const db = createMockDb([]);
      db.query.mockResolvedValueOnce({
        rows: [
          {
            successful_rewrites: existingRewrites,
            intervention_history: { total_interventions: 1 },
          },
        ],
        rowCount: 1,
      });
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await profilePersister.recordAcceptedRewrite(
        'alex',
        {
          original: 'new',
          rewrite: 'new rewrite',
        },
        db
      );

      expect(result.successful_rewrites).toHaveLength(50);
      expect(result.successful_rewrites[0].original).toBe('new');
    });

    it('should add accepted_at timestamp', async () => {
      const db = createMockDb([]);
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await profilePersister.recordAcceptedRewrite(
        'alex',
        {
          original: 'test',
          rewrite: 'test',
        },
        db
      );

      expect(result.successful_rewrites[0].accepted_at).toBeDefined();
    });

    it('should throw error for missing userId', async () => {
      const db = createMockDb([]);

      await expect(profilePersister.recordAcceptedRewrite(null, {}, db)).rejects.toThrow(
        'userId is required'
      );
    });

    it('should normalize user ID to lowercase', async () => {
      const db = createMockDb([]);
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await profilePersister.recordAcceptedRewrite(
        'ALEX',
        { original: 'test', rewrite: 'test' },
        db
      );

      expect(db.query.mock.calls[0][1][0]).toBe('alex');
    });
  });
});
