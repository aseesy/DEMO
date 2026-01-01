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
// PORT CONFIGURATION - Single place to change default ports
// =============================================================================
const DEFAULT_BACKEND_PORT = 3000;
const DEFAULT_FRONTEND_PORT = 5173;

// Server Configuration
const SERVER_PORT = parseInt(process.env.PORT, 10) || DEFAULT_BACKEND_PORT;
const SERVER_HOST = '0.0.0.0';

// Frontend URLs (for CORS) - uses default ports for fallback
const FRONTEND_URLS = (
  process.env.FRONTEND_URL ||
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

// Environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_DEVELOPMENT = NODE_ENV === 'development';

// Database
const DATABASE_URL = process.env.DATABASE_URL;

// API Keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Email
const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  user: process.env.GMAIL_USER,
  password: process.env.GMAIL_APP_PASSWORD,
  from: process.env.EMAIL_FROM || process.env.GMAIL_USER,
};

// Neo4j
const NEO4J_CONFIG = {
  uri: process.env.NEO4J_URI,
  user: process.env.NEO4J_USER,
  password: process.env.NEO4J_PASSWORD,
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
