require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Central configuration - Single Source of Truth
const { SERVER_PORT, SERVER_HOST, NODE_ENV, IS_PRODUCTION, SOCKET_CONFIG } = require('./config');

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
const { requireDatabaseReadyExceptHealth } = require('./middleware/dbReady');

// Create app and server FIRST so health check can work even during startup issues
const app = express();
const server = http.createServer(app);

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
// /health - Liveness check (always 200 if server is running)
app.get('/health', (req, res) => healthCheckHandler(req, res, dbConnected, dbError));

// /ready - Readiness check (503 if database not connected)
// Use this for load balancers to know when to route traffic
app.get('/ready', (req, res) => {
  const db = require('./dbPostgres');
  if (db.isReady()) {
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      database: 'connecting',
      message: 'Database connection is being established',
      retryAfter: 5,
      timestamp: new Date().toISOString(),
    });
  }
});

// Start server EARLY - before database initialization
server.listen(SERVER_PORT, SERVER_HOST, error => {
  if (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
  console.log(`✅ Server listening on ${SERVER_HOST}:${SERVER_PORT}`);
  console.log(`🏥 Health check ready at: http://${SERVER_HOST}:${SERVER_PORT}/health`);
});

// Setup Middleware
app.use((req, res, next) => {
  if (!IS_PRODUCTION) {
    // Log socket.io requests with special marker for debugging
    if (req.url.startsWith('/socket.io')) {
      console.log(
        `[${new Date().toISOString()}] 🔌 SOCKET.IO ${req.method} ${req.url} - Origin: ${req.headers.origin}`
      );
    } else {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`
      );
    }
  }
  next();
});
setupGlobalMiddleware(app);
const { allowedOrigins } = setupCors(app);
setupRateLimiting(app);

// CRITICAL: Protect all API routes from executing before database is ready
// This prevents crashes when users hit the server before connection pool is initialized
// Health check endpoints (/health, /ready) are excluded and handled above
app.use('/api', requireDatabaseReadyExceptHealth);

// Register API and Static Routes
setupRoutes(app, services);

// Setup Socket.io with config from central config
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      console.log(`[Socket.io CORS] Checking origin: ${origin}`);
      // Use the shared origin check logic
      if (!origin || origin === 'null' || isOriginAllowed(origin, allowedOrigins)) {
        console.log(`[Socket.io CORS] ✅ Allowed origin: ${origin}`);
        callback(null, true);
      } else {
        // Development fallbacks - be slightly more permissive in dev
        const isLocal =
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('http://192.168.') ||
          origin.startsWith('http://10.');

        if (isLocal) {
          console.log(`[Socket.io CORS] ✅ Allowed local origin: ${origin}`);
          callback(null, true);
        } else {
          console.warn(`[Socket.io CORS] ❌ Blocked origin: ${origin}`);
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
  ...SOCKET_CONFIG,
  allowEIO3: true,
});

// Add logging for socket.io engine events
// #region agent log
io.engine.on('connection_error', (err) => {
  fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:149',message:'Engine connection error',data:{error:err.message,type:err.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  console.error('[Socket.io Engine] ❌ Connection error:', err.message, err);
});
// #endregion

// #region agent log
io.engine.on('initial_headers', (headers, req) => {
  const queryAuth = req._query?.auth;
  const headerAuth = req.headers?.authorization;
  const hasAuth = !!(queryAuth || headerAuth || req.handshake?.auth?.token);
  // Log full query string to see if auth is in URL params
  const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const tokenInQuery = urlParams.get('token');
  const authInQuery = urlParams.get('auth') || tokenInQuery;
  // For POST requests, log if body is available (handshake POST contains auth)
  const isPost = req.method === 'POST';
  const hasBody = !!req.body;
  // Check req._query which engine.io uses for query params
  const tokenInQueryObj = req._query?.token;
  fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:157',message:'Engine initial headers',data:{origin:req.headers.origin,method:req.method,url:req.url,hasAuth,queryAuth:!!queryAuth,headerAuth:!!headerAuth,authInQuery:!!authInQuery,tokenInQuery:!!tokenInQuery,tokenInQueryObj:!!tokenInQueryObj,isPost,hasBody,queryKeys:Object.keys(req._query||{}),urlHasToken:req.url.includes('token=')},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'B'})}).catch(()=>{});
  console.log('[Socket.io Engine] Initial headers:', {
    origin: req.headers.origin,
    method: req.method,
    url: req.url.substring(0, 100) + (req.url.length > 100 ? '...' : ''),
    auth: hasAuth ? 'Present' : 'Missing',
    queryAuth: !!queryAuth,
    headerAuth: !!headerAuth,
    tokenInQuery: !!tokenInQuery,
    tokenInQueryObj: !!tokenInQueryObj,
    urlHasToken: req.url.includes('token='),
    isPost,
    hasBody,
  });
});
// #endregion

// Hook into engine.io connection to extract token and authenticate BEFORE Socket.io processes handshake
// #region agent log
io.engine.on('connection', (socket) => {
  const req = socket.request;
  
  // Extract token from URL query string
  let tokenFromUrl = null;
  try {
    if (req.url) {
      const urlParams = new URL(req.url, `http://${req.headers?.host || 'localhost'}`).searchParams;
      tokenFromUrl = urlParams.get('token');
    }
  } catch (err) {
    console.warn('[Socket.io Engine] Error parsing URL:', err.message);
  }
  
  // CRITICAL: Populate handshake.query BEFORE Socket.io processes the handshake
  // Socket.io reads from handshake.query when processing the handshake
  if (tokenFromUrl) {
    // Initialize handshake objects if they don't exist
    if (!socket.handshake) {
      socket.handshake = {};
    }
    if (!socket.handshake.query) {
      socket.handshake.query = {};
    }
    if (!socket.handshake._query) {
      socket.handshake._query = {};
    }
    // Set the token in both query objects (Socket.io checks both)
    socket.handshake.query.token = tokenFromUrl;
    socket.handshake._query.token = tokenFromUrl;
    console.log(`[Socket.io Engine] ✅ Extracted and set token in handshake.query for socket ${socket.id}`);
  }
  
  fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:189',message:'Engine connection - token extraction',data:{socketId:socket.id,tokenFromUrl:!!tokenFromUrl,urlHasToken:req.url?.includes('token='),hasQueryToken:!!socket.handshake.query?.token},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'B'})}).catch(()=>{});
  
  // Log connection attempt with token extraction status
  console.log(`[Socket.io Engine] 🔌 Connection attempt: socket=${socket.id}, transport=${socket.transport?.name}, tokenExtracted=${!!tokenFromUrl}, urlHasToken=${req.url?.includes('token=')}`);
  if (tokenFromUrl) {
    console.log(`[Socket.io Engine] Token found in URL, handshake.query.token=${socket.handshake.query?.token ? 'SET' : 'NOT SET'}`);
  }
  console.log('[Socket.io Engine] Full connection details:', JSON.stringify({
    id: socket.id,
    transport: socket.transport?.name,
    tokenExtracted: !!tokenFromUrl,
    urlHasToken: req.url?.includes('token='),
    handshakeQueryKeys: socket.handshake.query ? Object.keys(socket.handshake.query) : [],
  }, null, 2));
});
// #endregion

// #region agent log
io.engine.on('headers', (headers, req) => {
  fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:165',message:'Engine response headers',data:{url:req.url,hasSid:!!headers['set-cookie']?.find(c => c.includes('io='))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  console.log('[Socket.io Engine] Response headers:', {
    url: req.url,
    sid: headers['set-cookie']?.find(c => c.includes('io=')) ? 'Present' : 'Missing',
  });
});
// #endregion

// REMOVED: Duplicate io.engine.on('connection') handler - token extraction is handled above
// REMOVED: Duplicate io.engine.on('connection') handler - token extraction is handled above at line 189

// Initialize Socket Handlers
console.log('[Server] ========================================');
console.log('[Server] Setting up Socket.io handlers...');
console.log('[Server] io object exists:', !!io);
console.log('[Server] services exists:', !!services);
try {
  setupSockets(io, services);
  const middlewareCount = io._nsps?.get('/')?._fns?.length || 0;
  console.log('[Server] ✅ Socket.io handlers setup complete.');
  console.log('[Server] Middleware registered:', middlewareCount, 'middleware functions');
  console.log('[Server] ========================================');
} catch (err) {
  console.error('[Server] ❌ Error setting up sockets:', err);
  throw err;
}

// Configure Global Error Handling (Express)
setupErrorHandling(app);

// Setup global process error handlers and graceful shutdown
setupGlobalErrorHandlers();
setupGracefulShutdown(server);

// Final log
console.log(`📊 Environment: ${NODE_ENV}`);
console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);

// Export app for testing if needed
module.exports = app;
