/**
 * SummaryGenerator Unit Tests
 *
 * Tests AI summary generation with citations.
 * Covers prompt building, response parsing, and citation extraction.
 */

/* eslint-env jest */

const SummaryGenerator = require('../SummaryGenerator');

// Mock database pool
jest.mock('../../../../dbPostgres', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const pool = require('../../../../dbPostgres');

describe('SummaryGenerator', () => {
  let generator;
  let mockAiClient;
  let mockPoolClient;

  beforeEach(() => {
    // Mock OpenAI client
    mockAiClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    // Mock pool client for transactions
    mockPoolClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockPoolClient);

    generator = new SummaryGenerator(mockAiClient);
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // Constructor Tests
  // ─────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should use default model and tokens', () => {
      expect(generator.model).toBe('gpt-4o-mini');
      expect(generator.maxTokens).toBe(500);
    });

    it('should accept custom options', () => {
      const customGenerator = new SummaryGenerator(mockAiClient, {
        model: 'gpt-4o',
        maxTokens: 1000,
      });
      expect(customGenerator.model).toBe('gpt-4o');
      expect(customGenerator.maxTokens).toBe(1000);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Prompt Building Tests
  // ─────────────────────────────────────────────────────────────

  describe('_buildPrompt', () => {
    const mockMessages = [
      { id: 'msg-1', text: 'Soccer uniform costs $50', displayName: 'Dad' },
      { id: 'msg-2', text: 'Due by January 25th', displayName: 'Mom' },
    ];

    it('should include category in prompt', () => {
      const prompt = generator._buildPrompt(mockMessages, {
        category: 'activities',
        participants: ['Dad', 'Mom'],
      });
      expect(prompt).toContain('activities');
    });

    it('should include participants in prompt', () => {
      const prompt = generator._buildPrompt(mockMessages, {
        category: 'general',
        participants: ['Dad', 'Mom'],
      });
      expect(prompt).toContain('Dad, Mom');
    });

    it('should include message IDs for citations', () => {
      const prompt = generator._buildPrompt(mockMessages, {
        category: 'general',
        participants: [],
      });
      expect(prompt).toContain('[msg-1]');
      expect(prompt).toContain('[msg-2]');
    });

    it('should request JSON output format', () => {
      const prompt = generator._buildPrompt(mockMessages, {
        category: 'general',
        participants: [],
      });
      expect(prompt).toContain('Output valid JSON only');
      expect(prompt).toContain('"summary"');
      expect(prompt).toContain('"citations"');
    });

    it('should handle empty participants', () => {
      const prompt = generator._buildPrompt(mockMessages, {
        category: 'general',
        participants: [],
      });
      expect(prompt).toContain('Co-parents');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Response Parsing Tests
  // ─────────────────────────────────────────────────────────────

  describe('_parseResponse', () => {
    const mockMessages = [
      { id: 'msg-1', text: 'Soccer uniform costs $50' },
      { id: 'msg-2', text: 'Due by January 25th' },
    ];

    it('should parse valid JSON response', () => {
      const response = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Soccer uniform costs $50, due January 25th.',
                citations: [
                  { claim: '$50', message_ids: ['msg-1'] },
                  { claim: 'January 25th', message_ids: ['msg-2'] },
                ],
              }),
            },
          },
        ],
      };

      const result = generator._parseResponse(response, mockMessages);

      expect(result.summary).toBe('Soccer uniform costs $50, due January 25th.');
      expect(result.citations).toHaveLength(2);
    });

    it('should filter out invalid message IDs from citations', () => {
      const response = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Test summary',
                citations: [
                  { claim: 'claim', message_ids: ['msg-1', 'invalid-id'] },
                ],
              }),
            },
          },
        ],
      };

      const result = generator._parseResponse(response, mockMessages);

      expect(result.citations[0].messageIds).toEqual(['msg-1']);
      expect(result.citations[0].messageIds).not.toContain('invalid-id');
    });

    it('should throw on empty response', () => {
      const response = { choices: [{ message: { content: null } }] };

      expect(() => generator._parseResponse(response, mockMessages)).toThrow(
        'Empty response from LLM'
      );
    });

    it('should throw on invalid JSON', () => {
      const response = {
        choices: [{ message: { content: 'not valid json' } }],
      };

      expect(() => generator._parseResponse(response, mockMessages)).toThrow();
    });

    it('should throw on missing summary', () => {
      const response = {
        choices: [
          {
            message: {
              content: JSON.stringify({ citations: [] }),
            },
          },
        ],
      };

      expect(() => generator._parseResponse(response, mockMessages)).toThrow(
        'Invalid summary in response'
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Citation Position Finding Tests
  // ─────────────────────────────────────────────────────────────

  describe('_findClaimPosition', () => {
    it('should find exact match position', () => {
      const summary = 'The cost is $50 for the uniform.';
      const claim = '$50';

      const result = generator._findClaimPosition(summary, claim);

      expect(result.startIndex).toBe(12);
      expect(result.endIndex).toBe(15);
    });

    it('should be case insensitive', () => {
      const summary = 'Meeting with DOCTOR tomorrow.';
      const claim = 'doctor';

      const result = generator._findClaimPosition(summary, claim);

      expect(result.startIndex).toBe(13);
    });

    it('should handle partial match when exact not found', () => {
      const summary = 'The soccer practice is tomorrow.';
      const claim = 'football practice tomorrow';

      const result = generator._findClaimPosition(summary, claim);

      // Should find 'practice' or 'tomorrow'
      expect(result.startIndex).toBeGreaterThanOrEqual(0);
    });

    it('should return default position when no match', () => {
      const summary = 'Something completely different.';
      const claim = 'xyz abc';

      const result = generator._findClaimPosition(summary, claim);

      expect(result.startIndex).toBe(0);
      expect(result.endIndex).toBe(claim.length);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Fallback Summary Tests
  // ─────────────────────────────────────────────────────────────

  describe('_generateFallbackSummary', () => {
    it('should generate basic summary on failure', () => {
      const messages = [
        { id: 'msg-1', text: 'First message', timestamp: '2024-01-01T10:00:00Z' },
        { id: 'msg-2', text: 'Last message', timestamp: '2024-01-01T11:00:00Z' },
      ];

      const result = generator._generateFallbackSummary(messages, {
        category: 'activities',
      });

      expect(result.summary).toContain('activities');
      expect(result.summary).toContain('2 messages');
      expect(result.citations).toHaveLength(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // generateSummary Integration Tests
  // ─────────────────────────────────────────────────────────────

  describe('generateSummary', () => {
    const mockMessages = [
      { id: 'msg-1', text: 'Soccer uniform costs $50', user_email: 'dad@test.com' },
    ];

    it('should call AI client with correct parameters', async () => {
      mockAiClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Test summary',
                citations: [],
              }),
            },
          },
        ],
      });

      await generator.generateSummary('topic-1', mockMessages, {
        participants: ['Dad'],
        category: 'activities',
      });

      expect(mockAiClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: expect.any(Array),
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0.3,
      });
    });

    it('should return fallback on AI error', async () => {
      mockAiClient.chat.completions.create.mockRejectedValue(new Error('API error'));

      const result = await generator.generateSummary('topic-1', mockMessages, {
        participants: ['Dad'],
        category: 'activities',
      });

      expect(result.summary).toContain('Discussion about');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // regenerateSummary Tests
  // ─────────────────────────────────────────────────────────────

  describe('regenerateSummary', () => {
    it('should throw error when topic not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await expect(generator.regenerateSummary('nonexistent')).rejects.toThrow(
        'Topic not found'
      );
    });

    it('should fetch topic and messages for regeneration', async () => {
      // Mock topic fetch
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'topic-1', category: 'activities' }],
      });
      // Mock messages fetch
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'msg-1', text: 'Test', user_email: 'test@test.com' }],
      });
      // Mock user names fetch
      pool.query.mockResolvedValueOnce({
        rows: [{ email: 'test@test.com', first_name: 'Test' }],
      });

      mockAiClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Regenerated summary',
                citations: [],
              }),
            },
          },
        ],
      });

      // Mock transaction for saving
      mockPoolClient.query.mockResolvedValue({ rows: [] });

      const result = await generator.regenerateSummary('topic-1');

      expect(result.summary).toBe('Regenerated summary');
    });
  });
});
