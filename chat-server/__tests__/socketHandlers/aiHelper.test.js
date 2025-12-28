/**
 * Unit Tests for aiHelper.js
 *
 * Tests the AI mediation flow for socket messages.
 * These tests verify the complete mediation pipeline including:
 * - Pre-approved rewrite handling
 * - Bypass mediation handling
 * - AI analysis orchestration
 * - Intervention processing
 * - Error handling
 */

/* global jest, describe, beforeEach, afterEach, it, expect */

const { handleAiMediation } = require('../../socketHandlers/aiHelper');

// Mock dependencies
jest.mock('string-similarity', () => ({
  compareTwoStrings: jest.fn(),
}));

jest.mock('../../socketHandlers/aiContextHelper', () => ({
  getRecentMessages: jest.fn(),
  getParticipantUsernames: jest.fn(),
  getContactContext: jest.fn(),
  getTaskContext: jest.fn(),
  getFlaggedContext: jest.fn(),
}));

jest.mock('../../socketHandlers/aiActionHelper', () => ({
  handleNameDetection: jest.fn(),
  processIntervention: jest.fn(),
  processApprovedMessage: jest.fn(),
  handleAiFailure: jest.fn(),
}));

const stringSimilarity = require('string-similarity');
const aiContextHelper = require('../../socketHandlers/aiContextHelper');
const aiActionHelper = require('../../socketHandlers/aiActionHelper');

