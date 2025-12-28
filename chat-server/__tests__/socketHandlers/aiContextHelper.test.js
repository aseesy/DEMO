/**
 * Unit Tests for aiContextHelper.js
 *
 * Tests the AI context gathering functions used in mediation:
 * - getRecentMessages
 * - getParticipantUsernames (CRITICAL: tests userSessionService integration)
 * - getContactContext
 * - getTaskContext
 * - getFlaggedContext
 */

/* global jest, describe, beforeEach, it, expect */

const {
  getRecentMessages,
  getParticipantUsernames,
  getContactContext,
  getTaskContext,
  getFlaggedContext,
} = require('../../socketHandlers/aiContextHelper');

describe('aiContextHelper', () => {
  describe('getRecentMessages', () => {
    let mockDbPostgres;

    beforeEach(() => {
      mockDbPostgres = {
        query: jest.fn(),
      };
    });

    it('should return recent messages in chronological order', async () => {
      const roomId = 'room-123';
      const mockMessages = [
        { id: 'msg-1', text: 'First', timestamp: '2024-01-01T10:00:00Z' },
        { id: 'msg-2', text: 'Second', timestamp: '2024-01-01T10:01:00Z' },
        { id: 'msg-3', text: 'Third', timestamp: '2024-01-01T10:02:00Z' },
      ];

      mockDbPostgres.query.mockResolvedValue({
        rows: [...mockMessages].reverse(), // Database returns DESC, function reverses
      });

      const result = await getRecentMessages(mockDbPostgres, roomId);

      expect(mockDbPostgres.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'SELECT * FROM messages WHERE room_id = $1 ORDER BY timestamp DESC LIMIT 20'
        ),
        [roomId]
      );
      expect(result).toEqual(mockMessages);
    });

    it('should return empty array when no messages', async () => {
      const roomId = 'room-123';
      mockDbPostgres.query.mockResolvedValue({ rows: [] });

      const result = await getRecentMessages(mockDbPostgres, roomId);

      expect(result).toEqual([]);
    });
  });

  describe('getParticipantUsernames', () => {
    let mockDbSafe;
    let mockUserSessionService;

    beforeEach(() => {
      mockDbSafe = {
        safeSelect: jest.fn(),
      };
      mockUserSessionService = {
        getUsersInRoom: jest.fn(),
      };
    });

    it('should return usernames from room_members when available', async () => {
      const roomId = 'room-123';
      const roomMembers = [{ user_id: 1 }, { user_id: 2 }];
      const users = [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' },
      ];

      mockDbSafe.safeSelect
        .mockResolvedValueOnce(roomMembers) // First call: room_members
        .mockResolvedValueOnce(users); // Second call: users

      const result = await getParticipantUsernames(mockDbSafe, roomId, mockUserSessionService);

      expect(result).toEqual(['user1', 'user2']);
      expect(mockDbSafe.safeSelect).toHaveBeenCalledWith('room_members', { room_id: roomId });
      expect(mockDbSafe.safeSelect).toHaveBeenCalledWith('users', { id: [1, 2] });
      expect(mockUserSessionService.getUsersInRoom).not.toHaveBeenCalled();
    });

    it('should fallback to userSessionService when database query fails', async () => {
      const roomId = 'room-123';
      const activeUsers = [
        { username: 'user1', roomId: 'room-123' },
        { username: 'user2', roomId: 'room-123' },
      ];

      mockDbSafe.safeSelect.mockRejectedValue(new Error('Database error'));
      mockUserSessionService.getUsersInRoom.mockReturnValue(activeUsers);

      const result = await getParticipantUsernames(mockDbSafe, roomId, mockUserSessionService);

      expect(result).toEqual(['user1', 'user2']);
      expect(mockUserSessionService.getUsersInRoom).toHaveBeenCalledWith(roomId);
    });

    it('should fallback to userSessionService when no room members found', async () => {
      const roomId = 'room-123';
      const activeUsers = [{ username: 'user1', roomId: 'room-123' }];

      mockDbSafe.safeSelect.mockResolvedValueOnce([]); // No room members
      mockUserSessionService.getUsersInRoom.mockReturnValue(activeUsers);

      const result = await getParticipantUsernames(mockDbSafe, roomId, mockUserSessionService);

      expect(result).toEqual(['user1']);
      expect(mockUserSessionService.getUsersInRoom).toHaveBeenCalledWith(roomId);
    });

    it('should return empty array when userSessionService is not provided and database fails', async () => {
      const roomId = 'room-123';

      mockDbSafe.safeSelect.mockRejectedValue(new Error('Database error'));

      const result = await getParticipantUsernames(mockDbSafe, roomId, null);

      expect(result).toEqual([]);
    });

    it('should handle empty userSessionService result', async () => {
      const roomId = 'room-123';

      mockDbSafe.safeSelect.mockRejectedValue(new Error('Database error'));
      mockUserSessionService.getUsersInRoom.mockReturnValue([]);

      const result = await getParticipantUsernames(mockDbSafe, roomId, mockUserSessionService);

      expect(result).toEqual([]);
    });
  });

  describe('getContactContext', () => {
    let mockServices;
    let mockUser;

    beforeEach(() => {
      mockServices = {
        dbSafe: {
          safeSelect: jest.fn(),
        },
      };
      mockUser = {
        username: 'testuser',
      };
    });

    it('should return contact context when user has contacts', async () => {
      const participantUsernames = ['testuser', 'otheruser'];
      const userResult = [{ id: 1 }];
      const contacts = [{ contact_name: 'Contact1' }, { contact_name: 'Contact2' }];

      mockServices.dbSafe.safeSelect
        .mockResolvedValueOnce(userResult) // First call: users
        .mockResolvedValueOnce(contacts); // Second call: contacts

      const result = await getContactContext(mockServices, mockUser, participantUsernames);

      expect(result.existingContacts).toEqual(['Contact1', 'Contact2']);
      expect(result.aiContext).toContain('Contact1');
      expect(result.aiContext).toContain('Contact2');
    });

    it('should return empty arrays when user has no contacts', async () => {
      const participantUsernames = ['testuser'];
      const userResult = [{ id: 1 }];
      const contacts = [];

      mockServices.dbSafe.safeSelect
        .mockResolvedValueOnce(userResult)
        .mockResolvedValueOnce(contacts);

      const result = await getContactContext(mockServices, mockUser, participantUsernames);

      expect(result.existingContacts).toEqual([]);
      expect(result.aiContext).toContain('Contacts:');
    });

    it('should handle database errors gracefully', async () => {
      const participantUsernames = ['testuser'];

      mockServices.dbSafe.safeSelect.mockRejectedValue(new Error('Database error'));

      const result = await getContactContext(mockServices, mockUser, participantUsernames);

      expect(result.existingContacts).toEqual([]);
      expect(result.aiContext).toBeNull();
    });

    it('should handle user not found', async () => {
      const participantUsernames = ['testuser'];

      mockServices.dbSafe.safeSelect.mockResolvedValueOnce([]); // User not found

      const result = await getContactContext(mockServices, mockUser, participantUsernames);

      expect(result.existingContacts).toEqual([]);
      expect(result.aiContext).toBeNull();
    });
  });

  describe('getTaskContext', () => {
    let mockServices;
    let mockUser;

    beforeEach(() => {
      mockServices = {
        dbSafe: {
          safeSelect: jest.fn(),
        },
      };
      mockUser = {
        username: 'testuser',
      };
    });

    it('should return task context when user has active tasks', async () => {
      const userResult = [{ id: 1 }];
      const tasks = [{ title: 'Task 1' }, { title: 'Task 2' }];

      mockServices.dbSafe.safeSelect.mockResolvedValueOnce(userResult).mockResolvedValueOnce(tasks);

      const result = await getTaskContext(mockServices, mockUser);

      expect(result).toBe('Task 1, Task 2');
    });

    it('should return null when user has no active tasks', async () => {
      const userResult = [{ id: 1 }];
      const tasks = [];

      mockServices.dbSafe.safeSelect.mockResolvedValueOnce(userResult).mockResolvedValueOnce(tasks);

      const result = await getTaskContext(mockServices, mockUser);

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockServices.dbSafe.safeSelect.mockRejectedValue(new Error('Database error'));

      const result = await getTaskContext(mockServices, mockUser);

      expect(result).toBeNull();
    });
  });

  describe('getFlaggedContext', () => {
    let mockServices;
    let mockUser;

    beforeEach(() => {
      mockServices = {
        dbSafe: {
          safeSelect: jest.fn(),
        },
      };
      mockUser = {
        username: 'testuser',
      };
    });

    it('should return flagged context when user has flagged messages', async () => {
      const flags = [
        { id: 1, flagged_by_username: 'testuser' },
        { id: 2, flagged_by_username: 'testuser' },
      ];

      mockServices.dbSafe.safeSelect.mockResolvedValue(flags);

      const result = await getFlaggedContext(mockServices, mockUser);

      expect(result).toBe('User has flagged similar messages before.');
      expect(mockServices.dbSafe.safeSelect).toHaveBeenCalledWith(
        'message_flags',
        { flagged_by_username: 'testuser' },
        { limit: 5 }
      );
    });

    it('should return null when user has no flagged messages', async () => {
      mockServices.dbSafe.safeSelect.mockResolvedValue([]);

      const result = await getFlaggedContext(mockServices, mockUser);

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockServices.dbSafe.safeSelect.mockRejectedValue(new Error('Database error'));

      const result = await getFlaggedContext(mockServices, mockUser);

      expect(result).toBeNull();
    });
  });
});
