/**
 * Invitation Manager Library
 *
 * Standalone library for managing co-parent invitations.
 * Handles invitation creation, validation, acceptance, and lifecycle management.
 *
 * Feature: 003-account-creation-coparent-invitation
 * Constitutional Compliance:
 *   - Principle I (Library-First): Standalone module with clear API
 *   - Principle III (Contract-First): Defined interfaces before implementation
 *   - Principle XV (Conflict Reduction): Enables co-parent connections
 */

const invitationCreator = require('./invitationCreator');
const invitationValidator = require('./invitationValidator');

module.exports = {
  // Invitation Creation
  createInvitation: invitationCreator.createInvitation,
  cancelInvitation: invitationCreator.cancelInvitation,
  resendInvitation: invitationCreator.resendInvitation,

  // Invitation Validation & Processing
  validateToken: invitationValidator.validateToken,
  validateByShortCode: invitationValidator.validateByShortCode,
  acceptInvitation: invitationValidator.acceptInvitation,
  acceptByShortCode: invitationValidator.acceptByShortCode,
  declineInvitation: invitationValidator.declineInvitation,

  // Query Functions
  getInvitationById: invitationValidator.getInvitationById,
  getUserInvitations: invitationValidator.getUserInvitations,
  findExistingUser: invitationCreator.findExistingUser,
  findExistingInvitation: invitationCreator.findExistingInvitation,
  hasReachedCoparentLimit: invitationCreator.hasReachedCoparentLimit,

  // Maintenance
  expireOldInvitations: invitationValidator.expireOldInvitations,

  // Token Utilities
  generateToken: invitationCreator.generateToken,
  generateShortCode: invitationCreator.generateShortCode,
  hashToken: invitationCreator.hashToken,
  calculateExpiration: invitationCreator.calculateExpiration,

  // Constants
  INVITATION_STATUS: invitationCreator.INVITATION_STATUS,
  INVITATION_TYPE: invitationCreator.INVITATION_TYPE,
  TOKEN_CONFIG: invitationCreator.TOKEN_CONFIG,
};
