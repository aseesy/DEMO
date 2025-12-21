/**
 * Email Service Module - Modular Entry Point
 */
const { sendEmail } = require('./emailService/send');
const { getNewUserInvite, getPasswordResetTemplate } = require('./emailService/templates');

async function sendNewUserInvite(email, inviterName, inviteUrl, shortCode) {
  const { subject, html, text } = getNewUserInvite(inviterName, inviteUrl, shortCode);
  return await sendEmail(email, subject, html, text);
}

async function sendPasswordReset(email, token, username) {
  const resetUrl = `${process.env.APP_URL || 'https://coparentliaizen.com'}/reset-password?token=${token}`;
  const { subject, html, text } = getPasswordResetTemplate(resetUrl, username);
  return await sendEmail(email, subject, html, text);
}

async function sendVerificationCode(email, code, details = {}) {
  const subject = 'LiaiZen Verification Code';
  const text = `Your verification code is: ${code}`;
  const html = `<p>Your verification code is: <strong>${code}</strong></p>`;
  return await sendEmail(email, subject, html, text);
}

module.exports = {
  sendEmail,
  sendNewUserInvite,
  sendPasswordReset,
  sendVerificationCode,
};
