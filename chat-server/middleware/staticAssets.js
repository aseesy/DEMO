/**
 * Static Assets Middleware
 *
 * Single Responsibility: Serve static assets and handle SPA routing.
 *
 * Handles:
 * - Static file serving (production)
 * - Favicon serving
 * - SPA fallback (index.html)
 * - API info endpoint
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const { defaultLogger: defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'staticAssets',
});

/**
 * Setup static asset serving middleware
 *
 * @param {Object} app - Express app instance
 */
function setupStaticAssets(app) {
  const distPath = path.join(__dirname, '../dist');

  // Only serve static assets if dist folder exists (production)
  if (fs.existsSync(distPath)) {
    // Serve static files with caching
    app.use(
      express.static(distPath, {
        maxAge: '1y',
        etag: true,
        lastModified: true,
      })
    );

    // Serve favicon
    app.get('/favicon.ico', (req, res) => {
      const fav = path.join(distPath, 'favicon.ico');
      if (fs.existsSync(fav)) {
        res.sendFile(fav);
      } else {
        res.status(404).end();
      }
    });

    // SPA fallback: serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
      // Skip API routes, admin routes, and health check
      if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/admin') ||
        req.path.startsWith('/health')
      ) {
        return next();
      }

      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        next();
      }
    });
  } else {
    // Development mode: return API info
    app.get('/', (req, res) => {
      res.json({
        name: 'LiaiZen API Server',
        status: 'running',
        endpoints: { api: '/api', health: '/health', admin: '/admin' },
      });
    });
  }

  // API info endpoint
  app.get('/api/info', (req, res) => {
    res.json({ name: 'LiaiZen Chat Server', version: '1.0.0' });
  });

  // DEBUG: Client-side log relay endpoint (TEMPORARY - remove after debugging)
  app.post('/api/debug-log', express.json(), (req, res) => {
    const { message, data, timestamp } = req.body;
    logger.debug('Log message', {
      arg0: `[CLIENT-DEBUG] ${timestamp} - ${message}`,
      arg1: JSON.stringify(data || {}, null, 2),
    });
    res.json({ received: true });
  });
}

module.exports = {
  setupStaticAssets,
};
