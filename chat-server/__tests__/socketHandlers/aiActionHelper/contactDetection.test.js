/* eslint-env jest */
/**
 * Tests for contactDetection.js
 */

const { detectContactSuggestion, detectAndStorePendingSuggestion, handleNameDetection } = require('../../../socketHandlers/aiActionHelper/contactDetection');

// Mock the contactIntelligence module
jest.mock('../../../src/core/intelligence/contactIntelligence', () => ({
  detectContactMentions: jest.fn(),
}));

const contactIntelligence = require('../../../src/core/intelligence/contactIntelligence');

describe('contactDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectContactSuggestion', () => {
    const mockAiMediator = {
      generateContactSuggestion: jest.fn(),
    };

    it('should return null when no people are detected', async () => {
      contactIntelligence.detectContactMentions.mockResolvedValue({
        detectedPeople: [],
      });

      const result = await detectContactSuggestion(mockAiMediator, {
        text: 'Hello there',
        existingContacts: [],
        participantUsernames: [],
        recentMessages: [],
      });

      expect(result).toBeNull();
    });

    it('should return null when detection result is null', async () => {
      contactIntelligence.detectContactMentions.mockResolvedValue(null);

      const result = await detectContactSuggestion(mockAiMediator, {
        text: 'Hello there',
        existingContacts: [],
        participantUsernames: [],
        recentMessages: [],
      });

      expect(result).toBeNull();
    });

    it('should return contact suggestion when person detected', async () => {
      contactIntelligence.detectContactMentions.mockResolvedValue({
        detectedPeople: [
          { name: 'Dr. Smith', relationship: 'My Child\'s Teacher' },
        ],
      });

      mockAiMediator.generateContactSuggestion.mockResolvedValue({
        detectedName: 'Dr. Smith',
        suggestionText: 'Would you like to add Dr. Smith as a contact?',
      });

      const result = await detectContactSuggestion(mockAiMediator, {
        text: 'I spoke with Dr. Smith today',
        existingContacts: [],
        participantUsernames: [],
        recentMessages: [],
      });

      expect(result).toEqual({
        detectedName: 'Dr. Smith',
        suggestionText: 'Would you like to add Dr. Smith as a contact?',
        detectedRelationship: 'My Child\'s Teacher',
      });
    });

    it('should return null when aiMediator returns no suggestion', async () => {
      contactIntelligence.detectContactMentions.mockResolvedValue({
        detectedPeople: [{ name: 'John', relationship: 'Other' }],
      });

      mockAiMediator.generateContactSuggestion.mockResolvedValue(null);

      const result = await detectContactSuggestion(mockAiMediator, {
        text: 'I saw John',
        existingContacts: [],
        participantUsernames: [],
        recentMessages: [],
      });

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      contactIntelligence.detectContactMentions.mockRejectedValue(new Error('AI error'));
      console.error = jest.fn();

      const result = await detectContactSuggestion(mockAiMediator, {
        text: 'test message',
        existingContacts: [],
        participantUsernames: [],
        recentMessages: [],
      });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error detecting contact mentions:', expect.any(Error));
    });

    it('should pass participantUsernames to exclude from detection', async () => {
      contactIntelligence.detectContactMentions.mockResolvedValue({ detectedPeople: [] });

      await detectContactSuggestion(mockAiMediator, {
        text: 'Hello',
        existingContacts: [{ name: 'Contact1' }],
        participantUsernames: ['user1', 'user2'],
        recentMessages: [{ text: 'Previous message' }],
      });

      expect(contactIntelligence.detectContactMentions).toHaveBeenCalledWith(
        'Hello',
        [{ name: 'Contact1' }],
        [{ text: 'Previous message' }],
        ['user1', 'user2']
      );
    });
  });

  describe('detectAndStorePendingSuggestion', () => {
    const mockAiMediator = {
      generateContactSuggestion: jest.fn(),
    };

    it('should store suggestion on socket when detected', async () => {
      contactIntelligence.detectContactMentions.mockResolvedValue({
        detectedPeople: [{ name: 'Jane', relationship: 'My Family' }],
      });

      mockAiMediator.generateContactSuggestion.mockResolvedValue({
        detectedName: 'Jane',
        messageContext: 'test context',
      });

      const socket = {};

      const result = await detectAndStorePendingSuggestion(socket, mockAiMediator, {
        text: 'Jane is coming over',
        existingContacts: [],
        participantUsernames: [],
        recentMessages: [],
      });

      expect(result).toBeDefined();
      expect(socket.data.pendingContactSuggestion).toEqual({
        detectedName: 'Jane',
        detectedRelationship: 'My Family',
        messageContext: 'test context',
        timestamp: expect.any(Number),
      });
    });

    it('should not store anything when no suggestion', async () => {
      contactIntelligence.detectContactMentions.mockResolvedValue({ detectedPeople: [] });

      const socket = {};

      const result = await detectAndStorePendingSuggestion(socket, mockAiMediator, {
        text: 'Hello',
        existingContacts: [],
        participantUsernames: [],
        recentMessages: [],
      });

      expect(result).toBeNull();
      expect(socket.data).toBeUndefined();
    });

    it('should handle socket with existing data', async () => {
      contactIntelligence.detectContactMentions.mockResolvedValue({
        detectedPeople: [{ name: 'Bob', relationship: 'Other' }],
      });

      mockAiMediator.generateContactSuggestion.mockResolvedValue({
        detectedName: 'Bob',
        messageContext: 'context',
      });

      const socket = {
        data: { existingField: 'value' },
      };

      await detectAndStorePendingSuggestion(socket, mockAiMediator, {
        text: 'Bob said hi',
        existingContacts: [],
        participantUsernames: [],
        recentMessages: [],
      });

      expect(socket.data.existingField).toBe('value');
      expect(socket.data.pendingContactSuggestion).toBeDefined();
    });
  });

  describe('handleNameDetection (deprecated)', () => {
    it('should delegate to detectAndStorePendingSuggestion', async () => {
      contactIntelligence.detectContactMentions.mockResolvedValue({ detectedPeople: [] });

      const socket = {};
      const mockAiMediator = { generateContactSuggestion: jest.fn() };

      const result = await handleNameDetection(socket, mockAiMediator, {
        text: 'test',
        existingContacts: [],
        participantUsernames: [],
        recentMessages: [],
      });

      expect(result).toBeNull();
    });
  });
});
