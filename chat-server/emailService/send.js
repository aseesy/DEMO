/**
 * Core Email Sending Logic
 */
const nodemailer = require('nodemailer');

async function sendEmail(to, subject, html, text) {
  const isProd = process.env.NODE_ENV === 'production';
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;

  if (!gmailUser || !gmailPass) {
    console.log('⚠️  Email credentials missing - skipping email send');
    console.log(`To: ${to}\nSubject: ${subject}\nText: ${text}`);
    return { success: false, error: 'Credentials missing' };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  });

  const mailOptions = {
    from: `"LiaiZen" <${gmailUser}>`,
    to,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail };
