/**
 * Tests for Enhanced Neo4j Client
 * Tests the new query functions and metadata updates
 */

// Mock environment variables first
process.env.NEO4J_URI = 'http://localhost:7474';
process.env.NEO4J_PASSWORD = 'test-password';

const neo4jClient = require('../neo4jClient');

// Mock the executeCypher function
const originalExecuteCypher = neo4jClient.__executeCypher || (() => {});
let mockExecuteCypher = jest.fn();

// We need to access the internal executeCypher - for now, let's test the public API

describe('Enhanced Neo4j Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeIndexes', () => {
    it('should create indexes when Neo4j is available', async () => {
      const { initializeIndexes } = require('../neo4jClient');
      const executeCypher = require('../neo4jClient').executeCypher;
      
      executeCypher.mockResolvedValue({ data: [] });

      const result = await initializeIndexes();

      expect(result).toBe(true);
      expect(executeCypher).toHaveBeenCalled();
    });

    it('should handle already-existing indexes gracefully', async () => {
      const { initializeIndexes } = require('../neo4jClient');
      const executeCypher = require('../neo4jClient').executeCypher;
      
      executeCypher.mockRejectedValue(new Error('already exists'));

      const result = await initializeIndexes();

      expect(result).toBe(true); // Should return true even if indexes exist
    });
  });

  describe('updateRelationshipMetadata', () => {
    it('should update relationship metadata successfully', async () => {
      const { updateRelationshipMetadata } = require('../neo4jClient');
      const executeCypher = require('../neo4jClient').executeCypher;
      
      executeCypher.mockResolvedValue({ data: [{ row: [{}] }] });

      const result = await updateRelationshipMetadata(1, 2, 'room_123', {
        messageCount: 50,
        lastInteraction: new Date(),
        interventionCount: 5
      });

      expect(result).toBe(true);
      expect(executeCypher).toHaveBeenCalled();
    });

    it('should handle missing metadata gracefully', async () => {
      const { updateRelationshipMetadata } = require('../neo4jClient');
      const executeCypher = require('../neo4jClient').executeCypher;
      
      executeCypher.mockResolvedValue({ data: [{ row: [{}] }] });

      const result = await updateRelationshipMetadata(1, 2, 'room_123', {});

      expect(result).toBe(true);
      // Should use defaults (0 for counts, null for dates)
    });
  });

  describe('getCoParentsWithMetrics', () => {
    it('should return co-parents with metrics', async () => {
      const { getCoParentsWithMetrics } = require('../neo4jClient');
      const executeCypher = require('../neo4jClient').executeCypher;
      
      executeCypher.mockResolvedValue({
        data: [{
          row: [456, 'bob123', 'room_123', 50, '2025-12-15T10:00:00Z', 5, '2025-01-01T00:00:00Z']
        }]
      });

      const result = await getCoParentsWithMetrics(123, 123);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: 456,
        username: 'bob123',
        roomId: 'room_123',
        messageCount: 50,
        interventionCount: 5
      });
    });

    it('should enforce privacy - reject querying other users', async () => {
      const { getCoParentsWithMetrics } = require('../neo4jClient');

      await expect(
        getCoParentsWithMetrics(999, 123) // Different user IDs
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('getRelationshipNetwork', () => {
    it('should return relationship network', async () => {
      const { getRelationshipNetwork } = require('../neo4jClient');
      const executeCypher = require('../neo4jClient').executeCypher;
      
      executeCypher.mockResolvedValue({
        data: [{
          row: [456, 'bob123', 1, ['room_123']]
        }]
      });

      const result = await getRelationshipNetwork(123, 2, 123);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: 456,
        username: 'bob123',
        distance: 1
      });
    });

    it('should enforce privacy - reject querying other users networks', async () => {
      const { getRelationshipNetwork } = require('../neo4jClient');

      await expect(
        getRelationshipNetwork(999, 2, 123) // Different user IDs
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('getActiveRelationships', () => {
    it('should return active relationships above threshold', async () => {
      const { getActiveRelationships } = require('../neo4jClient');
      const executeCypher = require('../neo4jClient').executeCypher;
      
      executeCypher.mockResolvedValue({
        data: [{
          row: [456, 'bob123', 'room_123', 50, '2025-12-15T10:00:00Z']
        }]
      });

      const result = await getActiveRelationships(123, 10, 123);

      expect(result).toHaveLength(1);
      expect(result[0].messageCount).toBeGreaterThanOrEqual(10);
    });
  });
});

