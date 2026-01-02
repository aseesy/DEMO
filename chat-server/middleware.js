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
 * Check if origin is allowed
 */
function isOriginAllowed(origin, allowedList) {
  if (!origin || origin === 'null') return true;

  // Local development flexibility
  if (
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    origin.startsWith('http://192.168.') ||
    origin.startsWith('http://10.') ||
    origin.endsWith('.local:5173') ||
    origin.endsWith('.local:3000')
  ) {
    return true;
  }

  if (origin.includes('.vercel.app') || origin.includes('vercel.app')) return true;
  if (origin.includes('coparentliaizen.com')) return true;
  if (origin.includes('.railway.app') || origin.includes('railway.app')) return true;

  if (allowedList.includes(origin) || allowedList.includes('*')) return true;

  for (const allowed of allowedList) {
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) return true;
    }
  }

  return false;
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

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || origin === 'null' || isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
      } else {
        if (
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('http://192.168.')
        ) {
          callback(null, true);
        } else {
          console.warn(`CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
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
