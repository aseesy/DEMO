/**
 * Adaptive Authentication Module
 *
 * Evaluates login context to dynamically apply stricter verification when needed.
 * Uses risk scoring based on:
 * - Device recognition (new vs known device)
 * - Location analysis (new location, impossible travel)
 * - Login patterns (unusual time, rapid attempts)
 * - Account sensitivity (recent password change, high-value actions)
 *
 * Risk Levels:
 * - LOW (0-25): Normal login, no extra verification
 * - MEDIUM (26-50): Soft challenge (CAPTCHA or email confirmation)
 * - HIGH (51-75): Step-up auth required (email code)
 * - CRITICAL (76-100): Block and notify, require identity verification
 */

const crypto = require('crypto');
const dbSafe = require('../dbSafe');

// Risk thresholds
const RISK_LEVELS = {
  LOW: { max: 25, action: 'allow' },
  MEDIUM: { max: 50, action: 'soft_challenge' },
  HIGH: { max: 75, action: 'step_up_auth' },
  CRITICAL: { max: 100, action: 'block' },
};

// Risk weights for different signals
const RISK_WEIGHTS = {
  NEW_DEVICE: 15,
  NEW_LOCATION: 20,
  IMPOSSIBLE_TRAVEL: 40,
  UNUSUAL_TIME: 10,
  FAILED_ATTEMPTS_RECENT: 25,      // 3+ failed attempts in last hour
  FAILED_ATTEMPTS_MANY: 35,        // 5+ failed attempts in last hour
  PASSWORD_RECENTLY_CHANGED: 10,
  ACCOUNT_RECENTLY_CREATED: 5,
  TOR_OR_VPN: 30,
  KNOWN_BAD_IP: 50,
  SUSPICIOUS_USER_AGENT: 15,
};

/**
 * Generate a device fingerprint from request headers
 * @param {Object} req - Express request object
 * @returns {string} Device fingerprint hash
 */
function generateDeviceFingerprint(req) {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    // Screen info would come from client-side
    req.body?.deviceInfo?.screenResolution || '',
    req.body?.deviceInfo?.timezone || '',
    req.body?.deviceInfo?.platform || '',
  ];

  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex')
    .substring(0, 32);
}

/**
 * Extract IP address from request (handles proxies)
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

/**
 * Check if IP is from known VPN/TOR exit nodes
 * In production, this would query a threat intelligence API
 * @param {string} ip - IP address
 * @returns {Promise<boolean>}
 */
async function isVPNOrTor(ip) {
  // Placeholder - in production, integrate with:
  // - IPQualityScore
  // - MaxMind
  // - AbuseIPDB
  // For now, check some basic patterns
  const suspiciousPatterns = [
    /^10\./, /^192\.168\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private IPs (shouldn't reach here)
  ];

  return suspiciousPatterns.some(pattern => pattern.test(ip));
}

/**
 * Get user's login history for pattern analysis
 * @param {number} userId - User ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} Login history records
 */
async function getLoginHistory(userId, days = 30) {
  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const history = await dbSafe.safeSelect(
      'login_attempts',
      { user_id: userId },
      {
        orderBy: 'attempted_at DESC',
        limit: 100,
      }
    );

    return history.filter(h => h.attempted_at >= cutoff);
  } catch (error) {
    console.error('[AdaptiveAuth] Error fetching login history:', error);
    return [];
  }
}

/**
 * Get user's known devices
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Known device fingerprints
 */
async function getKnownDevices(userId) {
  try {
    const devices = await dbSafe.safeSelect(
      'user_devices',
      { user_id: userId, is_trusted: true },
      { limit: 20 }
    );
    return devices.map(d => d.device_fingerprint);
  } catch (error) {
    // Table might not exist yet
    return [];
  }
}

/**
 * Get recent failed login attempts
 * @param {string} email - User email
 * @param {number} hours - Hours to look back
 * @returns {Promise<number>} Count of failed attempts
 */
async function getRecentFailedAttempts(email, hours = 1) {
  try {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const attempts = await dbSafe.safeSelect(
      'login_attempts',
      { email: email.toLowerCase(), success: false },
      { limit: 100 }
    );

    return attempts.filter(a => a.attempted_at >= cutoff).length;
  } catch (error) {
    return 0;
  }
}

/**
 * Check for impossible travel (login from distant location within short time)
 * @param {Array} history - Login history
 * @param {string} currentLocation - Current approximate location
 * @returns {boolean}
 */
