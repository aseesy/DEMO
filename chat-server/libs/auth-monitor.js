/**
 * Authentication Monitoring Utility
 *
 * Provides real-time monitoring and alerting for authentication system issues.
 * Issues will self-present through structured logging that can be picked up by
 * external monitoring systems (Railway logs, Datadog, etc.)
 *
 * CRITICAL ALERTS: These indicate immediate user impact
 * WARNING ALERTS: These indicate potential issues
 * INFO: Normal operation logging
 */

const { defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'authMonitor',
});

const AUTH_EVENTS = {
  // Successful operations
  SIGNUP_SUCCESS: 'auth.signup.success',
  LOGIN_SUCCESS: 'auth.login.success',
  VERIFY_SUCCESS: 'auth.verify.success',
  INVITE_SENT: 'auth.invite.sent',
  INVITE_ACCEPTED: 'auth.invite.accepted',
  ROOM_CREATED: 'auth.room.created',
  PASSWORD_MIGRATED: 'auth.password.migrated',

  // Failures that affect users
  SIGNUP_FAILED: 'auth.signup.failed',
  LOGIN_FAILED: 'auth.login.failed',
  VERIFY_FAILED: 'auth.verify.failed',
  INVITE_FAILED: 'auth.invite.failed',
  ROOM_CREATION_FAILED: 'auth.room.failed',

  // Specific error types
  EMAIL_DUPLICATE: 'auth.error.email_duplicate',
  ACCOUNT_NOT_FOUND: 'auth.error.account_not_found',
  INVALID_PASSWORD: 'auth.error.invalid_password',
  OAUTH_ONLY: 'auth.error.oauth_only',
  TOKEN_EXPIRED: 'auth.error.token_expired',
  TOKEN_INVALID: 'auth.error.token_invalid',
  INVITE_EXPIRED: 'auth.error.invite_expired',
  INVITE_ALREADY_USED: 'auth.error.invite_already_used',

  // System issues
  DB_ERROR: 'auth.system.db_error',
  RATE_LIMITED: 'auth.system.rate_limited',
  USERNAME_COLLISION: 'auth.system.username_collision',
};

const SEVERITY = {
  CRITICAL: 'CRITICAL', // Immediate user impact, needs attention now
  WARNING: 'WARNING', // Potential issue, monitor closely
  INFO: 'INFO', // Normal operation
  DEBUG: 'DEBUG', // Detailed debugging info
};

/**
 * Metrics tracking for rate monitoring
 */
const metrics = {
  signupAttempts: { success: 0, failed: 0 },
  loginAttempts: { success: 0, failed: 0 },
  verifyAttempts: { success: 0, failed: 0 },
  inviteAttempts: { success: 0, failed: 0 },
  errors: {
    emailDuplicate: 0,
    accountNotFound: 0,
    invalidPassword: 0,
    tokenExpired: 0,
    dbErrors: 0,
  },
  lastReset: Date.now(),
};

/**
 * Reset metrics periodically (every hour)
 */
function resetMetricsIfNeeded() {
  const oneHour = 60 * 60 * 1000;
  if (Date.now() - metrics.lastReset > oneHour) {
    Object.keys(metrics.signupAttempts).forEach(k => (metrics.signupAttempts[k] = 0));
    Object.keys(metrics.loginAttempts).forEach(k => (metrics.loginAttempts[k] = 0));
    Object.keys(metrics.verifyAttempts).forEach(k => (metrics.verifyAttempts[k] = 0));
    Object.keys(metrics.inviteAttempts).forEach(k => (metrics.inviteAttempts[k] = 0));
    Object.keys(metrics.errors).forEach(k => (metrics.errors[k] = 0));
    metrics.lastReset = Date.now();
  }
}

/**
 * Log an authentication event with structured data
 * Format is designed to be parseable by log aggregation systems
 */
