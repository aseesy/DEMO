/**
 * Auth Password Routes
 */
const express = require('express');
const router = express.Router();
const db = require('../../dbPostgres');
const emailService = require('../../emailService');
const {
  validatePasswordDetailed,
  checkPasswordStrength,
  getPasswordRequirements,
} = require('../../libs/password-validator');
const { rateLimit } = require('../../middleware/spamProtection');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

router.get('/password-requirements', (req, res) => {
  const requirements = validatePasswordDetailed('');
  res.json({
    minLength: requirements.minLength,
    requirements: requirements.requirements.map(r => ({ id: r.id, label: r.label })),
  });
});

router.post('/validate-password', (req, res) => {
  const { password } = req.body;
  const result = validatePasswordDetailed(password);
  res.json({
    valid: result.valid,
    strength: checkPasswordStrength(password),
    requirements: result.requirements,
  });
});

router.post('/forgot-password', rateLimit('forgot-password', 5, 3600000), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const normalizedEmail = email.toLowerCase().trim();
    const successResponse = {
      message: 'If an account exists, you will receive a reset link.',
      success: true,
    };

    const userResult = await db.query(
      'SELECT id, username, email, google_id, password_hash FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );
    if (
      userResult.rows.length === 0 ||
      (userResult.rows[0].google_id && !userResult.rows[0].password_hash)
    )
      return res.json(successResponse);

    const user = userResult.rows[0];
    await db.query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND used_at IS NULL',
      [user.id]
    );

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [user.id, resetToken, expiresAt, req.ip, req.headers['user-agent']]
    );

    await emailService.sendPasswordReset(user.email, resetToken, user.username).catch(() => {});
    res.json(successResponse);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred.' });
  }
});

router.post('/reset-password', rateLimit('reset-password', 10, 3600000), async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Missing token or password' });

    const validation = validatePasswordDetailed(password);
    if (!validation.valid)
      return res
        .status(400)
        .json({
          error: validation.requirements.find(r => !r.met)?.label,
          code: 'WEAK_PASSWORD',
          requirements: getPasswordRequirements(),
        });

    const tokenResult = await db.query(
      'SELECT prt.*, u.email, u.username FROM password_reset_tokens prt JOIN users u ON prt.user_id = u.id WHERE prt.token = $1',
      [token]
    );
    if (tokenResult.rows.length === 0)
      return res.status(400).json({ error: 'Invalid or expired link.', code: 'INVALID_TOKEN' });

    const resetToken = tokenResult.rows[0];
    if (resetToken.used_at)
      return res.status(400).json({ error: 'Link already used.', code: 'TOKEN_USED' });
    if (new Date(resetToken.expires_at) < new Date())
      return res.status(400).json({ error: 'Link expired.', code: 'TOKEN_EXPIRED' });

    const passwordHash = await bcrypt.hash(password, 12);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      passwordHash,
      resetToken.user_id,
    ]);
    await db.query('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1', [
      resetToken.id,
    ]);
    await db.query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND id != $2 AND used_at IS NULL',
      [resetToken.user_id, resetToken.id]
    );

    res.json({ message: 'Password reset successfully.', success: true });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred.' });
  }
});

router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const tokenResult = await db.query(
      'SELECT prt.*, u.email FROM password_reset_tokens prt JOIN users u ON prt.user_id = u.id WHERE prt.token = $1',
      [token]
    );
    if (tokenResult.rows.length === 0)
      return res.json({ valid: false, error: 'Invalid link', code: 'INVALID_TOKEN' });

    const resetToken = tokenResult.rows[0];
    if (resetToken.used_at)
      return res.json({ valid: false, error: 'Used link', code: 'TOKEN_USED' });
    if (new Date(resetToken.expires_at) < new Date())
      return res.json({ valid: false, error: 'Expired link', code: 'TOKEN_EXPIRED' });

    res.json({
      valid: true,
      email: resetToken.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      expiresAt: resetToken.expires_at,
    });
  } catch (error) {
    res.status(500).json({ valid: false, error: 'An error occurred' });
  }
});

module.exports = router;
