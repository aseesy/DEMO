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
 * Phase 1: Added connection pool monitoring
 * Phase 2: Added TaskManager and EventBus stats
 */
function healthCheckHandler(req, res, dbConnected, dbError) {
  // CRITICAL: Always return 200 for Railway health checks
  // Railway will kill the service if health check returns non-200
  // Database connection status is informational, not a failure condition

  const response = {
    status: 'ok',
    server: 'running',
    timestamp: new Date().toISOString(),
  };

  // Add database status as informational (not blocking)
  if (!process.env.DATABASE_URL) {
    response.database = 'not_configured';
    response.warning = 'DATABASE_URL not set - add PostgreSQL service in Railway';
  } else if (dbError) {
    response.database = 'error';
    response.databaseError = dbError;
    response.warning = 'Database connection failed - retrying in background';
  } else {
    response.database = {
      status: dbConnected ? 'connected' : 'connecting'
    };
    
    // Phase 1: Add pool stats if available
    try {
      const dbPostgres = require('./dbPostgres');
      const poolStats = dbPostgres.getPoolStats();
      if (poolStats) {
        response.database.pool = poolStats;
      }
    } catch (err) {
      // Ignore errors getting pool stats
    }
  }

  // Phase 2: Add TaskManager stats
  try {
    const { taskManager } = require('./src/infrastructure/tasks/TaskManager');
    response.tasks = {
      active: taskManager.getTaskCount(),
      details: taskManager.getActiveTasks().map(t => ({
        name: t.name,
        type: t.type,
        createdAt: t.createdAt
      }))
    };
  } catch (err) {
    // Ignore errors getting task stats
  }

  // Phase 2: Add EventBus stats
  try {
    const { eventBus } = require('./src/infrastructure/events/EventBus');
    const history = eventBus.getHistory(10);
    response.events = {
      recent: history.length,
      subscribers: eventBus.getSubscriberCount(),
      recentEvents: history.map(e => ({
        event: e.event,
        timestamp: e.timestamp
      }))
    };
  } catch (err) {
    // Ignore errors getting event stats
  }

  // Always return 200 - server is up and responding
  // Database connection is handled asynchronously and won't block server startup
  res.status(200).json(response);
}

/**
 * Graceful shutdown handlers
 * Phase 2: Complete shutdown - closes sockets, DB, and cancels tasks
 */
function setupGracefulShutdown(server, io, services) {
  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down gracefully...`);
    
    let shutdownComplete = false;

    // Phase 2: Cancel all background tasks first
    try {
      const { taskManager } = require('./src/infrastructure/tasks/TaskManager');
      const cancelledCount = taskManager.cancelAll();
      console.log(`[Shutdown] Cancelled ${cancelledCount} background tasks`);
    } catch (err) {
      console.warn('[Shutdown] Error cancelling tasks:', err.message);
    }

    // Phase 2: Close Socket.io server (disconnects all clients gracefully)
    if (io) {
      return new Promise((resolve) => {
        io.close(() => {
          console.log('[Shutdown] Socket.io server closed');
          
          // Close HTTP server
          server.close(() => {
            console.log('[Shutdown] HTTP server closed');
            
            // Phase 2: Close database connections
            if (services?.dbPostgres) {
              const db = services.dbPostgres;
              if (db.end) {
                db.end()
                  .then(() => {
                    console.log('[Shutdown] Database connections closed');
                    shutdownComplete = true;
                    process.exit(0);
                  })
                  .catch((err) => {
                    console.error('[Shutdown] Error closing database:', err.message);
                    shutdownComplete = true;
                    process.exit(1);
                  });
              } else {
                shutdownComplete = true;
                process.exit(0);
              }
            } else {
              shutdownComplete = true;
              process.exit(0);
            }
          });
        });
      });
    } else {
      // No Socket.io - just close HTTP server
      server.close(() => {
        console.log('[Shutdown] HTTP server closed');
        
        // Close database connections
        if (services?.dbPostgres) {
          const db = services.dbPostgres;
          if (db.end) {
            db.end()
              .then(() => {
                console.log('[Shutdown] Database connections closed');
                process.exit(0);
              })
              .catch((err) => {
                console.error('[Shutdown] Error closing database:', err.message);
                process.exit(1);
              });
          } else {
            process.exit(0);
          }
        } else {
          process.exit(0);
        }
      });
    }

    // Force exit after 10 seconds (safety timeout)
    setTimeout(() => {
      if (!shutdownComplete) {
        console.error('[Shutdown] Forced shutdown after timeout');
        process.exit(1);
      }
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
