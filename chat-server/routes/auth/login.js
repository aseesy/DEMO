/**
 * Auth Login Routes
 */
const express = require('express');
const router = express.Router();
const auth = require('../../auth');
const adaptiveAuth = require('../../libs/adaptive-auth');
const emailService = require('../../emailService');
const {
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  verifyAuth,
} = require('../../middleware/auth');
const { honeypotCheck } = require('../../middleware/spamProtection');
const { loginRateLimit } = require('./utils');

router.post('/login', loginRateLimit, honeypotCheck('website'), async (req, res) => {
  const loginEmail = (req.body.email || '').trim().toLowerCase();
  const { password, username, trustDevice, verificationCode } = req.body;

  try {
    if (!password || (!loginEmail && !username))
      return res.status(400).json({ error: 'Missing credentials' });

    const preAuthRisk = await adaptiveAuth.calculateRiskScore(
      { email: loginEmail || username },
      req,
      null
    );
    if (preAuthRisk.riskLevel === 'CRITICAL') {
      await adaptiveAuth.recordLoginAttempt({
        email: loginEmail || username,
        success: false,
        deviceFingerprint: preAuthRisk.deviceFingerprint,
        ipAddress: preAuthRisk.clientIP,
        userAgent: req.headers['user-agent'],
        riskScore: preAuthRisk.score,
        riskLevel: preAuthRisk.riskLevel,
      });
      return res.status(403).json({ error: 'Suspicious activity blocked', code: 'LOGIN_BLOCKED' });
    }

    let user;
    try {
      user = loginEmail
        ? await auth.authenticateUserByEmail(loginEmail, password)
        : await auth.authenticateUser(username, password);
    } catch (authError) {
      await adaptiveAuth.recordLoginAttempt({
        email: loginEmail || username,
        success: false,
        deviceFingerprint: preAuthRisk.deviceFingerprint,
        ipAddress: preAuthRisk.clientIP,
        userAgent: req.headers['user-agent'],
        riskScore: preAuthRisk.score,
        riskLevel: preAuthRisk.riskLevel,
      });
      if (authError.message === 'Invalid password')
        return res.status(401).json({ error: 'Invalid password', code: 'INVALID_PASSWORD' });
      if (authError.message === 'Account not found' || authError.code === 'ACCOUNT_NOT_FOUND')
        return res.status(401).json({ error: 'Account not found', code: 'ACCOUNT_NOT_FOUND' });
      if (authError.code === 'OAUTH_ONLY_ACCOUNT')
        return res.status(401).json({ error: authError.message, code: 'OAUTH_ONLY_ACCOUNT' });
      throw authError;
    }

    if (!user)
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });

    const postAuthRisk = await adaptiveAuth.calculateRiskScore({ email: user.email }, req, user.id);
    if (postAuthRisk.action === 'step_up_auth') {
      if (verificationCode) {
        if (!(await adaptiveAuth.verifyStepUpCode(user.id, verificationCode)))
          return res
            .status(401)
            .json({
              error: 'Invalid code',
              code: 'INVALID_VERIFICATION_CODE',
              requiresVerification: true,
            });
      } else {
        const code = await adaptiveAuth.generateStepUpCode(user.id, 'email');
        try {
          await emailService.sendVerificationCode(user.email, code, {
            reason: 'Unusual activity',
            ip: postAuthRisk.clientIP,
          });
        } catch (err) {}
        return res
          .status(403)
          .json({
            error: 'Verification required',
            code: 'STEP_UP_REQUIRED',
            requiresVerification: true,
          });
      }
    }

    await adaptiveAuth.recordLoginAttempt({
      userId: user.id,
      email: user.email,
      success: true,
      deviceFingerprint: postAuthRisk.deviceFingerprint,
      ipAddress: postAuthRisk.clientIP,
      userAgent: req.headers['user-agent'],
      riskScore: postAuthRisk.score,
      riskLevel: postAuthRisk.riskLevel,
    });
    if (trustDevice) await adaptiveAuth.trustDevice(user.id, postAuthRisk.deviceFingerprint);

    const token = generateToken(user);
    setAuthCookie(res, token);
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
      },
      token,
      security: {
        riskLevel: postAuthRisk.riskLevel,
        newDevice: postAuthRisk.signals.some(s => s.signal === 'NEW_DEVICE'),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
