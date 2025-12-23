/**
 * Unit Tests for PostgresProfileRepository
 *
 * Tests the normalized profile data repository
 * Run with: npm test -- PostgresProfileRepository
 */

const {
  PostgresProfileRepository,
  TABLE_FIELD_MAPPING,
  FIELD_TO_TABLE,
} = require('../PostgresProfileRepository');

// Mock the dependencies
jest.mock('../PostgresGenericRepository');
jest.mock('../../../../dbSafe', () => ({
  withTransaction: jest.fn(callback => callback()),
}));

const { PostgresGenericRepository } = require('../PostgresGenericRepository');

describe('PostgresProfileRepository', () => {
  let repo;
  let mockRepos;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh mock functions for each test
    mockRepos = {
      demographics: {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue([{ id: 1 }]),
        delete: jest.fn().mockResolvedValue([]),
      },
      employment: {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue([{ id: 1 }]),
        delete: jest.fn().mockResolvedValue([]),
      },
      healthContext: {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue([{ id: 1 }]),
        delete: jest.fn().mockResolvedValue([]),
      },
      financials: {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue([{ id: 1 }]),
        delete: jest.fn().mockResolvedValue([]),
      },
      background: {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue([{ id: 1 }]),
        delete: jest.fn().mockResolvedValue([]),
      },
    };

    // Mock the constructor to return appropriate mock repos
    let callCount = 0;
    const repoOrder = ['demographics', 'employment', 'healthContext', 'financials', 'background'];
    PostgresGenericRepository.mockImplementation(() => {
      const repoName = repoOrder[callCount % 5];
      callCount++;
      return mockRepos[repoName];
    });

    repo = new PostgresProfileRepository();

    // Assign the mock repos directly to the instance
    repo.demographics = mockRepos.demographics;
    repo.employment = mockRepos.employment;
    repo.healthContext = mockRepos.healthContext;
    repo.financials = mockRepos.financials;
    repo.background = mockRepos.background;
  });

  describe('TABLE_FIELD_MAPPING', () => {
    it('should have mappings for all profile tables', () => {
      expect(TABLE_FIELD_MAPPING.user_demographics).toBeDefined();
      expect(TABLE_FIELD_MAPPING.user_employment).toBeDefined();
      expect(TABLE_FIELD_MAPPING.user_health_context).toBeDefined();
      expect(TABLE_FIELD_MAPPING.user_financials).toBeDefined();
      expect(TABLE_FIELD_MAPPING.user_background).toBeDefined();
    });

    it('should map old column names to new column names', () => {
      expect(TABLE_FIELD_MAPPING.user_demographics.preferred_name).toBe('preferred_name');
      expect(TABLE_FIELD_MAPPING.user_health_context.health_physical_conditions).toBe(
        'physical_conditions'
      );
      expect(TABLE_FIELD_MAPPING.user_financials.finance_income_level).toBe('income_level');
    });
  });

  describe('FIELD_TO_TABLE', () => {
    it('should reverse map field names to table info', () => {
      expect(FIELD_TO_TABLE.preferred_name).toEqual({
        table: 'user_demographics',
        column: 'preferred_name',
      });
      expect(FIELD_TO_TABLE.health_physical_conditions).toEqual({
        table: 'user_health_context',
        column: 'physical_conditions',
      });
    });
  });

  describe('constructor', () => {
    it('should create repository instances for all tables', () => {
      expect(repo.demographics).toBeDefined();
      expect(repo.employment).toBeDefined();
      expect(repo.healthContext).toBeDefined();
      expect(repo.financials).toBeDefined();
      expect(repo.background).toBeDefined();
    });
  });

  describe('getCompleteProfile', () => {
    it('should return null when no profile data exists', async () => {
      repo.demographics.findOne.mockResolvedValue(null);
      repo.employment.findOne.mockResolvedValue(null);
      repo.healthContext.findOne.mockResolvedValue(null);
      repo.financials.findOne.mockResolvedValue(null);
      repo.background.findOne.mockResolvedValue(null);

      const result = await repo.getCompleteProfile(1);
      expect(result).toBeNull();
    });

    it('should return merged profile when data exists', async () => {
      mockRepos.demographics.findOne.mockResolvedValue({
        preferred_name: 'John',
        pronouns: 'he/him',
        city: 'NYC',
      });
      mockRepos.employment.findOne.mockResolvedValue({
        employment_status: 'full-time',
        occupation: 'Engineer',
      });
      mockRepos.healthContext.findOne.mockResolvedValue(null);
      mockRepos.financials.findOne.mockResolvedValue({
        income_level: 'middle',
      });
      mockRepos.background.findOne.mockResolvedValue({
        education_level: 'bachelors',
      });

      const result = await repo.getCompleteProfile(1);

      expect(result.preferred_name).toBe('John');
      expect(result.pronouns).toBe('he/him');
      expect(result.city).toBe('NYC');
      expect(result.employment_status).toBe('full-time');
      expect(result.occupation).toBe('Engineer');
      expect(result.finance_income_level).toBe('middle');
      expect(result.education_level).toBe('bachelors');
    });

    it('should map new column names back to old column names', async () => {
      mockRepos.demographics.findOne.mockResolvedValue(null);
      mockRepos.employment.findOne.mockResolvedValue(null);
      mockRepos.healthContext.findOne.mockResolvedValue({
        physical_conditions: ['asthma'],
        mental_conditions: [],
      });
      mockRepos.financials.findOne.mockResolvedValue({
        income_stability: 'stable',
      });
      mockRepos.background.findOne.mockResolvedValue({
        raised_location: 'California',
      });

      const result = await repo.getCompleteProfile(1);

      // Old column names should be used for backward compatibility
      expect(result.health_physical_conditions).toEqual(['asthma']);
      expect(result.health_mental_conditions).toEqual([]);
      expect(result.finance_income_stability).toBe('stable');
      expect(result.background_raised).toBe('California');
    });
  });

  describe('getSection', () => {
    it('should return demographics section', async () => {
      mockRepos.demographics.findOne.mockResolvedValue({
        preferred_name: 'Jane',
        timezone: 'EST',
      });

      const result = await repo.getSection(1, 'demographics');

      expect(result.preferred_name).toBe('Jane');
      expect(mockRepos.demographics.findOne).toHaveBeenCalledWith({ user_id: 1 });
    });

    it('should return health section', async () => {
      mockRepos.healthContext.findOne.mockResolvedValue({
        physical_conditions: ['none'],
      });

      const result = await repo.getSection(1, 'health');

      expect(result.physical_conditions).toEqual(['none']);
      expect(mockRepos.healthContext.findOne).toHaveBeenCalledWith({ user_id: 1 });
    });

    it('should throw error for unknown section', async () => {
      await expect(repo.getSection(1, 'invalid')).rejects.toThrow('Unknown profile section: invalid');
    });
  });

  describe('updateProfile', () => {
    it('should route updates to correct tables', async () => {
      // Need to mock the _upsertSection method since it creates new repos
      const mockUpsert = jest.spyOn(repo, '_upsertSection').mockResolvedValue({});

      await repo.updateProfile(1, {
        preferred_name: 'John',
        employment_status: 'part-time',
        health_physical_conditions: ['none'],
        finance_income_level: 'high',
        education_level: 'masters',
      });

      // Verify _upsertSection was called for each table with data
      expect(mockUpsert).toHaveBeenCalledWith(
        'user_demographics',
        1,
        expect.objectContaining({ preferred_name: 'John' })
      );
      expect(mockUpsert).toHaveBeenCalledWith(
        'user_employment',
        1,
        expect.objectContaining({ employment_status: 'part-time' })
      );
      expect(mockUpsert).toHaveBeenCalledWith(
        'user_health_context',
        1,
        expect.objectContaining({ physical_conditions: ['none'] })
      );
      expect(mockUpsert).toHaveBeenCalledWith(
        'user_financials',
        1,
        expect.objectContaining({ income_level: 'high' })
      );
      expect(mockUpsert).toHaveBeenCalledWith(
        'user_background',
        1,
        expect.objectContaining({ education_level: 'masters' })
      );

      mockUpsert.mockRestore();
    });

    it('should skip tables with no updates', async () => {
      const mockUpsert = jest.spyOn(repo, '_upsertSection').mockResolvedValue({});

      await repo.updateProfile(1, {
        preferred_name: 'John', // Only demographics
      });

      // Should only be called for user_demographics
      expect(mockUpsert).toHaveBeenCalledTimes(1);
      expect(mockUpsert).toHaveBeenCalledWith(
        'user_demographics',
        1,
        expect.objectContaining({ preferred_name: 'John' })
      );

      mockUpsert.mockRestore();
    });
  });

  describe('updateSection', () => {
    it('should update specific section', async () => {
      const mockUpsert = jest.spyOn(repo, '_upsertSection').mockResolvedValue({ id: 1 });

      await repo.updateSection(1, 'demographics', { preferred_name: 'Jane' });

      expect(mockUpsert).toHaveBeenCalledWith(
        'user_demographics',
        1,
        expect.objectContaining({
          preferred_name: 'Jane',
          updated_at: expect.any(String),
        })
      );

      mockUpsert.mockRestore();
    });

    it('should throw error for unknown section', async () => {
      await expect(repo.updateSection(1, 'invalid', {})).rejects.toThrow(
        'Unknown profile section: invalid'
      );
    });
  });

  describe('initializeProfile', () => {
    it('should create records in all profile tables', async () => {
      await repo.initializeProfile(123);

      expect(mockRepos.demographics.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 123,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        })
      );
      expect(mockRepos.employment.create).toHaveBeenCalled();
      expect(mockRepos.healthContext.create).toHaveBeenCalled();
      expect(mockRepos.financials.create).toHaveBeenCalled();
      expect(mockRepos.background.create).toHaveBeenCalled();
    });
  });

  describe('deleteProfile', () => {
    it('should delete records from all profile tables', async () => {
      await repo.deleteProfile(123);

      expect(mockRepos.demographics.delete).toHaveBeenCalledWith({ user_id: 123 });
      expect(mockRepos.employment.delete).toHaveBeenCalledWith({ user_id: 123 });
      expect(mockRepos.healthContext.delete).toHaveBeenCalledWith({ user_id: 123 });
      expect(mockRepos.financials.delete).toHaveBeenCalledWith({ user_id: 123 });
      expect(mockRepos.background.delete).toHaveBeenCalledWith({ user_id: 123 });
    });
  });

  describe('_upsertSection', () => {
    it('should create new record when none exists', async () => {
      // The method creates a new repo instance, so we need to mock PostgresGenericRepository
      const { PostgresGenericRepository } = require('../PostgresGenericRepository');
      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn(),
      };
      PostgresGenericRepository.mockImplementation(() => mockRepo);

      await repo._upsertSection('user_demographics', 1, { preferred_name: 'Test' });

      expect(mockRepo.findOne).toHaveBeenCalledWith({ user_id: 1 });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          preferred_name: 'Test',
          created_at: expect.any(String),
        })
      );
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('should update existing record when one exists', async () => {
      const { PostgresGenericRepository } = require('../PostgresGenericRepository');
      const mockRepo = {
        findOne: jest.fn().mockResolvedValue({ id: 5, user_id: 1 }),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue([{ id: 5 }]),
      };
      PostgresGenericRepository.mockImplementation(() => mockRepo);

      await repo._upsertSection('user_demographics', 1, { preferred_name: 'Updated' });

      expect(mockRepo.findOne).toHaveBeenCalledWith({ user_id: 1 });
      expect(mockRepo.update).toHaveBeenCalledWith({ user_id: 1 }, { preferred_name: 'Updated' });
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });
});
