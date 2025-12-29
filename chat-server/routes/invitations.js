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

const { verifyAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/routeHandler');
const { invitationService } = require('../src/services');

router.get('/validate/:token', asyncHandler(async (req, res) => {
  const result = await invitationService.validateToken(req.params.token);
  res.json(result);
}));

router.get('/validate-code/:code', asyncHandler(async (req, res) => {
  const result = await invitationService.validateCode(req.params.code);
  res.json(result);
}));

router.get('/', verifyAuth, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const { status } = req.query;
  const invitations = await invitationService.getUserInvitations(userId, {
    status: status || null,
  });
  res.json(invitations);
}));

router.get('/my-invite', verifyAuth, asyncHandler(async (req, res) => {
  const result = await invitationService.getActiveInvitation(req.user.userId);
  res.json(result);
}));

router.post('/create', verifyAuth, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { inviteeEmail } = req.body;
  const result = await invitationService.createInvitationWithEmail(userId, inviteeEmail);
  res.json(result);
}));

router.post('/resend/:id', verifyAuth, asyncHandler(async (req, res) => {
  const invitationId = parseInt(req.params.id, 10);
  const userId = req.user.userId;
  const result = await invitationService.resendInvitationWithEmail(invitationId, userId);
  res.json(result);
}));

router.delete('/:id', verifyAuth, asyncHandler(async (req, res) => {
  const invitationId = parseInt(req.params.id, 10);
  const result = await invitationService.cancelInvitation(invitationId, req.user.userId);
  res.json(result);
}));

router.post('/accept', verifyAuth, asyncHandler(async (req, res) => {
  const { token } = req.body;
  const userId = req.user.userId;
  const result = await invitationService.acceptByToken(token, userId);
  res.json(result);
}));

router.post('/accept-code', verifyAuth, asyncHandler(async (req, res) => {
  const { code } = req.body;
  const result = await invitationService.acceptByCode(code, req.user.userId);
  res.json(result);
}));

router.post('/decline', verifyAuth, asyncHandler(async (req, res) => {
  const { token } = req.body;
  const userId = req.user.userId;
  const result = await invitationService.declineByToken(token, userId);
  res.json(result);
}));

module.exports = router;
