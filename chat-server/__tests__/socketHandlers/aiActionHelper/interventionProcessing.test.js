/* eslint-env jest */
/**
 * Tests for interventionProcessing.js
 */

// Mock the logger before importing the module
jest.mock('../../../src/infrastructure/logging/logger', () => {
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
  return {
    defaultLogger: mockLogger,
    Logger: jest.fn(() => mockLogger),
  };
});

// Mock the aiHelperUtils module
jest.mock('../../../socketHandlers/aiHelperUtils', () => ({
  updateUserStats: jest.fn().mockResolvedValue(undefined),
}));

const {
  processIntervention,
} = require('../../../socketHandlers/aiActionHelper/interventionProcessing');
const { updateUserStats } = require('../../../socketHandlers/aiHelperUtils');
const { defaultLogger } = require('../../../src/infrastructure/logging/logger');

describe('interventionProcessing', () => {
  let mockSocket;
  let mockIo;
  let mockServices;
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = defaultLogger;

    mockSocket = {
      connected: true,
      emit: jest.fn(),
    };

    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    mockServices = {
      communicationStats: {},
      dbSafe: {},
    };
  });

  describe('ai_intervention type', () => {
    const createInterventionContext = (overrides = {}) => ({
      user: { email: 'test@example.com', roomId: 'room-123' },
      message: { id: 'msg-1', text: 'Hello' },
      intervention: {
        type: 'ai_intervention',
        escalation: { riskLevel: 'medium', reasons: ['hostile tone'] },
        validation: 'Message contains hostile language',
        insight: 'Try rephrasing with empathy',
        refocusQuestions: ['What outcome do you want?'],
        rewrite1: 'Could we discuss this calmly?',
        rewrite2: 'I understand your frustration',
        emotion: 'frustrated',
      },
      addToHistory: jest.fn(),
      ...overrides,
    });

    it('should update user stats as flagged', async () => {
      await processIntervention(mockSocket, mockIo, mockServices, createInterventionContext());

      expect(updateUserStats).toHaveBeenCalledWith(
        mockServices,
        expect.objectContaining({ email: 'test@example.com' }),
        'room-123',
        true
      );
    });

    it('should emit draft_coaching event with intervention data', async () => {
      await processIntervention(mockSocket, mockIo, mockServices, createInterventionContext());

      expect(mockSocket.emit).toHaveBeenCalledWith('draft_coaching', {
        analyzing: false,
        shouldSend: false,
        riskLevel: 'medium',
        originalText: 'Hello',
        observerData: {
          axiomsFired: ['hostile tone'],
          explanation: 'Message contains hostile language',
          tip: 'Try rephrasing with empathy',
          refocusQuestions: ['What outcome do you want?'],
          rewrite1: 'Could we discuss this calmly?',
          rewrite2: 'I understand your frustration',
          escalation: { riskLevel: 'medium', reasons: ['hostile tone'] },
          emotion: 'frustrated',
        },
      });
    });

    it('should handle missing escalation data gracefully', async () => {
      const context = createInterventionContext();
      context.intervention.escalation = undefined;
      context.intervention.validation = undefined;
      context.intervention.insight = undefined;

      await processIntervention(mockSocket, mockIo, mockServices, context);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'draft_coaching',
        expect.objectContaining({
          riskLevel: 'medium',
          observerData: expect.objectContaining({
            axiomsFired: [],
            explanation: '',
            tip: '',
          }),
        })
      );
    });

    it('should skip emit when socket is disconnected', async () => {
      mockSocket.connected = false;

      await processIntervention(mockSocket, mockIo, mockServices, createInterventionContext());

      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[processIntervention] Socket disconnected, skipping emit',
        expect.any(Object)
      );
    });

    it('should use username fallback for logging', async () => {
      mockSocket.connected = false;

      const context = createInterventionContext();
      context.user = { username: 'user@test.com', roomId: 'room-123' }; // No email, only username

      await processIntervention(mockSocket, mockIo, mockServices, context);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[processIntervention] Socket disconnected, skipping emit',
        expect.objectContaining({ email: 'user@test.com' })
      );
    });
  });

  describe('ai_comment type', () => {
    const createCommentContext = (overrides = {}) => ({
      user: { email: 'test@example.com', roomId: 'room-123' },
      message: { id: 'msg-1', text: 'Hello' },
      intervention: {
        type: 'ai_comment',
        text: 'Great communication!',
      },
      addToHistory: jest.fn(),
      ...overrides,
    });

    it('should persist original message and ai comment', async () => {
      const context = createCommentContext();

      await processIntervention(mockSocket, mockIo, mockServices, context);

      expect(context.addToHistory).toHaveBeenCalledTimes(2);
      expect(context.addToHistory).toHaveBeenCalledWith({ id: 'msg-1', text: 'Hello' }, 'room-123');
      expect(context.addToHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ai_comment',
          username: 'Alex',
          text: 'Great communication!',
        }),
        'room-123'
      );
    });

    it('should broadcast original message and ai comment to room', async () => {
      const context = createCommentContext();

      await processIntervention(mockSocket, mockIo, mockServices, context);

      expect(mockIo.to).toHaveBeenCalledWith('room-123');
      expect(mockIo.emit).toHaveBeenCalledTimes(2);
      expect(mockIo.emit).toHaveBeenCalledWith('new_message', { id: 'msg-1', text: 'Hello' });
      expect(mockIo.emit).toHaveBeenCalledWith(
        'new_message',
        expect.objectContaining({
          type: 'ai_comment',
          text: 'Great communication!',
        })
      );
    });

    it('should not update user stats for ai_comment', async () => {
      await processIntervention(mockSocket, mockIo, mockServices, createCommentContext());

      expect(updateUserStats).not.toHaveBeenCalled();
    });
  });

  describe('unknown intervention type', () => {
    it('should do nothing for unknown types', async () => {
      const context = {
        user: { email: 'test@example.com', roomId: 'room-123' },
        message: { id: 'msg-1', text: 'Hello' },
        intervention: { type: 'unknown_type' },
        addToHistory: jest.fn(),
      };

      await processIntervention(mockSocket, mockIo, mockServices, context);

      expect(updateUserStats).not.toHaveBeenCalled();
      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(mockIo.emit).not.toHaveBeenCalled();
      expect(context.addToHistory).not.toHaveBeenCalled();
    });
  });
});
