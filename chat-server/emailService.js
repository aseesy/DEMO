// Email service for sending invitations
// Supports multiple email providers via environment variables

/**
 * Send an invitation email to a new user
 */
async function sendNewUserInvite(email, inviterName, token, appName = 'Co-Parent Chat') {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const joinUrl = `${frontendUrl}/join?token=${token}`;
  
  const subject = `You're invited to co-parent on ${appName}`;
  const htmlBody = `
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
        <div class="header">
          <h1>You're Invited!</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p><strong>${inviterName}</strong> has invited you to join ${appName}, a secure platform for co-parenting communication.</p>
          <p>Click the button below to accept the invitation and create your account:</p>
          <div style="text-align: center;">
            <a href="${joinUrl}" class="button">Accept Invitation</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4DA8B0;">${joinUrl}</p>
          <p>This invitation will expire in 7 days.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from ${appName}.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textBody = `
You're Invited!

Hi there,

${inviterName} has invited you to join ${appName}, a secure platform for co-parenting communication.

Accept your invitation by visiting:
${joinUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

---
This is an automated message from ${appName}.
  `;
  
  return await sendEmail(email, subject, htmlBody, textBody);
}

/**
 * Send a connection request email to an existing user
 */
async function sendExistingUserInvite(email, inviterName, appName = 'Co-Parent Chat') {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const notificationsUrl = `${frontendUrl}/notifications`;
  
  const subject = `You have a new co-parent connection request`;
  const htmlBody = `
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
        <div class="header">
          <h1>New Connection Request</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p><strong>${inviterName}</strong> wants to connect with you on ${appName}.</p>
          <p>Log in to your account to view and accept the connection request:</p>
          <div style="text-align: center;">
            <a href="${notificationsUrl}" class="button">View Connection Request</a>
          </div>
          <p>If you didn't expect this request, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from ${appName}.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textBody = `
New Connection Request

Hi there,

${inviterName} wants to connect with you on ${appName}.

Log in to your account to view and accept the connection request:
${notificationsUrl}

If you didn't expect this request, you can safely ignore this email.

---
This is an automated message from ${appName}.
  `;
  
  return await sendEmail(email, subject, htmlBody, textBody);
}

/**
 * Send email using configured email service
 * Supports Gmail OAuth2, SMTP (via nodemailer), or console logging for development
 */
async function sendEmail(to, subject, htmlBody, textBody) {
  // In development or if email is not configured, just log to console
  if ((process.env.NODE_ENV === 'development' && !process.env.EMAIL_SERVICE) || 
      (!process.env.EMAIL_SERVICE && process.env.NODE_ENV !== 'production')) {
    console.log('\n📧 EMAIL (Development Mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`\n${textBody}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return { success: true, message: 'Email logged to console (development mode)' };
  }
  
  const nodemailer = require('nodemailer');
  let transporter;
  
  // Gmail OAuth2 Configuration
  if (process.env.EMAIL_SERVICE === 'gmail-oauth2') {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER || 'info@liaizen.com',
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: process.env.GMAIL_ACCESS_TOKEN // Optional, will be generated if not provided
      }
    });
  }
  // Gmail App Password (simpler alternative)
  else if (process.env.EMAIL_SERVICE === 'gmail') {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'info@liaizen.com',
        pass: process.env.GMAIL_APP_PASSWORD // Use app-specific password, not regular password
      }
    });
  }
  // Generic SMTP Configuration
  else if (process.env.EMAIL_SERVICE === 'smtp') {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  } else {
    // Default: log in development, fail in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email service not configured. Set EMAIL_SERVICE environment variable.');
    }
    // Fall back to console logging
    console.log('\n📧 EMAIL (Development Mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`\n${textBody}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return { success: true, message: 'Email logged to console (development mode)' };
  }
  
  try {
    const fromEmail = process.env.EMAIL_FROM || process.env.GMAIL_USER || 'info@liaizen.com';
    const fromName = process.env.APP_NAME || 'Co-Parent Chat';
    
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: subject,
      text: textBody,
      html: htmlBody
    });
    
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

/**
 * Send contact form submission to info@liaizen.com
 */
async function sendContactForm(formData) {
  const { name, email, subject, message } = formData;
  const toEmail = 'info@liaizen.com';

  const emailSubject = `[Contact Form] ${subject}`;
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #275559; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #275559; }
        .value { margin-top: 5px; padding: 10px; background-color: white; border-left: 3px solid #4DA8B0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Contact Form Submission</h1>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">From:</div>
            <div class="value">${name} &lt;${email}&gt;</div>
          </div>
          <div class="field">
            <div class="label">Subject:</div>
            <div class="value">${subject}</div>
          </div>
          <div class="field">
            <div class="label">Message:</div>
            <div class="value">${message.replace(/\n/g, '<br>')}</div>
          </div>
        </div>
        <div class="footer">
          <p>This message was sent via the LiaiZen contact form.</p>
          <p>Reply directly to this email to respond to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
New Contact Form Submission

From: ${name} <${email}>
Subject: ${subject}

Message:
${message}

---
This message was sent via the LiaiZen contact form.
Reply directly to this email to respond to ${email}
  `;

  // Send email with reply-to set to the user's email
  const nodemailer = require('nodemailer');
  let transporter;

  // Use same configuration as sendEmail function
  if ((process.env.NODE_ENV === 'development' && !process.env.EMAIL_SERVICE) ||
      (!process.env.EMAIL_SERVICE && process.env.NODE_ENV !== 'production')) {
    console.log('\n📧 CONTACT FORM EMAIL (Development Mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${toEmail}`);
    console.log(`From: ${name} <${email}>`);
    console.log(`Subject: ${emailSubject}`);
    console.log(`\n${textBody}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return { success: true, message: 'Contact form email logged to console (development mode)' };
  }

  // Gmail OAuth2 Configuration
  if (process.env.EMAIL_SERVICE === 'gmail-oauth2') {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER || 'info@liaizen.com',
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: process.env.GMAIL_ACCESS_TOKEN
      }
    });
  }
  // Gmail App Password
  else if (process.env.EMAIL_SERVICE === 'gmail') {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'info@liaizen.com',
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }
  // Generic SMTP
  else if (process.env.EMAIL_SERVICE === 'smtp') {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  } else {
    // Default: log in development
    console.log('\n📧 CONTACT FORM EMAIL (Development Mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${toEmail}`);
    console.log(`From: ${name} <${email}>`);
    console.log(`Subject: ${emailSubject}`);
    console.log(`\n${textBody}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return { success: true, message: 'Contact form email logged to console (development mode)' };
  }

  try {
    const fromEmail = process.env.EMAIL_FROM || process.env.GMAIL_USER || 'info@liaizen.com';
    const fromName = 'LiaiZen Contact Form';

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      replyTo: `"${name}" <${email}>`, // Allow direct reply to submitter
      subject: emailSubject,
      text: textBody,
      html: htmlBody
    });

    console.log(`✅ Contact form email sent to ${toEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending contact form email:', error);
    throw error;
  }
}

module.exports = {
  sendNewUserInvite,
  sendExistingUserInvite,
  sendEmail,
  sendContactForm
};

