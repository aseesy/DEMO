/**
 * Spam Protection Middleware
 *
 * Provides honeypot validation, rate limiting, and reCAPTCHA v3 verification
 * to protect forms from bots and spam.
 */

// In-memory rate limit store (use Redis in production for multi-instance)
const rateLimitStore = new Map();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.firstRequest > 3600000) {
      // 1 hour
      rateLimitStore.delete(key);
    }
  }
}, 600000);

/**
 * Get client IP address from request
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

/**
 * Honeypot field validation middleware
 *
 * Checks for a honeypot field that should be empty.
 * Bots typically fill all form fields, so if this field has a value, reject the request.
 *
 * The honeypot field should be hidden via CSS (not type="hidden") so bots still see it.
 * Common names: website, url, company, fax, phone2
 */
function honeypotCheck(fieldName = 'website') {
  return (req, res, next) => {
    const honeypotValue = req.body[fieldName];

    // If honeypot field is filled, silently reject (don't give bots info)
    if (honeypotValue && honeypotValue.trim() !== '') {
      console.log(
        `[SPAM] Honeypot triggered from IP: ${getClientIP(req)}, field: ${fieldName}=${honeypotValue}`
      );

      // Return success to not tip off the bot, but don't actually process
      return res.json({
        success: true,
        message: 'Your message has been sent successfully.',
      });
    }

    // Remove honeypot field from body so it doesn't get processed
    delete req.body[fieldName];
    next();
  };
}

/**
 * Rate limiting middleware
 *
 * Limits requests per IP address within a time window.
 *
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds (default: 1 hour)
 * @param {number} options.maxRequests - Max requests per window (default: 5)
 * @param {string} options.message - Error message for rate limited requests
 */
function rateLimit(options = {}) {
  const {
    windowMs = 3600000, // 1 hour
    maxRequests = 5,
    message = 'Too many requests. Please try again later.',
  } = options;

  return (req, res, next) => {
    const clientIP = getClientIP(req);
    const key = `${req.path}:${clientIP}`;
    const now = Date.now();

    let data = rateLimitStore.get(key);

    if (!data) {
      data = { count: 0, firstRequest: now };
    }

    // Reset if window has passed
    if (now - data.firstRequest > windowMs) {
      data = { count: 0, firstRequest: now };
    }

    data.count++;
    rateLimitStore.set(key, data);

    // Add rate limit headers
    res.set('X-RateLimit-Limit', maxRequests.toString());
    res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - data.count).toString());
    res.set('X-RateLimit-Reset', new Date(data.firstRequest + windowMs).toISOString());

    if (data.count > maxRequests) {
      console.log(
        `[RATE LIMIT] IP ${clientIP} exceeded limit for ${req.path}: ${data.count}/${maxRequests}`
      );
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((data.firstRequest + windowMs - now) / 1000),
      });
    }

    next();
  };
}

/**
 * reCAPTCHA v3 verification middleware
 *
 * Verifies Google reCAPTCHA v3 token.
 * Requires RECAPTCHA_SECRET_KEY environment variable.
 *
 * @param {Object} options - Configuration options
 * @param {number} options.minScore - Minimum score threshold (0.0-1.0, default: 0.5)
 * @param {string} options.action - Expected action name
 */
function recaptchaVerify(options = {}) {
  const { minScore = 0.5, action = null } = options;

  return async (req, res, next) => {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    // Skip if reCAPTCHA is not configured
    if (!secretKey) {
      console.log('[RECAPTCHA] Secret key not configured, skipping verification');
      return next();
    }

    const token = req.body.recaptchaToken || req.body['g-recaptcha-response'];

    // Skip if no token provided (for backward compatibility)
    if (!token) {
      console.log('[RECAPTCHA] No token provided, skipping verification');
      return next();
    }

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${secretKey}&response=${token}&remoteip=${getClientIP(req)}`,
      });

      const data = await response.json();

      if (!data.success) {
        console.log(`[RECAPTCHA] Verification failed: ${JSON.stringify(data['error-codes'])}`);
        return res.status(400).json({
          error: 'Security verification failed. Please try again.',
        });
      }

      // Check score for v3
      if (data.score !== undefined && data.score < minScore) {
        console.log(
          `[RECAPTCHA] Low score: ${data.score} (min: ${minScore}) from IP: ${getClientIP(req)}`
        );
        return res.status(400).json({
          error: 'Security verification failed. Please try again.',
        });
      }

      // Check action if specified
      if (action && data.action !== action) {
        console.log(`[RECAPTCHA] Action mismatch: expected ${action}, got ${data.action}`);
        return res.status(400).json({
          error: 'Security verification failed. Please try again.',
        });
      }

      // Remove token from body
      delete req.body.recaptchaToken;
      delete req.body['g-recaptcha-response'];

      // Add score to request for logging
      req.recaptchaScore = data.score;

      next();
    } catch (error) {
      console.error('[RECAPTCHA] Verification error:', error);
      // Allow request to proceed on verification error (fail open)
      next();
    }
  };
}

/**
 * Combined spam protection middleware
 * Applies honeypot, rate limiting, and reCAPTCHA in sequence.
 */
function spamProtection(options = {}) {
  const {
    honeypotField = 'website',
    rateLimit: rateLimitOptions = {},
    recaptcha: recaptchaOptions = {},
  } = options;

  const middlewares = [honeypotCheck(honeypotField), rateLimit(rateLimitOptions)];

  // Only add reCAPTCHA if configured
  if (process.env.RECAPTCHA_SECRET_KEY) {
    middlewares.push(recaptchaVerify(recaptchaOptions));
  }

  return (req, res, next) => {
    // Chain middlewares
    let index = 0;
    const runNext = err => {
      if (err) return next(err);
      if (index >= middlewares.length) return next();
      middlewares[index++](req, res, runNext);
    };
    runNext();
  };
}

/**
 * Disposable email domain check
 * Rejects emails from known disposable email providers.
 */
const DISPOSABLE_DOMAINS = new Set([
  'guerrillamail.com',
  'guerrillamail.org',
  'sharklasers.com',
  'mailinator.com',
  'maildrop.cc',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'throwaway.email',
  'fakeinbox.com',
  'trashmail.com',
  'yopmail.com',
  'tempail.com',
  'dispostable.com',
  'mailnesia.com',
  'tempr.email',
  'discard.email',
  'spamgourmet.com',
]);

function rejectDisposableEmail(req, res, next) {
  const email = req.body.email;

  if (email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && DISPOSABLE_DOMAINS.has(domain)) {
      console.log(`[SPAM] Disposable email rejected: ${email} from IP: ${getClientIP(req)}`);
      return res.status(400).json({
        error: 'Please use a permanent email address, not a disposable one.',
      });
    }
  }

  next();
}

module.exports = {
  honeypotCheck,
  rateLimit,
  recaptchaVerify,
  spamProtection,
  rejectDisposableEmail,
  getClientIP,
};
