/**
 * Invitation Email Service
 *
 * Actor: Product/UX (user notifications)
 * Responsibility: Email operations for invitation lifecycle
 *
 * Wraps the main emailService with invitation-specific logic.
 */

const { BaseService } = require('../BaseService');
const { ValidationError, ExternalServiceError } = require('../errors');
const emailService = require('../../../emailService');

class InvitationEmailService extends BaseService {
  constructor() {
    super(null); // No primary table
  }

  /**
   * Send invitation email to new user
   * @param {Object} params - Email parameters
   * @param {string} params.inviteeEmail - Recipient email
   * @param {string} params.inviterName - Name of the inviter
   * @param {string} params.token - Invitation token
   * @returns {Promise<Object>} Send result
   */
  async sendNewUserInvite({ inviteeEmail, inviterName, token }) {
    if (!inviteeEmail || !inviteeEmail.includes('@')) {
      throw new ValidationError('Valid email address is required', 'inviteeEmail');
    }

    if (!token) {
      throw new ValidationError('Invitation token is required', 'token');
    }

    try {
      await emailService.sendNewUserInvite(
        inviteeEmail,
        inviterName || 'Your co-parent',
        token,
        'LiaiZen'
      );

      console.log(`✅ Invitation email sent to: ${inviteeEmail}`);

      return {
        success: true,
        emailSent: true,
        recipientEmail: inviteeEmail,
      };
    } catch (error) {
      console.error('Error sending invitation email:', error);

      // Don't throw - email failures shouldn't block the invitation flow
      return {
        success: false,
        emailSent: false,
        error: error.message,
      };
    }
  }

  /**
   * Resend invitation email
   * @param {Object} params - Email parameters
   * @param {string} params.inviteeEmail - Recipient email
   * @param {string} params.inviterName - Name of the inviter
   * @param {string} params.token - New invitation token
   * @returns {Promise<Object>} Send result
   */
  async resendInvitationEmail({ inviteeEmail, inviterName, token }) {
    if (!inviteeEmail) {
      return { success: false, reason: 'No email address provided' };
    }

    const frontendUrl = process.env.APP_URL || 'https://coparentliaizen.com';
    const inviteUrl = `${frontendUrl}/accept-invite?token=${token}`;

    try {
      await emailService.sendNewUserInvite(
        inviteeEmail,
        inviterName || 'Your co-parent',
        inviteUrl,
        'LiaiZen'
      );

      console.log(`✅ Invitation email resent to: ${inviteeEmail}`);

      return {
        success: true,
        emailSent: true,
        recipientEmail: inviteeEmail,
      };
    } catch (error) {
      console.error('Error resending invitation email:', error);

      return {
        success: false,
        emailSent: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if email service is available
   * @returns {Promise<boolean>} Service availability
   */
  async isAvailable() {
    try {
      return !!emailService && typeof emailService.sendNewUserInvite === 'function';
    } catch {
      return false;
    }
  }
}

// Export singleton instance
const invitationEmailService = new InvitationEmailService();

module.exports = { invitationEmailService, InvitationEmailService };
