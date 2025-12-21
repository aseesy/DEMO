/**
 * Invitations Routes
 *
 * Handles invitation management including validation, acceptance, and creation.
 * Business logic delegated to services layer.
 *
 * Actor: Product/UX
 */

const express = require('express');
const router = express.Router();

const auth = require('../auth');
const { verifyAuth } = require('../middleware/auth');
const { handleServiceError } = require('../middleware/errorHandlers');
const { invitationService, invitationEmailService } = require('../src/services');

// ============================================
// Validation Endpoints
// ============================================

/**
 * GET /api/invitations/validate/:token
 * Validate an invitation token (tries both invitations and pairing_sessions tables)
 */
router.get('/validate/:token', async (req, res) => {
  try {
    const result = await invitationService.validateToken(req.params.token);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * GET /api/invitations/validate-code/:code
 * Validate a short invite code (e.g., LZ-ABC123)
 */
router.get('/validate-code/:code', async (req, res) => {
  try {
    const result = await invitationService.validateCode(req.params.code);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// ============================================
// Invitation Management Endpoints
// ============================================

/**
 * GET /api/invitations
 * Get user's sent and received invitations
 */
router.get('/', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { status } = req.query;

    const invitations = await invitationService.getUserInvitations(userId, {
      status: status || null,
    });

    res.json(invitations);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * GET /api/invitations/my-invite
 * Get the current user's active outgoing invitation
 */
router.get('/my-invite', verifyAuth, async (req, res) => {
  try {
    const result = await invitationService.getActiveInvitation(req.user.userId);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * POST /api/invitations/create
 * Create a new invitation and get shareable link + short code
 */
router.post('/create', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { inviteeEmail } = req.body;

    const result = await invitationService.createInvitation(userId, inviteeEmail);

    // Send email if address was provided
    let emailSent = false;
    if (inviteeEmail && inviteeEmail.includes('@')) {
      const emailResult = await invitationEmailService.sendNewUserInvite({
        inviteeEmail,
        inviterName: result.inviterName,
        token: result.token,
      });
      emailSent = emailResult.emailSent;
    }

    res.json({
      ...result,
      emailSent,
    });
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * POST /api/invitations/resend/:id
 * Resend an invitation (generates new token)
 */
router.post('/resend/:id', verifyAuth, async (req, res) => {
  try {
    const invitationId = parseInt(req.params.id, 10);
    const userId = req.user.userId;

    const result = await invitationService.resendInvitation(invitationId, userId);

    // Send new invitation email if there's an invitee email
    if (result.inviteeEmail && !result.inviteeEmail.includes('placeholder')) {
      await invitationEmailService.resendInvitationEmail({
        inviteeEmail: result.inviteeEmail,
        inviterName: result.inviterName,
        token: result.token,
      });
    }

    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * DELETE /api/invitations/:id
 * Cancel an invitation
 */
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const invitationId = parseInt(req.params.id, 10);
    const result = await invitationService.cancelInvitation(invitationId, req.user.userId);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// ============================================
// Acceptance/Decline Endpoints
// ============================================

/**
 * POST /api/invitations/accept
 * Accept an invitation by token (for existing users)
 */
router.post('/accept', verifyAuth, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.userId;

    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }

    // Uses legacy auth module for full acceptance flow
    const result = await auth.acceptCoParentInvitation(token, userId, require('../dbPostgres'));

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * POST /api/invitations/accept-code
 * Accept an invitation by short code (for existing users)
 */
router.post('/accept-code', verifyAuth, async (req, res) => {
  try {
    const { code } = req.body;
    const result = await invitationService.acceptByCode(code, req.user.userId);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * POST /api/invitations/decline
 * Decline an invitation (for existing users)
 */
router.post('/decline', verifyAuth, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.userId;

    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }

    // Uses legacy auth module for decline flow
    const result = await auth.declineCoParentInvitation(token, userId, require('../dbPostgres'));

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    handleServiceError(error, res);
  }
});

module.exports = router;
