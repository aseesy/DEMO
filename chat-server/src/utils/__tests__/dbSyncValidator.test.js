/**
 * Tests for Database Synchronization Validator
 */

const dbSyncValidator = require('../dbSyncValidator');
const dbSafe = require('../../dbSafe');
const neo4jClient = require('../neo4jClient');

// Mock dependencies
jest.mock('../../dbSafe');
jest.mock('../neo4jClient');

describe('Database Synchronization Validator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCoParentRelationships', () => {
    it('should validate relationships successfully when in sync', async () => {
      // Mock PostgreSQL query result
      dbSafe.dbPostgres = {
        query: jest.fn().mockResolvedValue({
          rows: [{
            room_id: 'room_123',
            user_ids: [1, 2],
            member_count: 2
          }]
        })
      };

      // Mock Neo4j query result
      neo4jClient.isAvailable = jest.fn(() => true);
      neo4jClient.getCoParents = jest.fn().mockResolvedValue([
        { userId: 2, roomId: 'room_123' }
      ]);

      const result = await dbSyncValidator.validateCoParentRelationships();

      expect(result.valid).toBe(true);
      expect(result.discrepancies).toHaveLength(0);
    });

    it('should detect missing relationships in Neo4j', async () => {
      // Mock PostgreSQL query result
      dbSafe.dbPostgres = {
        query: jest.fn().mockResolvedValue({
          rows: [{
            room_id: 'room_123',
            user_ids: [1, 2],
            member_count: 2
          }]
        })
      };

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
      // Mock room members
      dbSafe.safeSelect = jest.fn()
        .mockResolvedValueOnce([{ user_id: 1 }, { user_id: 2 }]) // room_members
        .mockResolvedValueOnce([]); // communication_stats

      // Mock message count query
      dbSafe.dbPostgres = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [{ count: '50' }] }) // message count
          .mockResolvedValueOnce({ rows: [{ last_message: new Date() }] }) // last message
      };

      // Mock Neo4j update
      neo4jClient.isAvailable = jest.fn(() => true);
      neo4jClient.updateRelationshipMetadata = jest.fn().mockResolvedValue(true);

      const result = await dbSyncValidator.syncRelationshipMetadata('room_123');

      expect(result).toBe(true);
      expect(neo4jClient.updateRelationshipMetadata).toHaveBeenCalled();
    });

    it('should return false for non-co-parent rooms (not 2 members)', async () => {
      dbSafe.safeSelect = jest.fn().mockResolvedValue([
        { user_id: 1 }
      ]); // Only 1 member

      const result = await dbSyncValidator.syncRelationshipMetadata('room_123');

      expect(result).toBe(false);
    });
  });

  describe('runFullValidation', () => {
    it('should run all validations', async () => {
      // Mock both validation functions
      dbSyncValidator.validateCoParentRelationships = jest.fn().mockResolvedValue({
        valid: true,
        discrepancies: []
      });
      dbSyncValidator.validateUserNodes = jest.fn().mockResolvedValue({
        valid: true,
        missingUsers: []
      });

      const result = await dbSyncValidator.runFullValidation();

      expect(result.overall.valid).toBe(true);
      expect(result.relationships).toBeDefined();
      expect(result.users).toBeDefined();
    });
  });
});

