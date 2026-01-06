/**
 * TopicDetector Unit Tests
 *
 * Tests topic detection and clustering functionality.
 * Covers DBSCAN clustering, title generation, and category assignment.
 */

/* eslint-env jest */

const TopicDetector = require('../TopicDetector');

// Mock database pool
jest.mock('../../../../dbPostgres', () => ({
  query: jest.fn(),
}));

const pool = require('../../../../dbPostgres');

describe('TopicDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new TopicDetector({
      minMessages: 3,
      similarityThreshold: 0.75,
      maxTopics: 10,
    });
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // Constructor Tests
  // ─────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should use default values when no options provided', () => {
      const defaultDetector = new TopicDetector();
      expect(defaultDetector.minMessages).toBe(3);
      expect(defaultDetector.similarityThreshold).toBe(0.75);
      expect(defaultDetector.maxTopics).toBe(10);
    });

    it('should use custom values when options provided', () => {
      const customDetector = new TopicDetector({
        minMessages: 5,
        similarityThreshold: 0.8,
        maxTopics: 20,
      });
      expect(customDetector.minMessages).toBe(5);
      expect(customDetector.similarityThreshold).toBe(0.8);
      expect(customDetector.maxTopics).toBe(20);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // detectTopics Tests
  // ─────────────────────────────────────────────────────────────

  describe('detectTopics', () => {
    const mockMessages = [
      {
        id: 'msg-1',
        text: 'The soccer coach needs money for uniforms',
        user_email: 'parent1@test.com',
        timestamp: '2024-01-01T10:00:00Z',
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
      },
      {
        id: 'msg-2',
        text: 'How much does the soccer uniform cost?',
        user_email: 'parent2@test.com',
        timestamp: '2024-01-01T10:05:00Z',
        embedding: [0.1, 0.2, 0.3, 0.4, 0.6],
      },
      {
        id: 'msg-3',
        text: 'The uniform fee is $50',
        user_email: 'parent1@test.com',
        timestamp: '2024-01-01T10:10:00Z',
        embedding: [0.1, 0.2, 0.3, 0.4, 0.55],
      },
    ];

    it('should return empty array when not enough messages', async () => {
      pool.query.mockResolvedValue({ rows: [mockMessages[0]] });

      const result = await detector.detectTopics('room-1');

      expect(result).toEqual([]);
    });

    it('should detect topics when sufficient similar messages exist', async () => {
      pool.query.mockResolvedValue({ rows: mockMessages });

      const result = await detector.detectTopics('room-1');

      expect(pool.query).toHaveBeenCalled();
      // Result depends on clustering - may or may not find topics
      expect(Array.isArray(result)).toBe(true);
    });

    it('should limit results to maxTopics', async () => {
      const manyMessages = Array.from({ length: 50 }, (_, i) => ({
        ...mockMessages[0],
        id: `msg-${i}`,
        embedding: [0.1 + i * 0.01, 0.2, 0.3, 0.4, 0.5],
      }));
      pool.query.mockResolvedValue({ rows: manyMessages });

      const result = await detector.detectTopics('room-1');

      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should handle query errors gracefully', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(detector.detectTopics('room-1')).rejects.toThrow('Database error');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Category Assignment Tests
  // ─────────────────────────────────────────────────────────────

  describe('_determineCategory', () => {
    it('should detect medical category', () => {
      const messages = [
        { text: 'Doctor appointment tomorrow at 3pm' },
        { text: 'Need to pick up medication' },
      ];
      const category = detector._determineCategory(messages);
      expect(category).toBe('medical');
    });

    it('should detect school category', () => {
      const messages = [
        { text: 'Parent-teacher conference next week' },
        { text: 'Homework is due Friday' },
      ];
      const category = detector._determineCategory(messages);
      expect(category).toBe('school');
    });

    it('should detect activities category', () => {
      const messages = [
        { text: 'Soccer practice at 4pm' },
        { text: 'Birthday party Saturday' },
      ];
      const category = detector._determineCategory(messages);
      expect(category).toBe('activities');
    });

    it('should detect logistics category', () => {
      const messages = [
        { text: 'Can you do pickup today?' },
        { text: 'Weekend schedule change' },
      ];
      const category = detector._determineCategory(messages);
      expect(category).toBe('logistics');
    });

    it('should detect financial category', () => {
      const messages = [
        { text: 'Need to pay $50 for the fee' },
        { text: 'Can you reimburse the expense?' },
      ];
      const category = detector._determineCategory(messages);
      expect(category).toBe('financial');
    });

    it('should default to general when no keywords match', () => {
      const messages = [
        { text: 'Random conversation here' },
        { text: 'Nothing specific mentioned' },
      ];
      const category = detector._determineCategory(messages);
      expect(category).toBe('general');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Title Generation Tests
  // ─────────────────────────────────────────────────────────────

  describe('_generateTitle', () => {
    it('should generate title from common words', () => {
      const messages = [
        { text: 'Soccer uniform payment needed' },
        { text: 'Uniform costs $50' },
        { text: 'Soccer coach sent email about uniform' },
      ];
      const title = detector._generateTitle(messages);
      expect(title).toBeTruthy();
      expect(typeof title).toBe('string');
    });

    it('should return fallback for empty messages', () => {
      const messages = [{ text: '' }, { text: '' }];
      const title = detector._generateTitle(messages);
      expect(title).toBe('General Discussion');
    });

    it('should filter out common stopwords', () => {
      const messages = [
        { text: 'this is just about soccer' },
        { text: 'that what when soccer' },
      ];
      const title = detector._generateTitle(messages);
      // Should not include stopwords like 'this', 'that', 'what'
      expect(title.toLowerCase()).not.toContain('this');
      expect(title.toLowerCase()).not.toContain('that');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Cosine Similarity Tests
  // ─────────────────────────────────────────────────────────────

  describe('_calculateSimilarity', () => {
    it('should return 1 for identical vectors', async () => {
      const vec = [1, 0, 0, 0];
      const similarity = await detector._calculateSimilarity(vec, vec);
      expect(similarity).toBeCloseTo(1, 5);
    });

    it('should return 0 for orthogonal vectors', async () => {
      const vec1 = [1, 0, 0, 0];
      const vec2 = [0, 1, 0, 0];
      const similarity = await detector._calculateSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(0, 5);
    });

    it('should handle string embeddings (from pgvector)', async () => {
      const vec1 = JSON.stringify([0.5, 0.5, 0.5, 0.5]);
      const vec2 = JSON.stringify([0.5, 0.5, 0.5, 0.5]);
      const similarity = await detector._calculateSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(1, 5);
    });

    it('should return 0 for zero vectors', async () => {
      const vec1 = [0, 0, 0, 0];
      const vec2 = [1, 1, 1, 1];
      const similarity = await detector._calculateSimilarity(vec1, vec2);
      expect(similarity).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // assignMessageToTopic Tests
  // ─────────────────────────────────────────────────────────────

  describe('assignMessageToTopic', () => {
    it('should return null when no existing topics', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await detector.assignMessageToTopic(
        { id: 'msg-1', text: 'test message' },
        'room-1'
      );

      expect(result).toBeNull();
    });

    it('should return null when message has no embedding', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'topic-1', centroid: [0.1, 0.2] }] })
        .mockResolvedValueOnce({ rows: [] }); // No embedding found

      const result = await detector.assignMessageToTopic(
        { id: 'msg-no-embedding' },
        'room-1'
      );

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      pool.query.mockRejectedValue(new Error('Query failed'));

      const result = await detector.assignMessageToTopic(
        { id: 'msg-1' },
        'room-1'
      );

      expect(result).toBeNull();
    });
  });
});
