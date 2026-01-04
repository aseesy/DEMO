/**
 * Middleware Configuration
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Central configuration - Single Source of Truth
const {
  SERVER_PORT,
  FRONTEND_URLS,
  PRODUCTION_DOMAINS,
  IS_PRODUCTION,
  RATE_LIMIT,
} = require('./config');

/**
 * Configure global middleware
 */
function setupGlobalMiddleware(app) {
  // Trust proxy for rate limiting (important for Railway/load balancers)
  if (IS_PRODUCTION) {
    app.set('trust proxy', 1);
  }

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
          scriptSrcAttr: ["'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: [
            "'self'",
            'http://localhost:*',
            'ws://localhost:*',
            'http://127.0.0.1:*',
            'ws://127.0.0.1:*',
            '*.vercel.app',
            'https://coparentliaizen.com',
            'https://www.coparentliaizen.com',
            'https://app.coparentliaizen.com',
          ],
          fontSrc: ["'self'", 'https:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    })
  );

  // JSON and URL encoded body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parsing
  app.use(cookieParser());

  // Error handler for JSON payload too large
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({
        error:
          'Request payload too large or invalid JSON. Please reduce the size of your text fields.',
        details: !IS_PRODUCTION ? err.message : undefined,
      });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({
        error: 'Request payload too large. Please reduce the size of your text fields.',
        details: !IS_PRODUCTION ? err.message : undefined,
      });
    }
    next(err);
  });
}

/**
 * Normalize an origin by parsing it and lowercasing the hostname
 * @param {string} origin - Raw origin string
 * @returns {{ hostname: string, normalized: string } | null}
 */
function normalizeOrigin(origin) {
  if (!origin || origin === 'null') return null;
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    // Normalize: protocol + lowercase hostname (drop port if default)
    const normalized = `${url.protocol}//${hostname}`;
    return { hostname, normalized };
  } catch {
    return null;
  }
}

/**
 * Frozen allowlist of production domains (hostnames only, lowercase)
 */
const ALLOWED_HOSTNAMES = Object.freeze([
  'coparentliaizen.com',
  'www.coparentliaizen.com',
  'app.coparentliaizen.com',
]);

/**
 * Frozen allowlist of domain suffixes (for platform wildcards)
 */
const ALLOWED_SUFFIXES = Object.freeze(['.vercel.app', '.railway.app']);

/**
 * Check if origin is allowed
 * @param {string} origin - Request origin
 * @param {string[]} allowedList - Additional allowed origins from config
 * @returns {{ allowed: boolean, reason: string }}
 */
function isOriginAllowed(origin, allowedList) {
  // No origin (same-origin or server-to-server) - allow
  if (!origin || origin === 'null') {
    return { allowed: true, reason: 'no-origin' };
  }

  const parsed = normalizeOrigin(origin);
  if (!parsed) {
    return { allowed: false, reason: `invalid-url: ${origin}` };
  }

  const { hostname } = parsed;

  // Local development - allow all localhost/private IPs
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local')
  ) {
    return { allowed: true, reason: 'local-dev' };
  }

  // Check frozen production hostnames (exact match, case-insensitive via normalization)
  if (ALLOWED_HOSTNAMES.includes(hostname)) {
    return { allowed: true, reason: `allowed-hostname: ${hostname}` };
  }

  // Check frozen domain suffixes (Vercel, Railway)
  for (const suffix of ALLOWED_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      return { allowed: true, reason: `allowed-suffix: ${suffix}` };
    }
  }

  // Check config allowlist (exact match)
  if (allowedList.includes('*')) {
    return { allowed: true, reason: 'wildcard-allowlist' };
  }

  for (const allowed of allowedList) {
    const allowedParsed = normalizeOrigin(allowed);
    if (allowedParsed && allowedParsed.hostname === hostname) {
      return { allowed: true, reason: `config-allowlist: ${allowed}` };
    }
  }

  // Wildcard patterns in config
  for (const allowed of allowedList) {
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`, 'i');
      if (regex.test(origin)) {
        return { allowed: true, reason: `config-pattern: ${allowed}` };
      }
    }
  }

  return {
    allowed: false,
    reason: `not-in-allowlist: hostname=${hostname}, checked=[${ALLOWED_HOSTNAMES.join(',')}] + suffixes=[${ALLOWED_SUFFIXES.join(',')}]`,
  };
}

/**
 * Configure CORS
 */
function setupCors(app) {
  // Use FRONTEND_URLS from central config
  const allowedOrigins = [...FRONTEND_URLS];

  // Add server origin if not already included
  const serverOrigin = `http://localhost:${SERVER_PORT}`;
  if (!allowedOrigins.includes(serverOrigin)) {
    allowedOrigins.push(serverOrigin);
  }

  // Log CORS configuration in production for debugging
  if (IS_PRODUCTION) {
    console.log(`[CORS] Configuration loaded:`);
    console.log(`[CORS] FRONTEND_URL env var: ${process.env.FRONTEND_URL || 'NOT SET'}`);
    console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
  }

  const corsOptions = {
    origin: (origin, callback) => {
      const result = isOriginAllowed(origin, allowedOrigins);

      if (result.allowed) {
        if (IS_PRODUCTION && origin) {
          console.log(`[CORS] ✅ ${origin} → ${result.reason}`);
        }
        callback(null, true);
      } else {
        console.warn(`[CORS] ❌ BLOCKED: ${origin}`);
        console.warn(`[CORS] Reason: ${result.reason}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204,
    preflightContinue: false,
  };

  app.use(cors(corsOptions));

  return { allowedOrigins, corsOptions, isOriginAllowed };
}

/**
 * Configure rate limiting
 */
function setupRateLimiting(app) {
  const limiter = rateLimit({
    windowMs: RATE_LIMIT.windowMs,
    max: RATE_LIMIT.maxRequests,
    skip: req => req.path.startsWith('/api/auth/'),
    validate: { trustProxy: false },
  });

  const authLimiter = rateLimit({
    windowMs: RATE_LIMIT.windowMs,
    max: RATE_LIMIT.authMaxRequests,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    validate: { trustProxy: false },
  });

  app.use(limiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/signup', authLimiter);

  return { limiter, authLimiter };
}

/**
 * Configure custom error handling
 */
function setupErrorHandling(app) {
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);

    console.error('❌ Server Error:', err.stack);

    if (err.message === 'Not allowed by CORS') {
      return res.status(403).json({
        error: 'CORS Error',
        message: 'Origin not allowed',
      });
    }

    res.status(err.status || 500).json({
      error: 'Server Error',
      message: !IS_PRODUCTION ? err.message : 'An internal error occurred',
    });
  });
}

module.exports = {
  setupGlobalMiddleware,
  setupCors,
  setupRateLimiting,
  setupErrorHandling,
  isOriginAllowed,
};
