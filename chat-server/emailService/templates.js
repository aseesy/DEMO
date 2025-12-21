/**
 * Email Templates for LiaiZen
 */

function wrapHtml(content, title) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #275559; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background-color: #275559; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>${title}</h1></div>
        <div class="content">${content}</div>
        <div class="footer"><p>Automated message from LiaiZen.</p></div>
      </div>
    </body>
    </html>
  `;
}

function getNewUserInvite(inviterName, joinUrl, shortCode) {
  const content = `
    <p>Hi there,</p>
    <p><strong>${inviterName}</strong> has invited you to join LiaiZen.</p>
    <div style="text-align: center;"><a href="${joinUrl}" class="button">Accept Invitation</a></div>
    ${shortCode ? `<p style="text-align: center; font-size: 1.2em;">Or enter code: <strong>${shortCode}</strong></p>` : ''}
    <p>Link: ${joinUrl}</p>
  `;
  return {
    subject: `You're invited to co-parent on LiaiZen`,
    html: wrapHtml(content, "You're Invited!"),
    text: `You're invited by ${inviterName}. Join at: ${joinUrl} ${shortCode ? ' (Code: ' + shortCode + ')' : ''}`,
  };
}

function getPasswordResetTemplate(resetUrl, username) {
  const content = `
    <p>Hi ${username || 'there'},</p>
    <p>We received a request to reset your LiaiZen password.</p>
    <div style="text-align: center;"><a href="${resetUrl}" class="button">Reset Password</a></div>
    <p>Link: ${resetUrl}</p>
  `;
  return {
    subject: 'Reset your LiaiZen password',
    html: wrapHtml(content, 'Password Reset'),
    text: `Reset your password at: ${resetUrl}`,
  };
}

module.exports = { getNewUserInvite, getPasswordResetTemplate };