describe('aiHelper - handleAiMediation', () => {
  let mockSocket;
  let mockIo;
  let mockServices;
  let mockContext;
  let mockAddToHistory;

  beforeEach(() => {
    jest.clearAllMocks();
    // Don't use fake timers - setImmediate needs real async behavior

    // Mock socket
    mockSocket = {
      id: 'socket-123',
      emit: jest.fn(),
      data: {},
    };

    // Mock io
    mockIo = {
      to: jest.fn(() => ({
        emit: jest.fn(),
      })),
    };

    // Mock services
    mockServices = {
      aiMediator: {
        updateContext: jest.fn(),
        analyzeMessage: jest.fn(),
      },
      dbSafe: {
        safeSelect: jest.fn(),
      },
      dbPostgres: {
        query: jest.fn(),
      },
      communicationStats: {
        updateCommunicationStats: jest.fn(),
      },
      userSessionService: {
        getUsersInRoom: jest.fn(() => []),
        getUserBySocketId: jest.fn(),
      },
    };

    // Mock addToHistory callback
    mockAddToHistory = jest.fn().mockResolvedValue(undefined);

    // Mock context
    mockContext = {
      user: {
        username: 'testuser',
        roomId: 'room-123',
      },
      message: {
        id: 'msg-123',
        text: 'Hello world',
        username: 'testuser',
        timestamp: new Date().toISOString(),
      },
      data: {},
      addToHistory: mockAddToHistory,
    };
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Pre-approved rewrite handling', () => {
    it('should skip AI analysis for unedited rewrite (>= 95% similarity)', async () => {
      const originalRewrite = 'Hello world';
      mockContext.data = {
        isPreApprovedRewrite: true,
        originalRewrite: originalRewrite,
      };
      mockContext.message.text = originalRewrite;

      stringSimilarity.compareTwoStrings.mockReturnValue(0.96);
      mockServices.dbSafe.safeSelect.mockResolvedValue([{ id: 1 }]);

      await handleAiMediation(mockSocket, mockIo, mockServices, mockContext);

      // Should not call AI analysis
      expect(mockServices.aiMediator.analyzeMessage).not.toHaveBeenCalled();

      // Should mark as revision and emit
      expect(mockContext.message.isRevision).toBe(true);
      expect(mockAddToHistory).toHaveBeenCalledWith(mockContext.message, 'room-123');
      expect(mockIo.to).toHaveBeenCalledWith('room-123');
    });

    it('should run AI analysis for edited rewrite (< 95% similarity)', async () => {
      const originalRewrite = 'Hello world';
      const editedText = 'Hello world, how are you?';
      mockContext.data = {
        isPreApprovedRewrite: true,
        originalRewrite: originalRewrite,
      };
      mockContext.message.text = editedText;

      stringSimilarity.compareTwoStrings.mockReturnValue(0.8);
      mockServices.dbSafe.safeSelect.mockResolvedValue([{ id: 1 }]);

      // Mock AI analysis to return null (no intervention)
      aiContextHelper.getRecentMessages.mockResolvedValue([]);
      aiContextHelper.getParticipantUsernames.mockResolvedValue(['testuser', 'otheruser']);
      aiContextHelper.getContactContext.mockResolvedValue({
        existingContacts: [],
        aiContext: null,
      });
      aiContextHelper.getTaskContext.mockResolvedValue(null);
      aiContextHelper.getFlaggedContext.mockResolvedValue(null);
      mockServices.aiMediator.analyzeMessage.mockResolvedValue(null);
      aiActionHelper.handleNameDetection.mockResolvedValue(null);
      aiActionHelper.processApprovedMessage.mockResolvedValue(undefined);

      await handleAiMediation(mockSocket, mockIo, mockServices, mockContext);

      // Wait for setImmediate callback to execute
      await new Promise(resolve => setImmediate(resolve));

      // Should call AI analysis
      expect(mockServices.aiMediator.analyzeMessage).toHaveBeenCalled();
    });
  });

  describe('Bypass mediation handling', () => {
    it('should bypass mediation when bypassMediation flag is true', async () => {
      mockContext.data = {
        bypassMediation: true,
      };
      mockServices.dbSafe.safeSelect.mockResolvedValue([{ id: 1 }]);

      await handleAiMediation(mockSocket, mockIo, mockServices, mockContext);

      // Should not call AI analysis
      expect(mockServices.aiMediator.analyzeMessage).not.toHaveBeenCalled();

      // Should mark as bypassed and emit
      expect(mockContext.message.bypassedMediation).toBe(true);
      expect(mockAddToHistory).toHaveBeenCalledWith(mockContext.message, 'room-123');
      expect(mockIo.to).toHaveBeenCalledWith('room-123');
    });
  });

  describe('AI analysis flow', () => {
    beforeEach(() => {
      mockContext.data = {}; // Normal message, no bypass flags
    });

    it('should call AI mediator with correct parameters', async () => {
      const recentMessages = [{ id: 'msg-1', text: 'Previous message' }];
      const participantUsernames = ['testuser', 'otheruser'];
      const contactContext = {
        existingContacts: ['Contact1'],
        aiContext: 'Contacts: Contact1',
      };
      const taskContext = 'Task 1, Task 2';
      const flaggedContext = 'User has flagged messages before';

      aiContextHelper.getRecentMessages.mockResolvedValue(recentMessages);
      aiContextHelper.getParticipantUsernames.mockResolvedValue(participantUsernames);
      aiContextHelper.getContactContext.mockResolvedValue(contactContext);
      aiContextHelper.getTaskContext.mockResolvedValue(taskContext);
      aiContextHelper.getFlaggedContext.mockResolvedValue(flaggedContext);
      mockServices.aiMediator.analyzeMessage.mockResolvedValue(null);
      aiActionHelper.handleNameDetection.mockResolvedValue(null);
      aiActionHelper.processApprovedMessage.mockResolvedValue(undefined);

      await handleAiMediation(mockSocket, mockIo, mockServices, mockContext);

      // Wait for setImmediate callback to execute
      await new Promise(resolve => setImmediate(resolve));

      // Verify AI mediator was called with correct parameters
      expect(mockServices.aiMediator.updateContext).toHaveBeenCalledWith(mockContext.message);
      expect(mockServices.aiMediator.analyzeMessage).toHaveBeenCalledWith(
        mockContext.message,
        recentMessages,
        participantUsernames,
        contactContext.existingContacts,
        contactContext.aiContext,
        'room-123',
        taskContext,
        flaggedContext,
        {
          senderId: 'testuser',
          receiverId: 'otheruser',
        }
      );
    });

    it('should process intervention when AI returns intervention', async () => {
      const intervention = {
        shouldIntervene: true,
        rewrittenText: 'Rewritten message',
        reason: 'Escalation detected',
      };

      aiContextHelper.getRecentMessages.mockResolvedValue([]);
      aiContextHelper.getParticipantUsernames.mockResolvedValue(['testuser', 'otheruser']);
      aiContextHelper.getContactContext.mockResolvedValue({
        existingContacts: [],
        aiContext: null,
      });
      aiContextHelper.getTaskContext.mockResolvedValue(null);
      aiContextHelper.getFlaggedContext.mockResolvedValue(null);
      mockServices.aiMediator.analyzeMessage.mockResolvedValue(intervention);
      aiActionHelper.processIntervention.mockResolvedValue(undefined);

      await handleAiMediation(mockSocket, mockIo, mockServices, mockContext);

      // Wait for setImmediate callback to execute
      await new Promise(resolve => setImmediate(resolve));

      // Should process intervention, not approved message
      expect(aiActionHelper.processIntervention).toHaveBeenCalledWith(
        mockSocket,
        mockIo,
        mockServices,
        {
          user: mockContext.user,
          message: mockContext.message,
          intervention: intervention,
          addToHistory: mockAddToHistory,
        }
      );
      expect(aiActionHelper.processApprovedMessage).not.toHaveBeenCalled();
      expect(aiActionHelper.handleNameDetection).not.toHaveBeenCalled();
    });

    it('should process approved message when AI returns null', async () => {
      const contactSuggestion = {
        detectedName: 'John',
        detectedRelationship: 'My Friend',
        messageContext: 'Mentioned in message',
      };

      aiContextHelper.getRecentMessages.mockResolvedValue([]);
      aiContextHelper.getParticipantUsernames.mockResolvedValue(['testuser', 'otheruser']);
      aiContextHelper.getContactContext.mockResolvedValue({
        existingContacts: [],
        aiContext: null,
      });
      aiContextHelper.getTaskContext.mockResolvedValue(null);
      aiContextHelper.getFlaggedContext.mockResolvedValue(null);
      mockServices.aiMediator.analyzeMessage.mockResolvedValue(null);
      aiActionHelper.handleNameDetection.mockResolvedValue(contactSuggestion);
      aiActionHelper.processApprovedMessage.mockResolvedValue(undefined);

      await handleAiMediation(mockSocket, mockIo, mockServices, mockContext);

      // Wait for setImmediate callback to execute
      await new Promise(resolve => setImmediate(resolve));

      // Should process approved message with contact suggestion
      expect(aiActionHelper.processApprovedMessage).toHaveBeenCalledWith(
        mockSocket,
        mockIo,
        mockServices,
        {
          user: mockContext.user,
          message: mockContext.message,
          contactSuggestion: contactSuggestion,
          addToHistory: mockAddToHistory,
        }
      );
      expect(aiActionHelper.processIntervention).not.toHaveBeenCalled();
    });

    it('should handle AI analysis errors gracefully', async () => {
      const aiError = new Error('AI service unavailable');

      aiContextHelper.getRecentMessages.mockResolvedValue([]);
      aiContextHelper.getParticipantUsernames.mockResolvedValue(['testuser', 'otheruser']);
      aiContextHelper.getContactContext.mockResolvedValue({
        existingContacts: [],
        aiContext: null,
      });
      aiContextHelper.getTaskContext.mockResolvedValue(null);
      aiContextHelper.getFlaggedContext.mockResolvedValue(null);
      mockServices.aiMediator.analyzeMessage.mockRejectedValue(aiError);
      aiActionHelper.handleAiFailure.mockResolvedValue(undefined);

      await handleAiMediation(mockSocket, mockIo, mockServices, mockContext);

      // Wait for setImmediate callback to execute
      await new Promise(resolve => setImmediate(resolve));

      // Should handle failure gracefully
      expect(aiActionHelper.handleAiFailure).toHaveBeenCalledWith(mockSocket, mockIo, {
        user: mockContext.user,
        message: mockContext.message,
        error: aiError,
        addToHistory: mockAddToHistory,
      });
    });
  });

  describe('Participant username handling', () => {
    it('should correctly filter other participants for role context', async () => {
      const participantUsernames = ['testuser', 'otheruser', 'thirduser'];

      aiContextHelper.getRecentMessages.mockResolvedValue([]);
      aiContextHelper.getParticipantUsernames.mockResolvedValue(participantUsernames);
      aiContextHelper.getContactContext.mockResolvedValue({
        existingContacts: [],
        aiContext: null,
      });
      aiContextHelper.getTaskContext.mockResolvedValue(null);
      aiContextHelper.getFlaggedContext.mockResolvedValue(null);
      mockServices.aiMediator.analyzeMessage.mockResolvedValue(null);
      aiActionHelper.handleNameDetection.mockResolvedValue(null);
      aiActionHelper.processApprovedMessage.mockResolvedValue(undefined);

      await handleAiMediation(mockSocket, mockIo, mockServices, mockContext);

      // Wait for setImmediate callback to execute
      await new Promise(resolve => setImmediate(resolve));

      // Should use first other participant as receiver
      expect(mockServices.aiMediator.analyzeMessage).toHaveBeenCalledWith(
        mockContext.message,
        [],
        ['testuser', 'otheruser', 'thirduser'],
        [],
        null, // contactContext.aiContext
        'room-123',
        null, // taskContext
        null, // flaggedContext
        {
          senderId: 'testuser',
          receiverId: 'otheruser', // First other participant
        }
      );
    });

    it('should handle single participant (no receiver)', async () => {
      const participantUsernames = ['testuser'];

      aiContextHelper.getRecentMessages.mockResolvedValue([]);
      aiContextHelper.getParticipantUsernames.mockResolvedValue(participantUsernames);
      aiContextHelper.getContactContext.mockResolvedValue({
        existingContacts: [],
        aiContext: null,
      });
      aiContextHelper.getTaskContext.mockResolvedValue(null);
      aiContextHelper.getFlaggedContext.mockResolvedValue(null);
      mockServices.aiMediator.analyzeMessage.mockResolvedValue(null);
      aiActionHelper.handleNameDetection.mockResolvedValue(null);
      aiActionHelper.processApprovedMessage.mockResolvedValue(undefined);

      await handleAiMediation(mockSocket, mockIo, mockServices, mockContext);

      // Wait for setImmediate callback to execute
      await new Promise(resolve => setImmediate(resolve));

      // Should have null receiver when no other participants
      expect(mockServices.aiMediator.analyzeMessage).toHaveBeenCalledWith(
        mockContext.message,
        [],
        ['testuser'],
        [],
        null, // contactContext.aiContext
        'room-123',
        null, // taskContext
        null, // flaggedContext
        {
          senderId: 'testuser',
          receiverId: null,
        }
      );
    });
  });
});
