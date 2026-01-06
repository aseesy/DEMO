/**
 * Narrative Memory Service Tests
 *
 * Tests for the Dual-Brain AI Mediator narrative memory functionality.
 */

// Mock the database pool - must be before requiring the module
jest.mock('../../dbPostgres', () => ({
  query: jest.fn(),
}));

// Mock the OpenAI client
jest.mock('../../src/core/engine/client', () => ({
  getClient: jest.fn(),
  isConfigured: jest.fn(() => true),
}));

const narrativeMemory = require('../../src/core/memory/narrativeMemory');
const pool = require('../../dbPostgres');
const openaiClient = require('../../src/core/engine/client');

// Alias for easier use in tests
const query = pool.query;

describe('NarrativeMemory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cosineSimilarity', () => {
    it('should calculate similarity between identical vectors', () => {
      const vec = [1, 2, 3, 4, 5];
      const similarity = narrativeMemory.cosineSimilarity(vec, vec);
      expect(similarity).toBeCloseTo(1, 5);
    });

    it('should calculate similarity between different vectors', () => {
      const vecA = [1, 0, 0];
      const vecB = [0, 1, 0];
      const similarity = narrativeMemory.cosineSimilarity(vecA, vecB);
      expect(similarity).toBeCloseTo(0, 5); // Orthogonal vectors
    });

    it('should calculate similarity between similar vectors', () => {
      const vecA = [1, 2, 3];
      const vecB = [2, 4, 6];
      const similarity = narrativeMemory.cosineSimilarity(vecA, vecB);
      expect(similarity).toBeCloseTo(1, 5); // Parallel vectors
    });

    it('should return 0 for null vectors', () => {
      expect(narrativeMemory.cosineSimilarity(null, [1, 2, 3])).toBe(0);
      expect(narrativeMemory.cosineSimilarity([1, 2, 3], null)).toBe(0);
    });

    it('should return 0 for vectors of different lengths', () => {
      expect(narrativeMemory.cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    });

    it('should return 0 for zero vectors', () => {
      expect(narrativeMemory.cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
    });
  });

  describe('generateEmbedding', () => {
    it('should return null for empty text', async () => {
      const result = await narrativeMemory.generateEmbedding('');
      expect(result).toBeNull();
    });

    it('should return null for null text', async () => {
      const result = await narrativeMemory.generateEmbedding(null);
      expect(result).toBeNull();
    });

    it('should return null if OpenAI client is not configured', async () => {
      openaiClient.getClient.mockReturnValue(null);

      const result = await narrativeMemory.generateEmbedding('test text');
      expect(result).toBeNull();
    });

    it('should generate embedding for valid text', async () => {
      const mockEmbedding = Array(1536).fill(0.1);
      openaiClient.getClient.mockReturnValue({
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [{ embedding: mockEmbedding }],
          }),
        },
      });

      const result = await narrativeMemory.generateEmbedding('test text');
      expect(result).toEqual(mockEmbedding);
    });

    it('should handle OpenAI API errors gracefully', async () => {
      openaiClient.getClient.mockReturnValue({
        embeddings: {
          create: jest.fn().mockRejectedValue(new Error('API Error')),
        },
      });

      const result = await narrativeMemory.generateEmbedding('test text');
      expect(result).toBeNull();
    });
  });

  describe('storeMessageEmbedding', () => {
    const mockEmbedding = Array(1536).fill(0.1);

    beforeEach(() => {
      openaiClient.getClient.mockReturnValue({
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [{ embedding: mockEmbedding }],
          }),
        },
      });
    });

    it('should return false for missing messageId', async () => {
      const result = await narrativeMemory.storeMessageEmbedding(null, 'text');
      expect(result).toBe(false);
    });

    it('should return false for missing text', async () => {
      const result = await narrativeMemory.storeMessageEmbedding('msg-123', null);
      expect(result).toBe(false);
    });

    it('should store embedding successfully', async () => {
      query.mockResolvedValue({ rowCount: 1 });

      const result = await narrativeMemory.storeMessageEmbedding('msg-123', 'test message');
      expect(result).toBe(true);
      expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE messages'), [
        mockEmbedding,
        'msg-123',
      ]);
    });

    it('should handle database errors gracefully', async () => {
      query.mockRejectedValue(new Error('Database error'));

      const result = await narrativeMemory.storeMessageEmbedding('msg-123', 'test message');
      expect(result).toBe(false);
    });
  });

  describe('findSimilarMessages', () => {
    const mockEmbedding = Array(1536).fill(0.1);

    beforeEach(() => {
      openaiClient.getClient.mockReturnValue({
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [{ embedding: mockEmbedding }],
          }),
        },
      });
    });

    it('should return empty array for empty query', async () => {
      const result = await narrativeMemory.findSimilarMessages('', null, 'room-123');
      expect(result).toEqual([]);
    });

    it('should return empty array for missing roomId', async () => {
      const result = await narrativeMemory.findSimilarMessages('query', null, null);
      expect(result).toEqual([]);
    });

    it('should find similar messages', async () => {
      const similarEmbedding = Array(1536).fill(0.1); // Same as query
      const differentEmbedding = Array(1536)
        .fill(0)
        .map((_, i) => (i % 2 === 0 ? 0.1 : -0.1));

      query.mockResolvedValue({
        rows: [
          { id: 'msg-1', text: 'similar text', embedding: similarEmbedding, timestamp: new Date() },
          {
            id: 'msg-2',
            text: 'different text',
            embedding: differentEmbedding,
            timestamp: new Date(),
          },
        ],
      });

      const result = await narrativeMemory.findSimilarMessages('query text', null, 'room-123', 5);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].similarity).toBeGreaterThan(0.5);
    });

    it('should filter by user when userId provided', async () => {
      query
        .mockResolvedValueOnce({ rows: [{ email: 'user@example.com' }] }) // getUserEmail
        .mockResolvedValueOnce({ rows: [] }); // getMessages

      await narrativeMemory.findSimilarMessages('query text', 1, 'room-123', 5);

      expect(query).toHaveBeenCalledWith(expect.any(String), ['room-123', 'user@example.com']);
    });
  });

  describe('getUserNarrativeProfile', () => {
    it('should return null for missing userId', async () => {
      const result = await narrativeMemory.getUserNarrativeProfile(null, 'room-123');
      expect(result).toBeNull();
    });

    it('should return null for missing roomId', async () => {
      const result = await narrativeMemory.getUserNarrativeProfile(1, null);
      expect(result).toBeNull();
    });

    it('should return null for non-existent profile', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await narrativeMemory.getUserNarrativeProfile(1, 'room-123');
      expect(result).toBeNull();
    });

    it('should return profile when exists', async () => {
      const mockProfile = {
        id: 1,
        user_id: 1,
        room_id: 'room-123',
        core_values: ['fairness', 'respect'],
        known_triggers: ['money topics'],
        communication_patterns: { uses_absolutes: 0.8 },
        recurring_complaints: ['feeling unheard'],
        conflict_themes: ['custody'],
      };
      query.mockResolvedValue({ rows: [mockProfile] });

      const result = await narrativeMemory.getUserNarrativeProfile(1, 'room-123');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateNarrativeProfile', () => {
    const mockEmbedding = Array(1536).fill(0.1);

    beforeEach(() => {
      openaiClient.getClient.mockReturnValue({
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [{ embedding: mockEmbedding }],
          }),
        },
      });
    });

    it('should return false for missing userId', async () => {
      const result = await narrativeMemory.updateNarrativeProfile(null, 'room-123', {});
      expect(result).toBe(false);
    });

    it('should return false for missing roomId', async () => {
      const result = await narrativeMemory.updateNarrativeProfile(1, null, {});
      expect(result).toBe(false);
    });

    it('should return false for missing analysis', async () => {
      const result = await narrativeMemory.updateNarrativeProfile(1, 'room-123', null);
      expect(result).toBe(false);
    });

    it('should create new profile successfully', async () => {
      query.mockResolvedValue({ rowCount: 1 });

      const analysis = {
        core_values: ['fairness', 'respect'],
        known_triggers: ['money topics'],
        communication_patterns: { uses_absolutes: 0.8 },
        recurring_complaints: ['feeling unheard'],
        conflict_themes: ['custody'],
        message_count_analyzed: 50,
      };

      const result = await narrativeMemory.updateNarrativeProfile(1, 'room-123', analysis);
      expect(result).toBe(true);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_narrative_profiles'),
        expect.arrayContaining([1, 'room-123'])
      );
    });

    it('should handle database errors gracefully', async () => {
      query.mockRejectedValue(new Error('Database error'));

      const result = await narrativeMemory.updateNarrativeProfile(1, 'room-123', {
        core_values: ['test'],
      });
      expect(result).toBe(false);
    });
  });

  describe('getRoomNarrativeProfiles', () => {
    it('should return empty array for missing roomId', async () => {
      const result = await narrativeMemory.getRoomNarrativeProfiles(null);
      expect(result).toEqual([]);
    });

    it('should return all profiles in room', async () => {
      const mockProfiles = [
        { user_id: 1, email: 'user1@example.com', core_values: ['value1'] },
        { user_id: 2, email: 'user2@example.com', core_values: ['value2'] },
      ];
      query.mockResolvedValue({ rows: mockProfiles });

      const result = await narrativeMemory.getRoomNarrativeProfiles('room-123');
      expect(result).toHaveLength(2);
    });
  });

  describe('findStaleProfiles', () => {
    it('should find profiles needing re-analysis', async () => {
      const staleProfiles = [
        { user_id: 1, room_id: 'room-1', last_analyzed_at: null },
        {
          user_id: 2,
          room_id: 'room-2',
          last_analyzed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      ];
      query.mockResolvedValue({ rows: staleProfiles });

      const result = await narrativeMemory.findStaleProfiles(7, 100);
      expect(result).toHaveLength(2);
    });
  });

  describe('getMessagesWithoutEmbeddings', () => {
    it('should return messages needing embeddings', async () => {
      const messages = [
        { id: 'msg-1', text: 'Message 1' },
        { id: 'msg-2', text: 'Message 2' },
      ];
      query.mockResolvedValue({ rows: messages });

      const result = await narrativeMemory.getMessagesWithoutEmbeddings('room-123', 50);
      expect(result).toHaveLength(2);
    });
  });

  describe('batchStoreEmbeddings', () => {
    const mockEmbedding = Array(1536).fill(0.1);

    beforeEach(() => {
      openaiClient.getClient.mockReturnValue({
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [{ embedding: mockEmbedding }],
          }),
        },
      });
      query.mockResolvedValue({ rowCount: 1 });
    });

    it('should process messages in batches', async () => {
      const messages = [
        { id: 'msg-1', text: 'Message 1' },
        { id: 'msg-2', text: 'Message 2' },
        { id: 'msg-3', text: 'Message 3' },
      ];

      const result = await narrativeMemory.batchStoreEmbeddings(messages, {
        batchSize: 2,
        delayMs: 10,
      });

      expect(result.success).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('should call progress callback', async () => {
      const messages = [
        { id: 'msg-1', text: 'Message 1' },
        { id: 'msg-2', text: 'Message 2' },
      ];
      const onProgress = jest.fn();

      await narrativeMemory.batchStoreEmbeddings(messages, {
        batchSize: 1,
        delayMs: 10,
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith(1, 2);
      expect(onProgress).toHaveBeenCalledWith(2, 2);
    });

    it('should handle partial failures', async () => {
      const messages = [
        { id: 'msg-1', text: 'Message 1' },
        { id: 'msg-2', text: '' }, // Will fail
      ];

      const result = await narrativeMemory.batchStoreEmbeddings(messages, {
        batchSize: 10,
        delayMs: 10,
      });

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('Constants', () => {
    it('should export correct embedding model', () => {
      expect(narrativeMemory.EMBEDDING_MODEL).toBe('text-embedding-3-small');
    });

    it('should export correct embedding dimensions', () => {
      expect(narrativeMemory.EMBEDDING_DIMENSIONS).toBe(1536);
    });
  });
});
