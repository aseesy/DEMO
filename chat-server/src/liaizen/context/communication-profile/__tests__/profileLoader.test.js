/**
 * Unit Tests: Profile Loader
 *
 * Tests for loading user communication profiles from the database.
 * Uses mock database for isolation.
 *
 * Feature: 002-sender-profile-mediation
 */

const profileLoader = require('../profileLoader');

describe('Profile Loader', () => {
  // Mock database
  const createMockDb = (rows = []) => ({
    query: jest.fn().mockResolvedValue({
      rows,
      rowCount: rows.length,
    }),
  });

  describe('loadProfile', () => {
    it('should load existing profile from database', async () => {
      const mockProfile = {
        user_id: 'alex',
        communication_patterns: { tone_tendencies: ['assertive'] },
        triggers: { topics: ['schedule'] },
        successful_rewrites: [],
        intervention_history: { total_interventions: 5 },
        profile_version: 2,
        last_profile_update: '2024-01-01T00:00:00Z',
      };

      const db = createMockDb([mockProfile]);
      const result = await profileLoader.loadProfile('alex', db);

      expect(result.user_id).toBe('alex');
      expect(result.communication_patterns.tone_tendencies).toContain('assertive');
      expect(result.is_new).toBe(false);
    });

    it('should return default profile for new user', async () => {
      const db = createMockDb([]); // No rows returned
      const result = await profileLoader.loadProfile('newuser', db);

      expect(result.user_id).toBe('newuser');
      expect(result.is_new).toBe(true);
      expect(result.communication_patterns).toEqual(profileLoader.DEFAULT_PROFILE.communication_patterns);
    });

    it('should normalize user ID to lowercase', async () => {
      const db = createMockDb([]);
      await profileLoader.loadProfile('Alex', db);

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        ['alex']
      );
    });

    it('should return default profile with null user_id when userId is missing', async () => {
      const db = createMockDb([]);
      const result = await profileLoader.loadProfile(null, db);

      expect(result.user_id).toBeNull();
    });

    it('should return default profile with error flag on database error', async () => {
      const db = {
        query: jest.fn().mockRejectedValue(new Error('Connection failed')),
      };

      const result = await profileLoader.loadProfile('alex', db);

      expect(result.is_new).toBe(true);
      expect(result.load_error).toBe('Connection failed');
    });

    it('should parse JSONB fields that are strings', async () => {
      const mockProfile = {
        user_id: 'alex',
        communication_patterns: '{"tone_tendencies": ["direct"]}',
        triggers: '{"topics": ["money"]}',
        successful_rewrites: '[]',
        intervention_history: '{"total_interventions": 3}',
      };

      const db = createMockDb([mockProfile]);
      const result = await profileLoader.loadProfile('alex', db);

      expect(result.communication_patterns.tone_tendencies).toContain('direct');
      expect(result.triggers.topics).toContain('money');
    });

    it('should handle already-parsed JSONB objects', async () => {
      const mockProfile = {
        user_id: 'alex',
        communication_patterns: { tone_tendencies: ['direct'] },
        triggers: { topics: ['money'] },
        successful_rewrites: [],
        intervention_history: { total_interventions: 3 },
      };

      const db = createMockDb([mockProfile]);
      const result = await profileLoader.loadProfile('alex', db);

      expect(result.communication_patterns.tone_tendencies).toContain('direct');
    });
  });

  describe('loadProfiles', () => {
    it('should batch load multiple profiles', async () => {
      const mockProfiles = [
        { user_id: 'alex', communication_patterns: {}, triggers: {} },
        { user_id: 'jordan', communication_patterns: {}, triggers: {} },
      ];

      const db = createMockDb(mockProfiles);
      const result = await profileLoader.loadProfiles(['alex', 'jordan'], db);

      expect(result.size).toBe(2);
      expect(result.has('alex')).toBe(true);
      expect(result.has('jordan')).toBe(true);
    });

    it('should return empty map for empty userIds array', async () => {
      const db = createMockDb([]);
      const result = await profileLoader.loadProfiles([], db);

      expect(result.size).toBe(0);
    });

    it('should return empty map for null userIds', async () => {
      const db = createMockDb([]);
      const result = await profileLoader.loadProfiles(null, db);

      expect(result.size).toBe(0);
    });

    it('should add default profiles for users not found', async () => {
      const mockProfiles = [
        { user_id: 'alex', communication_patterns: {}, triggers: {} },
      ];

      const db = createMockDb(mockProfiles);
      const result = await profileLoader.loadProfiles(['alex', 'missing'], db);

      expect(result.size).toBe(2);
      expect(result.get('alex').is_new).toBe(false);
      expect(result.get('missing').is_new).toBe(true);
    });

    it('should normalize all user IDs to lowercase', async () => {
      const db = createMockDb([]);
      await profileLoader.loadProfiles(['Alex', 'JORDAN'], db);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id IN'),
        ['alex', 'jordan']
      );
    });

    it('should handle database errors gracefully', async () => {
      const db = {
        query: jest.fn().mockRejectedValue(new Error('Connection failed')),
      };

      const result = await profileLoader.loadProfiles(['alex', 'jordan'], db);

      expect(result.size).toBe(2);
      expect(result.get('alex').load_error).toBe('Connection failed');
      expect(result.get('jordan').load_error).toBe('Connection failed');
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
