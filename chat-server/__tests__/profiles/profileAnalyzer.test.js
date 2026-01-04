/**
 * Profile Analyzer Tests
 *
 * Tests for the Dual-Brain AI Mediator profile analysis functionality.
 */

const profileAnalyzer = require('../../src/core/profiles/profileAnalyzer');

describe('ProfileAnalyzer', () => {
  describe('buildUserAnalysisPrompt', () => {
    it('should build valid prompt with messages', () => {
      const messages = [
        { text: 'Can we discuss the schedule?', timestamp: new Date() },
        { text: 'I need to pick up the kids at 5pm', timestamp: new Date() },
      ];

      const prompt = profileAnalyzer.buildUserAnalysisPrompt(messages, 'TestUser');

      expect(prompt).toContain('TestUser');
      expect(prompt).toContain('Can we discuss the schedule?');
      expect(prompt).toContain('pick up the kids');
      expect(prompt).toContain('core_values');
      expect(prompt).toContain('known_triggers');
    });

    it('should limit messages to 100', () => {
      const messages = Array(150)
        .fill(null)
        .map((_, i) => ({
          text: `Message ${i}`,
          timestamp: new Date(),
        }));

      const prompt = profileAnalyzer.buildUserAnalysisPrompt(messages, 'TestUser');

      // Should include first 100, not all 150
      expect(prompt).toContain('Message 99');
      expect(prompt).not.toContain('Message 149');
    });

    it('should include AI constitution rules', () => {
      const prompt = profileAnalyzer.buildUserAnalysisPrompt([{ text: 'test' }], 'User');

      expect(prompt).toContain('NEVER use psychological terms');
      expect(prompt).toContain('narcissist');
      expect(prompt).toContain('manipulative');
    });
  });

  describe('parseProfileResponse', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        core_values: ['fairness', 'consistency'],
        known_triggers: ['money topics'],
        communication_patterns: { uses_absolutes: 0.5 },
        recurring_complaints: ['schedule changes'],
        conflict_themes: ['custody'],
      });

      const result = profileAnalyzer.parseProfileResponse(response);

      expect(result).not.toBeNull();
      expect(result.core_values).toContain('fairness');
      expect(result.known_triggers).toContain('money topics');
      expect(result.communication_patterns.uses_absolutes).toBe(0.5);
    });

    it('should parse JSON wrapped in markdown code blocks', () => {
      const response = `\`\`\`json
{
  "core_values": ["respect"],
  "known_triggers": [],
  "communication_patterns": {},
  "recurring_complaints": [],
  "conflict_themes": []
}
\`\`\``;

      const result = profileAnalyzer.parseProfileResponse(response);

      expect(result).not.toBeNull();
      expect(result.core_values).toContain('respect');
    });

    it('should handle missing fields by adding defaults', () => {
      const response = JSON.stringify({
        core_values: ['value1'],
        // Missing other fields
      });

      const result = profileAnalyzer.parseProfileResponse(response);

      expect(result).not.toBeNull();
      expect(result.known_triggers).toEqual([]);
      expect(result.communication_patterns).toEqual({});
    });

    it('should normalize communication pattern scores to 0-1', () => {
      const response = JSON.stringify({
        core_values: [],
        known_triggers: [],
        communication_patterns: {
          uses_absolutes: 1.5, // Should be capped at 1
          asks_questions: -0.5, // Should be raised to 0
        },
        recurring_complaints: [],
        conflict_themes: [],
      });

      const result = profileAnalyzer.parseProfileResponse(response);

      expect(result.communication_patterns.uses_absolutes).toBe(1);
      expect(result.communication_patterns.asks_questions).toBe(0);
    });

    it('should return null for invalid JSON', () => {
      const result = profileAnalyzer.parseProfileResponse('not valid json');
      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      expect(profileAnalyzer.parseProfileResponse(null)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(profileAnalyzer.parseProfileResponse('')).toBeNull();
    });
  });

  describe('checkMessageTriggers', () => {
    // Mock the narrative memory module
    jest.mock('../../src/core/memory/narrativeMemory', () => ({
      getUserNarrativeProfile: jest.fn(),
    }));

    it('should return no triggers for empty message', async () => {
      const result = await profileAnalyzer.checkMessageTriggers('', 1, 2, 'room-123');
      expect(result.hasTriggers).toBe(false);
    });

    it('should return no triggers for missing roomId', async () => {
      const result = await profileAnalyzer.checkMessageTriggers('test message', 1, 2, null);
      expect(result.hasTriggers).toBe(false);
    });
  });

  describe('Constitution Compliance', () => {
    it('should not include emotion-diagnosing language in prompts', () => {
      const prompt = profileAnalyzer.buildUserAnalysisPrompt([{ text: 'test' }], 'User');

      // Should NOT suggest emotional diagnosis
      expect(prompt).not.toMatch(/feels? angry/i);
      expect(prompt).not.toMatch(/feels? frustrated/i);
      expect(prompt).not.toMatch(/you're upset/i);
    });

    it('should focus on language patterns in prompt instructions', () => {
      const prompt = profileAnalyzer.buildUserAnalysisPrompt([{ text: 'test' }], 'User');

      expect(prompt).toContain('language and phrasing patterns');
      expect(prompt).toContain('observable communication patterns');
    });

    it('should request observable patterns, not emotions', () => {
      const prompt = profileAnalyzer.buildUserAnalysisPrompt([{ text: 'test' }], 'User');

      // Should focus on patterns that can be observed in text
      expect(prompt).toContain('uses_absolutes');
      expect(prompt).toContain('asks_questions');
      expect(prompt).toContain('solution_oriented');
    });
  });
});
