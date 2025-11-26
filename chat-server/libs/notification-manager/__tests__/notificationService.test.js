/**
 * Unit Tests: Notification Service
 *
 * Tests for creating and managing in-app notifications.
 * Uses mock database for isolation.
 *
 * Feature: 003-account-creation-coparent-invitation
 */

const notificationService = require('../notificationService');

describe('Notification Service', () => {
  // Mock database
  const createMockDb = (returnRows = []) => ({
    query: jest.fn().mockResolvedValue({
      rows: returnRows,
      rowCount: returnRows.length,
    }),
  });

  describe('createNotification', () => {
    it('should create notification with all fields', async () => {
      const mockNotification = {
        id: 1,
        user_id: 'user1',
        type: 'coparent_invitation',
        title: 'Test Title',
        message: 'Test message',
        data: { key: 'value' },
        read: false,
      };

      const db = createMockDb([mockNotification]);

      const result = await notificationService.createNotification({
        userId: 'user1',
        type: 'coparent_invitation',
        title: 'Test Title',
        message: 'Test message',
        data: { key: 'value' },
      }, db);

      expect(result).toEqual(mockNotification);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO in_app_notifications'),
        expect.any(Array)
      );
    });

    it('should throw error for missing userId', async () => {
      const db = createMockDb([]);

      await expect(
        notificationService.createNotification({
          type: 'test',
          title: 'Test',
        }, db)
      ).rejects.toThrow('userId is required');
    });

    it('should throw error for missing type', async () => {
      const db = createMockDb([]);

      await expect(
        notificationService.createNotification({
          userId: 'user1',
          title: 'Test',
        }, db)
      ).rejects.toThrow('type is required');
    });

    it('should throw error for missing title', async () => {
      const db = createMockDb([]);

      await expect(
        notificationService.createNotification({
          userId: 'user1',
          type: 'test',
        }, db)
      ).rejects.toThrow('title is required');
    });
  });

  describe('createInvitationNotification', () => {
    it('should create co-parent invitation notification', async () => {
      const mockNotification = {
        id: 1,
        user_id: 'user1',
        type: 'coparent_invitation',
        title: 'Co-Parent Invitation',
      };

      const db = createMockDb([mockNotification]);

      const result = await notificationService.createInvitationNotification({
        userId: 'user1',
        inviterName: 'Alex',
        invitationId: 123,
        invitationToken: 'token123',
      }, db);

      expect(result.type).toBe('coparent_invitation');
      const callArgs = db.query.mock.calls[0];
      expect(callArgs[1]).toContain('user1');
    });

    it('should include inviter name in message', async () => {
      const db = createMockDb([{ id: 1 }]);

      await notificationService.createInvitationNotification({
        userId: 'user1',
        inviterName: 'Jordan',
        invitationId: 123,
        invitationToken: 'token123',
      }, db);

      const callArgs = db.query.mock.calls[0];
      expect(callArgs[1][3]).toContain('Jordan');
    });

    it('should throw error for missing required params', async () => {
      const db = createMockDb([]);

      await expect(
        notificationService.createInvitationNotification({
          userId: 'user1',
        }, db)
      ).rejects.toThrow('userId, inviterName, and invitationId are required');
    });
  });

  describe('createInvitationAcceptedNotification', () => {
    it('should create accepted notification for inviter', async () => {
      const mockNotification = {
        id: 1,
        user_id: 'inviter1',
        type: 'invitation_accepted',
      };

      const db = createMockDb([mockNotification]);

      const result = await notificationService.createInvitationAcceptedNotification({
        userId: 'inviter1',
        inviteeName: 'Jordan',
        invitationId: 123,
        roomId: 'room123',
      }, db);

      expect(result.type).toBe('invitation_accepted');
    });

    it('should include room ID in data', async () => {
      const db = createMockDb([{ id: 1 }]);

      await notificationService.createInvitationAcceptedNotification({
        userId: 'inviter1',
        inviteeName: 'Jordan',
        invitationId: 123,
        roomId: 'room123',
      }, db);

      const callArgs = db.query.mock.calls[0];
      const dataParam = JSON.parse(callArgs[1][4]);
      expect(dataParam.room_id).toBe('room123');
    });
  });

  describe('createInvitationDeclinedNotification', () => {
    it('should create declined notification', async () => {
      const mockNotification = {
        id: 1,
        user_id: 'inviter1',
        type: 'invitation_declined',
      };

      const db = createMockDb([mockNotification]);

      const result = await notificationService.createInvitationDeclinedNotification({
        userId: 'inviter1',
        inviteeName: 'Jordan',
        invitationId: 123,
      }, db);

      expect(result.type).toBe('invitation_declined');
    });

    it('should work without invitee name', async () => {
      const db = createMockDb([{ id: 1 }]);

      await notificationService.createInvitationDeclinedNotification({
        userId: 'inviter1',
        invitationId: 123,
      }, db);

      const callArgs = db.query.mock.calls[0];
      expect(callArgs[1][3]).toContain('declined');
    });
  });

  describe('getNotifications', () => {
    it('should return all notifications for user', async () => {
      const mockNotifications = [
        { id: 1, user_id: 'user1', title: 'Test 1' },
        { id: 2, user_id: 'user1', title: 'Test 2' },
      ];

      const db = createMockDb(mockNotifications);

      const result = await notificationService.getNotifications('user1', db);

      expect(result).toHaveLength(2);
    });

    it('should filter by unread only', async () => {
      const db = createMockDb([]);

      await notificationService.getNotifications('user1', db, { unreadOnly: true });

      const callArgs = db.query.mock.calls[0];
      expect(callArgs[0]).toContain('read = FALSE');
    });

    it('should filter by type', async () => {
      const db = createMockDb([]);

      await notificationService.getNotifications('user1', db, { type: 'coparent_invitation' });

      const callArgs = db.query.mock.calls[0];
      expect(callArgs[0]).toContain('type = $2');
      expect(callArgs[1]).toContain('coparent_invitation');
    });

    it('should apply limit and offset', async () => {
      const db = createMockDb([]);

      await notificationService.getNotifications('user1', db, { limit: 10, offset: 20 });

      const callArgs = db.query.mock.calls[0];
      expect(callArgs[1]).toContain(10);
      expect(callArgs[1]).toContain(20);
    });

    it('should throw error for missing params', async () => {
      const db = createMockDb([]);

      await expect(
        notificationService.getNotifications(null, db)
      ).rejects.toThrow('userId and db are required');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const db = createMockDb([{ count: '5' }]);

      const result = await notificationService.getUnreadCount('user1', db);

      expect(result).toBe(5);
    });

    it('should return 0 when no unread', async () => {
      const db = createMockDb([{ count: '0' }]);

      const result = await notificationService.getUnreadCount('user1', db);

      expect(result).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const updatedNotification = {
        id: 1,
        user_id: 'user1',
        read: true,
        read_at: new Date().toISOString(),
      };

      const db = createMockDb([updatedNotification]);

      const result = await notificationService.markAsRead(1, 'user1', db);

      expect(result.read).toBe(true);
    });

    it('should throw error for non-existent notification', async () => {
      const db = createMockDb([]);

      await expect(
        notificationService.markAsRead(999, 'user1', db)
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const db = createMockDb([]);
      db.query.mockResolvedValueOnce({ rowCount: 5 });

      const result = await notificationService.markAllAsRead('user1', db);

      expect(result).toBe(5);
    });

    it('should return 0 when no unread notifications', async () => {
      const db = createMockDb([]);
      db.query.mockResolvedValueOnce({ rowCount: 0 });

      const result = await notificationService.markAllAsRead('user1', db);

      expect(result).toBe(0);
    });
  });

  describe('recordAction', () => {
    it('should record action on notification', async () => {
      const updatedNotification = {
        id: 1,
        action_taken: 'accepted',
        action_at: new Date().toISOString(),
      };

      const db = createMockDb([updatedNotification]);

      const result = await notificationService.recordAction(1, 'user1', 'accepted', db);

      expect(result.action_taken).toBe('accepted');
    });

    it('should throw error for non-existent notification', async () => {
      const db = createMockDb([]);

      await expect(
        notificationService.recordAction(999, 'user1', 'accepted', db)
      ).rejects.toThrow('Notification not found');
    });

    it('should throw error for missing params', async () => {
      const db = createMockDb([]);

      await expect(
        notificationService.recordAction(1, null, 'accepted', db)
      ).rejects.toThrow('notificationId, userId, action, and db are required');
    });
  });

  describe('deleteOldNotifications', () => {
    it('should delete old read notifications', async () => {
      const db = createMockDb([]);
      db.query.mockResolvedValueOnce({ rowCount: 10 });

      const result = await notificationService.deleteOldNotifications(30, db);

      expect(result).toBe(10);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM in_app_notifications'),
        [30]
      );
    });

    it('should throw error for missing params', async () => {
      const db = createMockDb([]);

      await expect(
        notificationService.deleteOldNotifications(null, db)
      ).rejects.toThrow('daysOld and db are required');
    });
  });

  describe('NOTIFICATION_TYPES', () => {
    it('should have all expected types', () => {
      expect(notificationService.NOTIFICATION_TYPES.COPARENT_INVITATION).toBe('coparent_invitation');
      expect(notificationService.NOTIFICATION_TYPES.INVITATION_ACCEPTED).toBe('invitation_accepted');
      expect(notificationService.NOTIFICATION_TYPES.INVITATION_DECLINED).toBe('invitation_declined');
      expect(notificationService.NOTIFICATION_TYPES.WELCOME).toBe('welcome');
      expect(notificationService.NOTIFICATION_TYPES.SYSTEM).toBe('system');
    });
  });

  describe('NOTIFICATION_ACTIONS', () => {
    it('should have all expected actions', () => {
      expect(notificationService.NOTIFICATION_ACTIONS.ACCEPTED).toBe('accepted');
      expect(notificationService.NOTIFICATION_ACTIONS.DECLINED).toBe('declined');
      expect(notificationService.NOTIFICATION_ACTIONS.DISMISSED).toBe('dismissed');
    });
  });
});
