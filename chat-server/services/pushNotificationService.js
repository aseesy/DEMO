/**
 * Push Notification Service
 *
 * Handles Web Push API notifications for PWA users.
 * Sends push notifications when users receive messages.
 *
 * Features:
 * - Saves push subscriptions to database
 * - Sends push notifications via web-push library
 * - Handles subscription management (save, delete, update)
 */

const webpush = require('web-push');
const dbPostgres = require('../dbPostgres');

// VAPID keys - should be in environment variables
// These are the same keys used in the frontend (usePWA.js)
// Generate new keys with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BNnD6XTZ6cpMVf3t6kq5Gjx2hJhx0FpR8BxPNxEwje3XuiVQNtIc6UnyFtGdWxQjiiPfRQ5QUkCxGPp5uG91gqs';
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'WU_mvOkJF60sCnFnZw8d9QVsOjublI1F__80D5UHsRw'; // Should be set as environment variable in production

// Set VAPID details
webpush.setVapidDetails('mailto:support@coparentliaizen.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

/**
 * Save a push subscription for a user
 * @param {number} userId - User ID
 * @param {object} subscription - Push subscription object from browser
 * @param {string} userAgent - User agent string (optional)
 * @returns {Promise<object>} Saved subscription
 */
async function saveSubscription(userId, subscription, userAgent = null) {
  try {
    const { endpoint, keys } = subscription;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      throw new Error('Invalid subscription: missing required fields');
    }

    // Check if subscription already exists (by endpoint)
    const existing = await dbPostgres.query(
      `SELECT id, user_id, is_active FROM push_subscriptions WHERE endpoint = $1`,
      [endpoint]
    );

    if (existing.rows.length > 0) {
      // Update existing subscription
      const result = await dbPostgres.query(
        `UPDATE push_subscriptions
         SET user_id = $1, p256dh = $2, auth = $3, user_agent = $4, 
             updated_at = CURRENT_TIMESTAMP, is_active = TRUE, last_used_at = CURRENT_TIMESTAMP
         WHERE endpoint = $5
         RETURNING *`,
        [userId, keys.p256dh, keys.auth, userAgent, endpoint]
      );
      console.log('[PushNotification] Updated existing subscription:', {
        userId,
        endpoint: endpoint.substring(0, 50) + '...',
      });
      return result.rows[0];
    } else {
      // Create new subscription
      const result = await dbPostgres.query(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         RETURNING *`,
        [userId, endpoint, keys.p256dh, keys.auth, userAgent]
      );
      console.log('[PushNotification] Created new subscription:', {
        userId,
        endpoint: endpoint.substring(0, 50) + '...',
      });
      return result.rows[0];
    }
  } catch (error) {
    console.error('[PushNotification] Error saving subscription:', error);
    throw error;
  }
}

/**
 * Delete a push subscription
 * @param {string} endpoint - Subscription endpoint URL
 * @returns {Promise<boolean>} Success status
 */
async function deleteSubscription(endpoint) {
  try {
    const result = await dbPostgres.query(
      `UPDATE push_subscriptions SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE endpoint = $1`,
      [endpoint]
    );
    console.log('[PushNotification] Deactivated subscription:', {
      endpoint: endpoint.substring(0, 50) + '...',
    });
    return result.rowCount > 0;
  } catch (error) {
    console.error('[PushNotification] Error deleting subscription:', error);
    throw error;
  }
}

/**
 * Get all active subscriptions for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of subscription objects
 */
async function getUserSubscriptions(userId) {
  try {
    const result = await dbPostgres.query(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions 
       WHERE user_id = $1 AND is_active = TRUE`,
      [userId]
    );

    return result.rows.map(row => ({
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth,
      },
    }));
  } catch (error) {
    console.error('[PushNotification] Error getting user subscriptions:', error);
    throw error;
  }
}

/**
 * Send a push notification to a user
 * @param {number} userId - User ID to send notification to
 * @param {object} payload - Notification payload
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body
 * @param {string} payload.icon - Icon URL (optional)
 * @param {object} payload.data - Additional data (optional)
 * @returns {Promise<{sent: number, failed: number}>} Send statistics
 */
async function sendNotificationToUser(userId, payload) {
  try {
    const subscriptions = await getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      console.log('[PushNotification] No active subscriptions for user:', userId);
      return { sent: 0, failed: 0 };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title || 'LiaiZen',
      body: payload.body || 'You have a new message',
      icon: payload.icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag: payload.tag || 'liaizen-message',
      requireInteraction: true, // Stay visible until user manually closes
      vibrate: [200, 100, 200],
      data: {
        url: payload.url || '/?view=chat',
        sender: payload.sender,
        timestamp: payload.timestamp || new Date().toISOString(),
        ...payload.data,
      },
    });

    let sent = 0;
    let failed = 0;

    // Send to all active subscriptions for this user
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(subscription, notificationPayload);
        sent++;

        // Update last_used_at
        await dbPostgres.query(
          `UPDATE push_subscriptions SET last_used_at = CURRENT_TIMESTAMP WHERE endpoint = $1`,
          [subscription.endpoint]
        );
      } catch (error) {
        failed++;
        console.error('[PushNotification] Failed to send to subscription:', {
          endpoint: subscription.endpoint.substring(0, 50) + '...',
          error: error.message,
        });

        // If subscription is invalid (410 Gone or 404 Not Found), deactivate it
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log('[PushNotification] Deactivating invalid subscription');
          await deleteSubscription(subscription.endpoint);
        }
      }
    }

    console.log('[PushNotification] Sent notifications:', { userId, sent, failed });
    return { sent, failed };
  } catch (error) {
    console.error('[PushNotification] Error sending notification:', error);
    throw error;
  }
}

/**
 * Send push notification when a message is received
 * @param {number} recipientUserId - User ID who received the message
 * @param {object} message - Message object
 * @param {string} message.username - Sender username
 * @param {string} message.text - Message text
 * @returns {Promise<{sent: number, failed: number}>} Send statistics
 */
async function notifyNewMessage(recipientUserId, message) {
  const truncatedText =
    (message.text || message.content || '').length > 100
      ? (message.text || message.content || '').substring(0, 100) + '...'
      : message.text || message.content || 'You have a new message';

  return sendNotificationToUser(recipientUserId, {
    title: `New message from ${message.username || 'Co-parent'}`,
    body: truncatedText,
    icon: '/icon-192.png',
    tag: `message-${message.id || Date.now()}`,
    sender: message.username,
    timestamp: message.timestamp || new Date().toISOString(),
    url: '/?view=chat',
    data: {
      messageId: message.id,
      username: message.username,
    },
  });
}

module.exports = {
  saveSubscription,
  deleteSubscription,
  getUserSubscriptions,
  sendNotificationToUser,
  notifyNewMessage,
  VAPID_PUBLIC_KEY, // Export for API endpoint
};
