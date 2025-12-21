/**
 * Server Utilities and Lifecycle Management
 */

const MAX_USERNAME_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 500;
const MAX_MESSAGE_HISTORY = 50;

/**
 * Decode HTML entities to catch encoded XSS attacks.
 * This decodes entities so we can then strip the dangerous content.
 */
function decodeHTMLEntities(str) {
  if (!str) return str;

  // Decode common HTML entities
  return (
    str
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#x27;/gi, "'")
      .replace(/&#x2F;/gi, '/')
      .replace(/&nbsp;/gi, ' ')
      // Decode hex entities (&#x3c; = <)
      .replace(/&#x([0-9a-fA-F]+);/gi, (match, hex) => {
        const code = parseInt(hex, 16);
        return code > 0 && code < 65536 ? String.fromCharCode(code) : '';
      })
      // Decode decimal entities (&#60; = <)
      .replace(/&#(\d+);/gi, (match, dec) => {
        const code = parseInt(dec, 10);
        return code > 0 && code < 65536 ? String.fromCharCode(code) : '';
      })
  );
}

/**
 * Strip all HTML tags and their content for script/style,
 * keeping only text content for other tags.
 */
function stripHtmlTags(str) {
  if (!str) return str;

  // Remove script and style tags with their content
  let result = str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove all HTML tags but keep text content
  result = result.replace(/<[^>]*>/g, '');

  return result;
}

/**
 * Sanitize user input to prevent XSS and limit length.
 *
 * Comprehensive protection against:
 * - HTML injection
 * - Script tags
 * - Event handlers (onclick, onerror, etc.)
 * - javascript: and data: URLs
 * - HTML entity encoded attacks
 * - Unicode encoded attacks
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  let sanitized = input;

  // Step 1: Decode HTML entities to catch encoded attacks
  // Run twice to catch double-encoding
  sanitized = decodeHTMLEntities(sanitized);
  sanitized = decodeHTMLEntities(sanitized);

  // Step 2: Strip all HTML tags
  sanitized = stripHtmlTags(sanitized);

  // Step 3: Remove dangerous patterns that might have slipped through

  // Remove javascript:, vbscript:, data: URLs (case-insensitive, with optional whitespace)
  sanitized = sanitized
    .replace(/j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, '')
    .replace(/v\s*b\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, '')
    .replace(/d\s*a\s*t\s*a\s*:/gi, '');

  // Remove event handlers (on*=)
  sanitized = sanitized.replace(/\bon\w+\s*=/gi, '');

  // Remove "script" word entirely (after decoding, could be part of attack)
  sanitized = sanitized.replace(/script/gi, '');

  // Remove any HTML tag-like patterns (< followed by letters)
  sanitized = sanitized.replace(/<\/?[a-z][^>]*>/gi, '');

  // Remove remaining < and > characters
  sanitized = sanitized.replace(/[<>]/g, '');

  // Step 4: Remove any img, svg, iframe related words that could be attack vectors
  sanitized = sanitized
    .replace(/\bimg\b/gi, '')
    .replace(/\bsvg\b/gi, '')
    .replace(/\biframe\b/gi, '')
    .replace(/\bobject\b/gi, '')
    .replace(/\bembed\b/gi, '');

  // Step 5: Trim and limit length
  return sanitized.trim().substring(0, MAX_MESSAGE_LENGTH);
}

/**
 * Validate username length and type
 */
function validateUsername(username) {
  if (typeof username !== 'string') return false;
  const clean = username.trim();
  return clean.length >= 2 && clean.length <= MAX_USERNAME_LENGTH;
}

/**
 * Health check route handler
 */
function healthCheckHandler(req, res, dbConnected, dbError) {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({
      status: 'error',
      error: 'DATABASE_URL not configured',
      message: 'Add DATABASE_URL environment variable in Railway dashboard',
      timestamp: new Date().toISOString(),
    });
  }

  if (dbError) {
    return res.status(503).json({
      status: 'error',
      error: 'Database connection failed',
      message: dbError,
      timestamp: new Date().toISOString(),
    });
  }

  res.status(200).json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'connecting',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Graceful shutdown handlers
 */
function setupGracefulShutdown(server) {
  const shutdown = signal => {
    console.log(`${signal} received, shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Global error handlers
 */
function setupGlobalErrorHandlers() {
  process.on('uncaughtException', error => {
    console.error('❌ Uncaught Exception:', error);
    console.error('Stack:', error.stack);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
  });
}

module.exports = {
  MAX_USERNAME_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_MESSAGE_HISTORY,
  sanitizeInput,
  validateUsername,
  healthCheckHandler,
  setupGracefulShutdown,
  setupGlobalErrorHandlers,
};
