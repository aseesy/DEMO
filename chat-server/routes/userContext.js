/**
 * User Context Routes
 * @di-pattern: direct
 *
 * Provides user context data for AI analysis.
 */

const express = require('express');
const userContext = require('../userContext');

const { defaultLogger: defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'userContext',
});

const router = express.Router();

// Get user context
router.get('/', async (req, res) => {
  const username = req.query.user;
  if (!username) {
    return res.status(400).json({ error: 'user query param required' });
  }
  try {
    // userContext.getUserContext expects username (TEXT in PostgreSQL)
    const context = await userContext.getUserContext(username);
    if (!context) {
      return res.json({
        userId: username,
        co_parent: null,
        children: [],
        contacts: [],
      });
    }
    res.json({
      userId: context.username,
      co_parent: context.co_parent,
      children: context.children || [],
      contacts: context.contacts || [],
    });
  } catch (err) {
    logger.error('Error getting user context', {
      err: err,
    });
    // Make sure we always return JSON, not HTML
    res.status(500).json({
      error: 'internal server error',
      message: err.message,
    });
  }
});

// Create or update user context
router.post('/', async (req, res) => {
  const { userId, co_parent, children, contacts } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    await userContext.setUserContext(userId, {
      co_parent,
      children,
      contacts,
    });
    res.json({ success: true });
  } catch (err) {
    logger.error('Error upserting user context', {
      err: err,
    });
    res.status(500).json({ error: 'internal server error' });
  }
});

module.exports = router;
