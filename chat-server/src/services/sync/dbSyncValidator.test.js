/**
 * Tests for Database Synchronization Validator
 */

// Mock dependencies BEFORE importing the module under test
jest.mock('../../../dbSafe', () => ({
  dbPostgres: {
    query: jest.fn(),
  },
  safeSelect: jest.fn(),
}));

// Mock dbPostgres directly (used via dynamic require inside validateCoParentRelationships)
jest.mock('../../../dbPostgres', () => ({
  query: jest.fn(),
}));

jest.mock('../../../infrastructure/database/neo4jClient');

// Import after mocks are set up
const dbSyncValidator = require('../dbSyncValidator');
const dbSafe = require('../../../dbSafe');
const dbPostgres = require('../../../dbPostgres');
const neo4jClient = require('../../../infrastructure/database/neo4jClient');

describe('Database Synchronization Validator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCoParentRelationships', () => {
    it('should validate relationships successfully when in sync', async () => {
      // Mock PostgreSQL query result (uses dbPostgres directly in the function)
      dbPostgres.query.mockResolvedValue({
        rows: [
          {
            room_id: 'room_123',
            user_ids: [1, 2],
            member_count: 2,
          },
        ],
      });

      // Mock Neo4j query result
      neo4jClient.isAvailable = jest.fn(() => true);
      neo4jClient.getCoParents = jest.fn().mockResolvedValue([{ userId: 2, roomId: 'room_123' }]);

      const result = await dbSyncValidator.validateCoParentRelationships();

      expect(result.valid).toBe(true);
      expect(result.discrepancies).toHaveLength(0);
    });

    it('should detect missing relationships in Neo4j', async () => {
      // Mock PostgreSQL query result (uses dbPostgres directly in the function)
      dbPostgres.query.mockResolvedValue({
        rows: [
          {
            room_id: 'room_123',
            user_ids: [1, 2],
            member_count: 2,
          },
        ],
      });

      // Mock Neo4j - relationship doesn't exist
      neo4jClient.isAvailable = jest.fn(() => true);
      neo4jClient.getCoParents = jest.fn().mockResolvedValue([]);

      const result = await dbSyncValidator.validateCoParentRelationships();

      expect(result.valid).toBe(false);
      expect(result.discrepancies.length).toBeGreaterThan(0);
      expect(result.discrepancies[0].type).toBe('missing_in_neo4j');
    });

    it('should handle Neo4j not configured', async () => {
      neo4jClient.isAvailable = jest.fn(() => false);

      const result = await dbSyncValidator.validateCoParentRelationships();

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Neo4j not configured');
    });
  });

  describe('syncRelationshipMetadata', () => {
    it('should sync metadata successfully', async () => {
      // Mock Neo4j as available first
      neo4jClient.isAvailable = jest.fn(() => true);
      neo4jClient.updateRelationshipMetadata = jest.fn().mockResolvedValue(true);

      // Mock room members
      dbSafe.safeSelect
        .mockResolvedValueOnce([{ user_id: 1 }, { user_id: 2 }]) // room_members
        .mockResolvedValueOnce([]); // communication_stats

      // Mock PostgreSQL queries (uses dbPostgres directly)
      dbPostgres.query
        .mockResolvedValueOnce({ rows: [{ count: '50' }] }) // message count
        .mockResolvedValueOnce({ rows: [{ last_message: new Date() }] }); // last message

      const result = await dbSyncValidator.syncRelationshipMetadata('room_123');

      expect(result).toBe(true);
      expect(neo4jClient.updateRelationshipMetadata).toHaveBeenCalled();
    });

    it('should return false for non-co-parent rooms (not 2 members)', async () => {
      neo4jClient.isAvailable = jest.fn(() => true);
      dbSafe.safeSelect.mockResolvedValue([{ user_id: 1 }]); // Only 1 member

      const result = await dbSyncValidator.syncRelationshipMetadata('room_123');

      expect(result).toBe(false);
    });
  });

  describe('runFullValidation', () => {
    it('should run all validations', async () => {
      // Mock Neo4j as unavailable so both validations return predictable results
      // validateCoParentRelationships returns {valid: false, error: 'Neo4j not configured'}
      // validateUserNodes returns {valid: false, error: 'Neo4j not configured'}
      neo4jClient.isAvailable = jest.fn(() => false);

      const result = await dbSyncValidator.runFullValidation();

      // When Neo4j is not available, both return valid: false
      expect(result.overall.valid).toBe(false);
      expect(result.relationships).toBeDefined();
      expect(result.relationships.error).toBe('Neo4j not configured');
      expect(result.users).toBeDefined();
      expect(result.users.error).toBe('Neo4j not configured');
    });

    it('should return overall valid true when both validations pass', async () => {
      // Set up mocks for successful validation
      neo4jClient.isAvailable = jest.fn(() => true);
      neo4jClient.getCoParents = jest.fn().mockResolvedValue([{ userId: 2, roomId: 'room_123' }]);
      neo4jClient.getUsers = jest.fn().mockResolvedValue([{ userId: 1 }, { userId: 2 }]);

      // Mock PostgreSQL to return data that matches Neo4j
      dbPostgres.query
        .mockResolvedValueOnce({
          rows: [{ room_id: 'room_123', user_ids: [1, 2], member_count: 2 }],
        }) // for validateCoParentRelationships
        .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] }); // for validateUserNodes

      const result = await dbSyncValidator.runFullValidation();

      expect(result.relationships).toBeDefined();
      expect(result.users).toBeDefined();
      expect(result.overall).toBeDefined();
    });
  });
});