function logAuthEvent(event, severity, data = {}) {
  resetMetricsIfNeeded();

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    severity,
    service: 'auth',
    ...data,
  };

  // Format for easy grep/search in Railway logs
  const prefix =
    severity === SEVERITY.CRITICAL
      ? '🚨 CRITICAL'
      : severity === SEVERITY.WARNING
        ? '⚠️ WARNING'
        : severity === SEVERITY.INFO
          ? '✅ INFO'
          : '🔍 DEBUG';

  const message = `[AUTH] ${prefix} | ${event} | ${JSON.stringify(logEntry)}`;

  // Use appropriate console method based on severity
  if (severity === SEVERITY.CRITICAL) {
    logger.error('Error occurred', message, {});
  } else if (severity === SEVERITY.WARNING) {
    logger.warn('message logged', {
      message: message,
    });
  } else {
    logger.debug('message logged', {
      message: message,
    });
  }

  return logEntry;
}

/**
 * Track signup attempt
 */
function trackSignup(success, email, errorCode = null, errorMessage = null) {
  if (success) {
    metrics.signupAttempts.success++;
    logAuthEvent(AUTH_EVENTS.SIGNUP_SUCCESS, SEVERITY.INFO, {
      email: maskEmail(email),
    });
  } else {
    metrics.signupAttempts.failed++;

    // Track specific error
    if (errorCode === 'REG_001' || errorMessage?.includes('Email already exists')) {
      metrics.errors.emailDuplicate++;
    }

    logAuthEvent(AUTH_EVENTS.SIGNUP_FAILED, SEVERITY.WARNING, {
      email: maskEmail(email),
      errorCode,
      errorMessage,
    });

    // Alert if high failure rate
    checkFailureRate('signup', metrics.signupAttempts);
  }
}

/**
 * Track login attempt
 */
function trackLogin(success, email, errorCode = null, errorMessage = null) {
  if (success) {
    metrics.loginAttempts.success++;
    logAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, SEVERITY.INFO, {
      email: maskEmail(email),
    });
  } else {
    metrics.loginAttempts.failed++;

    // Track specific errors
    if (errorCode === 'ACCOUNT_NOT_FOUND') {
      metrics.errors.accountNotFound++;
    } else if (errorCode === 'INVALID_PASSWORD') {
      metrics.errors.invalidPassword++;
    }

    const severity = errorCode === 'INVALID_PASSWORD' ? SEVERITY.INFO : SEVERITY.WARNING;
    logAuthEvent(AUTH_EVENTS.LOGIN_FAILED, severity, {
      email: maskEmail(email),
      errorCode,
    });

    // Alert if high invalid password rate (potential brute force)
    if (metrics.errors.invalidPassword > 50) {
      logAuthEvent('auth.alert.brute_force_suspected', SEVERITY.CRITICAL, {
        invalidPasswordAttempts: metrics.errors.invalidPassword,
        windowMinutes: 60,
      });
    }
  }
}

/**
 * Track session verification
 */
function trackVerify(success, userId, errorType = null) {
  if (success) {
    metrics.verifyAttempts.success++;
    logAuthEvent(AUTH_EVENTS.VERIFY_SUCCESS, SEVERITY.DEBUG, { userId });
  } else {
    metrics.verifyAttempts.failed++;

    if (errorType === 'expired') {
      metrics.errors.tokenExpired++;
    }

    logAuthEvent(AUTH_EVENTS.VERIFY_FAILED, SEVERITY.INFO, {
      errorType,
    });
  }
}

/**
 * Track invitation events
 */
function trackInvitation(event, success, data = {}) {
  if (event === 'sent') {
    if (success) {
      metrics.inviteAttempts.success++;
      logAuthEvent(AUTH_EVENTS.INVITE_SENT, SEVERITY.INFO, {
        inviterEmail: maskEmail(data.inviterEmail),
        inviteeEmail: maskEmail(data.inviteeEmail),
      });
    } else {
      metrics.inviteAttempts.failed++;
      logAuthEvent(AUTH_EVENTS.INVITE_FAILED, SEVERITY.WARNING, {
        inviterEmail: maskEmail(data.inviterEmail),
        inviteeEmail: maskEmail(data.inviteeEmail),
        error: data.error,
      });
    }
  } else if (event === 'accepted') {
    logAuthEvent(AUTH_EVENTS.INVITE_ACCEPTED, SEVERITY.INFO, {
      inviteeEmail: maskEmail(data.inviteeEmail),
      roomId: data.roomId,
    });
  }
}

