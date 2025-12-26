/* global jest, describe, beforeEach, it, expect */
/**
 * Push Notification Service Unit Tests
 *
 * Tests the push notification service methods to ensure proper
 * subscription management and notification sending.
 */

const pushNotificationService = require('../../services/pushNotificationService');
const dbPostgres = require('../../dbPostgres');
const webpush = require('web-push');

// Mock dependencies
jest.mock('../../dbPostgres');
jest.mock('web-push');

describe('PushNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveSubscription', () => {
    const mockUserId = 1;
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key',
      },
    };
    const mockUserAgent = 'Mozilla/5.0 Test Browser';

    it('should save a new subscription successfully', async () => {
      // Mock: no existing subscription
      dbPostgres.query.mockResolvedValueOnce({ rows: [] });
      // Mock: insert new subscription
      dbPostgres.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: mockUserId,
            endpoint: mockSubscription.endpoint,
            p256dh: mockSubscription.keys.p256dh,
            auth: mockSubscription.keys.auth,
            user_agent: mockUserAgent,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      const result = await pushNotificationService.saveSubscription(
        mockUserId,
        mockSubscription,
        mockUserAgent
      );

      expect(result).toBeDefined();
      expect(result.user_id).toBe(mockUserId);
      expect(result.endpoint).toBe(mockSubscription.endpoint);
      expect(dbPostgres.query).toHaveBeenCalledTimes(2);
    });

    it('should update existing subscription if endpoint already exists', async () => {
      // Mock: existing subscription found
      dbPostgres.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 2, // Different user
            endpoint: mockSubscription.endpoint,
            is_active: true,
          },
        ],
      });
      // Mock: update subscription
      dbPostgres.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: mockUserId,
            endpoint: mockSubscription.endpoint,
            p256dh: mockSubscription.keys.p256dh,
            auth: mockSubscription.keys.auth,
            user_agent: mockUserAgent,
            is_active: true,
            updated_at: new Date(),
          },
        ],
      });

      const result = await pushNotificationService.saveSubscription(
        mockUserId,
        mockSubscription,
        mockUserAgent
      );

      expect(result).toBeDefined();
      expect(result.user_id).toBe(mockUserId);
      expect(dbPostgres.query).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid subscription (missing endpoint)', async () => {
      const invalidSubscription = {
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key',
        },
      };

      await expect(
        pushNotificationService.saveSubscription(mockUserId, invalidSubscription)
      ).rejects.toThrow('Invalid subscription: missing required fields');
    });

    it('should throw error for invalid subscription (missing keys)', async () => {
      const invalidSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
      };

      await expect(
        pushNotificationService.saveSubscription(mockUserId, invalidSubscription)
      ).rejects.toThrow('Invalid subscription: missing required fields');
    });

    it('should throw error for invalid subscription (missing p256dh)', async () => {
      const invalidSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
        keys: {
          auth: 'test-auth-key',
        },
      };

      await expect(
        pushNotificationService.saveSubscription(mockUserId, invalidSubscription)
      ).rejects.toThrow('Invalid subscription: missing required fields');
    });

    it('should handle database errors', async () => {
      dbPostgres.query.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(
        pushNotificationService.saveSubscription(mockUserId, mockSubscription)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('deleteSubscription', () => {
    const mockEndpoint = 'https://fcm.googleapis.com/fcm/send/test-endpoint';

    it('should deactivate subscription successfully', async () => {
      dbPostgres.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await pushNotificationService.deleteSubscription(mockEndpoint);

      expect(result).toBe(true);
      expect(dbPostgres.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE push_subscriptions SET is_active = FALSE'),
        [mockEndpoint]
      );
    });

    it('should return false if subscription not found', async () => {
      dbPostgres.query.mockResolvedValueOnce({ rowCount: 0 });

      const result = await pushNotificationService.deleteSubscription(mockEndpoint);

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      dbPostgres.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(pushNotificationService.deleteSubscription(mockEndpoint)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getUserSubscriptions', () => {
    const mockUserId = 1;

    it('should return active subscriptions for user', async () => {
      const mockSubscriptions = [
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint1',
          p256dh: 'key1',
          auth: 'auth1',
        },
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint2',
          p256dh: 'key2',
          auth: 'auth2',
        },
      ];

      dbPostgres.query.mockResolvedValueOnce({ rows: mockSubscriptions });

      const result = await pushNotificationService.getUserSubscriptions(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        endpoint: mockSubscriptions[0].endpoint,
        keys: {
          p256dh: mockSubscriptions[0].p256dh,
          auth: mockSubscriptions[0].auth,
        },
      });
      expect(dbPostgres.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND is_active = TRUE'),
        [mockUserId]
      );
    });

    it('should return empty array if no subscriptions', async () => {
      dbPostgres.query.mockResolvedValueOnce({ rows: [] });

      const result = await pushNotificationService.getUserSubscriptions(mockUserId);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      dbPostgres.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(pushNotificationService.getUserSubscriptions(mockUserId)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('sendNotificationToUser', () => {
    const mockUserId = 1;
    const mockPayload = {
      title: 'Test Notification',
      body: 'Test message body',
      icon: '/icon.png',
      url: '/?view=chat',
    };

    it('should send notification to all active subscriptions', async () => {
      const mockSubscriptions = [
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint1',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint2',
          keys: { p256dh: 'key2', auth: 'auth2' },
        },
      ];

      // Mock getUserSubscriptions
      dbPostgres.query.mockResolvedValueOnce({ rows: mockSubscriptions });
      // Mock webpush.sendNotification (success)
      webpush.sendNotification.mockResolvedValue();
      // Mock update last_used_at (2 calls for 2 subscriptions)
      dbPostgres.query.mockResolvedValue({ rowCount: 1 });

      const result = await pushNotificationService.sendNotificationToUser(mockUserId, mockPayload);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
      expect(dbPostgres.query).toHaveBeenCalledTimes(3); // 1 for getUserSubscriptions + 2 for last_used_at
    });

    it('should return zero sent if no subscriptions', async () => {
      dbPostgres.query.mockResolvedValueOnce({ rows: [] });

      const result = await pushNotificationService.sendNotificationToUser(mockUserId, mockPayload);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it('should handle partial failures', async () => {
      const mockSubscriptions = [
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint1',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint2',
          keys: { p256dh: 'key2', auth: 'auth2' },
        },
      ];

      dbPostgres.query.mockResolvedValueOnce({ rows: mockSubscriptions });
      // First succeeds, second fails
      webpush.sendNotification
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error('Failed to send'));
      dbPostgres.query.mockResolvedValue({ rowCount: 1 });

      const result = await pushNotificationService.sendNotificationToUser(mockUserId, mockPayload);

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('should deactivate invalid subscriptions (410 Gone)', async () => {
      const mockSubscriptions = [
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint1',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
      ];

      const error = new Error('Subscription expired');
      error.statusCode = 410;

      dbPostgres.query.mockResolvedValueOnce({ rows: mockSubscriptions });
      webpush.sendNotification.mockRejectedValueOnce(error);
      // Mock deleteSubscription call
      dbPostgres.query.mockResolvedValueOnce({ rowCount: 1 });
      // Mock update last_used_at (won't be called due to error)
      dbPostgres.query.mockResolvedValue({ rowCount: 1 });

      const result = await pushNotificationService.sendNotificationToUser(mockUserId, mockPayload);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(1);
      // Should have called deleteSubscription
      expect(dbPostgres.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE push_subscriptions SET is_active = FALSE'),
        [mockSubscriptions[0].endpoint]
      );
    });

    it('should deactivate invalid subscriptions (404 Not Found)', async () => {
      const mockSubscriptions = [
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint1',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
      ];

      const error = new Error('Subscription not found');
      error.statusCode = 404;

      dbPostgres.query.mockResolvedValueOnce({ rows: mockSubscriptions });
      webpush.sendNotification.mockRejectedValueOnce(error);
      dbPostgres.query.mockResolvedValueOnce({ rowCount: 1 });
      dbPostgres.query.mockResolvedValue({ rowCount: 1 });

      const result = await pushNotificationService.sendNotificationToUser(mockUserId, mockPayload);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(1);
      expect(dbPostgres.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE push_subscriptions SET is_active = FALSE'),
        [mockSubscriptions[0].endpoint]
      );
    });

    it('should use default values for missing payload fields', async () => {
      const mockSubscriptions = [
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint1',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
      ];

      dbPostgres.query.mockResolvedValueOnce({ rows: mockSubscriptions });
      webpush.sendNotification.mockResolvedValue();
      dbPostgres.query.mockResolvedValue({ rowCount: 1 });

      const result = await pushNotificationService.sendNotificationToUser(mockUserId, {});

      expect(result.sent).toBe(1);
      // Verify default values were used in payload
      const sentPayload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
      expect(sentPayload.title).toBe('LiaiZen');
      expect(sentPayload.body).toBe('You have a new message');
      expect(sentPayload.icon).toBe('/icon-192.png');
    });
  });

  describe('notifyNewMessage', () => {
    const mockRecipientUserId = 2;
    const mockMessage = {
      id: 'msg-123',
      username: 'sender1',
      text: 'Hello, this is a test message',
      timestamp: '2025-01-01T12:00:00Z',
    };

    it('should send notification with truncated text for long messages', async () => {
      const longMessage = {
        ...mockMessage,
        text: 'A'.repeat(150), // 150 characters
      };

      const mockSubscriptions = [
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint1',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
      ];

      dbPostgres.query.mockResolvedValueOnce({ rows: mockSubscriptions });
      webpush.sendNotification.mockResolvedValue();
      dbPostgres.query.mockResolvedValue({ rowCount: 1 });

      const result = await pushNotificationService.notifyNewMessage(
        mockRecipientUserId,
        longMessage
      );

      expect(result.sent).toBe(1);
      const sentPayload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
      expect(sentPayload.body).toHaveLength(103); // 100 chars + '...'
      expect(sentPayload.body).toContain('...');
      expect(sentPayload.title).toBe('New message from sender1');
    });

    it('should send notification with full text for short messages', async () => {
      const mockSubscriptions = [
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint1',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
      ];

      dbPostgres.query.mockResolvedValueOnce({ rows: mockSubscriptions });
      webpush.sendNotification.mockResolvedValue();
      dbPostgres.query.mockResolvedValue({ rowCount: 1 });

      const result = await pushNotificationService.notifyNewMessage(
        mockRecipientUserId,
        mockMessage
      );

      expect(result.sent).toBe(1);
      const sentPayload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
      expect(sentPayload.body).toBe(mockMessage.text);
      expect(sentPayload.title).toBe('New message from sender1');
      expect(sentPayload.data.messageId).toBe(mockMessage.id);
      expect(sentPayload.data.senderName).toBe(mockMessage.username);
    });

    it('should prefer displayName over username', async () => {
      const messageWithDisplayName = {
        id: 'msg-456',
        username: 'sender1',
        displayName: 'Sarah', // First name should be preferred
        text: 'Hello!',
        timestamp: '2025-01-01T12:00:00Z',
      };

      const mockSubscriptions = [
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint1',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
      ];

      dbPostgres.query.mockResolvedValueOnce({ rows: mockSubscriptions });
      webpush.sendNotification.mockResolvedValue();
      dbPostgres.query.mockResolvedValue({ rowCount: 1 });

      const result = await pushNotificationService.notifyNewMessage(
        mockRecipientUserId,
        messageWithDisplayName
      );

      expect(result.sent).toBe(1);
      const sentPayload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
      expect(sentPayload.title).toBe('New message from Sarah');
      expect(sentPayload.data.senderName).toBe('Sarah');
    });

    it('should handle missing message fields gracefully', async () => {
      const incompleteMessage = {
        id: 'msg-123',
        // Missing username and text
      };

      const mockSubscriptions = [
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint1',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
      ];

      dbPostgres.query.mockResolvedValueOnce({ rows: mockSubscriptions });
      webpush.sendNotification.mockResolvedValue();
      dbPostgres.query.mockResolvedValue({ rowCount: 1 });

      const result = await pushNotificationService.notifyNewMessage(
        mockRecipientUserId,
        incompleteMessage
      );

      expect(result.sent).toBe(1);
      const sentPayload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
      expect(sentPayload.title).toBe('New message from Co-parent');
      expect(sentPayload.body).toBe('You have a new message');
    });
  });
});
