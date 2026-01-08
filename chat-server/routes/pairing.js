/**
 * Pairing Routes
 * @di-pattern: injected
 *
 * Handles pairing session management for co-parent connections.
 * Supports email, link, and code-based pairing.
 * Business logic delegated to services layer.
 *
 * Actor: Product/UX
 */

const express = require('express');
const router = express.Router();

const { verifyAuth } = require('../middleware/auth');
const { handleServiceError } = require('../middleware/errorHandlers');
const { pairingService } = require('../src/services');

router.setHelpers = function (helpers) {
  if (helpers.roomManager) {
    pairingService.setRoomManager(helpers.roomManager);
  }
};

// ============================================
// Pairing Management Endpoints
// ============================================

/**
 * POST /api/pairing/create
 * Create a new pairing invitation
 */
router.post('/create', verifyAuth, async (req, res) => {
  try {
    const { type, inviteeEmail } = req.body;
    const userId = req.user?.userId;

    const result = await pairingService.createPairing(userId, type, inviteeEmail);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * GET /api/pairing/status
 * Get current user's pairing status
 */
router.get('/status', verifyAuth, async (req, res) => {
  try {
    const status = await pairingService.getPairingStatus(req.user.userId);
    res.json(status);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// ============================================
// Validation Endpoints
// ============================================

/**
 * GET /api/pairing/validate/:code
 * Validate a pairing code (public endpoint)
 */
router.get('/validate/:code', async (req, res) => {
  try {
    const result = await pairingService.validateCode(req.params.code);
    res.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        valid: false,
        error: error.message,
        code: error.field,
      });
    }
    handleServiceError(error, res);
  }
});

/**
 * GET /api/pairing/validate-token/:token
 * Validate a pairing token (for email/link invitations)
 * 
 * Returns detailed validation result with helpful error messages
 */
router.get('/validate-token/:token', async (req, res) => {
  const token = req.params.token;
  const startTime = Date.now();
  
  try {
    // Log validation attempt (without logging full token for security)
    console.log(`[Pairing] Validating token (length: ${token?.length || 0})`);
    
    if (!token || token.trim().length === 0) {
      console.warn('[Pairing] Token validation failed: empty token');
      return res.status(400).json({
        valid: false,
        error: 'Invitation token is required',
        code: 'TOKEN_REQUIRED',
        userMessage: 'This invitation link is invalid. Please request a new invitation.',
      });
    }

    const result = await pairingService.validateToken(token);
    const duration = Date.now() - startTime;
    
    if (result.valid) {
      console.log(`[Pairing] Token validation successful (${duration}ms)`);
    } else {
      console.warn(`[Pairing] Token validation failed: ${result.code || 'UNKNOWN'} (${duration}ms)`);
    }
    
    // Ensure consistent response format
    res.json({
      valid: result.valid,
      ...(result.valid ? {
        inviterUsername: result.inviterUsername,
        inviterName: result.inviterName,
        inviteType: result.inviteType,
        expiresAt: result.expiresAt,
        pairingCode: result.pairingCode,
      } : {
        error: result.error || 'Invalid invitation token',
        code: result.code || 'INVALID_TOKEN',
        userMessage: result.userMessage || getErrorMessage(result.code || 'INVALID_TOKEN'),
      }),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Pairing] Token validation error (${duration}ms):`, {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
    });
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        valid: false,
        error: error.message,
        code: error.field || 'VALIDATION_ERROR',
        userMessage: getErrorMessage(error.field || 'VALIDATION_ERROR'),
      });
    }
    
    // Handle database errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        valid: false,
        error: 'Database connection failed',
        code: 'DATABASE_ERROR',
        userMessage: 'Unable to validate invitation. Please try again in a moment.',
      });
    }
    
    handleServiceError(error, res);
  }
});

/**
 * Helper function to get user-friendly error messages
 */
function getErrorMessage(code) {
  const messages = {
    TOKEN_REQUIRED: 'This invitation link is invalid. Please request a new invitation.',
    INVALID_TOKEN: 'This invitation link is invalid or has been used. Please request a new invitation.',
    EXPIRED: 'This invitation has expired. Please request a new invitation.',
    ALREADY_ACCEPTED: 'This invitation has already been accepted.',
    CANCELED: 'This invitation has been cancelled. Please request a new invitation.',
    DB_REQUIRED: 'Unable to validate invitation. Please try again later.',
    DATABASE_ERROR: 'Unable to validate invitation. Please try again in a moment.',
    VALIDATION_ERROR: 'Unable to validate invitation. Please check the link and try again.',
  };
  
  return messages[code] || 'Unable to validate invitation. Please request a new invitation.';
}

// ============================================
// Acceptance/Decline Endpoints
// ============================================

/**
 * POST /api/pairing/accept
 * Accept a pairing invitation
 */
router.post('/accept', verifyAuth, async (req, res) => {
  try {
    const { code, token } = req.body;
    const result = await pairingService.acceptPairing(req.user.userId, { code, token });
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * POST /api/pairing/decline/:id
 * Decline a pairing invitation
 */
router.post('/decline/:id', verifyAuth, async (req, res) => {
  try {
    const pairingId = parseInt(req.params.id);
    const result = await pairingService.declinePairing(pairingId, req.user.userId);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * DELETE /api/pairing/:id
 * Cancel a pending pairing (initiator only)
 */
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const pairingId = parseInt(req.params.id);
    const result = await pairingService.cancelPairing(pairingId, req.user.userId);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * POST /api/pairing/resend/:id
 * Resend a pairing invitation
 */
router.post('/resend/:id', verifyAuth, async (req, res) => {
  try {
    const pairingId = parseInt(req.params.id);
    const result = await pairingService.resendPairing(pairingId, req.user.userId);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// ============================================
// Diagnostic Endpoints (for debugging)
// ============================================

/**
 * GET /api/pairing/diagnose-token/:token
 * Diagnostic endpoint to check token status (for debugging)
 * Returns detailed information about token without requiring auth
 */
router.get('/diagnose-token/:token', async (req, res) => {
  const token = req.params.token;
  
  try {
    if (!token || token.trim().length === 0) {
      return res.status(400).json({
        error: 'Token is required',
        diagnostic: {
          tokenLength: 0,
          tokenProvided: false,
        },
      });
    }

    // Hash the token to check database
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const db = require('../dbPostgres');
    const result = await db.query(
      `SELECT 
        ps.id,
        ps.status,
        ps.invite_type,
        ps.pairing_code,
        ps.parent_a_id,
        ps.parent_b_id,
        ps.parent_b_email,
        ps.created_at,
        ps.expires_at,
        ps.accepted_at,
        ps.invite_token = $1 as token_matches,
        NOW() > ps.expires_at as is_expired,
        u.username as initiator_username,
        u.email as initiator_email
      FROM pairing_sessions ps
      JOIN users u ON ps.parent_a_id = u.id
      WHERE ps.invite_token = $1
      LIMIT 1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.json({
        found: false,
        diagnostic: {
          tokenLength: token.length,
          tokenHash: tokenHash.substring(0, 16) + '...', // Partial hash for debugging
          message: 'No pairing session found with this token hash',
        },
      });
    }

    const pairing = result.rows[0];
    const now = new Date();
    const expiresAt = new Date(pairing.expires_at);
    const timeUntilExpiry = expiresAt - now;

    return res.json({
      found: true,
      diagnostic: {
        pairingId: pairing.id,
        status: pairing.status,
        inviteType: pairing.invite_type,
        pairingCode: pairing.pairing_code,
        tokenMatches: pairing.token_matches,
        isExpired: pairing.is_expired,
        timeUntilExpiry: timeUntilExpiry > 0 ? `${Math.floor(timeUntilExpiry / (1000 * 60 * 60))} hours` : 'expired',
        createdAt: pairing.created_at,
        expiresAt: pairing.expires_at,
        acceptedAt: pairing.accepted_at,
        initiatorUsername: pairing.initiator_username,
        initiatorEmail: pairing.initiator_email ? pairing.initiator_email.substring(0, 3) + '***' : null, // Partially masked
        parentAId: pairing.parent_a_id,
        parentBId: pairing.parent_b_id,
        parentBEmail: pairing.parent_b_email ? pairing.parent_b_email.substring(0, 3) + '***' : null, // Partially masked
      },
      validation: {
        valid: pairing.status === 'pending' && !pairing.is_expired,
        reason: pairing.status !== 'pending' 
          ? `Status is ${pairing.status}` 
          : pairing.is_expired 
            ? 'Token has expired' 
            : 'Token is valid',
      },
    });
  } catch (error) {
    console.error('[Pairing] Diagnostic error:', error);
    return res.status(500).json({
      error: 'Diagnostic check failed',
      message: error.message,
    });
  }
});

module.exports = router;