/**
 * Track database errors
 */
function trackDbError(operation, error) {
  metrics.errors.dbErrors++;
  logAuthEvent(AUTH_EVENTS.DB_ERROR, SEVERITY.CRITICAL, {
    operation,
    error: error.message,
    code: error.code,
  });

  // Alert if multiple DB errors
  if (metrics.errors.dbErrors > 5) {
    logAuthEvent('auth.alert.db_issues', SEVERITY.CRITICAL, {
      dbErrorCount: metrics.errors.dbErrors,
      windowMinutes: 60,
      message: 'Multiple database errors detected - check database connectivity',
    });
  }
}

/**
 * Track room creation
 */
function trackRoomCreation(success, roomId, userId1, userId2, error = null) {
  if (success) {
    logAuthEvent(AUTH_EVENTS.ROOM_CREATED, SEVERITY.INFO, {
      roomId,
      users: [userId1, userId2],
    });
  } else {
    logAuthEvent(AUTH_EVENTS.ROOM_CREATION_FAILED, SEVERITY.CRITICAL, {
      users: [userId1, userId2],
      error: error?.message,
    });
  }
}

/**
 * Check failure rate and alert if too high
 */
function checkFailureRate(operation, counters) {
  const total = counters.success + counters.failed;
  if (total < 10) return; // Need minimum sample size

  const failureRate = counters.failed / total;

  if (failureRate > 0.5) {
    logAuthEvent(`auth.alert.high_failure_rate`, SEVERITY.CRITICAL, {
      operation,
      failureRate: (failureRate * 100).toFixed(1) + '%',
      failed: counters.failed,
      total,
      message: `${operation} failure rate is above 50% - investigate immediately`,
    });
  } else if (failureRate > 0.2) {
    logAuthEvent(`auth.alert.elevated_failure_rate`, SEVERITY.WARNING, {
      operation,
      failureRate: (failureRate * 100).toFixed(1) + '%',
      failed: counters.failed,
      total,
    });
  }
}

/**
 * Mask email for logging (privacy)
 */
function maskEmail(email) {
  if (!email) return '[no-email]';
  const [local, domain] = email.split('@');
  if (!domain) return '[invalid-email]';
  const maskedLocal = local.substring(0, 2) + '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Get current metrics summary
 */
function getMetricsSummary() {
  const now = Date.now();
  const windowMinutes = Math.round((now - metrics.lastReset) / 60000);

  return {
    windowMinutes,
    signup: {
      ...metrics.signupAttempts,
      successRate:
        metrics.signupAttempts.success + metrics.signupAttempts.failed > 0
          ? (
              (metrics.signupAttempts.success /
                (metrics.signupAttempts.success + metrics.signupAttempts.failed)) *
              100
            ).toFixed(1) + '%'
          : 'N/A',
    },
    login: {
      ...metrics.loginAttempts,
      successRate:
        metrics.loginAttempts.success + metrics.loginAttempts.failed > 0
          ? (
              (metrics.loginAttempts.success /
                (metrics.loginAttempts.success + metrics.loginAttempts.failed)) *
              100
            ).toFixed(1) + '%'
          : 'N/A',
    },
    errors: metrics.errors,
  };
}

/**
 * Health check for auth system
 */
async function healthCheck(dbSafe) {
  const checks = {
    database: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Test database connection
    const result = await dbSafe.safeSelect('users', {}, { limit: 1 });
    checks.database = true;
  } catch (error) {
    trackDbError('health_check', error);
  }

  const healthy = checks.database;

  if (!healthy) {
    logAuthEvent('auth.health.unhealthy', SEVERITY.CRITICAL, checks);
  }

  return {
    healthy,
    checks,
    metrics: getMetricsSummary(),
  };
}

module.exports = {
  AUTH_EVENTS,
  SEVERITY,
  logAuthEvent,
  trackSignup,
  trackLogin,
  trackVerify,
  trackInvitation,
  trackDbError,
  trackRoomCreation,
  getMetricsSummary,
  healthCheck,
};
