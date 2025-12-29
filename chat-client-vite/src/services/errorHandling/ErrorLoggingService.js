/**
 * Error Logging Service
 *
 * Centralized service for logging errors to external services (Sentry, etc.)
 * and tracking fail-open metrics for alerting.
 */

/**
 * Log error to external service (Sentry, etc.)
 *
 * @param {Error} error - The error to log
 * @param {Object} context - Additional context
 * @param {string} context.location - Where the error occurred
 * @param {string} context.messagePreview - Preview of the message (first 50 chars)
 * @param {number} context.retryAttempts - Number of retry attempts
 * @param {boolean} context.failOpen - Whether this was a fail-open scenario
 * @param {string} context.category - Error category (critical, network, etc.)
 */
export function logErrorToService(error, context = {}) {
  const {
    location = 'unknown',
    messagePreview = '',
    retryAttempts = 0,
    failOpen = false,
    category = 'unknown',
  } = context;

  // Structured error data
  const errorData = {
    message: error.message,
    stack: error.stack,
    location,
    messagePreview: messagePreview.substring(0, 50),
    retryAttempts,
    failOpen,
    category,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  };

  // Log to console (always)
  console.error(
    `[ErrorLoggingService] ${failOpen ? '⚠️ Fail-open' : '❌ Fail-closed'} error:`,
    errorData
  );

  // Optional: Send to external error tracking service if configured
  // Note: Sentry was removed, but this pattern allows for future error tracking services
  // To add error tracking: Set window.errorTrackingService with captureException method
  if (typeof window !== 'undefined' && window.errorTrackingService?.captureException) {
    try {
      window.errorTrackingService.captureException(error, {
        tags: {
          location,
          category,
          failOpen: failOpen.toString(),
        },
        extra: errorData,
        level: failOpen ? 'warning' : 'error',
      });
    } catch (trackingError) {
      console.error('[ErrorLoggingService] Failed to send to error tracking service:', trackingError);
    }
  }

  // Track fail-open metrics for alerting
  if (failOpen) {
    trackFailOpenMetric(errorData);
  }

  // Send to custom logging endpoint if configured
  if (typeof window !== 'undefined' && window.ENV?.LOG_ENDPOINT) {
    sendToLoggingEndpoint(errorData).catch(err => {
      console.error('[ErrorLoggingService] Failed to send to logging endpoint:', err);
    });
  }
}

/**
 * Track fail-open metrics for alerting
 *
 * @param {Object} errorData - Error data
 */
function trackFailOpenMetric(errorData) {
  if (typeof window === 'undefined') return;

  // Store in sessionStorage for metrics aggregation
  try {
    const metricsKey = 'failOpenMetrics';
    const existing = sessionStorage.getItem(metricsKey);
    const metrics = existing ? JSON.parse(existing) : { count: 0, errors: [] };

    metrics.count += 1;
    metrics.errors.push({
      timestamp: errorData.timestamp,
      category: errorData.category,
      location: errorData.location,
    });

    // Keep only last 100 errors (prevent storage bloat)
    if (metrics.errors.length > 100) {
      metrics.errors = metrics.errors.slice(-100);
    }

    sessionStorage.setItem(metricsKey, JSON.stringify(metrics));

    // Check if we need to alert (fail-open rate > 5%)
    checkFailOpenRate(metrics);
  } catch (err) {
    console.error('[ErrorLoggingService] Failed to track fail-open metric:', err);
  }
}

/**
 * Check fail-open rate and alert if threshold exceeded
 *
 * @param {Object} metrics - Metrics data
 */
function checkFailOpenRate(metrics) {
  // Calculate rate over last 100 messages (approximate)
  // In production, this would be calculated server-side with actual message counts
  const recentErrors = metrics.errors.filter(
    err => new Date(err.timestamp) > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
  );

  const failOpenRate = recentErrors.length / 100; // Approximate rate (would be calculated server-side)

  // Alert if rate > 5%
  if (failOpenRate > 0.05) {
    console.warn(
      `[ErrorLoggingService] ⚠️ High fail-open rate detected: ${(failOpenRate * 100).toFixed(2)}%`
    );

    // Send alert to monitoring service
    if (typeof window !== 'undefined' && window.ENV?.ALERT_ENDPOINT) {
      sendAlert({
        type: 'high_fail_open_rate',
        rate: failOpenRate,
        count: recentErrors.length,
        timestamp: new Date().toISOString(),
      }).catch(err => {
        console.error('[ErrorLoggingService] Failed to send alert:', err);
      });
    }
  }
}

/**
 * Send error data to custom logging endpoint
 *
 * @param {Object} errorData - Error data
 * @returns {Promise<void>}
 */
async function sendToLoggingEndpoint(errorData) {
  if (!window.ENV?.LOG_ENDPOINT) return;

  try {
    const response = await fetch(window.ENV.LOG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
    });

    if (!response.ok) {
      throw new Error(`Logging endpoint returned ${response.status}`);
    }
  } catch (error) {
    // Don't throw - logging failures shouldn't break the app
    console.error('[ErrorLoggingService] Failed to send to logging endpoint:', error);
  }
}

/**
 * Send alert to monitoring service
 *
 * @param {Object} alertData - Alert data
 * @returns {Promise<void>}
 */
async function sendAlert(alertData) {
  if (!window.ENV?.ALERT_ENDPOINT) return;

  try {
    const response = await fetch(window.ENV.ALERT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertData),
    });

    if (!response.ok) {
      throw new Error(`Alert endpoint returned ${response.status}`);
    }
  } catch (error) {
    // Don't throw - alert failures shouldn't break the app
    console.error('[ErrorLoggingService] Failed to send alert:', error);
  }
}

/**
 * Get fail-open metrics for dashboard
 *
 * @returns {Object} Metrics data
 */
export function getFailOpenMetrics() {
  if (typeof window === 'undefined') return { count: 0, errors: [] };

  try {
    const metricsKey = 'failOpenMetrics';
    const existing = sessionStorage.getItem(metricsKey);
    return existing ? JSON.parse(existing) : { count: 0, errors: [] };
  } catch (err) {
    console.error('[ErrorLoggingService] Failed to get metrics:', err);
    return { count: 0, errors: [] };
  }
}

/**
 * Clear fail-open metrics (for testing)
 */
export function clearFailOpenMetrics() {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem('failOpenMetrics');
  } catch (err) {
    console.error('[ErrorLoggingService] Failed to clear metrics:', err);
  }
}
