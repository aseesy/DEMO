/**
 * TopicService Unit Tests
 *
 * Tests the orchestration layer for AI Thread Summaries.
 * Covers topic CRUD, message assignment, and debouncing.
 */

/* eslint-env jest */

const TopicService = require('../TopicService');

// Mock database pool
jest.mock('../../../../dbPostgres', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

// Mock detector and generator
jest.mock('../TopicDetector');
jest.mock('../SummaryGenerator');

const pool = require('../../../../dbPostgres');
const TopicDetector = require('../TopicDetector');
const SummaryGenerator = require('../SummaryGenerator');

describe('TopicService', () => {
  let service;
  let mockAiClient;
  let mockPoolClient;

  beforeEach(() => {
    // Mock AI client
    mockAiClient = {
      chat: { completions: { create: jest.fn() } },
    };

    // Mock pool client for transactions
    mockPoolClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockPoolClient);

    // Reset mocks
    TopicDetector.mockClear();
    SummaryGenerator.mockClear();

    // Create service
    service = new TopicService(mockAiClient);

    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ─────────────────────────────────────────────────────────────
  // getTopicsForRoom Tests
  // ─────────────────────────────────────────────────────────────

  describe('getTopicsForRoom', () => {
    const mockTopics = [
      {
        id: 'topic-1',
        title: 'Soccer Uniform',
        category: 'activities',
        summary_text: 'Discussion about uniform',
        message_count: 5,
      },
      {
        id: 'topic-2',
        title: 'Doctor Appointment',
        category: 'medical',
        summary_text: 'Upcoming appointment',
        message_count: 3,
      },
    ];

    it('should return topics for room', async () => {
      pool.query.mockResolvedValue({ rows: mockTopics });

      const result = await service.getTopicsForRoom('room-1');

      expect(result).toEqual(mockTopics);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT ts.*'),
        ['room-1', 20]
      );
    });

    it('should exclude archived topics by default', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await service.getTopicsForRoom('room-1');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('is_archived = FALSE'),
        expect.any(Array)
      );
    });

    it('should include archived when requested', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await service.getTopicsForRoom('room-1', { includeArchived: true });

      expect(pool.query).toHaveBeenCalledWith(
        expect.not.stringContaining('is_archived = FALSE'),
        expect.any(Array)
      );
    });

    it('should respect limit option', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await service.getTopicsForRoom('room-1', { limit: 5 });

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['room-1', 5]);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getTopicWithCitations Tests
  // ─────────────────────────────────────────────────────────────

  describe('getTopicWithCitations', () => {
    it('should return null when topic not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await service.getTopicWithCitations('nonexistent');

      expect(result).toBeNull();
    });

    it('should return topic with citations and messages', async () => {
      // Mock topic
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'topic-1', title: 'Test', summary_text: 'Summary' }],
      });
      // Mock citations
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'cite-1', claim_text: 'claim' }],
      });
      // Mock messages
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'msg-1', text: 'Message text' }],
      });

      const result = await service.getTopicWithCitations('topic-1');

      expect(result.id).toBe('topic-1');
      expect(result.citations).toHaveLength(1);
      expect(result.messages).toHaveLength(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // addMessageToTopic Tests
  // ─────────────────────────────────────────────────────────────

  describe('addMessageToTopic', () => {
    it('should insert message-topic mapping', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await service.addMessageToTopic('msg-1', 'topic-1');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO topic_messages'),
        ['topic-1', 'msg-1', 1.0]
      );
    });

    it('should update topic stats after adding message', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await service.addMessageToTopic('msg-1', 'topic-1');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE topic_summaries'),
        ['topic-1']
      );
    });

    it('should queue regeneration after adding message', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const queueSpy = jest.spyOn(service, 'queueRegeneration');

      await service.addMessageToTopic('msg-1', 'topic-1');

      expect(queueSpy).toHaveBeenCalledWith('topic-1');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // queueRegeneration Tests
  // ─────────────────────────────────────────────────────────────

  describe('queueRegeneration', () => {
    it('should debounce multiple calls for same topic', async () => {
      const regenerateSpy = jest
        .spyOn(service, 'regenerateSummary')
        .mockResolvedValue({});

      // Queue multiple regenerations
      service.queueRegeneration('topic-1');
      service.queueRegeneration('topic-1');
      service.queueRegeneration('topic-1');

      // Fast-forward past debounce
      jest.advanceTimersByTime(35000);

      // Should only regenerate once
      expect(regenerateSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle different topics independently', async () => {
      const regenerateSpy = jest
        .spyOn(service, 'regenerateSummary')
        .mockResolvedValue({});

      service.queueRegeneration('topic-1');
      service.queueRegeneration('topic-2');

      jest.advanceTimersByTime(35000);

      expect(regenerateSpy).toHaveBeenCalledTimes(2);
      expect(regenerateSpy).toHaveBeenCalledWith('topic-1');
      expect(regenerateSpy).toHaveBeenCalledWith('topic-2');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // reportInaccurate Tests
  // ─────────────────────────────────────────────────────────────

  describe('reportInaccurate', () => {
    it('should lower confidence score', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      jest.spyOn(service, 'regenerateSummary').mockResolvedValue({});

      await service.reportInaccurate('topic-1', 'user@test.com', 'Wrong info');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('confidence_score - 0.1'),
        ['topic-1']
      );
    });

    it('should immediately regenerate summary', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const regenerateSpy = jest
        .spyOn(service, 'regenerateSummary')
        .mockResolvedValue({});

      await service.reportInaccurate('topic-1', 'user@test.com', 'Wrong');

      expect(regenerateSpy).toHaveBeenCalledWith('topic-1');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getMessageContext Tests
  // ─────────────────────────────────────────────────────────────

  describe('getMessageContext', () => {
    it('should return null when message not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await service.getMessageContext('nonexistent');

      expect(result).toBeNull();
    });

    it('should return target message with surrounding context', async () => {
      // Mock target message
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: 'msg-5', room_id: 'room-1', timestamp: '2024-01-01T12:00:00Z' },
        ],
      });
      // Mock context
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: 'msg-3', text: 'Earlier' },
          { id: 'msg-4', text: 'Before target' },
          { id: 'msg-5', text: 'Target' },
          { id: 'msg-6', text: 'After target' },
          { id: 'msg-7', text: 'Later' },
        ],
      });

      const result = await service.getMessageContext('msg-5');

      expect(result.targetMessage.id).toBe('msg-5');
      expect(result.context).toHaveLength(5);
    });

    it('should respect contextSize parameter', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'msg-1', room_id: 'room-1', timestamp: '2024-01-01T12:00:00Z' }],
      });
      pool.query.mockResolvedValueOnce({ rows: [] });

      await service.getMessageContext('msg-1', 10);

      // Check that LIMIT uses the contextSize
      expect(pool.query).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.arrayContaining([10])
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // detectAndCreateTopics Tests
  // ─────────────────────────────────────────────────────────────

  describe('detectAndCreateTopics', () => {
    it('should detect topics and create new ones', async () => {
      // Mock detector
      service.detector.detectTopics = jest.fn().mockResolvedValue([
        {
          title: 'New Topic',
          category: 'activities',
          messageIds: ['msg-1', 'msg-2', 'msg-3'],
          messageCount: 3,
          confidence: 0.85,
          firstMessageAt: '2024-01-01T10:00:00Z',
          lastMessageAt: '2024-01-01T11:00:00Z',
          roomId: 'room-1',
        },
      ]);

      // Mock no similar topic found
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Mock transaction
      mockPoolClient.query.mockResolvedValue({ rows: [] });

      const result = await service.detectAndCreateTopics('room-1');

      expect(service.detector.detectTopics).toHaveBeenCalledWith('room-1', expect.any(Object));
      expect(result).toHaveLength(1);
    });

    it('should merge with existing topic when overlap found', async () => {
      // Mock detector
      service.detector.detectTopics = jest.fn().mockResolvedValue([
        {
          title: 'Topic',
          category: 'general',
          messageIds: ['msg-1', 'msg-2', 'msg-3'],
          messageCount: 3,
          confidence: 0.8,
          firstMessageAt: '2024-01-01T10:00:00Z',
          lastMessageAt: '2024-01-01T11:00:00Z',
          roomId: 'room-1',
        },
      ]);

      // Mock similar topic found
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'existing-topic', title: 'Existing' }],
      });

      // Mock insert for addMessagesToTopic
      pool.query.mockResolvedValue({ rows: [] });

      const result = await service.detectAndCreateTopics('room-1');

      // Should not create new topic, just add to existing
      expect(result).toHaveLength(0);
    });
  });
});