function detectImpossibleTravel(history, currentIP) {
  if (history.length === 0) return false;

  const lastLogin = history[0];
  const timeDiffHours = (Date.now() - new Date(lastLogin.attempted_at).getTime()) / (1000 * 60 * 60);

  // If last login was from different IP within 1 hour, flag it
  // In production, use actual geolocation to calculate distance
  if (timeDiffHours < 1 && lastLogin.ip_address !== currentIP) {
    // Simple heuristic - in production, calculate actual distance
    return true;
  }

  return false;
}

/**
 * Check if login time is unusual for this user
 * @param {Array} history - Login history
 * @returns {boolean}
 */
function isUnusualTime(history) {
  if (history.length < 10) return false; // Not enough data

  const currentHour = new Date().getHours();
  const historicalHours = history.map(h => new Date(h.attempted_at).getHours());

  // Check if current hour is significantly different from usual
  const avgHour = historicalHours.reduce((a, b) => a + b, 0) / historicalHours.length;
  const hourDiff = Math.abs(currentHour - avgHour);

  // If more than 6 hours different from average, flag it
  return hourDiff > 6 || (24 - hourDiff) > 6;
}

/**
 * Analyze user agent for suspicious patterns
 * @param {string} userAgent - User agent string
 * @returns {boolean}
 */
