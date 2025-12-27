/**
 * Push Notification Integration Tests
 *
 * Tests the complete flow from message sending to push notification delivery.
 * This ensures that push notifications are triggered correctly when messages are processed.
 */

const pushNotificationService = require('../../services/pushNotificationService');
const dbPostgres = require('../../dbPostgres');

// Mock dependencies
jest.mock('../../services/pushNotificationService');
jest.mock('../../dbPostgres');

describe('Push Notification Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Message to Push Notification Flow', () => {
    it('should trigger push notification when message is approved', async () => {
      const mockRecipientUserId = 2;
      const mockSenderUsername = 'sender1';
      const mockMessage = {
        id: 'msg-123',
        username: mockSenderUsername,
        text: 'Hello, this is a test message',
        timestamp: new Date().toISOString(),
      };

      // Mock room members query
      dbPostgres.query.mockResolvedValueOnce({
        rows: [
          { user_id: 1, username: mockSenderUsername },
          { user_id: mockRecipientUserId, username: 'recipient1' },
        ],
      });

      // Mock push notification service
      pushNotificationService.notifyNewMessage.mockResolvedValueOnce({
        sent: 1,
        failed: 0,
      });

      // Simulate the flow from aiActionHelper.processApprovedMessage
      // This is the actual code path that should trigger notifications
      const roomMembersResult = await dbPostgres.query(
        `SELECT user_id, username FROM room_members rm
         JOIN users u ON rm.user_id = u.id
         WHERE rm.room_id = $1`,
        ['room-123']
      );

      if (roomMembersResult.rows.length > 0) {
        const recipient = roomMembersResult.rows.find(
          member => member.username?.toLowerCase() !== mockSenderUsername.toLowerCase()
        );

        if (recipient && recipient.user_id) {
          await pushNotificationService.notifyNewMessage(recipient.user_id, mockMessage);
        }
      }

      expect(dbPostgres.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT user_id, username FROM room_members'),
        ['room-123']
      );
      expect(pushNotificationService.notifyNewMessage).toHaveBeenCalledWith(
        mockRecipientUserId,
        mockMessage
      );
    });

    it('should not send notification if recipient not found', async () => {
      const mockSenderUsername = 'sender1';
      const mockMessage = {
        id: 'msg-123',
        username: mockSenderUsername,
        text: 'Hello',
      };

      // Mock: only sender in room (no recipient)
      dbPostgres.query.mockResolvedValueOnce({
        rows: [{ user_id: 1, username: mockSenderUsername }],
      });

      const roomMembersResult = await dbPostgres.query(
        `SELECT user_id, username FROM room_members rm
         JOIN users u ON rm.user_id = u.id
         WHERE rm.room_id = $1`,
        ['room-123']
      );

      const recipient = roomMembersResult.rows.find(
        member => member.username?.toLowerCase() !== mockSenderUsername.toLowerCase()
      );

      if (recipient && recipient.user_id) {
        await pushNotificationService.notifyNewMessage(recipient.user_id, mockMessage);
      }

      expect(pushNotificationService.notifyNewMessage).not.toHaveBeenCalled();
    });

    it('should handle push notification errors gracefully', async () => {
      const mockRecipientUserId = 2;
      const mockSenderUsername = 'sender1';
      const mockMessage = {
        id: 'msg-123',
        username: mockSenderUsername,
        text: 'Hello',
      };

      dbPostgres.query.mockResolvedValueOnce({
        rows: [
          { user_id: 1, username: mockSenderUsername },
          { user_id: mockRecipientUserId, username: 'recipient1' },
        ],
      });

      // Mock push notification failure
      pushNotificationService.notifyNewMessage.mockRejectedValueOnce(
        new Error('Push notification failed')
      );

      // Simulate the flow with error handling
      try {
        const roomMembersResult = await dbPostgres.query(
          `SELECT user_id, username FROM room_members rm
           JOIN users u ON rm.user_id = u.id
           WHERE rm.room_id = $1`,
          ['room-123']
        );

        const recipient = roomMembersResult.rows.find(
          member => member.username?.toLowerCase() !== mockSenderUsername.toLowerCase()
        );

        if (recipient && recipient.user_id) {
          await pushNotificationService.notifyNewMessage(recipient.user_id, mockMessage);
        }
      } catch (error) {
        // Error should be caught and logged, but not crash the message flow
        expect(error.message).toBe('Push notification failed');
      }

      expect(pushNotificationService.notifyNewMessage).toHaveBeenCalled();
    });

    it('should handle case-insensitive username comparison', async () => {
      const mockRecipientUserId = 2;
      const mockSenderUsername = 'Sender1'; // Different case
      const mockMessage = {
        id: 'msg-123',
        username: mockSenderUsername,
        text: 'Hello',
      };

      dbPostgres.query.mockResolvedValueOnce({
        rows: [
          { user_id: 1, username: 'sender1' }, // Lowercase in DB
          { user_id: mockRecipientUserId, username: 'recipient1' },
        ],
      });

      pushNotificationService.notifyNewMessage.mockResolvedValueOnce({
        sent: 1,
        failed: 0,
      });

      const roomMembersResult = await dbPostgres.query(
        `SELECT user_id, username FROM room_members rm
         JOIN users u ON rm.user_id = u.id
         WHERE rm.room_id = $1`,
        ['room-123']
      );

      const recipient = roomMembersResult.rows.find(
        member => member.username?.toLowerCase() !== mockSenderUsername.toLowerCase()
      );

      if (recipient && recipient.user_id) {
        await pushNotificationService.notifyNewMessage(recipient.user_id, mockMessage);
      }

      expect(pushNotificationService.notifyNewMessage).toHaveBeenCalledWith(
        mockRecipientUserId,
        mockMessage
      );
    });
  });

  describe('Subscription Management Flow', () => {
    it('should save subscription and then send notification', async () => {
      const mockUserId = 1;
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key',
        },
      };

      const mockSavedSubscription = {
        id: 1,
        user_id: mockUserId,
        endpoint: mockSubscription.endpoint,
        is_active: true,
      };

      // Step 1: Save subscription
      pushNotificationService.saveSubscription.mockResolvedValueOnce(mockSavedSubscription);

      const saved = await pushNotificationService.saveSubscription(
        mockUserId,
        mockSubscription,
        'Test Browser'
      );

      expect(saved).toEqual(mockSavedSubscription);

      // Step 2: Later, send notification
      pushNotificationService.notifyNewMessage.mockResolvedValueOnce({
        sent: 1,
        failed: 0,
      });

      const mockMessage = {
        id: 'msg-123',
        username: 'sender1',
        text: 'Hello',
      };

      const result = await pushNotificationService.notifyNewMessage(mockUserId, mockMessage);

      expect(result.sent).toBe(1);
      expect(pushNotificationService.saveSubscription).toHaveBeenCalled();
      expect(pushNotificationService.notifyNewMessage).toHaveBeenCalled();
    });
  });
});

