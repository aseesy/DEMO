/* eslint-env jest */
/**
 * Tests for messageApproval.js
 */

const { processApprovedMessage } = require('../../../socketHandlers/aiActionHelper/messageApproval');

// Mock dependencies
jest.mock('../../../socketHandlers/aiHelperUtils', () => ({
  updateUserStats: jest.fn().mockResolvedValue(undefined),
  gatherAnalysisContext: jest.fn().mockResolvedValue({
    contactContext: { existingContacts: [] },
    recentMessages: [],
  }),
}));

jest.mock('../../../services/pushNotificationService', () => ({
  notifyNewMessage: jest.fn().mockResolvedValue({ sent: 1, failed: 0 }),
}));

jest.mock('../../../src/core/intelligence/informationExtractionService', () => ({
  processMessageExtraction: jest.fn().mockResolvedValue([]),
}));

const { updateUserStats } = require('../../../socketHandlers/aiHelperUtils');

describe('messageApproval', () => {
  let mockSocket;
  let mockIo;
  let mockServices;
  let originalSetImmediate;

  beforeEach(() => {
    jest.clearAllMocks();

    // Make setImmediate synchronous for testing
    originalSetImmediate = global.setImmediate;
    global.setImmediate = (fn) => fn();

    mockSocket = {
      connected: true,
      emit: jest.fn(),
    };

    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    mockServices = {
      dbPostgres: {
        query: jest.fn().mockResolvedValue({ rows: [] }),
      },
      communicationStats: {},
    };

    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    global.setImmediate = originalSetImmediate;
  });

  const createContext = (overrides = {}) => ({
    user: { email: 'sender@example.com', roomId: 'room-123' },
    message: { id: 'msg-1', text: 'Hello world', username: 'sender' },
    contactSuggestion: null,
    addToHistory: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  describe('basic message processing', () => {
    it('should update user stats as non-flagged', async () => {
      await processApprovedMessage(mockSocket, mockIo, mockServices, createContext());

      expect(updateUserStats).toHaveBeenCalledWith(
        mockServices,
        expect.objectContaining({ email: 'sender@example.com' }),
        'room-123',
        false
      );
    });

    it('should save message to database', async () => {
      const context = createContext();

      await processApprovedMessage(mockSocket, mockIo, mockServices, context);

      expect(context.addToHistory).toHaveBeenCalledWith(
        { id: 'msg-1', text: 'Hello world', username: 'sender' },
        'room-123'
      );
    });

    it('should broadcast message to room', async () => {
      await processApprovedMessage(mockSocket, mockIo, mockServices, createContext());

      expect(mockIo.to).toHaveBeenCalledWith('room-123');
      expect(mockIo.emit).toHaveBeenCalledWith('new_message', {
        id: 'msg-1',
        text: 'Hello world',
        username: 'sender',
      });
    });

    it('should continue even if save fails', async () => {
      const context = createContext({
        addToHistory: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await processApprovedMessage(mockSocket, mockIo, mockServices, context);

      expect(console.error).toHaveBeenCalledWith(
        '[processApprovedMessage] ERROR saving message:',
        expect.any(Error)
      );
      expect(mockIo.emit).toHaveBeenCalledWith('new_message', expect.any(Object));
    });
  });

  describe('contact suggestion handling', () => {
    it('should emit contact suggestion when provided and socket connected', async () => {
      const context = createContext({
        contactSuggestion: {
          suggestionText: 'Add Dr. Smith?',
          detectedName: 'Dr. Smith',
          detectedRelationship: 'My Child\'s Teacher',
        },
      });

      await processApprovedMessage(mockSocket, mockIo, mockServices, context);

      expect(mockSocket.emit).toHaveBeenCalledWith('new_message', expect.objectContaining({
        type: 'contact_suggestion',
        text: 'Add Dr. Smith?',
        detectedName: 'Dr. Smith',
        detectedRelationship: 'My Child\'s Teacher',
      }));
    });

    it('should not emit contact suggestion when socket disconnected', async () => {
      mockSocket.connected = false;
      const context = createContext({
        contactSuggestion: {
          suggestionText: 'Add contact?',
          detectedName: 'Test',
          detectedRelationship: 'Other',
        },
      });

      await processApprovedMessage(mockSocket, mockIo, mockServices, context);

      // Should not emit contact_suggestion type
      const emitCalls = mockSocket.emit.mock.calls;
      const contactSuggestionCall = emitCalls.find(
        call => call[1]?.type === 'contact_suggestion'
      );
      expect(contactSuggestionCall).toBeUndefined();
    });

    it('should not emit contact suggestion when not provided', async () => {
      const context = createContext({ contactSuggestion: null });

      await processApprovedMessage(mockSocket, mockIo, mockServices, context);

      const emitCalls = mockSocket.emit.mock.calls;
      const contactSuggestionCall = emitCalls.find(
        call => call[1]?.type === 'contact_suggestion'
      );
      expect(contactSuggestionCall).toBeUndefined();
    });
  });

  describe('push notification handling', () => {
    it('should send push notification to recipient', async () => {
      mockServices.dbPostgres.query.mockResolvedValue({
        rows: [
          { user_id: 1, username: 'sender@example.com' },
          { user_id: 2, username: 'recipient@example.com' },
        ],
      });

      await processApprovedMessage(mockSocket, mockIo, mockServices, createContext());

      const pushNotificationService = require('../../../services/pushNotificationService');
      expect(pushNotificationService.notifyNewMessage).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ id: 'msg-1' })
      );
    });

    it('should not fail if push notification fails', async () => {
      mockServices.dbPostgres.query.mockResolvedValue({
        rows: [
          { user_id: 1, username: 'sender@example.com' },
          { user_id: 2, username: 'recipient@example.com' },
        ],
      });

      const pushNotificationService = require('../../../services/pushNotificationService');
      pushNotificationService.notifyNewMessage.mockRejectedValueOnce(new Error('Push failed'));

      // Need to catch the unhandled rejection since setImmediate runs async
      await processApprovedMessage(mockSocket, mockIo, mockServices, createContext());

      // Wait for setImmediate to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Message should still be broadcast regardless of push failure
      expect(mockIo.emit).toHaveBeenCalledWith('new_message', expect.any(Object));
    });

    it('should skip push notification if no room members', async () => {
      mockServices.dbPostgres.query.mockResolvedValue({ rows: [] });

      await processApprovedMessage(mockSocket, mockIo, mockServices, createContext());

      const pushNotificationService = require('../../../services/pushNotificationService');
      expect(pushNotificationService.notifyNewMessage).not.toHaveBeenCalled();
    });
  });

  describe('username fallback', () => {
    it('should use username when email not available', async () => {
      const context = createContext();
      context.user = { username: 'testuser@example.com', roomId: 'room-123' };

      mockServices.dbPostgres.query
        .mockResolvedValueOnce({
          rows: [
            { user_id: 1, username: 'testuser@example.com' },
            { user_id: 2, username: 'other@example.com' },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await processApprovedMessage(mockSocket, mockIo, mockServices, context);

      // Should use username for matching sender
      expect(mockIo.emit).toHaveBeenCalledWith('new_message', expect.any(Object));
    });
  });
});