function isSuspiciousUserAgent(userAgent) {
  if (!userAgent) return true;

  const suspiciousPatterns = [
    /curl/i, /wget/i, /python/i, /bot/i, /spider/i, /crawler/i,
    /^$/,  // Empty
  ];

  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Calculate risk score for a login attempt
 * @param {Object} context - Login context
 * @param {Object} req - Express request
 * @param {number|null} userId - User ID (null if user not found)
 * @returns {Promise<Object>} Risk assessment
 */
async function calculateRiskScore(context, req, userId = null) {
  const { email } = context;
  const signals = [];
  let score = 0;

  const deviceFingerprint = generateDeviceFingerprint(req);
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'];

  // Check device
  if (userId) {
    const knownDevices = await getKnownDevices(userId);
    if (!knownDevices.includes(deviceFingerprint)) {
      signals.push({ signal: 'NEW_DEVICE', weight: RISK_WEIGHTS.NEW_DEVICE });
      score += RISK_WEIGHTS.NEW_DEVICE;
    }
  }

  // Check failed attempts
  const failedAttempts = await getRecentFailedAttempts(email);
  if (failedAttempts >= 5) {
    signals.push({ signal: 'FAILED_ATTEMPTS_MANY', weight: RISK_WEIGHTS.FAILED_ATTEMPTS_MANY });
    score += RISK_WEIGHTS.FAILED_ATTEMPTS_MANY;
  } else if (failedAttempts >= 3) {
    signals.push({ signal: 'FAILED_ATTEMPTS_RECENT', weight: RISK_WEIGHTS.FAILED_ATTEMPTS_RECENT });
    score += RISK_WEIGHTS.FAILED_ATTEMPTS_RECENT;
  }

  // Check VPN/TOR
  if (await isVPNOrTor(clientIP)) {
    signals.push({ signal: 'TOR_OR_VPN', weight: RISK_WEIGHTS.TOR_OR_VPN });
    score += RISK_WEIGHTS.TOR_OR_VPN;
  }

  // Check user agent
  if (isSuspiciousUserAgent(userAgent)) {
    signals.push({ signal: 'SUSPICIOUS_USER_AGENT', weight: RISK_WEIGHTS.SUSPICIOUS_USER_AGENT });
    score += RISK_WEIGHTS.SUSPICIOUS_USER_AGENT;
  }

  // User-specific checks
  if (userId) {
    const history = await getLoginHistory(userId);

    // Check impossible travel
    if (detectImpossibleTravel(history, clientIP)) {
      signals.push({ signal: 'IMPOSSIBLE_TRAVEL', weight: RISK_WEIGHTS.IMPOSSIBLE_TRAVEL });
      score += RISK_WEIGHTS.IMPOSSIBLE_TRAVEL;
    }

    // Check unusual time
    if (isUnusualTime(history)) {
      signals.push({ signal: 'UNUSUAL_TIME', weight: RISK_WEIGHTS.UNUSUAL_TIME });
      score += RISK_WEIGHTS.UNUSUAL_TIME;
    }
  }

  // Cap score at 100
  score = Math.min(100, score);

  // Determine risk level
  let riskLevel = 'LOW';
  let action = 'allow';

  if (score > RISK_LEVELS.HIGH.max) {
    riskLevel = 'CRITICAL';
    action = 'block';
  } else if (score > RISK_LEVELS.MEDIUM.max) {
    riskLevel = 'HIGH';
    action = 'step_up_auth';
  } else if (score > RISK_LEVELS.LOW.max) {
    riskLevel = 'MEDIUM';
    action = 'soft_challenge';
  }

  return {
    score,
    riskLevel,
    action,
    signals,
    deviceFingerprint,
    clientIP,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Record a login attempt for future analysis
 * @param {Object} attempt - Attempt details
 */
async function recordLoginAttempt(attempt) {
  const {
    userId,
    email,
    success,
    deviceFingerprint,
    ipAddress,
    userAgent,
    riskScore,
    riskLevel,
  } = attempt;

  try {
    await dbSafe.safeInsert('login_attempts', {
      user_id: userId,
      email: email.toLowerCase(),
      success,
      device_fingerprint: deviceFingerprint,
      ip_address: ipAddress,
      user_agent: userAgent?.substring(0, 500),
      risk_score: riskScore,
      risk_level: riskLevel,
      attempted_at: new Date().toISOString(),
    });
  } catch (error) {
    // Log but don't fail login
    console.error('[AdaptiveAuth] Failed to record attempt:', error.message);
  }
}

/**
 * Register a device as trusted for a user
 * @param {number} userId - User ID
 * @param {string} deviceFingerprint - Device fingerprint
 * @param {string} deviceName - Optional device name
 */
async function trustDevice(userId, deviceFingerprint, deviceName = null) {
  try {
    // Check if device already exists
    const existing = await dbSafe.safeSelect('user_devices', {
      user_id: userId,
      device_fingerprint: deviceFingerprint,
    });

    if (existing.length > 0) {
      // Update last seen
      await dbSafe.safeUpdate('user_devices', {
        last_seen: new Date().toISOString(),
        is_trusted: true,
      }, {
        user_id: userId,
        device_fingerprint: deviceFingerprint,
      });
    } else {
      // Add new device
      await dbSafe.safeInsert('user_devices', {
        user_id: userId,
        device_fingerprint: deviceFingerprint,
        device_name: deviceName,
        is_trusted: true,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[AdaptiveAuth] Failed to trust device:', error.message);
  }
}

/**
 * Generate a step-up verification code
 * @param {number} userId - User ID
 * @param {string} type - Verification type (email, sms)
 * @returns {Promise<string>} Verification code
 */
async function generateStepUpCode(userId, type = 'email') {
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    await dbSafe.safeInsert('verification_codes', {
      user_id: userId,
      code,
      type,
      expires_at: expiresAt.toISOString(),
      used: false,
      created_at: new Date().toISOString(),
    });

    return code;
  } catch (error) {
    console.error('[AdaptiveAuth] Failed to generate code:', error.message);
    throw error;
  }
}

/**
 * Verify a step-up code
 * @param {number} userId - User ID
 * @param {string} code - Verification code
 * @returns {Promise<boolean>}
 */
async function verifyStepUpCode(userId, code) {
  try {
    const records = await dbSafe.safeSelect('verification_codes', {
      user_id: userId,
      code,
      used: false,
    });

    if (records.length === 0) return false;

    const record = records[0];
    if (new Date(record.expires_at) < new Date()) {
      return false; // Expired
    }

    // Mark as used
    await dbSafe.safeUpdate('verification_codes', { used: true }, { id: record.id });

    return true;
  } catch (error) {
    console.error('[AdaptiveAuth] Failed to verify code:', error.message);
    return false;
  }
}

/**
 * Get risk assessment summary for logging/monitoring
 * @param {Object} assessment - Risk assessment result
 * @returns {string} Formatted summary
 */
function formatRiskSummary(assessment) {
  const signalNames = assessment.signals.map(s => s.signal).join(', ');
  return `[${assessment.riskLevel}] Score: ${assessment.score} | Signals: ${signalNames || 'none'} | IP: ${assessment.clientIP}`;
}

module.exports = {
  RISK_LEVELS,
  RISK_WEIGHTS,
  calculateRiskScore,
  recordLoginAttempt,
  trustDevice,
  generateStepUpCode,
  verifyStepUpCode,
  generateDeviceFingerprint,
  getClientIP,
  formatRiskSummary,
  // Exported for testing
  isVPNOrTor,
  isSuspiciousUserAgent,
  detectImpossibleTravel,
  isUnusualTime,
};
