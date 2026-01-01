/* eslint-env jest */
/**
 * System Messages Tests
 */

const {
  createSystemMessage,
  saveSystemMessage,
} = require('../../../socketHandlers/connectionOperations/systemMessages');

describe('System Messages Module', () => {
  describe('createSystemMessage', () => {
    it('should create a system message with required fields', () => {
      const result = createSystemMessage('socket-123', 'User joined', 'room-abc');

      expect(result).toMatchObject({
        type: 'system',
        user_email: 'system@liaizen.app',
        username: 'System',
        text: 'User joined',
        roomId: 'room-abc',
      });
      expect(result.id).toContain('socket-123');
      expect(result.timestamp).toBeDefined();
    });

    it('should use custom email if provided', () => {
      const result = createSystemMessage(
        'socket-123',
        'Message',
        'room-abc',
        'custom@example.com'
      );

      expect(result.user_email).toBe('custom@example.com');
    });

    it('should generate unique IDs', () => {
      const result1 = createSystemMessage('socket-1', 'Message 1', 'room-abc');
      const result2 = createSystemMessage('socket-2', 'Message 2', 'room-abc');

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('saveSystemMessage', () => {
    it('should save message to database', async () => {
      const mockDbSafe = {
        safeInsert: jest.fn().mockResolvedValue(1),
      };
      const systemMessage = {
        id: 'msg-123',
        type: 'system',
        user_email: 'system@liaizen.app',
        text: 'Test message',
        timestamp: '2024-01-01T00:00:00Z',
        roomId: 'room-abc',
      };

      await saveSystemMessage(systemMessage, mockDbSafe);

      expect(mockDbSafe.safeInsert).toHaveBeenCalledWith('messages', {
        id: 'msg-123',
        type: 'system',
        user_email: 'system@liaizen.app',
        text: 'Test message',
        timestamp: '2024-01-01T00:00:00Z',
        room_id: 'room-abc',
      });
    });

    it('should use default email if not provided', async () => {
      const mockDbSafe = {
        safeInsert: jest.fn().mockResolvedValue(1),
      };
      const systemMessage = {
        id: 'msg-123',
        type: 'system',
        text: 'Test message',
        timestamp: '2024-01-01T00:00:00Z',
        roomId: 'room-abc',
      };

      await saveSystemMessage(systemMessage, mockDbSafe);

      expect(mockDbSafe.safeInsert).toHaveBeenCalledWith(
        'messages',
        expect.objectContaining({
          user_email: 'system@liaizen.app',
        })
      );
    });
  });
});
