/**
 * Pairing Routes
 *
 * Handles pairing session management for co-parent connections.
 * Supports email, link, and code-based pairing.
 * Extracted from server.js for better maintainability.
 */

const express = require('express');
const router = express.Router();

const dbSafe = require('../dbSafe');
const db = require('../dbPostgres');
const pairingManager = require('../libs/pairing-manager');
const { verifyAuth } = require('../middleware/auth');

// Helper references - set from server.js
let roomManager;

router.setHelpers = function(helpers) {
  roomManager = helpers.roomManager;
};

/**
 * POST /api/pairing/create
 * Create a new pairing invitation
 * Requires authentication
 */
router.post('/create', verifyAuth, async (req, res) => {
  try {
    const { type, inviteeEmail } = req.body;
    const userId = req.user.userId;

    if (!type || !['email', 'link', 'code'].includes(type)) {
      return res.status(400).json({ error: 'Invalid invitation type. Must be email, link, or code.' });
    }

    // Get user info
    const userResult = await db.query('SELECT username, email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    // Check for mutual invitation if email type
    if (type === 'email' && inviteeEmail) {
      const mutualResult = await pairingManager.detectAndCompleteMutual({
        initiatorId: userId,
        initiatorEmail: user.email,
        inviteeEmail: inviteeEmail,
      }, db, roomManager);

      if (mutualResult) {
        // Mutual invitation detected and auto-completed!
        return res.json({
          success: true,
          mutual: true,
          message: 'Mutual invitation detected! You are now paired.',
          pairing: mutualResult.pairing,
          sharedRoomId: mutualResult.sharedRoomId,
        });
      }
    }

    let result;
    switch (type) {
      case 'email':
        if (!inviteeEmail) {
          return res.status(400).json({ error: 'inviteeEmail is required for email invitations' });
        }
        result = await pairingManager.createEmailPairing({
          initiatorId: userId,
          inviteeEmail,
          initiatorUsername: user.username,
        }, db);
        break;

      case 'link':
        result = await pairingManager.createLinkPairing({
          initiatorId: userId,
          initiatorUsername: user.username,
        }, db);
        break;

      case 'code':
        result = await pairingManager.createCodePairing({
          initiatorId: userId,
          initiatorUsername: user.username,
        }, db);
        break;
    }

    res.json({
      success: true,
      pairingCode: result.pairingCode,
      token: result.token, // Only present for email/link types
      expiresAt: result.expiresAt,
      inviteType: type,
    });

  } catch (error) {
    console.error('Create pairing error:', error);
    if (error.message.includes('already have an active')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pairing/status
 * Get current user's pairing status
 * Requires authentication
 */
router.get('/status', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const status = await pairingManager.getPairingStatus(userId, db);
    res.json(status);
  } catch (error) {
    console.error('Get pairing status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pairing/validate/:code
 * Validate a pairing code (public endpoint for checking before login/signup)
 */
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pairingManager.validateCode(code, db);

    if (!result.valid) {
      return res.status(400).json({
        valid: false,
        error: result.error,
        code: result.code,
      });
    }

    // Get inviter email domain for display
    const inviterEmail = result.initiatorEmail || result.pairing.initiator_email || '';
    const inviterEmailDomain = inviterEmail.split('@')[1] || '';

    res.json({
      valid: true,
      inviterName: result.initiatorName || result.pairing.invited_by_username || result.pairing.initiator_username,
      inviterUsername: result.pairing.invited_by_username || result.pairing.initiator_username,
      inviterEmailDomain,
      inviteType: result.pairing.invite_type,
      expiresAt: result.pairing.expires_at,
    });
  } catch (error) {
    console.error('Validate code error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pairing/validate-token/:token
 * Validate a pairing token (for email/link invitations)
 */
router.get('/validate-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await pairingManager.validateToken(token, db);

    if (!result.valid) {
      return res.status(400).json({
        valid: false,
        error: result.error,
        code: result.code,
      });
    }

    // Get inviter email domain for display
    const inviterEmail = result.initiatorEmail || result.pairing.initiator_email || '';
    const inviterEmailDomain = inviterEmail.split('@')[1] || '';

    res.json({
      valid: true,
      inviterName: result.initiatorName || result.pairing.invited_by_username || result.pairing.initiator_username,
      inviterUsername: result.pairing.invited_by_username || result.pairing.initiator_username,
      inviterEmailDomain,
      inviteType: result.pairing.invite_type,
      expiresAt: result.pairing.expires_at,
    });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/pairing/accept
 * Accept a pairing invitation
 * Body: { code?: string, token?: string }
 * Requires authentication
 */
router.post('/accept', verifyAuth, async (req, res) => {
  try {
    const { code, token } = req.body;
    const userId = req.user.userId;

    if (!code && !token) {
      return res.status(400).json({ error: 'Either code or token is required' });
    }

    let result;
    if (code) {
      result = await pairingManager.acceptByCode(code, userId, db, roomManager);
    } else {
      result = await pairingManager.acceptByToken(token, userId, db, roomManager);
    }

    res.json({
      success: true,
      message: 'Pairing accepted! You are now connected with your co-parent.',
      pairing: result.pairing,
      sharedRoomId: result.sharedRoomId,
      partnerId: result.initiatorId,
    });

  } catch (error) {
    console.error('Accept pairing error:', error);
    if (error.message.includes('not found') || error.message.includes('expired')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('cannot accept your own')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/pairing/decline/:id
 * Decline a pairing invitation
 * Requires authentication
 */
router.post('/decline/:id', verifyAuth, async (req, res) => {
  try {
    const pairingId = parseInt(req.params.id);
    const userId = req.user.userId;

    const result = await pairingManager.declinePairing(pairingId, userId, db);

    res.json({
      success: true,
      message: 'Pairing invitation declined.',
    });

  } catch (error) {
    console.error('Decline pairing error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/pairing/:id
 * Cancel a pending pairing (initiator only)
 * Requires authentication
 */
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const pairingId = parseInt(req.params.id);
    const userId = req.user.userId;

    await pairingManager.cancelPairing(pairingId, userId, db);

    res.json({
      success: true,
      message: 'Pairing invitation cancelled.',
    });

  } catch (error) {
    console.error('Cancel pairing error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/pairing/resend/:id
 * Resend a pairing invitation (generates new token/expiration)
 * Requires authentication
 */
router.post('/resend/:id', verifyAuth, async (req, res) => {
  try {
    const pairingId = parseInt(req.params.id);
    const userId = req.user.userId;

    const result = await pairingManager.resendPairing(pairingId, userId, db);

    res.json({
      success: true,
      message: 'Invitation resent with new expiration.',
      token: result.token,
      expiresAt: result.expiresAt,
    });

  } catch (error) {
    console.error('Resend pairing error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
