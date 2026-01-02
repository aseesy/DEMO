require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Import refactored modules
const { healthCheckHandler, setupGracefulShutdown, setupGlobalErrorHandlers } = require('./utils');

const {
  setupGlobalMiddleware,
  setupCors,
  setupRateLimiting,
  setupErrorHandling,
  isOriginAllowed,
} = require('./middleware');

const { initDatabase, loadServices } = require('./database');
const { setupRoutes } = require('./routeManager');
const { setupSockets } = require('./sockets');

// Create app and server FIRST so health check can work even during startup issues
const app = express();
const server = http.createServer(app);

// Server constants
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

// Global variables for status
let dbConnected = false;
let dbError = null;

// Initialize Database and Services
initDatabase().then(status => {
  dbConnected = status.dbConnected;
  dbError = status.dbError;
});

// Load services
const services = loadServices();

// Register health check IMMEDIATELY so Railway can verify server is starting
app.get('/health', (req, res) => healthCheckHandler(req, res, dbConnected, dbError));

// Start server EARLY - before database initialization
server.listen(PORT, HOST, error => {
  if (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
  console.log(`✅ Server listening on ${HOST}:${PORT}`);
  console.log(`🏥 Health check ready at: http://${HOST}:${PORT}/health`);
});

// Setup Middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`
    );
  }
  next();
});
setupGlobalMiddleware(app);
const { allowedOrigins } = setupCors(app);
setupRateLimiting(app);

// Register API and Static Routes
setupRoutes(app, services);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Use the shared origin check logic
      if (!origin || origin === 'null' || isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
      } else {
        // Development fallbacks - be slightly more permissive in dev
        const isLocal =
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('http://192.168.') ||
          origin.startsWith('http://10.');

        if (isLocal) {
          callback(null, true);
        } else {
          console.warn(`Socket.io CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
  // Transport configuration: Use feature flag for consistency between dev and prod
  // Set SOCKET_FORCE_POLLING=true to force polling-only (useful for debugging)
  // Default: allow both polling and websocket in all environments for consistency
  transports: process.env.SOCKET_FORCE_POLLING === 'true' ? ['polling'] : ['polling', 'websocket'],
  allowEIO3: true,
  // Allow upgrades unless forced to polling-only
  allowUpgrades: process.env.SOCKET_FORCE_POLLING !== 'true',
});

// Initialize Socket Handlers
console.log('[Server] Socket.io path:', io.path());

// DEBUG: Log Engine.io level events
io.engine.on('connection', rawSocket => {
  console.log('[Engine.io] New raw connection:', rawSocket.id);
});
io.engine.on('connection_error', err => {
  console.log('[Engine.io] Connection error:', err.message, err.code);
});
io.engine.on('initial_headers', (headers, req) => {
  console.log('[Engine.io] Initial headers for:', req.url);
});

setupSockets(io, services);

// Configure Global Error Handling (Express)
setupErrorHandling(app);

// Setup global process error handlers and graceful shutdown
setupGlobalErrorHandlers();
setupGracefulShutdown(server, io, services);

// Final log
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);

// Export app for testing if needed
module.exports = app;
