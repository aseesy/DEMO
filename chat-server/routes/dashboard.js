/**
 * Dashboard Routes
 * @di-pattern: direct
 *
 * Handles dashboard updates and communication stats.
 * Extracted from server.js for better maintainability.
 */

const express = require('express');
const router = express.Router();

const dbSafe = require('../dbSafe');
const db = require('../dbPostgres');
const roomManager = require('../roomManager');
const communicationStats = require('../communicationStats');

/**
 * GET /api/dashboard/updates
 * Get dashboard updates (aggregated activity: expenses, agreements, invites)
 */
router.get('/updates', async (req, res) => {
  try {
    // Prefer email, but also accept username if it looks like an email
    let email = req.query.email;
    if (!email && req.query.username && req.query.username.includes('@')) {
      email = req.query.username;
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get user by email (email is now the primary identifier)
    const userResult = await dbSafe.safeSelect(
      'users',
      { email: email.toLowerCase() },
      { limit: 1 }
    );
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;
    const userEmail = users[0].email;

    // Get user's room to find co-parent
    const userRoom = await roomManager.getUserRoom(userId);
    if (!userRoom) {
      return res.json({ updates: [] });
    }

    // Get recent expenses (limit 3)
    let expenseUpdates = [];
    try {
      const expensesQuery = `
        SELECT e.*, u.email as requester_email, u.first_name, u.last_name, u.display_name
        FROM expenses e
        JOIN users u ON e.requested_by = u.id
        WHERE e.room_id IN (SELECT room_id FROM room_members WHERE user_id = $1)
        ORDER BY e.updated_at DESC
        LIMIT 3
      `;
      const expensesRes = await db.query(expensesQuery, [userId]);

      expenseUpdates = expensesRes.rows.map(exp => {
        const isMe = exp.requested_by === userId;
        const personName =
          exp.display_name ||
          (exp.first_name
            ? `${exp.first_name} ${exp.last_name || ''}`.trim()
            : exp.requester_email?.split('@')[0] || 'Unknown');
        let description = '';

        if (exp.status === 'pending') {
          description = isMe
            ? `You requested $${exp.amount} for ${exp.description}`
            : `${personName} requested $${exp.amount} for ${exp.description}`;
        } else if (exp.status === 'approved') {
          description = `Expense for ${exp.description} was approved`;
        } else if (exp.status === 'declined') {
          description = `Expense for ${exp.description} was declined`;
        }

        return {
          type: 'expense',
          description,
          timestamp: exp.updated_at,
          personName: isMe ? 'You' : personName,
          id: exp.id,
          status: exp.status,
        };
      });
    } catch (err) {
      console.warn('Could not get expenses:', err.message);
    }

    // Get recent agreements (limit 3)
    let agreementUpdates = [];
    try {
      const agreementsQuery = `
        SELECT a.*, u.email as proposer_email, u.first_name, u.last_name, u.display_name
        FROM agreements a
        JOIN users u ON a.proposed_by = u.id
        WHERE a.room_id IN (SELECT room_id FROM room_members WHERE user_id = $1)
        ORDER BY a.updated_at DESC
        LIMIT 3
      `;
      const agreementsRes = await db.query(agreementsQuery, [userId]);

      agreementUpdates = agreementsRes.rows.map(agr => {
        const isMe = agr.proposed_by === userId;
        const personName =
          agr.display_name ||
          (agr.first_name
            ? `${agr.first_name} ${agr.last_name || ''}`.trim()
            : agr.proposer_email?.split('@')[0] || 'Unknown');
        let description = '';

        if (agr.status === 'proposed') {
          description = isMe
            ? `You proposed: ${agr.title}`
            : `${personName} proposed: ${agr.title}`;
        } else if (agr.status === 'agreed') {
          description = `Agreement reached: ${agr.title}`;
        } else if (agr.status === 'rejected') {
          description = `Agreement declined: ${agr.title}`;
        }

        return {
          type: 'agreement',
          description,
          timestamp: agr.updated_at,
          personName: isMe ? 'You' : personName,
          id: agr.id,
          status: agr.status,
        };
      });
    } catch (err) {
      console.warn('Could not fetch agreements:', err.message);
    }

    // Aggregate all updates
    const allUpdates = [...expenseUpdates, ...agreementUpdates];

    // Sort by timestamp (newest first)
    allUpdates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit to top 15
    const limitedUpdates = allUpdates.slice(0, 15);

    res.json({ updates: limitedUpdates });
  } catch (error) {
    console.error('Error getting dashboard updates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/communication-stats
 * Get communication stats for a user
 */
router.get('/communication-stats', async (req, res) => {
  try {
    // Prefer email, but also accept username if it looks like an email
    let email = req.query.email;
    if (!email && req.query.username && req.query.username.includes('@')) {
      email = req.query.username;
    }

    console.log('[dashboard] /communication-stats called:', {
      email: email,
      queryEmail: req.query.email,
      queryUsername: req.query.username,
      allQueryParams: req.query,
    });

    if (!email) {
      console.warn('[dashboard] /communication-stats: Email is required');
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get user ID by email (email is now the primary identifier)
    let userResult;
    try {
      userResult = await dbSafe.safeSelect('users', { email: email.toLowerCase() }, { limit: 1 });
    } catch (dbError) {
      console.error(
        '[dashboard] /communication-stats: Database error during user lookup:',
        dbError
      );
      throw dbError;
    }

    const users = dbSafe.parseResult(userResult);

    console.log('[dashboard] /communication-stats: User lookup result:', {
      email: email.toLowerCase(),
      found: users.length > 0,
      userId: users.length > 0 ? users[0].id : null,
    });

    if (users.length === 0) {
      console.warn(
        '[dashboard] /communication-stats: User not found for email:',
        email.toLowerCase()
      );
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Get aggregated stats across all rooms
    let stats;
    try {
      stats = await communicationStats.getUserStats(userId);
    } catch (statsError) {
      console.error('[dashboard] /communication-stats: Error getting stats:', statsError, {
        userId,
        errorMessage: statsError.message,
        errorStack: statsError.stack,
      });
      throw statsError;
    }

    console.log('[dashboard] /communication-stats: Stats retrieved:', {
      userId,
      stats: stats,
    });

    res.json({
      success: true,
      stats: stats,
    });
  } catch (error) {
    console.error('[dashboard] Error getting communication stats:', error, {
      message: error.message,
      stack: error.stack,
      query: req.query,
      errorName: error.name,
      errorType: error.constructor.name,
    });

    // If error message contains "Username is required", it's coming from a service that still expects username
    // Convert it to a more helpful error message
    let errorMessage = error.message;
    if (errorMessage && errorMessage.includes('Username is required')) {
      console.error(
        '[dashboard] /communication-stats: ERROR - Service is throwing "Username is required"',
        {
          errorStack: error.stack,
          query: req.query,
        }
      );
      errorMessage = 'Email is required. Please ensure you are passing the email parameter.';
    }

    const statusCode = error.message && error.message.includes('Username is required') ? 400 : 500;
    res.status(statusCode).json({ error: errorMessage });
  }
});

module.exports = router;
