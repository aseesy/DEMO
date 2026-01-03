/**
 * Central Configuration - Single Source of Truth
 *
 * All configuration values should be imported from this file.
 * Never hardcode ports, URLs, or other config values elsewhere.
 *
 * IMPORTANT: This file loads dotenv to ensure env vars are available
 * regardless of import order.
 */

// Ensure dotenv is loaded - safe to call multiple times
require('dotenv').config();

// =============================================================================
// ENV PARSING - Strip quotes, trim whitespace, validate
// =============================================================================

/**
 * Parse an environment variable: strip quotes, trim whitespace, remove newlines.
 * @param {string} name - Environment variable name
 * @param {object} options - { required?: boolean, isUrl?: boolean }
 * @returns {string|undefined} - Cleaned value or undefined
 */
function parseEnv(name, options = {}) {
  let value = process.env[name];
  if (value === undefined || value === '') {
    if (options.required) {
      console.error(`❌ FATAL: Required env var ${name} is not set`);
      process.exit(1);
    }
    return undefined;
  }

  // Strip surrounding quotes (single or double)
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  // Remove newlines and trim whitespace
  value = value.replace(/[\r\n]+/g, '').trim();

  // Validate URL format if specified
  if (options.isUrl && value) {
    try {
      new URL(value);
    } catch {
      console.error(`❌ FATAL: ${name} is not a valid URL: ${value}`);
      process.exit(1);
    }
  }

  return value;
}

// =============================================================================
// PORT CONFIGURATION - Single place to change default ports
// =============================================================================
const DEFAULT_BACKEND_PORT = 3000;
const DEFAULT_FRONTEND_PORT = 5173;

// Server Configuration
const SERVER_PORT = parseInt(process.env.PORT, 10) || DEFAULT_BACKEND_PORT;
const SERVER_HOST = '0.0.0.0';

// Environment (parse first - affects validation behavior)
const NODE_ENV = parseEnv('NODE_ENV') || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_DEVELOPMENT = NODE_ENV === 'development';

// Frontend URLs (for CORS) - uses default ports for fallback
const FRONTEND_URLS = (
  parseEnv('FRONTEND_URL') ||
  `http://localhost:${DEFAULT_FRONTEND_PORT},http://localhost:${DEFAULT_BACKEND_PORT}`
)
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);

// Production URLs
const PRODUCTION_DOMAINS = [
  'coparentliaizen.com',
  'www.coparentliaizen.com',
  'vercel.app',
  'railway.app',
];

// Database - REQUIRED in production
const DATABASE_URL = parseEnv('DATABASE_URL', {
  required: IS_PRODUCTION,
  isUrl: true,
});

// API Keys - warn if missing in production
const OPENAI_API_KEY = parseEnv('OPENAI_API_KEY');
const ANTHROPIC_API_KEY = parseEnv('ANTHROPIC_API_KEY');
if (IS_PRODUCTION && !OPENAI_API_KEY) {
  console.warn('⚠️ WARNING: OPENAI_API_KEY not set - AI features disabled');
}

// JWT - REQUIRED in production
const JWT_SECRET = parseEnv('JWT_SECRET', { required: IS_PRODUCTION });
const JWT_EXPIRES_IN = parseEnv('JWT_EXPIRES_IN') || '7d';

// Email
const EMAIL_CONFIG = {
  service: parseEnv('EMAIL_SERVICE') || 'gmail',
  user: parseEnv('GMAIL_USER'),
  password: parseEnv('GMAIL_APP_PASSWORD'),
  from: parseEnv('EMAIL_FROM') || parseEnv('GMAIL_USER'),
};

// Neo4j
const NEO4J_CONFIG = {
  uri: parseEnv('NEO4J_URI', { isUrl: true }),
  user: parseEnv('NEO4J_USER'),
  password: parseEnv('NEO4J_PASSWORD'),
};

// Rate Limiting
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: IS_PRODUCTION ? 500 : 1000,
  authMaxRequests: 50,
};

// Socket.io
const SOCKET_CONFIG = {
  pingTimeout: 25000, // Reduced from 60s - detect dead connections faster
  pingInterval: 15000, // Reduced from 25s - more responsive heartbeat
  maxHttpBufferSize: 1e5, // Reduced from 1MB to 100KB - prevent large payload abuse
  transports: ['websocket', 'polling'],
  // Connection state recovery (Socket.io 4.6+)
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: false, // Always run auth middleware on recovery
  },
};

// URLs for internal use
const getServerUrl = () => `http://localhost:${SERVER_PORT}`;
const getSocketUrl = () => `http://localhost:${SERVER_PORT}`;

// Export all configuration
module.exports = {
  // Env parsing utility (for other modules)
  parseEnv,

  // Default Ports (for scripts and fallbacks)
  DEFAULT_BACKEND_PORT,
  DEFAULT_FRONTEND_PORT,

  // Server
  SERVER_PORT,
  SERVER_HOST,

  // URLs
  FRONTEND_URLS,
  PRODUCTION_DOMAINS,
  getServerUrl,
  getSocketUrl,

  // Environment
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,

  // Database
  DATABASE_URL,

  // API Keys
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,

  // JWT
  JWT_SECRET,
  JWT_EXPIRES_IN,

  // Email
  EMAIL_CONFIG,

  // Neo4j
  NEO4J_CONFIG,

  // Rate Limiting
  RATE_LIMIT,

  // Socket.io
  SOCKET_CONFIG,
};
