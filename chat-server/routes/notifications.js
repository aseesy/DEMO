/**
 * Notifications Routes
 *
 * Handles in-app notification management.
 * Extracted from server.js for better maintainability.
 */

const express = require('express');
const router = express.Router();

const dbSafe = require('../dbSafe');
const db = require('../dbPostgres');
const { verifyAuth, optionalAuth } = require('../middleware/auth');

/**
 * GET /api/notifications
 * Get all notifications for authenticated user
 */
router.get('/', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const notifications = await dbSafe.safeSelect(
      'in_app_notifications',
      { user_id: userId },
      {
        orderBy: 'created_at',
        orderDirection: 'DESC',
        limit: 50,
      }
    );

    res.json({ notifications });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ count: 0 });
    }

    const userId = req.user.userId || req.user.id;

    const unreadNotifications = await dbSafe.safeSelect('in_app_notifications', {
      user_id: userId,
      read: false,
    });

    res.json({ count: unreadNotifications.length });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    await dbSafe.safeUpdate(
      'in_app_notifications',
      { read: true },
      {
        id: parseInt(id),
        user_id: userId,
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.post('/mark-all-read', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    await dbSafe.safeUpdate('in_app_notifications', { read: true }, { user_id: userId });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/:id/action
 * Handle notification action (accept/decline invitation, etc.)
 */
router.post('/:id/action', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const userId = req.user.userId || req.user.id;

    // Get notification
    const notificationResult = await dbSafe.safeSelect(
      'in_app_notifications',
      {
        id: parseInt(id),
        user_id: userId,
      },
      { limit: 1 }
    );
    const notifications = dbSafe.parseResult(notificationResult);

    if (notifications.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = notifications[0];

    // Mark as read
    await dbSafe.safeUpdate('in_app_notifications', { read: true }, { id: parseInt(id) });

    res.json({
      success: true,
      message: `Action '${action}' handled for notification`,
    });
  } catch (error) {
    console.error('Error handling notification action:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
