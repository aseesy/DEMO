/**
 * Push Notifications API Routes
 *
 * Handles Web Push API subscription management for PWA users.
 */

const express = require('express');
const router = express.Router();
const pushNotificationService = require('../services/pushNotificationService');
const { verifyAuth } = require('../middleware/auth');

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
    console.error('[PushNotifications] Error saving subscription:', error);
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
    console.error('[PushNotifications] Error deleting subscription:', error);
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

module.exports = router;
