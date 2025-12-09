/**
 * Invitations Routes
 *
 * Handles invitation management including validation, acceptance, and creation.
 * Extracted from server.js for better maintainability.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const auth = require('../auth');
const dbSafe = require('../dbSafe');
const db = require('../dbPostgres');
const emailService = require('../emailService');
const invitationManager = require('../libs/invitation-manager');
const pairingManager = require('../libs/pairing-manager');
const { verifyAuth, optionalAuth, generateToken, setAuthCookie, JWT_SECRET } = require('../middleware/auth');

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * GET /api/invitations/validate/:token
 * Validate an invitation token (tries both invitations and pairing_sessions tables)
 */
router.get('/validate/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Try invitations table first (old system)
    let validation = await invitationManager.validateToken(token, db);

    // If not found in invitations, try pairing_sessions table (new system)
    if (!validation.valid && validation.code === 'INVALID_TOKEN') {
      console.log('Token not found in invitations table, trying pairing_sessions...');
      const pairingValidation = await pairingManager.validateToken(token, db);

      if (pairingValidation.valid) {
        // Convert pairing response to invitation response format
        const inviterEmail = pairingValidation.initiatorEmail || pairingValidation.pairing?.initiator_email || '';
        const inviterEmailDomain = inviterEmail ? inviterEmail.split('@')[1] || '' : '';

        return res.json({
          valid: true,
          inviterName: pairingValidation.initiatorName || pairingValidation.pairing?.invited_by_username,
          inviterEmail,
          inviterEmailDomain,
          inviteeEmail: pairingValidation.pairing?.parent_b_email,
          expiresAt: pairingValidation.pairing?.expires_at,
          // Flag to indicate this is from pairing system
          isPairing: true,
          pairingId: pairingValidation.pairing?.id,
        });
      }

      // Return the pairing validation error if it has a different code
      if (pairingValidation.code !== 'INVALID_TOKEN') {
        return res.status(400).json({
          valid: false,
          error: pairingValidation.error,
          code: pairingValidation.code
        });
      }
    }

    if (!validation.valid) {
      return res.status(400).json({
        valid: false,
        error: validation.error,
        code: validation.code
      });
    }

    // Get inviter email domain for display
    const inviterEmailDomain = validation.inviterEmail ? validation.inviterEmail.split('@')[1] || '' : '';

    res.json({
      valid: true,
      inviterName: validation.inviterName,
      inviterEmail: validation.inviterEmail,
      inviterEmailDomain,
      inviteeEmail: validation.invitation.invitee_email,
      expiresAt: validation.invitation.expires_at
    });

  } catch (error) {
    console.error('Validate invitation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/invitations/accept
 * Accept an invitation (for existing users)
 * Requires authentication
 */
router.post('/accept', verifyAuth, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.userId;

    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }

    const result = await auth.acceptCoParentInvitation(token, userId, db);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Accept invitation error:', error);

    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('limit reached')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/invitations/decline
 * Decline an invitation (for existing users)
 * Requires authentication
 */
router.post('/decline', verifyAuth, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.userId;

    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }

    const result = await auth.declineCoParentInvitation(token, userId, db);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Decline invitation error:', error);

    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/invitations
 * Get user's sent and received invitations
 * Requires authentication
 */
router.get('/', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { status } = req.query;

    const invitations = await invitationManager.getUserInvitations(userId, db, {
      status: status || null
    });

    res.json(invitations);

  } catch (error) {
    console.error('Get invitations error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/invitations/resend/:id
 * Resend an invitation (generates new token)
 * Requires authentication
 */
router.post('/resend/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await invitationManager.resendInvitation(parseInt(id, 10), userId, db);

    // Get invitation details for email
    const invitation = await invitationManager.getInvitationById(parseInt(id, 10), db);

    // Send new invitation email
    if (invitation && !invitation.invitee_id) {
      try {
        const inviteUrl = `${process.env.APP_URL || 'https://coparentliaizen.com'}/accept-invite?token=${result.token}`;
        await emailService.sendNewUserInvite(
          invitation.invitee_email,
          invitation.inviter_name || 'Your co-parent',
          inviteUrl,
          'LiaiZen'
        );
        console.log(`✅ Invitation email resent to: ${invitation.invitee_email}`);
      } catch (emailError) {
        console.error('Error resending invitation email:', emailError);
      }
    }

    res.json({
      success: true,
      invitation: result.invitation,
      expiresAt: result.invitation.expires_at
    });

  } catch (error) {
    console.error('Resend invitation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/invitations/:id
 * Cancel an invitation
 * Requires authentication
 */
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await invitationManager.cancelInvitation(parseInt(id, 10), userId, db);

    res.json({
      success: true,
      message: 'Invitation cancelled'
    });

  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/invitations/create
 * Create a new invitation and get shareable link + short code
 * User can share these themselves (SMS, WhatsApp, email, etc.)
 * Requires authentication
 */
router.post('/create', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { inviteeEmail } = req.body;

    // Email is optional for creating an invitation
    // If not provided, we create a generic invite that anyone can use
    const result = await invitationManager.createInvitation({
      inviterId: userId,
      inviteeEmail: inviteeEmail || `pending-${Date.now()}@placeholder.local`,
    }, db);

    const frontendUrl = process.env.APP_URL || 'https://coparentliaizen.com';
    const inviteUrl = `${frontendUrl}/accept-invite?token=${result.token}`;

    // Get inviter name for the shareable message
    const inviterResult = await db.query('SELECT username, email, first_name, last_name, display_name FROM users WHERE id = $1', [userId]);
    const inviterUser = inviterResult.rows[0];
    const inviterName = inviterUser?.display_name ||
      (inviterUser?.first_name ? `${inviterUser.first_name} ${inviterUser.last_name || ''}`.trim() : null) ||
      inviterUser?.username ||
      'Your co-parent';

    // Send email if address was provided
    let emailSent = false;
    if (inviteeEmail && inviteeEmail.includes('@')) {
      try {
        await emailService.sendNewUserInvite(
          inviteeEmail,
          inviterName,
          result.token, // Pass token directly, emailService constructs URL
          'LiaiZen'
        );
        emailSent = true;
        console.log(`✅ Invitation email sent to: ${inviteeEmail}`);
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't fail the request, just note that email failed
      }
    }

    res.json({
      success: true,
      inviteUrl,
      shortCode: result.shortCode,
      token: result.token,
      expiresAt: result.invitation.expires_at,
      invitationId: result.invitation.id,
      emailSent,
      // Pre-built shareable message
      shareableMessage: `Hi! I'm using LiaiZen to help us communicate better for our kids. Join me using this link: ${inviteUrl}\n\nOr if you already have an account, use invite code: ${result.shortCode}`,
      inviterName,
    });

  } catch (error) {
    console.error('Create invitation error:', error);

    if (error.message.includes('limit reached')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/invitations/validate-code/:code
 * Validate a short invite code (e.g., LZ-ABC123)
 * Tries both invitations table and pairing_sessions table for compatibility
 */
router.get('/validate-code/:code', async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // Try invitations table first (old system)
    let validation = await invitationManager.validateByShortCode(code, db);

    // If not found in invitations, try pairing_sessions table (new system)
    if (!validation.valid && validation.code === 'INVALID_CODE') {
      console.log('Code not found in invitations table, trying pairing_sessions...');
      const pairingValidation = await pairingManager.validateCode(code, db);

      if (pairingValidation.valid) {
        // Convert pairing response to invitation response format
        const inviterEmail = pairingValidation.initiatorEmail || pairingValidation.pairing?.initiator_email || '';
        const inviterEmailDomain = inviterEmail ? inviterEmail.split('@')[1] || '' : '';

        return res.json({
          valid: true,
          inviterName: pairingValidation.initiatorName || pairingValidation.pairing?.invited_by_username,
          inviterEmail,
          inviterEmailDomain,
          inviteeEmail: pairingValidation.pairing?.parent_b_email,
          expiresAt: pairingValidation.pairing?.expires_at,
          // Flag to indicate this is from pairing system
          isPairing: true,
          pairingId: pairingValidation.pairing?.id,
        });
      }

      // Return the pairing validation error if it has a different code
      if (pairingValidation.code !== 'INVALID_CODE') {
        return res.status(400).json({
          valid: false,
          error: pairingValidation.error,
          code: pairingValidation.code
        });
      }
    }

    if (!validation.valid) {
      return res.status(400).json({
        valid: false,
        error: validation.error,
        code: validation.code
      });
    }

    // Get inviter email domain for display
    const inviterEmailDomain = validation.inviterEmail ? validation.inviterEmail.split('@')[1] || '' : '';

    res.json({
      valid: true,
      inviterName: validation.inviterName,
      inviterEmail: validation.inviterEmail,
      inviterEmailDomain,
      inviteeEmail: validation.invitation.invitee_email,
      expiresAt: validation.invitation.expires_at
    });

  } catch (error) {
    console.error('Validate short code error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/invitations/accept-code
 * Accept an invitation by short code (for existing users)
 * Requires authentication
 */
router.post('/accept-code', verifyAuth, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;

    if (!code) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const result = await invitationManager.acceptByShortCode(code, userId, db);

    // Create shared room if not exists
    let sharedRoom = null;
    if (result.roomId) {
      sharedRoom = { id: result.roomId };
    } else {
      // Create a new shared room for the co-parents
      const roomId = `room_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      await db.query(
        'INSERT INTO rooms (id, name, created_by, is_private) VALUES ($1, $2, $3, 1)',
        [roomId, 'Co-Parent Chat', result.inviterId]
      );

      // Add both users as members
      await db.query(
        'INSERT INTO room_members (room_id, user_id, role) VALUES ($1, $2, $3), ($1, $4, $3)',
        [roomId, result.inviterId, 'coparent', userId]
      );

      sharedRoom = { id: roomId, name: 'Co-Parent Chat' };
    }

    res.json({
      success: true,
      invitation: result.invitation,
      sharedRoom
    });

  } catch (error) {
    console.error('Accept by short code error:', error);

    if (error.message.includes('limit reached')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/invitations/my-invite
 * Get the current user's active outgoing invitation (if any)
 * Requires authentication
 */
router.get('/my-invite', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's active pending invitation
    const result = await db.query(
      `SELECT i.*, u.username as invitee_name, u.email as invitee_email_user
       FROM invitations i
       LEFT JOIN users u ON i.invitee_id = u.id
       WHERE i.inviter_id = $1 AND i.status = 'pending'
       ORDER BY i.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ hasInvite: false });
    }

    const invitation = result.rows[0];
    const frontendUrl = process.env.APP_URL || 'https://coparentliaizen.com';

    res.json({
      hasInvite: true,
      invitation: {
        id: invitation.id,
        shortCode: invitation.short_code,
        inviteeEmail: invitation.invitee_email,
        status: invitation.status,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at,
      },
      inviteUrl: `${frontendUrl}/accept-invite?token=${invitation.token_hash}`, // Note: this won't work - need actual token
    });

  } catch (error) {
    console.error('Get my invite error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
