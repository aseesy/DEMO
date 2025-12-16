/**
 * Tests for Enhanced Neo4j Client
 * Tests the public API and privacy enforcement
 */

// Mock environment variables first
process.env.NEO4J_URI = 'http://localhost:7474';
process.env.NEO4J_PASSWORD = 'test-password';

// Mock the HTTP request module used by neo4jClient
jest.mock('http', () => ({
  request: jest.fn((options, callback) => {
    const mockResponse = {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      on: jest.fn((event, handler) => {
        if (event === 'data') {
          // Will be called with test data
        }
        if (event === 'end') {
          setTimeout(handler, 0);
        }
        return mockResponse;
      }),
      setEncoding: jest.fn()
    };
    setTimeout(() => callback(mockResponse), 0);
    return {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn()
    };
  })
}));

// Now require the module after mocks are set up
const neo4jClient = require('../neo4jClient');

describe('Enhanced Neo4j Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Privacy Enforcement', () => {
    describe('getCoParentsWithMetrics', () => {
      it('should enforce privacy - reject querying other users', async () => {
        const { getCoParentsWithMetrics } = neo4jClient;

        await expect(
          getCoParentsWithMetrics(999, 123) // Different user IDs
        ).rejects.toThrow('Unauthorized');
      });
    });

    describe('getRelationshipNetwork', () => {
      it('should enforce privacy - reject querying other users networks', async () => {
        const { getRelationshipNetwork } = neo4jClient;

        await expect(
          getRelationshipNetwork(999, 2, 123) // Different user IDs
        ).rejects.toThrow('Unauthorized');
      });
    });
  });

  describe('Module Exports', () => {
    it('should export all required functions', () => {
      expect(typeof neo4jClient.createUserNode).toBe('function');
      expect(typeof neo4jClient.createCoParentRelationship).toBe('function');
      expect(typeof neo4jClient.endCoParentRelationship).toBe('function');
      expect(typeof neo4jClient.getCoParents).toBe('function');
      expect(typeof neo4jClient.getCoParentsSecure).toBe('function');
      expect(typeof neo4jClient.getCoParentsWithMetrics).toBe('function');
      expect(typeof neo4jClient.getRelationshipNetwork).toBe('function');
      expect(typeof neo4jClient.getActiveRelationships).toBe('function');
      expect(typeof neo4jClient.updateRelationshipMetadata).toBe('function');
      expect(typeof neo4jClient.initializeIndexes).toBe('function');
      expect(typeof neo4jClient.isAvailable).toBe('function');
    });
  });

  describe('isAvailable', () => {
    it('should return boolean indicating if Neo4j is configured', () => {
      const result = neo4jClient.isAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Graceful Handling', () => {
    it('getCoParentsWithMetrics should return empty array for null userId', async () => {
      const result = await neo4jClient.getCoParentsWithMetrics(null, null);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('getRelationshipNetwork should return empty array for null userId', async () => {
      const result = await neo4jClient.getRelationshipNetwork(null, 2, null);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });
});
