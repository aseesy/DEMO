/**
 * Push Notifications API Routes Integration Tests
 *
 * Tests the push notification API endpoints to ensure proper
 * request/response handling and authentication.
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');

// Mock dependencies
jest.mock('../../services/pushNotificationService', () => ({
  saveSubscription: jest.fn(),
  deleteSubscription: jest.fn(),
  getUserSubscriptions: jest.fn(),
  sendNotificationToUser: jest.fn(),
  notifyNewMessage: jest.fn(),
  VAPID_PUBLIC_KEY: 'test-public-key',
}));

jest.mock('../../middleware/auth', () => ({
  verifyAuth: (req, res, next) => {
    // Mock authentication - set user if Authorization header is present
    if (req.headers.authorization === 'Bearer valid-token') {
      req.user = { id: 1, username: 'testuser' };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
  },
}));

const pushNotificationService = require('../../services/pushNotificationService');
const pushNotificationsRoutes = require('../../routes/pushNotifications');

describe('Push Notifications Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Mount routes
    app.use('/api/push', pushNotificationsRoutes);
  });

  describe('POST /api/push/subscribe', () => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key',
      },
    };

    it('should save subscription successfully for authenticated user', async () => {
      const mockSavedSubscription = {
        id: 1,
        user_id: 1,
        endpoint: mockSubscription.endpoint,
        is_active: true,
      };

      pushNotificationService.saveSubscription.mockResolvedValueOnce(mockSavedSubscription);

      const response = await request(app)
        .post('/api/push/subscribe')
        .set('Authorization', 'Bearer valid-token')
        .send({
          subscription: mockSubscription,
          userAgent: 'Mozilla/5.0 Test Browser',
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        subscription: mockSavedSubscription,
      });
      expect(pushNotificationService.saveSubscription).toHaveBeenCalledWith(
        1, // userId from req.user
        mockSubscription,
        'Mozilla/5.0 Test Browser'
      );
    });

    it('should use user-agent from headers if not provided in body', async () => {
      const mockSavedSubscription = {
        id: 1,
        user_id: 1,
        endpoint: mockSubscription.endpoint,
        is_active: true,
      };

      pushNotificationService.saveSubscription.mockResolvedValueOnce(mockSavedSubscription);

      await request(app)
        .post('/api/push/subscribe')
        .set('Authorization', 'Bearer valid-token')
        .set('User-Agent', 'Mozilla/5.0 Header Browser')
        .send({
          subscription: mockSubscription,
        })
        .expect(200);

      expect(pushNotificationService.saveSubscription).toHaveBeenCalledWith(
        1,
        mockSubscription,
        'Mozilla/5.0 Header Browser'
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      const response = await request(app)
        .post('/api/push/subscribe')
        .send({
          subscription: mockSubscription,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(pushNotificationService.saveSubscription).not.toHaveBeenCalled();
    });

    it('should return 400 if subscription is missing', async () => {
      const response = await request(app)
        .post('/api/push/subscribe')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid subscription data' });
      expect(pushNotificationService.saveSubscription).not.toHaveBeenCalled();
    });

    it('should return 400 if subscription.endpoint is missing', async () => {
      const invalidSubscription = {
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key',
        },
      };

      const response = await request(app)
        .post('/api/push/subscribe')
        .set('Authorization', 'Bearer valid-token')
        .send({
          subscription: invalidSubscription,
        })
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid subscription data' });
    });

    it('should return 400 if subscription.keys is missing', async () => {
      const invalidSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
      };

      const response = await request(app)
        .post('/api/push/subscribe')
        .set('Authorization', 'Bearer valid-token')
        .send({
          subscription: invalidSubscription,
        })
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid subscription data' });
    });

    it('should return 500 if service throws error', async () => {
      pushNotificationService.saveSubscription.mockRejectedValueOnce(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/push/subscribe')
        .set('Authorization', 'Bearer valid-token')
        .send({
          subscription: mockSubscription,
        })
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to save subscription' });
    });
  });

  describe('DELETE /api/push/unsubscribe', () => {
    const mockEndpoint = 'https://fcm.googleapis.com/fcm/send/test-endpoint';

    it('should delete subscription successfully', async () => {
      pushNotificationService.deleteSubscription.mockResolvedValueOnce(true);

      const response = await request(app)
        .delete('/api/push/unsubscribe')
        .send({
          endpoint: mockEndpoint,
        })
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(pushNotificationService.deleteSubscription).toHaveBeenCalledWith(mockEndpoint);
    });

    it('should return 400 if endpoint is missing', async () => {
      const response = await request(app)
        .delete('/api/push/unsubscribe')
        .send({})
        .expect(400);

      expect(response.body).toEqual({ error: 'Endpoint required' });
      expect(pushNotificationService.deleteSubscription).not.toHaveBeenCalled();
    });

    it('should return 500 if service throws error', async () => {
      pushNotificationService.deleteSubscription.mockRejectedValueOnce(
        new Error('Database error')
      );

      const response = await request(app)
        .delete('/api/push/unsubscribe')
        .send({
          endpoint: mockEndpoint,
        })
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to delete subscription' });
    });
  });

  describe('GET /api/push/vapid-key', () => {
    it('should return VAPID public key', async () => {
      const response = await request(app).get('/api/push/vapid-key').expect(200);

      expect(response.body).toEqual({
        publicKey: 'test-public-key',
      });
    });

    it('should not require authentication', async () => {
      await request(app).get('/api/push/vapid-key').expect(200);
    });
  });
});

