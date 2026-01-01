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
 */
router.get('/validate-token/:token', async (req, res) => {
  try {
    const result = await pairingService.validateToken(req.params.token);
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

module.exports = router;
