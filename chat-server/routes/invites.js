/**
 * Invites Routes
 * @di-pattern: injected
 *
 * Production-grade invite acceptance endpoint.
 * Handles authenticated invitation acceptance with email enforcement.
 *
 * Actor: Product/UX
 */

const express = require('express');
const router = express.Router();

const { verifyAuth } = require('../middleware/auth');
const { handleServiceError } = require('../middleware/errorHandlers');
const { pairingService } = require('../src/services');
const { ValidationError, ConflictError, ForbiddenError } = require('../src/services/errors');

router.setHelpers = function (helpers) {
  if (helpers.roomManager) {
    pairingService.setRoomManager(helpers.roomManager);
  }
};

// ============================================
// Invite Acceptance Endpoint
// ============================================

/**
 * POST /api/invites/accept
 * Accept an invitation (requires authentication)
 *
 * Request Body:
 * {
 *   "token": "0f9e6e285123f2d8fde4bd608b135bfc5d5822ac8f0371379b8f28f6514d5e8a"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Invitation accepted successfully",
 *   "pairingId": 123,
 *   "roomId": "room-abc-123"
 * }
 *
 * Error Responses:
 * - 400: Invalid request (missing token)
 * - 401: Not authenticated
 * - 403: Wrong account (email mismatch)
 * - 404: Token not found
 * - 409: Already accepted or already paired
 */
router.post('/accept', verifyAuth, async (req, res) => {
  const startTime = Date.now();
  const userId = req.user?.userId;
  const userEmail = req.user?.email;

  try {
    const { token } = req.body;

    // Validate token is provided
    if (!token || token.trim().length === 0) {
      console.warn(`[Invites] Accept failed: token missing (userId: ${userId})`);
      return res.status(400).json({
        success: false,
        error: 'Token is required',
        code: 'TOKEN_REQUIRED',
      });
    }

    // Log acceptance attempt (without full token for security)
    console.log(`[Invites] Accept attempt (userId: ${userId}, token length: ${token.length})`);

    // Validate token first to get pairing info
    const validation = await pairingService.validateToken(token);

    if (!validation.valid) {
      const duration = Date.now() - startTime;
      console.warn(`[Invites] Accept failed: ${validation.code || 'INVALID'} (${duration}ms, userId: ${userId})`);
      
      // Map validation codes to HTTP status codes
      let statusCode = 400;
      if (validation.code === 'ALREADY_ACCEPTED' || validation.code === 'ALREADY_PAIRED') {
        statusCode = 409;
      } else if (validation.code === 'INVALID_TOKEN' || validation.code === 'EXPIRED') {
        statusCode = 404;
      }

      return res.status(statusCode).json({
        success: false,
        error: validation.error || 'Invalid invitation token',
        code: validation.code || 'INVALID_TOKEN',
      });
    }

    // Email enforcement: If parent_b_email is set, logged-in user's email must match
    if (validation.parentBEmail) {
      const expectedEmail = validation.parentBEmail.toLowerCase().trim();
      const actualEmail = (userEmail || '').toLowerCase().trim();

      if (actualEmail !== expectedEmail) {
        const duration = Date.now() - startTime;
        console.warn(`[Invites] Email mismatch (${duration}ms, userId: ${userId}, expected: ${expectedEmail}, actual: ${actualEmail})`);
        
        return res.status(403).json({
          success: false,
          error: `This invitation was sent to ${validation.parentBEmail}. You're logged in as ${userEmail || 'a different account'}.`,
          code: 'WRONG_ACCOUNT',
          expectedEmail: validation.parentBEmail,
          actualEmail: userEmail,
        });
      }
    }

    // Accept the invitation
    const result = await pairingService.acceptPairing(userId, { token });

    const duration = Date.now() - startTime;
    console.log(`[Invites] Accept success (${duration}ms, userId: ${userId}, pairingId: ${result.pairing?.id})`);

    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      pairingId: result.pairing?.id,
      roomId: result.sharedRoomId,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Invites] Accept error (${duration}ms, userId: ${userId}):`, {
      message: error.message,
      code: error.code,
    });

    // Handle specific error types
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: error.field || 'VALIDATION_ERROR',
      });
    }

    if (error instanceof ConflictError) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'CONFLICT',
      });
    }

    if (error instanceof ForbiddenError) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'FORBIDDEN',
      });
    }

    // Check for email mismatch in error message
    if (error.message && error.message.includes('invitation was sent to')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'WRONG_ACCOUNT',
      });
    }

    // Check for already paired/accepted errors
    if (error.message && (error.message.includes('already have an active') || error.message.includes('already been accepted'))) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'ALREADY_ACCEPTED',
      });
    }

    // Generic error handling
    handleServiceError(error, res);
  }
});

module.exports = router;


