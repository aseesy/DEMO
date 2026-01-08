/**
 * Push Notifications API Routes
 * @di-pattern: direct
 *
 * Handles Web Push API subscription management for PWA users.
 */

const express = require('express');
const router = express.Router();
const pushNotificationService = require('../services/pushNotificationService');
const { verifyAuth } = require('../middleware/auth');

const { defaultLogger: defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'pushNotifications',
});

/**
 * POST /api/push/subscribe
 * Save a push subscription for the authenticated user
 */
router.post('/subscribe', verifyAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { subscription, userAgent } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    const saved = await pushNotificationService.saveSubscription(
      userId,
      subscription,
      userAgent || req.headers['user-agent']
    );

    res.json({ success: true, subscription: saved });
  } catch (error) {
    logger.error('[PushNotifications] Error saving subscription', {
      error: error,
    });
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

/**
 * DELETE /api/push/unsubscribe
 * Remove a push subscription
 */
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint required' });
    }

    await pushNotificationService.deleteSubscription(endpoint);

    res.json({ success: true });
  } catch (error) {
    logger.error('[PushNotifications] Error deleting subscription', {
      error: error,
    });
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

/**
 * GET /api/push/vapid-key
 * Get the VAPID public key for client-side subscription
 */
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: pushNotificationService.VAPID_PUBLIC_KEY });
});

/**
 * GET /api/push/status
 * Get push notification subscription status for the authenticated user
 * Used for debugging subscription issues
 */
router.get('/status', verifyAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscriptions = await pushNotificationService.getUserSubscriptions(userId);

    res.json({
      success: true,
      userId,
      subscriptionCount: subscriptions.length,
      subscriptions: subscriptions.map(sub => ({
        endpoint: sub.endpoint.substring(0, 50) + '...',
        hasKeys: !!(sub.keys && sub.keys.p256dh && sub.keys.auth),
      })),
      message:
        subscriptions.length > 0
          ? `You have ${subscriptions.length} active subscription(s)`
          : 'No active subscriptions found. Please subscribe to push notifications in PWA settings.',
    });
  } catch (error) {
    logger.error('[PushNotifications] Error getting subscription status', {
      error: error,
    });
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

/**
 * POST /api/push/test
 * Send a test push notification to the authenticated user
 * Used for debugging push notification delivery
 */
router.post('/test', verifyAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    logger.debug('[PushNotifications] Sending test notification to user', {
      userId: userId,
    });

    const result = await pushNotificationService.sendNotificationToUser(userId, {
      title: 'LiaiZen Test',
      body: 'This is a test notification. If you see this, push notifications are working!',
      tag: 'test-notification',
      url: '/?view=dashboard',
    });

    logger.debug('[PushNotifications] Test notification result', {
      result: result,
    });

    res.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      message:
        result.sent > 0
          ? 'Test notification sent successfully!'
          : 'No active subscriptions found or all failed',
    });
  } catch (error) {
    logger.error('[PushNotifications] Error sending test notification', {
      error: error,
    });
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

module.exports = router;
