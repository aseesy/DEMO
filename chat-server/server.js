require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

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
const isDev = process.env.NODE_ENV !== 'production';
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
  // In dev mode, use polling only to avoid session race conditions during upgrade
  // In production, allow both websocket and polling with websocket preferred
  transports: isDev ? ['polling'] : ['websocket', 'polling'],
  allowEIO3: true,
  // Allow upgrades only in production
  allowUpgrades: !isDev,
});

// VERY FIRST middleware - test if ANY middleware runs
io.use((socket, next) => {
  try {
    console.log(`[SERVER.JS] 🔥🔥🔥 FIRST MIDDLEWARE CALLED for socket ${socket.id} 🔥🔥🔥`);
    next();
  } catch (err) {
    console.error(`[SERVER.JS] ❌ MIDDLEWARE ERROR:`, err);
    next(err);
  }
});

// Catch any errors on the namespace itself
io.of('/').on('connect_error', err => {
  console.error(`[SERVER.JS] ❌ Namespace connect_error:`, err);
});

// CRITICAL: Hook into Socket.io connection events to track handshake processing
io.on('connection', socket => {
  console.log(
    `[HYPOTHESIS_T] ✅✅✅ Socket.io io.on('connection') FIRED for socket ${socket.id} ✅✅✅`
  );
  console.log(`[HYPOTHESIS_T] Socket handshake:`, {
    query: socket.handshake.query,
    _query: socket.handshake._query,
    auth: socket.handshake.auth,
    hasUser: !!socket.user,
  });
});

// CRITICAL: Hook into Socket.io error events
io.on('error', err => {
  console.error(`[HYPOTHESIS_T] ❌ Socket.io error:`, err);
});

// CRITICAL: Hook into Engine.io connection errors
io.engine.on('connection_error', err => {
  console.error('[Socket.io Engine] ❌ Connection error:', err.message, err);
  console.error('[Socket.io Engine] ❌ Connection error stack:', err.stack);
});

// CRITICAL: Hook into Engine.io connection events
io.engine.on('connection', socket => {
  console.log(`[Socket.io Engine] 🔌 New transport connection: ${socket.id}`);

  // Track when transport closes
  socket.on('close', (reason, description) => {
    console.log(
      `[Socket.io Engine] 🔒 Transport CLOSED: ${socket.id} - reason: ${reason}, desc: ${description}`
    );
  });

  socket.on('error', err => {
    console.log(`[Socket.io Engine] ⚠️ Transport ERROR: ${socket.id} - ${err}`);
  });

  // Log when packets are received
  socket.on('packet', packet => {
    console.log(
      `[Socket.io Engine] 📦 Packet from ${socket.id}:`,
      packet.type,
      packet.data?.substring?.(0, 100)
    );
  });
});

io.engine.on('initial_headers', (headers, req) => {
  console.log(`[Socket.io Engine] 📋 Initial headers for ${req.url}`);
});

// Log all incoming requests to socket.io path
console.log('[Server] Socket.io path:', io.path());

// Initialize Socket Handlers
setupSockets(io, services);

// Configure Global Error Handling (Express)
setupErrorHandling(app);

// Setup global process error handlers and graceful shutdown
setupGlobalErrorHandlers();
setupGracefulShutdown(server);

// Final log
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);

// Export app for testing if needed
module.exports = app;
