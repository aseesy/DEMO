/**
 * Tests for Intent Extractor
 *
 * @module liaizen/core/__tests__/intentExtractor.test
 */

const extractor = require('../intentExtractor');

describe('Intent Extractor', () => {
  describe('extractUserIntent', () => {
    it('should detect scheduling need from current message', () => {
      const result = extractor.extractUserIntent({
        messageText: 'Can we meet at 3pm instead?',
        recentMessages: [],
        senderId: 'alice',
      });

      expect(result.intents.length).toBeGreaterThan(0);
      expect(result.primaryIntent).toBeTruthy();
      expect(result.primaryIntent.intent.id).toBe('SCHEDULING_NEED');
    });

    it('should detect information need from questions', () => {
      const result = extractor.extractUserIntent({
        messageText: 'What time did you pick her up?',
        recentMessages: [],
        senderId: 'alice',
      });

      const infoNeed = result.intents.find(i => i.intent.id === 'INFORMATION_NEED');
      expect(infoNeed).toBeTruthy();
    });

    it('should infer intent from conversation history', () => {
      const recentMessages = [
        { username: 'alice', text: 'Can we change the meeting time?' },
        { username: 'bob', text: 'What time works for you?' },
        { username: 'alice', text: '3pm would be better' },
      ];

      const result = extractor.extractUserIntent({
        messageText: 'Your mom is more sane then you at this point',
        recentMessages,
        senderId: 'alice',
      });

      // Should infer scheduling need from history even though current message is problematic
      const schedulingIntent = result.intents.find(i => i.intent.id === 'SCHEDULING_NEED');
      expect(schedulingIntent).toBeTruthy();
      expect(schedulingIntent.source).toBe('conversation_history');
    });

    it('should combine intents from message and history', () => {
      const recentMessages = [
        { username: 'alice', text: 'I need to know what happened' },
        { username: 'bob', text: "I'll explain later" },
      ];

      const result = extractor.extractUserIntent({
        messageText: "Why didn't you tell me?",
        recentMessages,
        senderId: 'alice',
      });

      const infoNeed = result.intents.find(i => i.intent.id === 'INFORMATION_NEED');
      expect(infoNeed).toBeTruthy();
      expect(infoNeed.sources || [infoNeed.source]).toContain('current_message');
    });

    it('should detect action need from explicit requests', () => {
      const result = extractor.extractUserIntent({
        messageText: 'Can you please pick up the kids?',
        recentMessages: [],
        senderId: 'alice',
      });

      const actionNeed = result.intents.find(i => i.intent.id === 'ACTION_NEED');
      expect(actionNeed).toBeTruthy();
    });

    it('should detect collaboration need', () => {
      const result = extractor.extractUserIntent({
        messageText: 'Can we work together on this?',
        recentMessages: [],
        senderId: 'alice',
      });

      const collabNeed = result.intents.find(i => i.intent.id === 'COLLABORATION_NEED');
      expect(collabNeed).toBeTruthy();
    });

    it('should handle empty input gracefully', () => {
      const result = extractor.extractUserIntent({
        messageText: '',
        recentMessages: [],
        senderId: null,
      });

      expect(result.intents).toEqual([]);
      expect(result.primaryIntent).toBeNull();
    });

    it('should boost confidence for problematic messages with clear history intent', () => {
      const recentMessages = [
        { username: 'alice', text: 'The meeting time needs to change' },
        { username: 'alice', text: "3pm doesn't work for me" },
        { username: 'alice', text: 'Can we meet at a different time?' },
      ];

      const result = extractor.extractUserIntent({
        messageText: "You're such an idiot",
        recentMessages,
        senderId: 'alice',
      });

      const schedulingIntent = result.intents.find(i => i.intent.id === 'SCHEDULING_NEED');
      expect(schedulingIntent).toBeTruthy();
      // Should have some confidence from history even though current message is problematic
      expect(schedulingIntent.confidence).toBeGreaterThan(20);
      expect(schedulingIntent.source).toBe('conversation_history');
    });
  });

  describe('detectIntentFromMessage', () => {
    it('should detect multiple intents from a single message', () => {
      const intents = extractor.detectIntentFromMessage(
        'Can we meet at 3pm? I need to know what happened.'
      );

      expect(intents.length).toBeGreaterThan(1);
      const scheduling = intents.find(i => i.intent.id === 'SCHEDULING_NEED');
      const information = intents.find(i => i.intent.id === 'INFORMATION_NEED');
      expect(scheduling).toBeTruthy();
      expect(information).toBeTruthy();
    });
  });

  describe('getIntentCategory', () => {
    it('should return intent category by ID', () => {
      const category = extractor.getIntentCategory('SCHEDULING_NEED');

      expect(category).toBeTruthy();
      expect(category.id).toBe('SCHEDULING_NEED');
      expect(category.name).toBe('Scheduling Need');
      expect(category.description).toBeTruthy();
    });

    it('should return null for invalid intent ID', () => {
      const category = extractor.getIntentCategory('INVALID_INTENT');

      expect(category).toBeNull();
    });
  });

  describe('listAllIntentCategories', () => {
    it('should return all intent category definitions', () => {
      const categories = extractor.listAllIntentCategories();

      expect(categories.length).toBeGreaterThan(0);
      expect(categories.every(c => c.id && c.name && c.description)).toBe(true);
    });
  });
});
