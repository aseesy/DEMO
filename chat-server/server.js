require('dotenv').config();

// PostgreSQL-Only Database Initialization
// DATABASE_URL must be set (PostgreSQL required in all environments)

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not set!');
  console.error('❌ PostgreSQL is required in all environments.');
  console.error('❌ Set DATABASE_URL environment variable.');
  process.exit(1);
}

console.log('🐘 PostgreSQL mode: DATABASE_URL detected');
console.log('📊 Using PostgreSQL database');

// Initialize PostgreSQL client (non-blocking)
require('./dbPostgres');

// Run PostgreSQL migration in background (non-blocking, async)
// Migration runs after server starts - won't block startup
setTimeout(() => {
  const { runMigration } = require('./run-migration');
  runMigration().catch(err => {
    console.error('⚠️  Migration error (non-blocking):', err.message);
    console.log('⚠️  Server will continue running - migration can be retried');
  });
}, 2000); // Wait 2 seconds for server to start

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');
const aiMediator = require('./aiMediator');
const userContext = require('./userContext');
const auth = require('./auth');
const messageStore = require('./messageStore');
const roomManager = require('./roomManager');
const connectionManager = require('./connectionManager');
const emailService = require('./emailService');
const dbSafe = require('./dbSafe');
const FigmaService = require('./figmaService');
const ComponentScanner = require('./componentScanner');
const FigmaGenerator = require('./figmaGenerator');
const communicationStats = require('./communicationStats');

// Initialize Figma service if API token is provided
let figmaService = null;
if (process.env.FIGMA_ACCESS_TOKEN) {
  try {
    figmaService = new FigmaService(process.env.FIGMA_ACCESS_TOKEN);
    console.log('✅ Figma API service initialized');
  } catch (error) {
    console.warn('⚠️  Figma API service not available:', error.message);
  }
}

const app = express();
const server = http.createServer(app);

// Register health check IMMEDIATELY so Railway can verify server is starting
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Start server EARLY - before all routes are set up
// This allows Railway's health check to pass immediately
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

// Start listening immediately with minimal setup
server.listen(PORT, HOST, (error) => {
  if (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
  console.log(`✅ Server listening on ${HOST}:${PORT}`);
  console.log(`🏥 Health check ready at: http://${HOST}:${PORT}/health`);
});

// Trust proxy - required for Railway/Vercel deployment and rate limiting
// Configure to only trust Railway's proxy (not all proxies) to prevent rate limit bypass
// Railway uses a reverse proxy, so we trust only the first hop (Railway's proxy)
if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
  // In production/Railway, trust only the first proxy (Railway's reverse proxy)
  // This prevents IP spoofing while still getting correct client IPs
  app.set('trust proxy', 1);
} else {
  // In development, we can trust proxy for local testing with Docker/compose
  // But we'll still use a number to satisfy express-rate-limit
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers (onclick, etc.)
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Parse JSON bodies - increase limit for large profile text fields
app.use(express.json({ limit: '10mb' })); // Allow up to 10MB for profile data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse cookies (required for JWT session management)
app.use(cookieParser());

// Error handler for JSON payload too large (must be after body parsers)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Request payload too large or invalid JSON. Please reduce the size of your text fields.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request payload too large. Please reduce the size of your text fields.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  next(err);
});

// Parse FRONTEND_URL - supports comma-separated list for multiple origins
// Default includes both legacy frontend (3000) and Vite dev server (5173)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(url => url.trim());

// Add admin page origin (same server) to allowed origins
const serverPort = process.env.PORT || 3001;
const serverOrigin = `http://localhost:${serverPort}`;
if (!allowedOrigins.includes(serverOrigin)) {
  allowedOrigins.push(serverOrigin);
}

// Helper function to check if origin is allowed (supports regex patterns)
function isOriginAllowed(origin, allowedList) {
  if (!origin) return true; // Allow requests with no origin

  // Automatically allow all Vercel preview and production domains
  if (origin.includes('.vercel.app') || origin.includes('vercel.app')) {
    return true;
  }

  // Automatically allow production domain
  if (origin.includes('coparentliaizen.com')) {
    return true;
  }

  // Check exact matches
  if (allowedList.includes(origin) || allowedList.includes('*')) {
    return true;
  }

  // Check regex patterns (for Vercel preview domains: *.vercel.app)
  for (const allowed of allowedList) {
    if (allowed.includes('*')) {
      // Convert wildcard pattern to regex
      const pattern = allowed.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) {
        return true;
      }
    }
  }

  return false;
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow Figma plugins (they use origin "null" as a string)
    if (origin === 'null') {
      return callback(null, true);
    }

    // Allow same-origin requests (for admin page)
    if (origin.startsWith(`http://localhost:${serverPort}`) ||
      origin.startsWith(`https://localhost:${serverPort}`)) {
      return callback(null, true);
    }

    // Check if origin is allowed (supports wildcard patterns for Vercel)
    if (isOriginAllowed(origin, allowedOrigins)) {
      callback(null, true);
    } else {
      // For development, allow localhost and local network IPs from any port
      if (origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://192.168.')) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Figma-Token', 'X-Requested-With'],
  exposedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Rate limiting - general API protection (exclude auth endpoints)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Much higher limit for development
  skip: (req) => {
    // Skip rate limiting for auth endpoints (they have their own limits)
    return req.path.startsWith('/api/auth/');
  },
  validate: {
    trustProxy: false, // We've configured trust proxy properly (trust only Railway's proxy)
  }
});

// More lenient rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 login/signup attempts per 15 minutes
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins against limit
  validate: {
    trustProxy: false, // We've configured trust proxy properly (trust only Railway's proxy)
  }
});

// Apply general rate limiting (excludes auth endpoints)
app.use(limiter);
// Apply auth-specific rate limiting to auth endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/userContext', require('./routes/userContext'));

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Automatically allow all Vercel preview and production domains
      if (origin.includes('.vercel.app') || origin.includes('vercel.app')) {
        return callback(null, true);
      }

      // Automatically allow production domain
      if (origin.includes('coparentliaizen.com')) {
        return callback(null, true);
      }

      // Allow same-origin requests
      if (origin.startsWith(`http://localhost:${serverPort}`) ||
        origin.startsWith(`https://localhost:${serverPort}`)) {
        return callback(null, true);
      }

      // Check if origin is allowed (supports wildcard patterns for Vercel)
      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
      } else {
        // For development, allow localhost and local network IPs from any port
        if (origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('http://192.168.')) {
          callback(null, true);
        } else {
          console.warn(`Socket.io CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Additional security and performance settings
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB max message size
  transports: ['websocket', 'polling'],
  allowEIO3: true // Allow Engine.IO v3 clients (for better compatibility)
});

// In-memory storage for active connections
const activeUsers = new Map(); // socketId -> user data
const messageHistory = []; // In-memory cache of recent messages
const MAX_MESSAGE_HISTORY = 50;

// Load messages from database on startup
(async () => {
  try {
    const recentMessages = await messageStore.getRecentMessages(MAX_MESSAGE_HISTORY);
    messageHistory.push(...recentMessages);
    console.log(`✅ Loaded ${recentMessages.length} messages from database`);

    // Clean old messages periodically (keep last 1000)
    setInterval(async () => {
      try {
        await messageStore.cleanOldMessages(1000);
      } catch (err) {
        console.error('Error cleaning old messages:', err);
      }
    }, 3600000); // Every hour
  } catch (err) {
    console.error('Error loading messages from database:', err);
  }
})();
const MAX_USERNAME_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 500;

// Middleware to verify JWT token
/**
 * Auto-complete onboarding tasks when conditions are met
 */
async function autoCompleteOnboardingTasks(userId) {
  try {
    // Get user profile to check if profile is complete
    const users = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });

    if (users.length === 0) return;

    const user = users[0];
    const now = new Date().toISOString();

    // Check if profile is complete (has filled out multiple profile fields)
    // Count how many profile fields are filled out
    const filledFields = [
      user.first_name,
      user.last_name,
      user.address,
      user.occupation,
      user.parenting_philosophy,
      user.personal_growth,
      user.email
    ].filter(field => field && field.trim().length > 0).length;

    // Profile is considered complete if at least 2 fields are filled out
    const profileComplete = filledFields >= 2;

    // Check if co-parent exists
    const coparentResult = await dbSafe.safeSelect('contacts', {
      user_id: userId
    }, {});
    const allContacts = dbSafe.parseResult(coparentResult);
    const hasCoparent = allContacts.some(c =>
      c.relationship === 'My Co-Parent' ||
      c.relationship === 'co-parent' ||
      c.relationship === "My Partner's Co-Parent"
    );

    // Check if children exist
    const hasChildren = allContacts.some(c =>
      c.relationship === 'My Child' ||
      c.relationship === "My Partner's Child"
    );

    // Get all onboarding tasks for this user
    const onboardingTaskTitles = [
      'Complete Your Profile',
      'Add Your Co-parent',
      'Add Your Children'
    ];

    for (const taskTitle of onboardingTaskTitles) {
      const taskResult = await dbSafe.safeSelect('tasks', {
        user_id: userId,
        title: taskTitle,
        status: 'open'
      }, { limit: 1 });

      const tasks = dbSafe.parseResult(taskResult);

      if (tasks.length > 0) {
        const task = tasks[0];
        let shouldComplete = false;

        if (taskTitle === 'Complete Your Profile' && profileComplete) {
          shouldComplete = true;
        } else if (taskTitle === 'Add Your Co-parent' && hasCoparent) {
          shouldComplete = true;
        } else if (taskTitle === 'Add Your Children' && hasChildren) {
          shouldComplete = true;
        }

        if (shouldComplete) {
          await dbSafe.safeUpdate('tasks', {
            status: 'completed',
            completed_at: now,
            updated_at: now
          }, { id: task.id });

          console.log(`✅ Auto-completed onboarding task: ${taskTitle} for user ${userId}`);
        }
      }
    }

    require('./db').saveDatabase();
  } catch (error) {
    console.error('Error in autoCompleteOnboardingTasks:', error);
    throw error;
  }
}

async function verifyAuth(req, res, next) {
  try {
    // Check for token in cookie or Authorization header
    const token = req.cookies.auth_token ||
      (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded; // Add user info to request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Utility functions
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .trim()
    .substring(0, MAX_MESSAGE_LENGTH);
}

function validateUsername(username) {
  if (typeof username !== 'string') return false;
  const clean = username.trim();
  return clean.length >= 2 && clean.length <= MAX_USERNAME_LENGTH;
}

function isUsernameTaken(username, currentSocketId) {
  for (const [socketId, userData] of activeUsers.entries()) {
    if (socketId !== currentSocketId && userData.username.toLowerCase() === username.toLowerCase()) {
      return true;
    }
  }
  return false;
}

async function addToMessageHistory(message, isPrivate = false) {
  // Only add non-private messages to public history
  if (!isPrivate && !message.private) {
    messageHistory.push(message);
    if (messageHistory.length > MAX_MESSAGE_HISTORY) {
      messageHistory.shift();
    }

    // Save to database (async, non-blocking)
    messageStore.saveMessage(message).catch(err => {
      console.error('Error saving message to database:', err);
    });
  }
}

function getPublicMessageHistory() {
  // Filter out private/flagged messages from history
  return messageHistory.filter(msg => !msg.private && !msg.flagged);
}

function getUserList() {
  return Array.from(activeUsers.values()).map(user => ({
    username: user.username,
    joinedAt: user.joinedAt
  }));
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Handle user joining
  socket.on('join', async ({ username }) => {
    try {
      const cleanUsername = sanitizeInput(username);

      // Validate username
      if (!validateUsername(cleanUsername)) {
        socket.emit('error', { message: 'Invalid username. Must be 2-20 characters.' });
        return;
      }

      // Get user and their room
      const user = await auth.getUser(cleanUsername);
      if (!user) {
        socket.emit('error', { message: 'User not found.' });
        return;
      }

      // If user doesn't have a room (old user from before rooms were added), create one
      let roomId;
      if (!user.room) {
        console.log(`User ${cleanUsername} has no room, creating one...`);
        try {
          if (!user.id) {
            socket.emit('error', { message: 'User not found.' });
            return;
          }

          const newRoom = await roomManager.createPrivateRoom(user.id, cleanUsername);
          roomId = newRoom.roomId;
          user.room = newRoom;
          console.log(`Created room ${roomId} for user ${cleanUsername}`);
        } catch (err) {
          console.error('Error creating room:', err);
          socket.emit('error', { message: 'Failed to create chat room.' });
          return;
        }
      } else {
        roomId = user.room.roomId;
      }

      // Check if username is taken in this room
      let isUserInRoom = false;
      for (const [socketId, userData] of activeUsers.entries()) {
        if (userData.roomId === roomId && userData.username.toLowerCase() === cleanUsername.toLowerCase() && socketId !== socket.id) {
          isUserInRoom = true;
          break;
        }
      }

      if (isUserInRoom) {
        socket.emit('error', { message: 'You are already connected in another tab.' });
        return;
      }

      // Join the Socket.io room
      socket.join(roomId);

      // Store user data with room
      activeUsers.set(socket.id, {
        username: cleanUsername,
        roomId: roomId,
        joinedAt: new Date().toISOString(),
        socketId: socket.id
      });

      // Get room members
      const members = await roomManager.getRoomMembers(roomId);

      // Ensure contacts exist for all users in shared rooms
      if (members.length > 1) {
        console.log(`🔗 Ensuring contacts for room ${roomId} with ${members.length} members`);
        await roomManager.ensureContactsForRoomMembers(roomId);
      }

      // Load room message history from database using PostgreSQL
      const dbPostgres = require('./dbPostgres');
      const historyQuery = `
        SELECT * FROM messages
        WHERE room_id = $1
        AND (private = false OR private IS NULL)
        AND (flagged = false OR flagged IS NULL)
        AND (deleted = false OR deleted IS NULL)
        ORDER BY timestamp ASC
        LIMIT 500
      `;
      const result = await dbPostgres.query(historyQuery, [roomId]);
      const messages = result.rows;

      console.log(`📜 Loading ${messages.length} messages for room ${roomId}`);

      let roomHistory = [];
      messages.forEach(msg => {
        let originalMessage = null;
        if (msg.original_message) {
          try {
            originalMessage = JSON.parse(msg.original_message);
          } catch (err) {
            console.warn('Error parsing original_message:', err);
          }
        }

        let reactions = null;
        if (msg.reactions) {
          try {
            reactions = JSON.parse(msg.reactions);
          } catch (err) {
            console.warn('Error parsing reactions:', err);
          }
        }

        let userFlaggedBy = null;
        if (msg.user_flagged_by) {
          try {
            userFlaggedBy = JSON.parse(msg.user_flagged_by);
          } catch (err) {
            console.warn('Error parsing user_flagged_by:', err);
          }
        }

        roomHistory.push({
          id: msg.id,
          type: msg.type,
          username: msg.username,
          text: msg.text,
          timestamp: msg.timestamp, // Preserve full ISO timestamp
          threadId: msg.thread_id || null,
          validation: msg.validation || null,
          tip1: msg.tip1 || null,
          tip2: msg.tip2 || null,
          rewrite: msg.rewrite || null,
          originalMessage: originalMessage,
          edited: msg.edited === 1 || msg.edited === '1',
          editedAt: msg.edited_at || null,
          reactions: reactions || {},
          user_flagged_by: userFlaggedBy || []
        });
      });

      // Send message history to the new user
      socket.emit('message_history', roomHistory);

      // Create system message
      const systemMessage = {
        id: `${Date.now()}-${socket.id}`,
        type: 'system',
        username: 'System',
        text: `${cleanUsername} joined the chat`,
        timestamp: new Date().toISOString(),
        roomId: roomId
      };

      // Save to database using safe insert
      try {
        await dbSafe.safeInsert('messages', {
          id: systemMessage.id,
          type: systemMessage.type,
          username: systemMessage.username,
          text: systemMessage.text,
          timestamp: systemMessage.timestamp,
          socket_id: socket.id,
          room_id: roomId,
          private: 0
        });
      } catch (err) {
        console.error('Error saving system message:', err);
      }

      // Get active users in this room
      const roomUsers = [];
      for (const [sid, userData] of activeUsers.entries()) {
        if (userData.roomId === roomId) {
          roomUsers.push({
            username: userData.username,
            joinedAt: userData.joinedAt
          });
        }
      }

      // Broadcast to room only
      io.to(roomId).emit('user_joined', {
        message: systemMessage,
        users: roomUsers,
        roomMembers: members
      });

      // Get room name
      const roomName = user.room ? user.room.roomName : `${cleanUsername}'s Co-Parenting Room`;

      // Confirm successful join to the user
      socket.emit('join_success', {
        username: cleanUsername,
        roomId: roomId,
        roomName: roomName,
        users: roomUsers,
        roomMembers: members
      });

      console.log(`User joined room: ${cleanUsername} → ${roomId} (${socket.id})`);
    } catch (error) {
      console.error('Error in join handler:', error);
      socket.emit('error', { message: 'Failed to join chat room.' });
    }
  });

  // Handle proactive coaching request (before sending message)
  socket.on('analyze_draft', async ({ draftText }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before analyzing drafts.' });
        return;
      }

      const proactiveCoach = require('./proactiveCoach');
      const db = await require('./db').getDb();
      const dbSafe = require('./dbSafe');
      const dbPostgres = require('./dbPostgres');

      // Get recent messages for context from database
      const messagesQuery = `
        SELECT * FROM messages
        WHERE room_id = $1
        ORDER BY timestamp DESC
        LIMIT 10
      `;
      const messagesResult = await dbPostgres.query(messagesQuery, [user.roomId]);
      const recentMessages = messagesResult.rows.length > 0 ? messagesResult.rows.reverse() : [];

      // Get user context
      const users = await dbSafe.safeSelect('users', { username: user.username.toLowerCase() }, { limit: 1 });
      const userContext = users.length > 0 ? users[0] : {};

      // Get flagged messages for learning
      const flagsResult = await dbSafe.safeSelect('message_flags', {
        flagged_by_username: user.username
      }, {
        orderBy: 'created_at',
        orderDirection: 'DESC',
        limit: 5
      });
      const flags = dbSafe.parseResult(flagsResult);

      // Get the actual flagged messages
      const flaggedMessages = [];
      if (flags.length > 0) {
        const messageIds = flags.map(f => f.message_id).filter(Boolean);
        if (messageIds.length > 0) {
          const messagesResult = await dbSafe.safeSelect('messages', {
            id: messageIds
          });
          const flaggedMsgs = dbSafe.parseResult(messagesResult);
          flaggedMsgs.forEach(msg => {
            const flag = flags.find(f => f.message_id === msg.id);
            if (flag && flag.reason) {
              flaggedMessages.push({ text: msg.text, reason: flag.reason });
            }
          });
        }
      }

      // Get contact context
      let contactContext = null;
      if (users.length > 0) {
        const contactsResult = await dbSafe.safeSelect('contacts', { user_id: users[0].id });
        const contacts = dbSafe.parseResult(contactsResult);
        if (contacts.length > 0) {
          contactContext = contacts.map(c => `${c.contact_name} (${c.relationship || 'contact'})`).join(', ');
        }
      }

      const coaching = await proactiveCoach.analyzeDraftMessage(
        draftText,
        recentMessages,
        userContext,
        contactContext,
        flaggedMessages
      );

      if (coaching) {
        socket.emit('draft_analysis', coaching);
      }
    } catch (error) {
      console.error('Error analyzing draft:', error);
      socket.emit('error', { message: 'Failed to analyze draft message.' });
    }
  });

  // Handle new messages
  socket.on('send_message', async ({ text, isPreApprovedRewrite, originalRewrite }) => {
    try {
      const user = activeUsers.get(socket.id);

      if (!user) {
        socket.emit('error', { message: 'You must join before sending messages.' });
        return;
      }

      const cleanText = sanitizeInput(text);

      if (!cleanText || cleanText.length === 0) {
        return; // Silently ignore empty messages
      }

      if (cleanText.length > MAX_MESSAGE_LENGTH) {
        socket.emit('error', { message: `Message too long (max ${MAX_MESSAGE_LENGTH} characters).` });
        return;
      }

      const message = {
        id: `${Date.now()}-${socket.id}`,
        type: 'user',
        username: user.username,
        text: cleanText,
        timestamp: new Date().toISOString(),
        socketId: socket.id,
        roomId: user.roomId
      };

      // IF THIS IS A PRE-APPROVED REWRITE, CHECK FOR EDITS BEFORE BYPASSING
      if (isPreApprovedRewrite && originalRewrite) {
        const stringSimilarity = require('string-similarity');
        const similarity = stringSimilarity.compareTwoStrings(cleanText, originalRewrite);

        // Log edit detection details
        console.log(`📝 Edit Detection:`, {
          originalLength: originalRewrite.length,
          sentLength: cleanText.length,
          similarity: Math.round(similarity * 100) + '%',
          wasEdited: similarity < 0.85
        });

        // Check for significant edits (less than 85% similar)
        if (similarity < 0.85) {
          console.log(`⚠️  Pre-approved rewrite was edited (${Math.round(similarity * 100)}% similar) - running AI analysis`);
          // Force re-analysis by clearing the bypass flag
          // This message will now go through full AI mediation below
        } else {
          console.log(`✅ Pre-approved rewrite unmodified (${Math.round(similarity * 100)}% similar) - SKIPPING AI mediation`);

          // Update communication stats - successful message using pre-approved rewrite
          try {
            const db = await require('./db').getDb();
            const userResult = await dbSafe.safeSelect('users', { username: user.username.toLowerCase() }, { limit: 1 });
            const users = dbSafe.parseResult(userResult);
            if (users.length > 0) {
              await communicationStats.updateCommunicationStats(users[0].id, user.roomId, false);
            }
          } catch (statsErr) {
            console.error('Error updating communication stats for pre-approved rewrite:', statsErr);
          }

          // Add to history
          messageHistory.push(message);
          if (messageHistory.length > 100) {
            messageHistory.shift();
          }

          // Save to database using messageStore (proper abstraction)
          messageStore.saveMessage({
            ...message,
            roomId: user.roomId
          }).catch(err => {
            console.error('Error saving pre-approved rewrite to database:', err);
          });

          // Mark as revision/rewrite
          message.isRevision = true;

          // Broadcast to all users in the room
          io.to(user.roomId).emit('new_message', message);
          return; // Exit early - no AI mediation needed
        }
      }

      // Don't add to history yet - wait for AI analysis
      // We'll add it later if it's approved
      aiMediator.updateContext(message);

      // Get recent messages from database for AI analysis
      const dbModule = require('./db');
      const dbSafe = require('./dbSafe');
      const dbPostgres = require('./dbPostgres');

      const messagesQuery = `
        SELECT * FROM messages
        WHERE room_id = $1
        ORDER BY timestamp DESC
        LIMIT 20
      `;
      const messagesResult = await dbPostgres.query(messagesQuery, [user.roomId]);
      const recentMessages = messagesResult.rows.length > 0 ? messagesResult.rows.reverse() : [];

      // Check if AI mediator should intervene (async, non-blocking)
      // We analyze BEFORE broadcasting to decide if message should be shown to others
      // IMPORTANT: Message is NOT broadcast yet - we wait for AI analysis
      // OPTIMIZED: Single unified API call instead of separate conflictPredictor, emotionalModel, interventionPolicy calls
      console.log(`⏳ Message from ${user.username} queued for unified AI analysis - NOT broadcasting yet`);

      setImmediate(async () => {
        console.log('🔍 AI Mediator: setImmediate callback triggered');
        try {
          const context = aiMediator.getContext();
          const participantUsernames = Array.from(activeUsers.values()).map(u => u.username);
          console.log('🤖 AI Mediator: Starting analysis for message:', cleanText.substring(0, 30));

          // Get existing contacts with full information for AI context
          let existingContacts = [];
          let contactContextForAI = null;
          try {
            const userResult = await dbSafe.safeSelect('users', { username: user.username.toLowerCase() }, { limit: 1 });
            const users = userResult;
            if (users.length > 0) {
              const fullContacts = await dbSafe.safeSelect('contacts', { user_id: users[0].id });
              existingContacts = fullContacts.map(c => c.contact_name);

              // Get contacts for all participants to identify shared children
              const allParticipantContacts = new Map(); // username -> contacts array
              allParticipantContacts.set(user.username.toLowerCase(), fullContacts);

              // Get contacts for other participants in the room
              for (const participantUsername of participantUsernames) {
                if (participantUsername.toLowerCase() !== user.username.toLowerCase()) {
                  try {
                    const participantUserResult = await dbSafe.safeSelect('users', { username: participantUsername.toLowerCase() }, { limit: 1 });
                    const participantUsers = dbSafe.parseResult(participantUserResult);
                    if (participantUsers.length > 0) {
                      const participantContactsResult = await dbSafe.safeSelect('contacts', { user_id: participantUsers[0].id });
                      const participantContacts = dbSafe.parseResult(participantContactsResult);
                      allParticipantContacts.set(participantUsername.toLowerCase(), participantContacts);
                    }
                  } catch (err) {
                    console.error(`Error fetching contacts for ${participantUsername}:`, err);
                  }
                }
              }

              // Identify shared children (children that appear in both co-parents' contacts)
              const sharedChildren = [];
              const senderContacts = allParticipantContacts.get(user.username.toLowerCase()) || [];
              const senderChildren = senderContacts.filter(c =>
                c.relationship && (
                  c.relationship.toLowerCase().includes('child') ||
                  c.relationship.toLowerCase().includes('son') ||
                  c.relationship.toLowerCase().includes('daughter')
                )
              );

              for (const senderChild of senderChildren) {
                const childName = senderChild.contact_name.toLowerCase();
                // Check if this child appears in any other participant's contacts
                for (const [participantUsername, participantContacts] of allParticipantContacts.entries()) {
                  if (participantUsername !== user.username.toLowerCase()) {
                    const hasChild = participantContacts.some(c =>
                      c.contact_name.toLowerCase() === childName &&
                      c.relationship && (
                        c.relationship.toLowerCase().includes('child') ||
                        c.relationship.toLowerCase().includes('son') ||
                        c.relationship.toLowerCase().includes('daughter')
                      )
                    );
                    if (hasChild) {
                      // This is a shared child
                      const coParentName = participantUsername;
                      if (!sharedChildren.find(sc => sc.name.toLowerCase() === childName && sc.coParent === coParentName)) {
                        sharedChildren.push({
                          name: senderChild.contact_name,
                          coParent: coParentName
                        });
                      }
                    }
                  }
                }
              }

              // Format contacts with relationships and context for AI mediator
              if (fullContacts.length > 0) {
                const contactInfo = fullContacts.map(contact => {
                  const parts = [];
                  parts.push(contact.contact_name);
                  if (contact.relationship) {
                    parts.push(`(relationship: ${contact.relationship})`);
                  }

                  // If this is a child contact, check if it's shared with co-parent
                  const isChild = contact.relationship && (
                    contact.relationship.toLowerCase().includes('child') ||
                    contact.relationship.toLowerCase().includes('son') ||
                    contact.relationship.toLowerCase().includes('daughter')
                  );
                  if (isChild) {
                    const sharedChild = sharedChildren.find(sc =>
                      sc.name.toLowerCase() === contact.contact_name.toLowerCase()
                    );
                    if (sharedChild) {
                      parts.push(`[SHARED CHILD with co-parent: ${sharedChild.coParent}]`);
                    } else if (contact.other_parent) {
                      parts.push(`[Child of co-parent: ${contact.other_parent}]`);
                    }
                  }

                  if (contact.notes) {
                    parts.push(`- ${contact.notes}`);
                  }
                  const concerns = [];
                  if (contact.difficult_aspects) concerns.push(`Difficult aspects: ${contact.difficult_aspects}`);
                  if (contact.friction_situations) concerns.push(`Friction situations: ${contact.friction_situations}`);
                  if (contact.safety_concerns) concerns.push(`Safety concerns: ${contact.safety_concerns}`);
                  if (contact.legal_matters) concerns.push(`Legal matters: ${contact.legal_matters}`);
                  if (contact.substance_mental_health) concerns.push(`Substance/mental health: ${contact.substance_mental_health}`);
                  if (contact.neglect_abuse_concerns) concerns.push(`Neglect/abuse concerns: ${contact.neglect_abuse_concerns}`);
                  if (concerns.length > 0) {
                    parts.push(`Concerns: ${concerns.join('; ')}`);
                  }
                  if (contact.separation_date) {
                    parts.push(`Separation date: ${contact.separation_date}`);
                  }
                  // Add triggering reasons if available
                  if (contact.triggering_reasons) {
                    try {
                      const triggeringReasons = JSON.parse(contact.triggering_reasons);
                      if (triggeringReasons.length > 0) {
                        const reasons = triggeringReasons.map(tr => tr.reason).join('; ');
                        parts.push(`Triggering reasons (user-specific): ${reasons}`);
                      }
                    } catch (e) {
                      // Ignore parse errors
                    }
                  }
                  return parts.join(' ');
                }).join('\n');

                // Add shared children summary at the top
                let sharedChildrenInfo = '';
                if (sharedChildren.length > 0) {
                  const sharedChildrenList = sharedChildren.map(sc =>
                    `${sc.name} (shared with co-parent: ${sc.coParent})`
                  ).join(', ');
                  sharedChildrenInfo = `\n\nIMPORTANT - SHARED CHILDREN (these children belong to both co-parents):\n${sharedChildrenList}\n\nWhen either co-parent mentions these children's names, they are referring to their shared child. Use this context to understand the relationship dynamic.\n`;
                }

                contactContextForAI = `Contacts and Relationships:${sharedChildrenInfo}\n${contactInfo}`;
              } else if (sharedChildren.length > 0) {
                // Even if no contacts, show shared children if found
                const sharedChildrenList = sharedChildren.map(sc =>
                  `${sc.name} (shared with co-parent: ${sc.coParent})`
                ).join(', ');
                contactContextForAI = `IMPORTANT - SHARED CHILDREN (these children belong to both co-parents):\n${sharedChildrenList}\n\nWhen either co-parent mentions these children's names, they are referring to their shared child. Use this context to understand the relationship dynamic.`;
              }
            }
          } catch (contactErr) {
            console.error('Error fetching contacts for AI context:', contactErr);
          }

          // Get flagged message context for AI mediator (recent flags to learn from)
          let flaggedMessagesContext = null;
          try {
            const db = await require('./db').getDb();
            const userResult = await dbSafe.safeSelect('users', { username: user.username.toLowerCase() }, { limit: 1 });
            const users = dbSafe.parseResult(userResult);
            if (users.length > 0) {
              const userId = users[0].id;

              // Get recent flags from this user (last 10 flags)
              const flagsResult = await dbSafe.safeSelect('message_flags', {
                flagged_by_username: user.username
              }, {
                orderBy: 'created_at',
                orderDirection: 'DESC',
                limit: 10
              });

              const recentFlags = dbSafe.parseResult(flagsResult);

              if (recentFlags.length > 0) {
                // Get the actual messages for these flags
                const messageIds = recentFlags.map(f => f.message_id).filter(Boolean);
                if (messageIds.length > 0) {
                  const flaggedMessagesResult = await dbSafe.safeSelect('messages', {
                    id: messageIds
                  });

                  const flaggedMessages = dbSafe.parseResult(flaggedMessagesResult);

                  // Create a map of message_id -> flag reason
                  const flagReasonsMap = new Map();
                  recentFlags.forEach(flag => {
                    if (flag.reason) {
                      flagReasonsMap.set(flag.message_id, flag.reason);
                    }
                  });

                  // Format flagged messages with reasons
                  const flaggedContext = flaggedMessages
                    .filter(msg => flagReasonsMap.has(msg.id))
                    .slice(0, 5) // Limit to 5 most recent
                    .map(msg => {
                      const reason = flagReasonsMap.get(msg.id);
                      return `Message: "${msg.text}" - Flagged because: ${reason}`;
                    })
                    .join('\n');

                  if (flaggedContext) {
                    flaggedMessagesContext = `\n\nLEARNING FROM PREVIOUS FLAGS (what this user finds problematic):\n${flaggedContext}\n\nUse this context to better understand what types of messages need intervention for this user.`;
                  }
                }
              }
            }
          } catch (flagContextErr) {
            console.error('Error fetching flagged messages context:', flagContextErr);
          }

          // Get task context for AI mediator
          let taskContextForAI = null;
          try {
            const db = await require('./db').getDb();
            const userResult = await dbSafe.safeSelect('users', { username: user.username.toLowerCase() }, { limit: 1 });
            const users = dbSafe.parseResult(userResult);
            if (users.length > 0) {
              const userId = users[0].id;

              // Get active/open tasks (recent and relevant)
              const activeTasksResult = await dbSafe.safeSelect('tasks', {
                user_id: userId,
                status: 'open'
              }, {
                orderBy: 'due_date',
                orderDirection: 'ASC',
                limit: 5
              });

              const activeTasks = dbSafe.parseResult(activeTasksResult);

              // Also get recently completed tasks for context
              const recentCompletedResult = await dbSafe.safeSelect('tasks', {
                user_id: userId,
                status: 'completed'
              }, {
                orderBy: 'completed_at',
                orderDirection: 'DESC',
                limit: 3
              });

              const recentCompleted = dbSafe.parseResult(recentCompletedResult);

              if (activeTasks.length > 0 || recentCompleted.length > 0) {
                const taskParts = [];

                if (activeTasks.length > 0) {
                  const activeTaskList = activeTasks.map(task => {
                    let taskInfo = task.title;
                    if (task.due_date) {
                      const dueDate = new Date(task.due_date);
                      const today = new Date();
                      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                      if (daysUntilDue < 0) {
                        taskInfo += ` (overdue by ${Math.abs(daysUntilDue)} days)`;
                      } else if (daysUntilDue === 0) {
                        taskInfo += ' (due today)';
                      } else if (daysUntilDue <= 3) {
                        taskInfo += ` (due in ${daysUntilDue} days)`;
                      }
                    }
                    if (task.priority && task.priority !== 'medium') {
                      taskInfo += ` [${task.priority} priority]`;
                    }
                    if (task.description) {
                      taskInfo += ` - ${task.description.substring(0, 50)}`;
                    }
                    return taskInfo;
                  }).join('\n  - ');
                  taskParts.push(`Active parenting tasks:\n  - ${activeTaskList}`);
                }

                if (recentCompleted.length > 0) {
                  const completedList = recentCompleted.map(task => task.title).join(', ');
                  taskParts.push(`Recently completed: ${completedList}`);
                }

                taskContextForAI = taskParts.join('\n\n');
              }
            }
          } catch (taskErr) {
            console.error('Error fetching tasks for AI context:', taskErr);
          }

          // OPTIMIZED: Single unified AI analysis call
          // This replaces:
          // - conflictPredictor.assessEscalationRisk()
          // - emotionalModel.analyzeEmotionalState()
          // - interventionPolicy.generateInterventionPolicy()
          // - aiMediator.analyzeAndIntervene()
          // All in ONE API call!

          const intervention = await aiMediator.analyzeMessage(
            message,
            recentMessages,  // Use recentMessages from database query above
            participantUsernames,
            existingContacts,
            contactContextForAI,
            user.roomId,
            taskContextForAI,
            flaggedMessagesContext
          );

          // Check for names in message (only if message passed moderation)
          let contactSuggestion = null;
          if (!intervention) {
            try {
              const detectedNames = await aiMediator.detectNamesInMessage(cleanText, existingContacts, participantUsernames);
              console.log(`📝 Detected names in message:`, detectedNames);

              if (detectedNames.length > 0) {
                // Check if there's already a pending suggestion
                let hasPendingSuggestion = socket.data && socket.data.pendingContactSuggestion;

                // Check if pending suggestion is too old (more than 5 minutes) - expire it
                const SUGGESTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
                if (hasPendingSuggestion && socket.data.pendingContactSuggestion.timestamp) {
                  const suggestionAge = Date.now() - socket.data.pendingContactSuggestion.timestamp;
                  if (suggestionAge > SUGGESTION_TIMEOUT) {
                    console.log(`⏰ Pending suggestion expired (${Math.round(suggestionAge / 1000)}s old) - clearing and processing new names`);
                    delete socket.data.pendingContactSuggestion;
                    hasPendingSuggestion = false; // Treat as if no pending suggestion
                  }
                }

                if (hasPendingSuggestion) {
                  // If there's already a pending suggestion, queue additional names
                  if (!socket.data.pendingNamesQueue) {
                    socket.data.pendingNamesQueue = [];
                  }
                  // Add all detected names to queue (excluding the one already pending)
                  const pendingName = socket.data.pendingContactSuggestion.detectedName.toLowerCase();
                  detectedNames.forEach(name => {
                    if (name.toLowerCase() !== pendingName &&
                      !socket.data.pendingNamesQueue.some(q => q.toLowerCase() === name.toLowerCase())) {
                      socket.data.pendingNamesQueue.push(name);
                    }
                  });
                  console.log(`📋 Queued additional names for later:`, socket.data.pendingNamesQueue);
                } else {
                  // No pending suggestion (or it expired) - process new names immediately
                  // First, check if there are queued names to process
                  if (socket.data && socket.data.pendingNamesQueue && socket.data.pendingNamesQueue.length > 0) {
                    // Process queued name first
                    const queuedName = socket.data.pendingNamesQueue.shift();
                    console.log(`📝 Processing queued name: ${queuedName}`);
                    contactSuggestion = await aiMediator.generateContactSuggestion(queuedName, 'Mentioned in chat');
                    if (contactSuggestion) {
                      if (!socket.data) socket.data = {};
                      socket.data.pendingContactSuggestion = {
                        detectedName: contactSuggestion.detectedName,
                        messageContext: contactSuggestion.messageContext,
                        timestamp: Date.now()
                      };
                      // Queue remaining names from current message
                      if (detectedNames.length > 0) {
                        if (!socket.data.pendingNamesQueue) {
                          socket.data.pendingNamesQueue = [];
                        }
                        detectedNames.forEach(name => {
                          if (name.toLowerCase() !== queuedName.toLowerCase() &&
                            !socket.data.pendingNamesQueue.some(q => q.toLowerCase() === name.toLowerCase())) {
                            socket.data.pendingNamesQueue.push(name);
                          }
                        });
                      }
                    }
                  } else {
                    // No queue - process first detected name from current message
                    const detectedName = detectedNames[0];
                    console.log(`📝 Processing first detected name: ${detectedName}`);
                    contactSuggestion = await aiMediator.generateContactSuggestion(detectedName, cleanText);
                    if (contactSuggestion) {
                      // Store pending contact suggestion in user's socket data
                      if (!socket.data) socket.data = {};
                      socket.data.pendingContactSuggestion = {
                        detectedName: contactSuggestion.detectedName,
                        messageContext: contactSuggestion.messageContext,
                        timestamp: Date.now()
                      };

                      // Store remaining names in queue for later
                      if (detectedNames.length > 1) {
                        if (!socket.data.pendingNamesQueue) {
                          socket.data.pendingNamesQueue = [];
                        }
                        socket.data.pendingNamesQueue.push(...detectedNames.slice(1));
                        console.log(`📋 Queued additional names:`, socket.data.pendingNamesQueue);
                      }
                    }
                  }
                }
              }
            } catch (nameErr) {
              console.error('Error detecting names:', nameErr);
            }
          }

          if (intervention) {
            // Handle different intervention types
            if (intervention.type === 'ai_intervention') {
              // AI INTERVENTION - Block message and show intervention ONLY to sender
              console.log(`🚫 Message from ${user.username} blocked by AI - showing intervention to sender ONLY`);

              // DO NOT save the blocked message to database
              // DO NOT broadcast to room - this message should never reach other users

              // Update communication stats - streak broken by intervention
              try {
                const db = await require('./db').getDb();
                const userResult = await dbSafe.safeSelect('users', { username: user.username.toLowerCase() }, { limit: 1 });
                const users = dbSafe.parseResult(userResult);
                if (users.length > 0) {
                  await communicationStats.updateCommunicationStats(users[0].id, user.roomId, true);
                }
              } catch (statsErr) {
                console.error('Error updating communication stats for intervention:', statsErr);
              }

              // Send intervention UI ONLY to the sender (private message)
              const interventionMessage = {
                id: `ai-intervention-${Date.now()}`,
                type: 'ai_intervention',
                personalMessage: intervention.personalMessage,
                tip1: intervention.tip1,
                rewrite1: intervention.rewrite1,
                rewrite2: intervention.rewrite2,
                originalMessage: message,
                escalation: intervention.escalation,
                emotion: intervention.emotion,
                timestamp: new Date().toISOString()
              };

              // Send ONLY to the sender (not to the room)
              socket.emit('new_message', interventionMessage);

              console.log(`✅ Intervention UI sent to ${user.username} privately - message NOT visible to others`);
            } else if (intervention.type === 'ai_comment') {
              // COMMENT: Helpful observation - show to everyone in room
              console.log(`💬 AI adding contextual comment - broadcasting to room`);

              // First, broadcast the original message normally
              messageStore.saveMessage({
                ...message,
                roomId: user.roomId
              }).catch(err => {
                console.error('Error saving message to database:', err);
              });

              io.to(user.roomId).emit('new_message', message);

              // Then add the AI comment (visible to everyone)
              const aiComment = {
                id: `ai-comment-${Date.now()}`,
                type: 'ai_comment',
                username: 'Alex',
                text: intervention.text,
                timestamp: new Date().toISOString(),
                roomId: user.roomId
              };

              // Save and broadcast the comment to the room
              messageStore.saveMessage(aiComment).catch(err => {
                console.error('Error saving AI comment to database:', err);
              });

              io.to(user.roomId).emit('new_message', aiComment);

              console.log(`✅ AI commented - visible to all in room`);

              // Extract relationship insights asynchronously (non-blocking)
              setImmediate(async () => {
                try {
                  const recentMessages = aiMediator.getContext().recentMessages;
                  await aiMediator.extractRelationshipInsights(recentMessages, user.roomId);
                } catch (insightErr) {
                  console.error('Error extracting relationship insights:', insightErr);
                }
              });
            }
          } else {
            // Message is fine - broadcast to room only and save to database
            console.log(`✅ Message from ${user.username} approved - broadcasting to room ${user.roomId}`);

            // Update communication stats - successful message, increment streak
            try {
              const db = await require('./db').getDb();
              const userResult = await dbSafe.safeSelect('users', { username: user.username.toLowerCase() }, { limit: 1 });
              const users = dbSafe.parseResult(userResult);
              if (users.length > 0) {
                await communicationStats.updateCommunicationStats(users[0].id, user.roomId, false);
              }
            } catch (statsErr) {
              console.error('Error updating communication stats for approved message:', statsErr);
            }

            // Save to database using messageStore (includes room_id)
            messageStore.saveMessage({
              ...message,
              roomId: user.roomId
            }).catch(err => {
              console.error('Error saving message to database:', err);
            });

            // Broadcast to room only
            io.to(user.roomId).emit('new_message', message);

            // If we detected a name, send contact suggestion
            if (contactSuggestion) {
              const suggestionMessage = {
                id: `contact-suggestion-${Date.now()}`,
                type: 'contact_suggestion',
                username: 'AI Assistant',
                text: contactSuggestion.suggestionText,
                detectedName: contactSuggestion.detectedName,
                timestamp: new Date().toISOString(),
                roomId: user.roomId
              };

              // Send suggestion only to the user who mentioned the name
              socket.emit('new_message', suggestionMessage);
              console.log(`💡 Contact suggestion sent for: ${contactSuggestion.detectedName}`);
            }

            // Extract relationship insights asynchronously (non-blocking, every few messages)
            // Only extract if we have enough messages (at least 3)
            if (context.recentMessages.length >= 3) {
              setImmediate(async () => {
                try {
                  // Only extract insights occasionally (every 5th message) to avoid excessive API calls
                  const messageCount = context.recentMessages.length;
                  if (messageCount % 5 === 0) {
                    await aiMediator.extractRelationshipInsights(context.recentMessages, user.roomId);
                  }
                } catch (insightErr) {
                  console.error('Error extracting relationship insights:', insightErr);
                }
              });
            }
          }
        } catch (aiError) {
          console.error('❌ Error in AI mediator:', aiError.message);
          // If AI fails, allow the message through (fail open) rather than blocking everything
          // This prevents the AI system from breaking normal communication
          console.log(`⚠️ AI moderation failed for ${user.username} - allowing message through (fail open)`);

          // Broadcast message normally if AI fails
          messageStore.saveMessage({
            ...message,
            roomId: user.roomId
          }).catch(err => {
            console.error('Error saving message to database:', err);
          });

          // Broadcast to room
          io.to(user.roomId).emit('new_message', message);

          if (aiError.stack) {
            console.error('Stack trace:', aiError.stack);
          }
          // Don't let AI errors break the chat - allow messages through
        }
      });

    } catch (error) {
      console.error('Error in send_message handler:', error);
      socket.emit('error', { message: 'Failed to send message.' });
    }
  });

  // Handle user typing indicator
  socket.on('typing', ({ isTyping }) => {
    const user = activeUsers.get(socket.id);
    if (user && user.roomId) {
      // Broadcast typing indicator only to room
      socket.to(user.roomId).emit('user_typing', {
        username: user.username,
        isTyping
      });
    }
  });

  // Handle message editing
  socket.on('edit_message', async ({ messageId, text }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before editing messages.' });
        return;
      }

      const cleanText = sanitizeInput(text);
      if (!cleanText || cleanText.length === 0) {
        socket.emit('error', { message: 'Message cannot be empty.' });
        return;
      }

      if (cleanText.length > MAX_MESSAGE_LENGTH) {
        socket.emit('error', { message: `Message too long (max ${MAX_MESSAGE_LENGTH} characters).` });
        return;
      }

      // Get message from database
      const db = await require('./db').getDb();
      const dbPostgres = require('./dbPostgres');
      const messageQuery = `
        SELECT * FROM messages
        WHERE id = $1
        AND username = $2
        AND room_id = $3
        LIMIT 1
      `;
      const messageResult = await dbPostgres.query(messageQuery, [messageId, user.username, user.roomId]);
      const messages = messageResult.rows;

      if (messages.length === 0) {
        socket.emit('error', { message: 'Message not found or you do not have permission to edit it.' });
        return;
      }

      const originalMessage = messages[0];

      // Update message in database
      await dbSafe.safeUpdate('messages', {
        text: cleanText,
        edited: 1,
        edited_at: new Date().toISOString()
      }, { id: messageId });

      require('./db').saveDatabase();

      // Broadcast edited message to room
      const editedMessage = {
        id: messageId,
        type: originalMessage.type,
        username: user.username,
        text: cleanText,
        timestamp: originalMessage.timestamp,
        edited: true,
        editedAt: new Date().toISOString(),
        roomId: user.roomId
      };

      io.to(user.roomId).emit('message_edited', editedMessage);
      console.log(`Message ${messageId} edited by ${user.username}`);
    } catch (error) {
      console.error('Error editing message:', error);
      socket.emit('error', { message: 'Failed to edit message.' });
    }
  });

  // Handle message deletion
  socket.on('delete_message', async ({ messageId }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before deleting messages.' });
        return;
      }

      // Get message from database
      const db = await require('./db').getDb();
      const dbPostgres = require('./dbPostgres');
      const messageQuery = `
        SELECT * FROM messages
        WHERE id = $1
        AND username = $2
        AND room_id = $3
        LIMIT 1
      `;
      const messageResult = await dbPostgres.query(messageQuery, [messageId, user.username, user.roomId]);
      const messages = messageResult.rows;

      if (messages.length === 0) {
        socket.emit('error', { message: 'Message not found or you do not have permission to delete it.' });
        return;
      }

      // Mark message as deleted (soft delete)
      await dbSafe.safeUpdate('messages', {
        deleted: 1,
        deleted_at: new Date().toISOString()
      }, { id: messageId });

      require('./db').saveDatabase();

      // Broadcast deletion to room
      io.to(user.roomId).emit('message_deleted', {
        messageId: messageId,
        roomId: user.roomId
      });

      console.log(`Message ${messageId} deleted by ${user.username}`);
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('error', { message: 'Failed to delete message.' });
    }
  });

  // Handle message reactions
  socket.on('add_reaction', async ({ messageId, emoji }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before reacting to messages.' });
        return;
      }

      // Validate emoji (simple check - should be a single emoji character)
      if (!emoji || emoji.length === 0) {
        socket.emit('error', { message: 'Invalid emoji.' });
        return;
      }

      // Get message from database to verify it exists in this room
      const dbPostgres = require('./dbPostgres');
      const messageQuery = `
        SELECT * FROM messages
        WHERE id = $1
        AND room_id = $2
        AND (deleted = false OR deleted IS NULL)
        LIMIT 1
      `;
      const messageResult = await dbPostgres.query(messageQuery, [messageId, user.roomId]);
      const messages = messageResult.rows;

      if (messages.length === 0) {
        socket.emit('error', { message: 'Message not found.' });
        return;
      }

      // Get existing reactions for this message
      const reactionsQuery = `
        SELECT reactions FROM messages
        WHERE id = $1
        LIMIT 1
      `;
      const reactionsResult = await dbPostgres.query(reactionsQuery, [messageId]);
      const reactionsData = reactionsResult.rows;

      let reactions = {};
      if (reactionsData.length > 0 && reactionsData[0].reactions) {
        try {
          reactions = JSON.parse(reactionsData[0].reactions);
        } catch (e) {
          reactions = {};
        }
      }

      // Add or update reaction
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }

      // Toggle reaction - if user already reacted, remove it; otherwise add it
      const userIndex = reactions[emoji].indexOf(user.username);
      if (userIndex > -1) {
        reactions[emoji].splice(userIndex, 1);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      } else {
        reactions[emoji].push(user.username);
      }

      // Update message in database
      await dbSafe.safeUpdate('messages', {
        reactions: JSON.stringify(reactions)
      }, { id: messageId });

      require('./db').saveDatabase();

      // Broadcast reaction update to room
      io.to(user.roomId).emit('reaction_updated', {
        messageId: messageId,
        reactions: reactions,
        roomId: user.roomId
      });

      console.log(`Reaction ${emoji} added/removed by ${user.username} on message ${messageId}`);
    } catch (error) {
      console.error('Error adding reaction:', error);
      socket.emit('error', { message: 'Failed to add reaction.' });
    }
  });

  // Handle intervention feedback (explicit feedback on AI interventions)
  socket.on('intervention_feedback', async ({ interventionId, helpful, reason }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before providing feedback.' });
        return;
      }

      const feedbackLearner = require('./feedbackLearner');

      // Record explicit feedback
      await feedbackLearner.recordExplicitFeedback(
        user.username,
        helpful ? 'helpful' : 'not_helpful',
        { interventionId: interventionId },
        reason || null
      );

      // Update intervention feedback in consolidated AI mediator
      aiMediator.recordInterventionFeedback(user.roomId, helpful);

      socket.emit('feedback_recorded', { success: true });
      console.log(`📝 Intervention feedback recorded: ${helpful ? 'helpful' : 'not helpful'} from ${user.username}`);

    } catch (error) {
      console.error('Error recording intervention feedback:', error);
      socket.emit('error', { message: 'Failed to record feedback.' });
    }
  });

  // Handle thread creation
  socket.on('create_thread', async ({ roomId, title, messageId }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before creating threads.' });
        return;
      }

      const threadManager = require('./threadManager');
      const threadId = await threadManager.createThread(roomId, title, user.username, messageId);

      // If messageId provided, add it to the thread
      if (messageId) {
        await threadManager.addMessageToThread(messageId, threadId);
      }

      // Get updated thread list
      const threads = await threadManager.getThreadsForRoom(roomId);
      io.to(roomId).emit('threads_updated', threads);

      socket.emit('thread_created', { threadId, title });
      console.log(`✅ Thread created: ${title} by ${user.username}`);

    } catch (error) {
      console.error('Error creating thread:', error);
      socket.emit('error', { message: 'Failed to create thread.' });
    }
  });

  // Handle getting threads for a room
  socket.on('get_threads', async ({ roomId }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before getting threads.' });
        return;
      }

      const threadManager = require('./threadManager');
      const threads = await threadManager.getThreadsForRoom(roomId);
      socket.emit('threads_list', threads);

    } catch (error) {
      console.error('Error getting threads:', error);
      socket.emit('error', { message: 'Failed to get threads.' });
    }
  });

  // Handle getting messages for a thread
  socket.on('get_thread_messages', async ({ threadId }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before getting thread messages.' });
        return;
      }

      const threadManager = require('./threadManager');
      const messages = await threadManager.getThreadMessages(threadId);
      socket.emit('thread_messages', { threadId, messages });

    } catch (error) {
      console.error('Error getting thread messages:', error);
      socket.emit('error', { message: 'Failed to get thread messages.' });
    }
  });

  // Handle adding message to thread
  socket.on('add_to_thread', async ({ messageId, threadId }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before adding to thread.' });
        return;
      }

      const threadManager = require('./threadManager');
      await threadManager.addMessageToThread(messageId, threadId);

      // Update thread list
      const userObj = activeUsers.get(socket.id);
      if (userObj) {
        const threads = await threadManager.getThreadsForRoom(userObj.roomId);
        io.to(userObj.roomId).emit('threads_updated', threads);
      }

      socket.emit('message_added_to_thread', { messageId, threadId });
      console.log(`✅ Message ${messageId} added to thread ${threadId}`);

    } catch (error) {
      console.error('Error adding to thread:', error);
      socket.emit('error', { message: 'Failed to add message to thread.' });
    }
  });

  // Handle removing message from thread
  socket.on('remove_from_thread', async ({ messageId }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before removing from thread.' });
        return;
      }

      const threadManager = require('./threadManager');
      await threadManager.removeMessageFromThread(messageId);

      // Update thread list
      const userObj = activeUsers.get(socket.id);
      if (userObj) {
        const threads = await threadManager.getThreadsForRoom(userObj.roomId);
        io.to(userObj.roomId).emit('threads_updated', threads);
      }

      socket.emit('message_removed_from_thread', { messageId });
      console.log(`✅ Message ${messageId} removed from thread`);

    } catch (error) {
      console.error('Error removing from thread:', error);
      socket.emit('error', { message: 'Failed to remove message from thread.' });
    }
  });

  // Handle override request (user wants to send message anyway)
  socket.on('override_intervention', async ({ messageId, overrideAction }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before overriding.' });
        return;
      }

      const feedbackLearner = require('./feedbackLearner');

      // Record implicit feedback (user overrode intervention)
      await feedbackLearner.recordImplicitFeedback(
        user.username,
        'override_intervention',
        { messageId: messageId, overrideAction: overrideAction }
      );

      // Get the original message and send it anyway
      const db = await require('./db').getDb();
      const dbSafe = require('./dbSafe');
      const messageResult = await dbSafe.safeSelect('messages', { id: messageId }, { limit: 1 });
      const messages = dbSafe.parseResult(messageResult);

      if (messages.length > 0) {
        const originalMessage = messages[0];
        const messageObj = {
          id: originalMessage.id || messageId,
          type: 'user',
          username: originalMessage.username || user.username,
          text: originalMessage.text,
          timestamp: originalMessage.timestamp || new Date().toISOString(),
          roomId: user.roomId,
          overrideNote: 'User chose to send this message despite intervention'
        };

        // Message already exists in database from original send attempt
        // Just broadcast to room
        io.to(user.roomId).emit('new_message', messageObj);

        socket.emit('override_success', { messageId: messageId });
        console.log(`✅ User ${user.username} overrode intervention for message ${messageId}`);
      } else {
        socket.emit('error', { message: 'Original message not found.' });
      }

    } catch (error) {
      console.error('Error handling override:', error);
      socket.emit('error', { message: 'Failed to override intervention.' });
    }
  });

  // Handle user flagging a message as triggering
  socket.on('flag_message', async ({ messageId, reason }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before flagging messages.' });
        return;
      }

      // Get message from database to verify it exists in this room
      const dbPostgres = require('./dbPostgres');
      const messageQuery = `
        SELECT * FROM messages
        WHERE id = $1
        AND room_id = $2
        AND (deleted = false OR deleted IS NULL)
        LIMIT 1
      `;
      const messageResult = await dbPostgres.query(messageQuery, [messageId, user.roomId]);
      const messages = messageResult.rows;

      if (messages.length === 0) {
        socket.emit('error', { message: 'Message not found.' });
        return;
      }

      const message = messages[0];

      // Don't allow users to flag their own messages
      if (message.username === user.username) {
        socket.emit('error', { message: 'You cannot flag your own messages.' });
        return;
      }

      // Get existing user flags for this message
      let flaggedBy = [];
      if (message.user_flagged_by) {
        try {
          flaggedBy = JSON.parse(message.user_flagged_by);
        } catch (e) {
          flaggedBy = [];
        }
      }

      // Check if user is already flagging this message
      const isCurrentlyFlagged = flaggedBy.includes(user.username);

      // Toggle flag - if user already flagged, remove it; otherwise add it
      if (isCurrentlyFlagged) {
        // Unflagging - remove from array
        flaggedBy = flaggedBy.filter(u => u !== user.username);
      } else {
        // Flagging - add to array
        flaggedBy.push(user.username);

        // If reason is provided, save it to the co-parent's contact profile
        if (reason && reason.trim()) {
          try {
            // Get the sender's username (co-parent)
            const senderUsername = message.username;

            // Get current user's ID
            const userResult = await dbSafe.safeSelect('users', { username: user.username.toLowerCase() }, { limit: 1 });
            const users = dbSafe.parseResult(userResult);

            if (users.length > 0) {
              const userId = users[0].id;

              // Find the co-parent contact (case-insensitive)
              const contactResult = await dbSafe.safeSelect('contacts', {
                user_id: userId,
                relationship: 'co-parent'
              }, { limit: 100 }); // Get all co-parent contacts to check

              const contacts = dbSafe.parseResult(contactResult);

              // Find contact with matching name (case-insensitive)
              const contact = contacts.find(c =>
                c.contact_name && c.contact_name.toLowerCase() === senderUsername.toLowerCase()
              );

              if (contact) {

                // Get existing triggering reasons
                let triggeringReasons = [];
                if (contact.triggering_reasons) {
                  try {
                    triggeringReasons = JSON.parse(contact.triggering_reasons);
                  } catch (e) {
                    triggeringReasons = [];
                  }
                }

                // Add new triggering reason with timestamp and message context
                const triggeringReason = {
                  reason: reason.trim(),
                  messageText: message.text || '',
                  timestamp: new Date().toISOString(),
                  messageId: messageId
                };

                triggeringReasons.push(triggeringReason);

                // Keep only last 20 triggering reasons to avoid excessive data
                if (triggeringReasons.length > 20) {
                  triggeringReasons = triggeringReasons.slice(-20);
                }

                // Update contact with triggering reasons
                await dbSafe.safeUpdate('contacts', {
                  triggering_reasons: JSON.stringify(triggeringReasons),
                  updated_at: new Date().toISOString()
                }, { id: contact.id });

                console.log(`💾 Saved triggering reason for ${senderUsername} from ${user.username}: ${reason}`);
              } else {
                console.log(`⚠️ Co-parent contact not found for ${senderUsername} - cannot save triggering reason`);
              }
            }
          } catch (reasonError) {
            console.error('Error saving triggering reason:', reasonError);
            // Don't fail the flag operation if saving reason fails
          }
        }
      }

      // Update message in database
      await dbSafe.safeUpdate('messages', {
        user_flagged_by: JSON.stringify(flaggedBy)
      }, { id: messageId });

      // Save flag record for AI learning (only when flagging, not unflagging)
      if (!isCurrentlyFlagged && reason && reason.trim()) {
        try {
          await dbSafe.safeInsert('message_flags', {
            message_id: messageId,
            flagged_by_username: user.username,
            reason: reason.trim(),
            created_at: new Date().toISOString()
          });
          console.log(`📝 Saved flag feedback for AI learning: message ${messageId} flagged by ${user.username}`);
        } catch (flagError) {
          console.error('Error saving flag record:', flagError);
          // Don't fail the flag operation if saving flag record fails
        }
      }

      require('./db').saveDatabase();

      // Broadcast flag update to room
      io.to(user.roomId).emit('message_flagged', {
        messageId: messageId,
        flaggedBy: flaggedBy,
        roomId: user.roomId
      });

      console.log(`Message ${messageId} ${isCurrentlyFlagged ? 'unflagged' : 'flagged'} by ${user.username}. Flagged by: ${flaggedBy.join(', ')}`);
    } catch (error) {
      console.error('Error flagging message:', error);
      socket.emit('error', { message: 'Failed to flag message.' });
    }
  });

  // Handle contact suggestion response
  socket.on('contact_suggestion_response', async ({ response, detectedName, relationship }) => {
    try {
      console.log('📥 Received contact_suggestion_response:', { response, detectedName, relationship });

      const user = activeUsers.get(socket.id);
      if (!user) {
        console.error('❌ User not found for contact suggestion response');
        return socket.emit('error', { message: 'User not found' });
      }

      // Check if there's a pending suggestion
      if (!socket.data || !socket.data.pendingContactSuggestion) {
        console.error('❌ No pending contact suggestion found');
        return socket.emit('error', { message: 'No pending contact suggestion' });
      }

      const pending = socket.data.pendingContactSuggestion;
      console.log('📋 Processing pending suggestion:', pending);

      if (response === 'yes') {
        if (!relationship) {
          console.log('⚠️ No relationship provided, asking for relationship');
          // Ask for relationship
          const relationshipPrompt = {
            id: `contact-relationship-${Date.now()}`,
            type: 'contact_relationship_prompt',
            username: 'AI Assistant',
            text: `What is ${pending.detectedName}'s relationship to you? (e.g., therapist, family member, teacher, friend, etc.)`,
            detectedName: pending.detectedName,
            timestamp: new Date().toISOString()
          };
          socket.emit('new_message', relationshipPrompt);
          return;
        }

        // Create the contact
        try {
          console.log('💾 Creating contact:', {
            name: pending.detectedName,
            relationship: relationship,
            userId: user.username
          });

          const db = await require('./db').getDb();
          const userResult = await dbSafe.safeSelect('users', { username: user.username.toLowerCase() }, { limit: 1 });
          const users = dbSafe.parseResult(userResult);

          if (users.length === 0) {
            console.error('❌ User not found in database:', user.username);
            return socket.emit('error', { message: 'User not found in database' });
          }

          const now = new Date().toISOString();
          const contactId = await dbSafe.safeInsert('contacts', {
            user_id: users[0].id,
            contact_name: pending.detectedName,
            contact_email: null,
            relationship: relationship || null,
            notes: `Mentioned in chat: ${pending.messageContext}`,
            separation_date: null,
            address: null,
            difficult_aspects: null,
            friction_situations: null,
            legal_matters: null,
            safety_concerns: null,
            substance_mental_health: null,
            neglect_abuse_concerns: null,
            additional_thoughts: null,
            created_at: now,
            updated_at: now
          });
          require('./db').saveDatabase();

          console.log('✅ Contact created successfully:', {
            contactId,
            contactName: pending.detectedName,
            userId: users[0].id
          });

          const successMessage = {
            id: `contact-added-${Date.now()}`,
            type: 'system',
            username: 'AI Assistant',
            text: `✅ ${pending.detectedName} has been added to your contacts!`,
            timestamp: new Date().toISOString()
          };
          socket.emit('new_message', successMessage);

          // Clear pending suggestion
          delete socket.data.pendingContactSuggestion;

          // Process next name in queue if available
          if (socket.data && socket.data.pendingNamesQueue && socket.data.pendingNamesQueue.length > 0) {
            const nextName = socket.data.pendingNamesQueue.shift();
            console.log(`📝 Processing queued name: ${nextName}`);

            setTimeout(async () => {
              try {
                const contactSuggestion = await aiMediator.generateContactSuggestion(nextName, 'Mentioned in chat');
                if (contactSuggestion) {
                  socket.data.pendingContactSuggestion = {
                    detectedName: contactSuggestion.detectedName,
                    messageContext: contactSuggestion.messageContext,
                    timestamp: Date.now()
                  };

                  const suggestionMessage = {
                    id: `contact-suggestion-${Date.now()}`,
                    type: 'contact_suggestion',
                    username: 'AI Assistant',
                    text: contactSuggestion.suggestionText,
                    detectedName: contactSuggestion.detectedName,
                    messageContext: contactSuggestion.messageContext,
                    timestamp: new Date().toISOString()
                  };
                  socket.emit('new_message', suggestionMessage);
                  console.log(`💡 Contact suggestion sent for queued name: ${contactSuggestion.detectedName}`);
                }
              } catch (err) {
                console.error('Error processing queued name:', err);
              }
            }, 1000); // Wait 1 second before showing next suggestion
          }
        } catch (err) {
          console.error('Error creating contact:', err);
          console.error('Error stack:', err.stack);
          socket.emit('error', { message: 'Failed to add contact. Please try again.' });
        }
      } else {
        // User declined - clear pending suggestion
        delete socket.data.pendingContactSuggestion;

        // Process next name in queue if available
        if (socket.data && socket.data.pendingNamesQueue && socket.data.pendingNamesQueue.length > 0) {
          const nextName = socket.data.pendingNamesQueue.shift();
          console.log(`📝 Processing queued name after decline: ${nextName}`);

          setTimeout(async () => {
            try {
              const contactSuggestion = await aiMediator.generateContactSuggestion(nextName, 'Mentioned in chat');
              if (contactSuggestion) {
                socket.data.pendingContactSuggestion = {
                  detectedName: contactSuggestion.detectedName,
                  messageContext: contactSuggestion.messageContext,
                  timestamp: Date.now()
                };

                const suggestionMessage = {
                  id: `contact-suggestion-${Date.now()}`,
                  type: 'contact_suggestion',
                  username: 'AI Assistant',
                  text: contactSuggestion.suggestionText,
                  detectedName: contactSuggestion.detectedName,
                  messageContext: contactSuggestion.messageContext,
                  timestamp: new Date().toISOString()
                };
                socket.emit('new_message', suggestionMessage);
                console.log(`💡 Contact suggestion sent for queued name: ${contactSuggestion.detectedName}`);
              }
            } catch (err) {
              console.error('Error processing queued name:', err);
            }
          }, 1000); // Wait 1 second before showing next suggestion
        }
        const declinedMessage = {
          id: `contact-declined-${Date.now()}`,
          type: 'system',
          username: 'AI Assistant',
          text: `No problem! You can always add ${pending.detectedName} to your contacts later from the Contacts page.`,
          timestamp: new Date().toISOString()
        };
        socket.emit('new_message', declinedMessage);
      }
    } catch (error) {
      console.error('Error handling contact suggestion response:', error);
      socket.emit('error', { message: 'Failed to process contact suggestion.' });
    }
  });

  // Handle relationship input for contact
  socket.on('contact_relationship', async ({ detectedName, relationship }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        return socket.emit('error', { message: 'User not found' });
      }

      // Create the contact with relationship
      try {
        const db = await require('./db').getDb();
        const userResult = await dbSafe.safeSelect('users', { username: user.username.toLowerCase() }, { limit: 1 });
        const users = dbSafe.parseResult(userResult);

        if (users.length > 0 && socket.data && socket.data.pendingContactSuggestion) {
          const pending = socket.data.pendingContactSuggestion;
          const now = new Date().toISOString();
          await dbSafe.safeInsert('contacts', {
            user_id: users[0].id,
            contact_name: detectedName || pending.detectedName,
            contact_email: null,
            relationship: relationship || null,
            notes: `Mentioned in chat: ${pending.messageContext}`,
            separation_date: null,
            address: null,
            difficult_aspects: null,
            friction_situations: null,
            legal_matters: null,
            safety_concerns: null,
            substance_mental_health: null,
            neglect_abuse_concerns: null,
            additional_thoughts: null,
            created_at: now,
            updated_at: now
          });
          require('./db').saveDatabase();

          const successMessage = {
            id: `contact-added-${Date.now()}`,
            type: 'system',
            username: 'AI Assistant',
            text: `✅ ${detectedName || pending.detectedName} has been added to your contacts as ${relationship || 'a contact'}!`,
            timestamp: new Date().toISOString()
          };
          socket.emit('new_message', successMessage);

          // Clear pending suggestion
          delete socket.data.pendingContactSuggestion;
        }
      } catch (err) {
        console.error('Error creating contact with relationship:', err);
        socket.emit('error', { message: 'Failed to add contact. Please try again.' });
      }
    } catch (error) {
      console.error('Error handling contact relationship:', error);
      socket.emit('error', { message: 'Failed to process relationship.' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    const user = activeUsers.get(socket.id);

    if (user) {
      console.log(`User disconnected: ${user.username} from room ${user.roomId} (${socket.id})`);

      const roomId = user.roomId;
      activeUsers.delete(socket.id);

      const systemMessage = {
        id: `${Date.now()}-${socket.id}`,
        type: 'system',
        username: 'System',
        text: `${user.username} left the chat`,
        timestamp: new Date().toISOString(),
        roomId: roomId
      };

      // Save to database
      try {
        const dbPostgres = require('./dbPostgres');
        await dbPostgres.query(`
          INSERT INTO messages (id, type, username, text, timestamp, socket_id, room_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [systemMessage.id, systemMessage.type, systemMessage.username, systemMessage.text, systemMessage.timestamp, socket.id, roomId]);
      } catch (err) {
        console.error('Error saving system message:', err);
      }

      // Get remaining users in this room
      const roomUsers = [];
      for (const [sid, userData] of activeUsers.entries()) {
        if (userData.roomId === roomId) {
          roomUsers.push({
            username: userData.username,
            joinedAt: userData.joinedAt
          });
        }
      }

      // Broadcast to room only
      io.to(roomId).emit('user_left', {
        message: systemMessage,
        users: roomUsers
      });
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error);
  });
});

// Health check endpoint already registered earlier (line 53) - removing duplicate

// Serve admin UI
app.get('/admin', (req, res) => {
  const adminPath = path.join(__dirname, 'admin.html');
  console.log('Serving admin page from:', adminPath);
  res.sendFile(adminPath, (err) => {
    if (err) {
      console.error('Error serving admin page:', err);
      res.status(500).send('Error loading admin page');
    }
  });
});

// Debug endpoint: List all users (for development/debugging)
app.get('/api/debug/users', async (req, res) => {
  try {
    const dbPostgres = require('./dbPostgres');
    const result = await dbPostgres.query(`
      SELECT 
        id, 
        username, 
        email, 
        created_at, 
        last_login 
      FROM users 
      ORDER BY created_at DESC
    `);

    const users = result.rows || [];
    
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email || null,
      created_at: user.created_at,
      last_login: user.last_login || null
    }));

    res.json({
      users: formattedUsers,
      count: formattedUsers.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public endpoint: Get total user count (for beta spots calculation)
app.get('/api/stats/user-count', async (req, res) => {
  try {
    const usePostgres = !!process.env.DATABASE_URL;
    let count = 0;

    if (usePostgres) {
      // PostgreSQL
      const dbPostgres = require('./dbPostgres');
      const result = await dbPostgres.query('SELECT COUNT(*) as count FROM users');
      count = parseInt(result.rows[0]?.count || 0, 10);
    } else {
      // PostgreSQL (should always be this path now)
      const dbPostgres = require('./dbPostgres');
      const result = await dbPostgres.query('SELECT COUNT(*) as count FROM users');
      count = parseInt(result.rows[0]?.count || 0, 10);
    }

    res.json({ count });
  } catch (error) {
    console.error('Error fetching user count:', error);
    // Return 0 on error so frontend doesn't break
    res.json({ count: 0 });
  }
});

// Debug endpoint: List all rooms
app.get('/api/debug/rooms', async (req, res) => {
  try {
    const db = await require('./db').getDb();
    // Use safeExec for read-only query (no user input)
    const result = db.exec(`
      SELECT 
        r.id,
        r.name,
        r.created_by,
        u.username as created_by_username,
        r.is_private,
        r.created_at,
        COUNT(CASE WHEN u2.id IS NOT NULL THEN 1 END) as member_count
      FROM rooms r
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN room_members rm ON r.id = rm.room_id
      LEFT JOIN users u2 ON rm.user_id = u2.id
      GROUP BY r.id, r.name, r.created_by, u.username, r.is_private, r.created_at
      ORDER BY r.created_at DESC
    `);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.json({ rooms: [], count: 0 });
    }

    const row = result[0];
    const columns = row.columns;
    const rooms = row.values.map(values => {
      const room = {};
      values.forEach((value, index) => {
        room[columns[index]] = value;
      });
      return {
        id: room.id,
        name: room.name,
        created_by: room.created_by,
        created_by_username: room.created_by_username,
        is_private: room.is_private === 1,
        created_at: room.created_at,
        member_count: room.member_count || 0
      };
    });

    res.json({
      rooms,
      count: rooms.length
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin endpoint: Clean up orphaned data
app.post('/api/admin/cleanup', async (req, res) => {
  try {
    const db = await require('./db').getDb();

    // Clean up orphaned room_members (entries referencing deleted users)
    const orphanedMembersQuery = `
      DELETE FROM room_members 
      WHERE user_id NOT IN (SELECT id FROM users)
    `;
    const membersDeleted = db.exec(orphanedMembersQuery);

    // Clean up orphaned rooms (rooms with no valid members left)
    const orphanedRoomsQuery = `
      DELETE FROM rooms 
      WHERE id NOT IN (
        SELECT DISTINCT rm.room_id 
        FROM room_members rm 
        INNER JOIN users u ON rm.user_id = u.id 
        WHERE rm.room_id IS NOT NULL
      )
    `;
    const roomsDeleted = db.exec(orphanedRoomsQuery);

    // Clean up orphaned messages (messages with no room)
    const orphanedMessagesQuery = `
      DELETE FROM messages 
      WHERE room_id IS NOT NULL 
      AND room_id NOT IN (SELECT id FROM rooms)
    `;
    const messagesDeleted = db.exec(orphanedMessagesQuery);

    // Save database after cleanup
    require('./db').saveDatabase();

    console.log('✅ Cleanup completed: orphaned data removed');

    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      deleted: {
        room_members: membersDeleted.length > 0 ? 'some' : 0,
        rooms: roomsDeleted.length > 0 ? 'some' : 0,
        messages: messagesDeleted.length > 0 ? 'some' : 0
      }
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin endpoint: Delete a user
app.delete('/api/admin/users/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const db = await require('./db').getDb();

    // Check if user exists
    const userResult = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const username = users[0].username;

    // Delete user (CASCADE will handle related records)
    await dbSafe.safeDelete('users', { id: userId });

    // Clean up orphaned room_members (entries referencing deleted users)
    // This is a safety net in case CASCADE didn't work
    const orphanedMembersQuery = `
      DELETE FROM room_members 
      WHERE user_id NOT IN (SELECT id FROM users)
    `;
    db.exec(orphanedMembersQuery);

    // Clean up orphaned rooms (rooms with no valid members left)
    // Only count room_members that reference existing users
    const orphanedRoomsQuery = `
      DELETE FROM rooms 
      WHERE id NOT IN (
        SELECT DISTINCT rm.room_id 
        FROM room_members rm 
        INNER JOIN users u ON rm.user_id = u.id 
        WHERE rm.room_id IS NOT NULL
      )
    `;
    db.exec(orphanedRoomsQuery);

    // Also clean up orphaned messages (messages with no room)
    const orphanedMessagesQuery = `
      DELETE FROM messages 
      WHERE room_id IS NOT NULL 
      AND room_id NOT IN (SELECT id FROM rooms)
    `;
    db.exec(orphanedMessagesQuery);

    // Save database after cleanup
    require('./db').saveDatabase();

    console.log(`User ${username} (ID: ${userId}) deleted by admin`);

    res.json({
      success: true,
      message: `User ${username} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint: List all pending connections
app.get('/api/debug/pending-connections', async (req, res) => {
  try {
    const db = await require('./db').getDb();
    const result = db.exec(`
      SELECT 
        pc.id,
        pc.inviter_id,
        u1.username as inviter_username,
        pc.invitee_email,
        pc.token,
        pc.status,
        pc.created_at,
        pc.expires_at,
        pc.accepted_at
      FROM pending_connections pc
      LEFT JOIN users u1 ON pc.inviter_id = u1.id
      ORDER BY pc.created_at DESC
    `);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.json({ connections: [], count: 0 });
    }

    const row = result[0];
    const columns = row.columns;
    const connections = row.values.map(values => {
      const conn = {};
      values.forEach((value, index) => {
        conn[columns[index]] = value;
      });
      return {
        id: conn.id,
        inviter_id: conn.inviter_id,
        inviter_username: conn.inviter_username,
        invitee_email: conn.invitee_email,
        token: conn.token,
        status: conn.status,
        created_at: conn.created_at,
        expires_at: conn.expires_at,
        accepted_at: conn.accepted_at || null,
        is_expired: conn.expires_at ? new Date(conn.expires_at) < new Date() : false
      };
    });

    res.json({
      connections,
      count: connections.length
    });
  } catch (error) {
    console.error('Error fetching pending connections:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from Vite build (if dist directory exists)
// This allows the backend to serve the frontend if needed
const distPath = path.join(__dirname, 'dist');
const distExists = fs.existsSync(distPath);

if (distExists) {
  console.log('[Server] Serving static files from:', distPath);
  // Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(distPath, {
    maxAge: '1y', // Cache static assets for 1 year
    etag: true,
    lastModified: true
  }));

  // Serve favicon if it exists
  app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(distPath, 'favicon.ico');
    if (fs.existsSync(faviconPath)) {
      res.sendFile(faviconPath);
    } else {
      res.status(404).end();
    }
  });

  // Catch-all handler: serve index.html for all non-API routes
  // This allows React Router to handle client-side routing
  app.get('*', (req, res, next) => {
    // Skip API routes and admin routes
    if (req.path.startsWith('/api') || req.path.startsWith('/admin') || req.path.startsWith('/health')) {
      return next();
    }

    // Serve index.html for all other routes (React Router will handle routing)
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
} else {
  // Frontend is served by Vercel - backend only serves API
  // Root endpoint provides API information
  app.get('/', (req, res) => {
    res.json({
      name: 'Multi-User Chat Server',
      version: '1.0.0',
      activeUsers: activeUsers.size,
      message: 'API server running. Frontend is served by Vercel.',
      endpoints: {
        api: '/api',
        health: '/health',
        admin: '/admin'
      }
    });
  });
}

// API info endpoint (moved to /api/info)
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Multi-User Chat Server',
    version: '1.0.0',
    activeUsers: activeUsers.size
  });
});

// Contact form endpoint (public - no authentication required)
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'All fields are required (name, email, subject, message)'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Validate message length
    if (message.trim().length < 10) {
      return res.status(400).json({ error: 'Message must be at least 10 characters' });
    }

    // Send email via email service
    const result = await emailService.sendContactForm({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim()
    });

    console.log(`📧 Contact form submitted by ${name} <${email}>: ${subject}`);

    res.json({
      success: true,
      message: 'Your message has been sent successfully. We\'ll get back to you within 24-48 hours.'
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({
      error: 'Failed to send message. Please try emailing us directly at info@liaizen.com',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Authentication API endpoints
// Sign up (create new account)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, context } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    // Create user with email (username will be auto-generated from email)
    const user = await auth.createUserWithEmail(cleanEmail, password, context || {});

    // Generate JWT token (same as login endpoint)
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '90d' }
    );

    // Set httpOnly cookie (more secure than localStorage)
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // Allow cross-site requests from same domain
      maxAge: 90 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Also return token in response for compatibility (frontend can use this if cookies don't work)
    res.json({
      success: true,
      user,
      token // Include token in response for backward compatibility
    });
  } catch (error) {
    if (error.message === 'Email already exists') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const user = await auth.authenticateUserByEmail(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token with 30-day expiration for persistent sessions
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    // Set httpOnly cookie (more secure than localStorage) with 30-day expiration
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // Allow cross-site requests from same domain
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days for persistent sessions
    });

    // Also return token in response for compatibility (frontend can use this if cookies don't work)
    res.json({
      success: true,
      user,
      token // Include token in response for backward compatibility
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

// Verify session (for frontend to check if user is authenticated)
app.get('/api/auth/verify', verifyAuth, async (req, res) => {
  try {
    // Get user from database to ensure they still exist
    const user = await auth.getUser(req.user.username);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user,
      authenticated: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get frontend URL from env or request headers
function getFrontendUrl(req) {
  // 1. Use explicit FRONTEND_URL env var if set
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.split(',')[0];
  }

  // 2. Try to detect from request headers (Origin or Referer)
  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    try {
      const urlObj = new URL(origin);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch (e) {
      // Invalid URL, continue to fallback
      console.warn('[getFrontendUrl] Error parsing origin:', e.message);
    }
  }

  // 3. Fallback to localhost for development
  return 'http://localhost:3000';
}

// Google OAuth: Initiate login
app.get('/api/auth/google', (req, res) => {
  // Support multiple variable names (OAUTH_CLIENT_ID, 0AUTH_CLIENT_ID typo, or GOOGLE_CLIENT_ID)
  const GOOGLE_CLIENT_ID = process.env.OAUTH_CLIENT_ID ||
    process.env['0AUTH_CLIENT_ID'] || // Handle typo with zero
    process.env.GOOGLE_CLIENT_ID;
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }

  // Use frontend URL for redirect (Google redirects to frontend, frontend sends code to backend)
  const frontendUrl = getFrontendUrl(req);
  const redirectUri = `${frontendUrl}/auth/google/callback`;
  const scope = 'openid email profile';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}`;

  res.json({ authUrl });
});

// Google OAuth: Handle callback (frontend will redirect here, then send code to backend)
app.post('/api/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Support multiple variable names (OAUTH_CLIENT_ID, 0AUTH_CLIENT_ID typo, or GOOGLE_CLIENT_ID)
    const GOOGLE_CLIENT_ID = process.env.OAUTH_CLIENT_ID ||
      process.env['0AUTH_CLIENT_ID'] || // Handle typo with zero
      process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET ||
      process.env['0AUTH_CLIENT_SECRET'] || // Handle typo with zero
      process.env.GOOGLE_CLIENT_SECRET;
    // Use same redirect URI as used in the auth URL (detect from request if needed)
    const frontendUrl = getFrontendUrl(req);
    const redirectUri = `${frontendUrl}/auth/google/callback`;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return res.status(401).json({ error: 'Failed to exchange authorization code' });
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return res.status(401).json({ error: 'Failed to get user info from Google' });
    }

    const googleUser = await userInfoResponse.json();
    const { id: googleId, email, name, picture } = googleUser;

    // Get or create user
    const user = await auth.getOrCreateGoogleUser(googleId, email, name, picture);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '90d' }
    );

    // Set httpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 90 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user info (if authenticated)
app.get('/api/auth/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await auth.getUser(username);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Context API endpoints (updated to work with auth)
// Get user context
app.get('/api/user-context/:username', async (req, res) => {
  try {
    const { username } = req.params;
    // Try to get from persistent storage first
    const user = await auth.getUser(username);
    if (user && user.context) {
      return res.json(user.context);
    }
    // Fallback to in-memory storage
    const context = userContext.getUserContext(username);
    if (context) {
      res.json(context);
    } else {
      res.status(404).json({ error: 'User context not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set/update user context (syncs with persistent storage)
app.post('/api/user-context/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const contextData = req.body;

    // Update in persistent storage if user exists
    try {
      await auth.updateUserContext(username, contextData);
    } catch (err) {
      // User might not have account yet, just update in-memory
    }

    // Also update in-memory for compatibility
    const updatedContext = userContext.setUserContext(username, contextData);
    res.json(updatedContext);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update specific fields in user context
app.patch('/api/user-context/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const updates = req.body;

    // Update in persistent storage if user exists
    try {
      await auth.updateUserContext(username, updates);
    } catch (err) {
      // User might not have account yet
    }

    // Also update in-memory
    const updatedContext = userContext.updateUserContext(username, updates);
    res.json(updatedContext);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all user contexts (admin/debugging)
app.get('/api/user-contexts', (req, res) => {
  try {
    const allContexts = userContext.getAllContexts();
    res.json(allContexts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tasks API endpoints
// Get all tasks for a user
app.get('/api/tasks', async (req, res) => {
  try {
    const identifier = req.query.username || req.query.email || req.body.username || req.body.email;

    if (!identifier) {
      return res.status(400).json({ error: 'Email or username is required' });
    }

    // Get user by email OR username
    const isEmail = identifier.includes('@');
    const users = isEmail
      ? await dbSafe.safeSelect('users', { email: identifier.toLowerCase() }, { limit: 1 })
      : await dbSafe.safeSelect('users', { username: identifier.toLowerCase() }, { limit: 1 });

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Get tasks with optional filtering
    const status = req.query.status || req.query.filter;
    const search = req.query.search;
    const priority = req.query.priority;

    let tasksResult;
    // Build filter conditions
    const filterConditions = { user_id: userId };

    if (status && status !== 'all') {
      filterConditions.status = status;
    }

    if (priority && priority !== 'all') {
      filterConditions.priority = priority;
    }

    tasksResult = await dbSafe.safeSelect('tasks', filterConditions, {
      orderBy: 'created_at',
      orderDirection: 'DESC'
    });

    let tasks = tasksResult;

    // Auto-complete onboarding tasks if conditions are met (check on load)
    try {
      await autoCompleteOnboardingTasks(userId);
      // Reload tasks after auto-completion WITH THE SAME FILTERS to get updated status
      const updatedTasksResult = await dbSafe.safeSelect('tasks', filterConditions, {
        orderBy: 'created_at',
        orderDirection: 'DESC'
      });
      tasks = updatedTasksResult;
    } catch (error) {
      console.error('Error auto-completing onboarding tasks on load:', error);
      // Continue with original tasks if auto-complete fails
    }

    // Parse JSON fields for assigned_to and related_people
    tasks = tasks.map(task => {
      if (task.related_people) {
        try {
          task.related_people = JSON.parse(task.related_people);
        } catch (e) {
          task.related_people = [];
        }
      } else {
        task.related_people = [];
      }
      return task;
    });

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      tasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower))
      );
    }

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { username, title, description, status, priority, due_date, assigned_to, related_people } = req.body;

    if (!username || !title || !title.trim()) {
      return res.status(400).json({ error: 'Username and title are required' });
    }

    const db = await require('./db').getDb();

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;
    const titleTrimmed = title.trim();

    // Check for duplicate onboarding tasks (exact title match for onboarding tasks)
    const onboardingTaskTitles = [
      'Welcome to LiaiZen',
      'Complete Your Profile',
      'Add Your Co-parent',
      'Add Your Children'
    ];

    if (onboardingTaskTitles.includes(titleTrimmed)) {
      const existingResult = await dbSafe.safeSelect('tasks', {
        user_id: userId,
        title: titleTrimmed
      }, { limit: 1 });

      const existingTasks = dbSafe.parseResult(existingResult);

      if (existingTasks.length > 0) {
        // Task already exists, return existing task
        return res.json({
          success: true,
          id: existingTasks[0].id,
          message: 'Task already exists',
          existing: true
        });
      }
    }

    const now = new Date().toISOString();

    const taskId = await dbSafe.safeInsert('tasks', {
      user_id: userId,
      title: titleTrimmed,
      description: description || null,
      status: status || 'open',
      priority: priority || 'medium',
      due_date: due_date || null,
      assigned_to: assigned_to || null,
      related_people: related_people ? JSON.stringify(related_people) : null,
      created_at: now,
      updated_at: now,
      completed_at: null
    });

    require('./db').saveDatabase();

    res.json({
      success: true,
      id: taskId,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a task
app.put('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { username, title, description, status, priority, due_date, assigned_to, related_people } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = await require('./db').getDb();

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify task belongs to user
    const taskResult = await dbSafe.safeSelect('tasks', { id: parseInt(taskId), user_id: userId }, { limit: 1 });
    const tasks = dbSafe.parseResult(taskResult);

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description || null;
    if (status !== undefined) {
      updateData.status = status;
      // Set completed_at if status is 'completed'
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'open' && tasks[0].completed_at) {
        updateData.completed_at = null;
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (due_date !== undefined) updateData.due_date = due_date || null;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to || null;
    if (related_people !== undefined) updateData.related_people = related_people ? JSON.stringify(related_people) : null;

    await dbSafe.safeUpdate('tasks', updateData, { id: parseInt(taskId) });
    require('./db').saveDatabase();

    res.json({
      success: true,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a task
app.delete('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const username = req.query.username || req.body.username;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = await require('./db').getDb();

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify task belongs to user
    const taskResult = await dbSafe.safeSelect('tasks', { id: parseInt(taskId), user_id: userId }, { limit: 1 });
    const tasks = dbSafe.parseResult(taskResult);

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await dbSafe.safeDelete('tasks', { id: parseInt(taskId) });
    require('./db').saveDatabase();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Duplicate a task
app.post('/api/tasks/:taskId/duplicate', async (req, res) => {
  try {
    const { taskId } = req.params;
    const username = req.body.username || req.query.username;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = await require('./db').getDb();

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Get original task
    const taskResult = await dbSafe.safeSelect('tasks', { id: parseInt(taskId), user_id: userId }, { limit: 1 });
    const tasks = dbSafe.parseResult(taskResult);

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const originalTask = tasks[0];
    const now = new Date().toISOString();

    // Create duplicate with "Copy of" prefix
    const newTaskId = await dbSafe.safeInsert('tasks', {
      user_id: userId,
      title: `Copy of ${originalTask.title}`,
      description: originalTask.description,
      status: 'open',
      priority: originalTask.priority || 'medium',
      due_date: originalTask.due_date,
      created_at: now,
      updated_at: now,
      completed_at: null
    });

    require('./db').saveDatabase();

    res.json({
      success: true,
      id: newTaskId,
      message: 'Task duplicated successfully'
    });
  } catch (error) {
    console.error('Error duplicating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard updates (recent activity from co-parent and children)
app.get('/api/dashboard/updates', async (req, res) => {
  try {
    const username = req.query.username;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = await require('./db').getDb();

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;
    const updates = [];

    // Get user's room to find co-parent
    const userRoom = await roomManager.getUserRoom(userId);
    if (userRoom) {
      const roomMembers = await roomManager.getRoomMembers(userRoom.id);
      const coparentMember = roomMembers.find(m => m.user_id !== userId);

      if (coparentMember) {
        // Get co-parent user info
        const coparentUserResult = await dbSafe.safeSelect('users', { id: coparentMember.user_id }, { limit: 1 });
        const coparentUsers = dbSafe.parseResult(coparentUserResult);

        if (coparentUsers.length > 0) {
          const coparentUsername = coparentUsers[0].username;

          // Get recent messages from co-parent (last 48 hours)
          const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
          const messagesQuery = `
            SELECT * FROM messages
            WHERE room_id = ${dbSafe.escapeSQL(userRoom.id)}
            AND username = ${dbSafe.escapeSQL(coparentUsername)}
            AND timestamp > ${dbSafe.escapeSQL(twoDaysAgo)}
            AND private = 0
            AND flagged = 0
            ORDER BY timestamp DESC
            LIMIT 5
          `;
          const messagesResult = db.exec(messagesQuery);
          const messages = dbSafe.parseResult(messagesResult);

          messages.forEach(msg => {
            updates.push({
              personName: coparentUsername,
              type: 'message',
              description: msg.text || 'Sent a message',
              timestamp: msg.timestamp
            });
          });

          // Get recent task completions by co-parent
          const coparentTasksQuery = `
            SELECT * FROM tasks
            WHERE user_id = ${coparentMember.user_id}
            AND status = 'completed'
            AND completed_at > ${dbSafe.escapeSQL(twoDaysAgo)}
            ORDER BY completed_at DESC
            LIMIT 3
          `;
          const tasksResult = db.exec(coparentTasksQuery);
          const completedTasks = dbSafe.parseResult(tasksResult);

          completedTasks.forEach(task => {
            updates.push({
              personName: coparentUsername,
              type: 'task',
              description: `Completed: ${task.title}`,
              timestamp: task.completed_at || task.updated_at
            });
          });
        }
      }
    }

    // Get children contacts and their activity
    const childrenContactsResult = await dbSafe.safeSelect('contacts', {
      user_id: userId,
      relationship: 'My Child'
    }, {});
    const childrenContacts = dbSafe.parseResult(childrenContactsResult);

    // Also check for "My Partner's Child" relationship
    const partnerChildrenResult = await dbSafe.safeSelect('contacts', {
      user_id: userId
    }, {});
    const allChildren = dbSafe.parseResult(partnerChildrenResult).filter(
      c => c.relationship === 'My Child' || c.relationship === "My Partner's Child"
    );

    // Get recent tasks related to children (could be enhanced with child-specific task tracking)
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const recentTasksQuery = `
      SELECT * FROM tasks
      WHERE user_id = ${userId}
      AND created_at > ${dbSafe.escapeSQL(twoDaysAgo)}
      AND (title LIKE '%child%' OR title LIKE '%children%' OR description LIKE '%child%' OR description LIKE '%children%')
      ORDER BY created_at DESC
      LIMIT 3
    `;
    const childTasksResult = db.exec(recentTasksQuery);
    const childTasks = dbSafe.parseResult(childTasksResult);

    childTasks.forEach(task => {
      // Try to match to a child contact
      const relatedChild = allChildren.find(c =>
        task.title.toLowerCase().includes(c.contact_name?.toLowerCase() || '') ||
        task.description?.toLowerCase().includes(c.contact_name?.toLowerCase() || '')
      );

      updates.push({
        personName: relatedChild?.contact_name || 'Your Child',
        type: 'task',
        description: `New task: ${task.title}`,
        timestamp: task.created_at
      });
    });

    // Sort updates by timestamp (most recent first) and limit to 10
    updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedUpdates = updates.slice(0, 10);

    res.json({
      success: true,
      updates: limitedUpdates
    });
  } catch (error) {
    console.error('Error fetching dashboard updates:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get communication stats for a user
app.get('/api/dashboard/communication-stats', async (req, res) => {
  try {
    const username = req.query.username;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = await require('./db').getDb();

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Get aggregated stats across all rooms
    const stats = await communicationStats.getUserStats(userId);

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching communication stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate task using AI
app.post('/api/tasks/generate', async (req, res) => {
  try {
    const { username, taskDetails } = req.body;

    if (!username || !taskDetails || !taskDetails.trim()) {
      return res.status(400).json({ error: 'Username and task details are required' });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
      return res.status(503).json({ error: 'AI service is not configured' });
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `You are a helpful task management assistant for a co-parenting app. Based on the following task description, create a well-structured task with:
- A clear, concise title (max 60 characters)
- A detailed description that expands on the task
- An appropriate priority level (low, medium, or high)
- A suggested due date if applicable (format: YYYY-MM-DD, or null if not applicable)

Task description from user: "${taskDetails}"

Respond in JSON format only with this structure:
{
  "title": "Task title here",
  "description": "Detailed description here",
  "priority": "medium",
  "due_date": "2024-12-31" or null
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful task management assistant. Always respond with valid JSON only, no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content.trim();

    // Parse JSON response
    let taskData;
    try {
      // Remove any markdown code blocks if present
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        taskData = JSON.parse(jsonMatch[0]);
      } else {
        taskData = JSON.parse(response);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('AI response was:', response);
      return res.status(500).json({ error: 'Failed to parse AI response. Please try again.' });
    }

    // Validate and sanitize the response
    const generatedTask = {
      title: (taskData.title || taskDetails.substring(0, 60)).trim(),
      description: (taskData.description || taskDetails).trim(),
      priority: ['low', 'medium', 'high'].includes(taskData.priority?.toLowerCase())
        ? taskData.priority.toLowerCase()
        : 'medium',
      due_date: taskData.due_date || null,
      status: 'open'
    };

    res.json({
      success: true,
      task: generatedTask
    });
  } catch (error) {
    console.error('Error generating task with AI:', error);
    res.status(500).json({ error: error.message || 'Failed to generate task' });
  }
});

// Get onboarding/dashboard status
app.get('/api/user/onboarding-status', async (req, res) => {
  try {
    const username = req.query.username || req.body.username;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = await require('./db').getDb();

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Check if profile is complete (has at least first_name or last_name)
    const profileComplete = !!(user.first_name || user.last_name || user.email);

    // Check if has co-parent contact
    const coparentResult = await dbSafe.safeSelect('contacts', {
      user_id: user.id,
      relationship: 'co-parent'
    }, { limit: 1 });
    const hasCoparent = dbSafe.parseResult(coparentResult).length > 0;

    // Check if has children in contacts (relationship includes "child" or "children")
    const childrenResult = await dbSafe.safeSelect('contacts', {
      user_id: user.id
    });
    const allContacts = dbSafe.parseResult(childrenResult);
    const hasChildren = allContacts.some(c =>
      c.relationship && (
        c.relationship.toLowerCase().includes('child') ||
        c.relationship.toLowerCase().includes('son') ||
        c.relationship.toLowerCase().includes('daughter')
      )
    );

    // Check if user is in shared room (co-parent connected)
    // Use safeExec for complex query - user.id is already validated as integer
    const sharedRoomQuery = `
      SELECT COUNT(rm2.user_id) as member_count
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
      LEFT JOIN room_members rm2 ON r.id = rm2.room_id
      WHERE rm.user_id = ${parseInt(user.id)}
      GROUP BY r.id
      HAVING member_count > 1
      LIMIT 1
    `;
    const sharedRoomResult = db.exec(sharedRoomQuery);
    const isConnected = sharedRoomResult.length > 0 && sharedRoomResult[0].values.length > 0;

    res.json({
      profileComplete,
      hasCoparent,
      isConnected,
      hasChildren,
      showDashboard: !profileComplete || !hasCoparent || !hasChildren
    });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Child Activities API endpoints
// Get all activities for a child contact
app.get('/api/activities/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const username = req.query.username || req.body.username;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = await require('./db').getDb();

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify contact belongs to user and is a child
    const contactResult = await dbSafe.safeSelect('contacts', {
      id: parseInt(contactId),
      user_id: userId,
      relationship: 'my child'
    }, { limit: 1 });
    const contacts = dbSafe.parseResult(contactResult);

    if (contacts.length === 0) {
      return res.status(404).json({ error: 'Child contact not found' });
    }

    // Get all activities for this child
    const activitiesResult = await dbSafe.safeSelect('child_activities', {
      contact_id: parseInt(contactId)
    }, {
      orderBy: 'created_at',
      orderDirection: 'DESC'
    });
    let activities = dbSafe.parseResult(activitiesResult);

    // Parse JSON fields
    activities = activities.map(activity => ({
      ...activity,
      days_of_week: activity.days_of_week ? JSON.parse(activity.days_of_week) : []
    }));

    res.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new activity
app.post('/api/activities', async (req, res) => {
  try {
    const {
      contactId,
      username,
      activityName,
      description,
      location,
      instructorContact,
      daysOfWeek,
      startTime,
      endTime,
      recurrence,
      startDate,
      endDate,
      cost,
      costFrequency,
      splitType,
      splitPercentage,
      paidBy,
      notes
    } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (!contactId || !activityName || !recurrence || !startDate) {
      return res.status(400).json({ error: 'Contact ID, activity name, recurrence, and start date are required' });
    }

    const db = await require('./db').getDb();

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify contact belongs to user and is a child
    const contactResult = await dbSafe.safeSelect('contacts', {
      id: parseInt(contactId),
      user_id: userId,
      relationship: 'my child'
    }, { limit: 1 });
    const contacts = dbSafe.parseResult(contactResult);

    if (contacts.length === 0) {
      return res.status(404).json({ error: 'Child contact not found' });
    }

    // Insert activity
    const insertData = {
      contact_id: parseInt(contactId),
      user_id: userId,
      activity_name: activityName.trim(),
      description: description || null,
      location: location || null,
      instructor_contact: instructorContact || null,
      days_of_week: daysOfWeek ? JSON.stringify(daysOfWeek) : null,
      start_time: startTime || null,
      end_time: endTime || null,
      recurrence: recurrence,
      start_date: startDate,
      end_date: endDate || null,
      cost: cost || 0,
      cost_frequency: costFrequency || null,
      split_type: splitType || 'equal',
      split_percentage: splitPercentage || null,
      paid_by: paidBy || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await dbSafe.safeInsert('child_activities', insertData);
    require('./db').saveDatabase();

    res.json({
      success: true,
      message: 'Activity created successfully'
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update activity
app.put('/api/activities/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    const {
      username,
      activityName,
      description,
      location,
      instructorContact,
      daysOfWeek,
      startTime,
      endTime,
      recurrence,
      startDate,
      endDate,
      cost,
      costFrequency,
      splitType,
      splitPercentage,
      paidBy,
      notes
    } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = await require('./db').getDb();

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify activity belongs to user
    const activityResult = await dbSafe.safeSelect('child_activities', {
      id: parseInt(activityId),
      user_id: userId
    }, { limit: 1 });
    const activities = dbSafe.parseResult(activityResult);

    if (activities.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Build update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (activityName !== undefined) updateData.activity_name = activityName.trim();
    if (description !== undefined) updateData.description = description || null;
    if (location !== undefined) updateData.location = location || null;
    if (instructorContact !== undefined) updateData.instructor_contact = instructorContact || null;
    if (daysOfWeek !== undefined) updateData.days_of_week = daysOfWeek ? JSON.stringify(daysOfWeek) : null;
    if (startTime !== undefined) updateData.start_time = startTime || null;
    if (endTime !== undefined) updateData.end_time = endTime || null;
    if (recurrence !== undefined) updateData.recurrence = recurrence;
    if (startDate !== undefined) updateData.start_date = startDate;
    if (endDate !== undefined) updateData.end_date = endDate || null;
    if (cost !== undefined) updateData.cost = cost || 0;
    if (costFrequency !== undefined) updateData.cost_frequency = costFrequency || null;
    if (splitType !== undefined) updateData.split_type = splitType || 'equal';
    if (splitPercentage !== undefined) updateData.split_percentage = splitPercentage || null;
    if (paidBy !== undefined) updateData.paid_by = paidBy || null;
    if (notes !== undefined) updateData.notes = notes || null;

    await dbSafe.safeUpdate('child_activities', updateData, { id: parseInt(activityId) });
    require('./db').saveDatabase();

    res.json({
      success: true,
      message: 'Activity updated successfully'
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete activity
app.delete('/api/activities/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    const username = req.query.username || req.body.username;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = await require('./db').getDb();

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify activity belongs to user
    const activityResult = await dbSafe.safeSelect('child_activities', {
      id: parseInt(activityId),
      user_id: userId
    }, { limit: 1 });
    const activities = dbSafe.parseResult(activityResult);

    if (activities.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    await dbSafe.safeDelete('child_activities', { id: parseInt(activityId) });
    require('./db').saveDatabase();

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Profile API endpoints
// Get current user's profile
app.get('/api/user/profile', async (req, res) => {
  try {
    const username = req.query.username || req.body.username;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = await require('./db').getDb();
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    res.json({
      username: user.username,
      email: user.email || null,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      address: user.address || null,
      household_members: user.household_members || null,
      occupation: user.occupation || null,
      parenting_philosophy: user.parenting_philosophy || null,
      personal_growth: user.personal_growth || null
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update current user's profile
app.put('/api/user/profile', async (req, res) => {
  try {
    // Check if request body was parsed correctly
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body. Request may be too large.' });
    }

    const { currentUsername, username, email, first_name, last_name, address, household_members, occupation, parenting_philosophy, personal_growth } = req.body;

    // Debug logging
    console.log('Profile update request:', {
      currentUsername,
      hasPersonalGrowth: personal_growth !== undefined,
      personalGrowthLength: personal_growth ? personal_growth.length : 0,
      requestBodySize: JSON.stringify(req.body).length
    });

    // Use currentUsername to find the user, fallback to username for backward compatibility
    const lookupUsername = currentUsername || username;

    if (!lookupUsername) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = await require('./db').getDb();

    // Get user ID using current username (to find the user)
    const userResult = await dbSafe.safeSelect('users', { username: lookupUsername.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;
    const dbUsername = users[0].username;

    // Build update object with only provided fields
    const updateData = {};

    // Handle username update if provided and different
    const newUsername = username ? username.trim() : null;
    if (newUsername && newUsername.toLowerCase() !== dbUsername.toLowerCase()) {
      // Validate username length
      if (newUsername.length < 2 || newUsername.length > 20) {
        return res.status(400).json({ error: 'Username must be between 2 and 20 characters' });
      }

      // Check username uniqueness (case-insensitive)
      const usernameCheck = await dbSafe.safeSelect('users', { username: newUsername.toLowerCase() }, { limit: 1 });
      const existingUsers = dbSafe.parseResult(usernameCheck);
      if (existingUsers.length > 0 && existingUsers[0].id !== userId) {
        return res.status(400).json({ error: 'Username already in use' });
      }

      updateData.username = newUsername.toLowerCase();
    }

    if (email !== undefined) {
      const trimmedEmail = email ? email.trim().toLowerCase() : null;
      if (trimmedEmail) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }
      }
      updateData.email = trimmedEmail;
    }
    // Field length limits to prevent database issues (SQLite TEXT can be very large, but we'll set reasonable limits)
    const MAX_FIELD_LENGTHS = {
      first_name: 100,
      last_name: 100,
      address: 500,
      household_members: 1000,
      occupation: 200,
      parenting_philosophy: 5000,
      personal_growth: 10000
    };

    if (first_name !== undefined) {
      const trimmed = first_name != null ? String(first_name).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.first_name) {
        return res.status(400).json({ error: `First name must be ${MAX_FIELD_LENGTHS.first_name} characters or less` });
      }
      updateData.first_name = trimmed;
    }
    if (last_name !== undefined) {
      const trimmed = last_name != null ? String(last_name).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.last_name) {
        return res.status(400).json({ error: `Last name must be ${MAX_FIELD_LENGTHS.last_name} characters or less` });
      }
      updateData.last_name = trimmed;
    }
    if (address !== undefined) {
      const trimmed = address != null ? String(address).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.address) {
        return res.status(400).json({ error: `Address must be ${MAX_FIELD_LENGTHS.address} characters or less` });
      }
      updateData.address = trimmed;
    }
    if (household_members !== undefined) {
      const trimmed = household_members != null ? String(household_members).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.household_members) {
        return res.status(400).json({ error: `Household members must be ${MAX_FIELD_LENGTHS.household_members} characters or less` });
      }
      updateData.household_members = trimmed;
    }
    if (occupation !== undefined) {
      const trimmed = occupation != null ? String(occupation).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.occupation) {
        return res.status(400).json({ error: `Occupation must be ${MAX_FIELD_LENGTHS.occupation} characters or less` });
      }
      updateData.occupation = trimmed;
    }
    if (parenting_philosophy !== undefined) {
      const trimmed = parenting_philosophy != null ? String(parenting_philosophy).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.parenting_philosophy) {
        return res.status(400).json({ error: `Parenting philosophy must be ${MAX_FIELD_LENGTHS.parenting_philosophy} characters or less` });
      }
      updateData.parenting_philosophy = trimmed;
    }
    if (personal_growth !== undefined) {
      // Handle personal_growth - preserve empty strings
      const trimmed = personal_growth != null ? String(personal_growth).trim() : null;
      if (trimmed && trimmed.length > MAX_FIELD_LENGTHS.personal_growth) {
        return res.status(400).json({ error: `Personal growth must be ${MAX_FIELD_LENGTHS.personal_growth} characters or less` });
      }
      updateData.personal_growth = trimmed;
      console.log('Updating personal_growth:', {
        original: personal_growth,
        processed: updateData.personal_growth,
        length: updateData.personal_growth ? updateData.personal_growth.length : 0
      });
    }

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== users[0].email) {
      const emailCheck = await dbSafe.safeSelect('users', { email: updateData.email }, { limit: 1 });
      const existingUsers = dbSafe.parseResult(emailCheck);
      if (existingUsers.length > 0 && existingUsers[0].id !== userId) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Log what we're about to update
    console.log('Updating user profile:', {
      userId,
      updateDataKeys: Object.keys(updateData),
      updateData: updateData
    });

    await dbSafe.safeUpdate('users', updateData, { id: userId });
    require('./db').saveDatabase();

    console.log('Profile updated successfully for user:', userId);

    // Auto-complete onboarding tasks if conditions are met
    try {
      await autoCompleteOnboardingTasks(userId);
    } catch (error) {
      console.error('Error auto-completing onboarding tasks:', error);
      // Don't fail profile update if this fails
    }

    // Return updated username if it was changed
    const updatedUsername = updateData.username || dbUsername;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      username: updatedUsername
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    console.error('Error stack:', error.stack);
    // Return more detailed error for Safari
    res.status(500).json({
      error: error.message || 'Failed to update profile',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update password
app.put('/api/user/password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Username, current password, and new password are required' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters' });
    }

    // Authenticate with current password
    const user = await auth.authenticateUser(username, currentPassword);
    if (!user) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    const newPasswordHash = await auth.hashPassword(newPassword);
    await dbSafe.safeUpdate('users', { password_hash: newPasswordHash }, { id: user.id });
    require('./db').saveDatabase();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: error.message });
  }
});

// Contacts API endpoints
// Get all contacts for current user
app.get('/api/contacts', async (req, res) => {
  try {
    const username = req.query.username || req.body.username;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Get contacts
    let contacts = await dbSafe.safeSelect('contacts', { user_id: userId }, { orderBy: 'created_at', orderDirection: 'DESC' });

    // Enrich contacts with linked contact information
    for (let contact of contacts) {
      if (contact.linked_contact_id) {
        const linkedContacts = await dbSafe.safeSelect('contacts', { id: contact.linked_contact_id }, { limit: 1 });
        if (linkedContacts.length > 0) {
          contact.linked_contact_name = linkedContacts[0].contact_name;
          contact.linked_contact_relationship = linkedContacts[0].relationship;
        }
      }
    }

    res.json({
      contacts,
      count: contacts.length
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new contact
app.post('/api/contacts', async (req, res) => {
  try {
    // Check if request body was parsed correctly
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body. Request may be too large.' });
    }

    const { username, contact_name, contact_email, relationship, notes, separation_date, address,
      difficult_aspects, friction_situations, legal_matters, safety_concerns,
      substance_mental_health, neglect_abuse_concerns, additional_thoughts, other_parent,
      child_age, child_birthdate, school, phone, partner_duration, has_children,
      custody_arrangement, linked_contact_id } = req.body;

    console.log('Creating contact:', {
      username,
      contact_name,
      relationship,
      hasNotes: !!notes
    });

    if (!username || !contact_name) {
      return res.status(400).json({ error: 'Username and contact name are required' });
    }

    const db = await require('./db').getDb();

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;
    const now = new Date().toISOString();

    // Insert contact
    const contactId = await dbSafe.safeInsert('contacts', {
      user_id: userId,
      contact_name: contact_name.trim(),
      contact_email: contact_email ? contact_email.trim().toLowerCase() : null,
      relationship: relationship || null,
      notes: notes || null,
      separation_date: separation_date || null,
      address: address || null,
      difficult_aspects: difficult_aspects || null,
      friction_situations: friction_situations || null,
      legal_matters: legal_matters || null,
      safety_concerns: safety_concerns || null,
      substance_mental_health: substance_mental_health || null,
      neglect_abuse_concerns: neglect_abuse_concerns || null,
      additional_thoughts: additional_thoughts || null,
      other_parent: other_parent || null,
      child_age: child_age || null,
      child_birthdate: child_birthdate || null,
      school: school || null,
      phone: phone || null,
      partner_duration: partner_duration || null,
      has_children: has_children || null,
      custody_arrangement: custody_arrangement || null,
      linked_contact_id: linked_contact_id || null,
      created_at: now,
      updated_at: now
    });

    require('./db').saveDatabase();

    console.log('Contact created successfully:', {
      contactId,
      userId,
      contact_name: contact_name.trim()
    });

    // Auto-complete onboarding tasks if conditions are met
    try {
      await autoCompleteOnboardingTasks(userId);
    } catch (error) {
      console.error('Error auto-completing onboarding tasks:', error);
      // Don't fail contact creation if this fails
    }

    res.json({
      success: true,
      message: 'Contact created successfully',
      contactId: contactId
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: error.message || 'Failed to create contact',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update contact
app.put('/api/contacts/:contactId', async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId);
    const { username, contact_name, contact_email, relationship, notes, separation_date, address,
      difficult_aspects, friction_situations, legal_matters, safety_concerns,
      substance_mental_health, neglect_abuse_concerns, additional_thoughts, other_parent,
      child_age, child_birthdate, school, phone, partner_duration, has_children,
      custody_arrangement, linked_contact_id } = req.body;

    if (!contactId || isNaN(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = await require('./db').getDb();

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify contact belongs to user
    const contactResult = await dbSafe.safeSelect('contacts', { id: contactId }, { limit: 1 });
    const contacts = dbSafe.parseResult(contactResult);

    if (contacts.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (contacts[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update contact
    const updateData = {
      updated_at: new Date().toISOString()
    };
    if (contact_name !== undefined) updateData.contact_name = contact_name.trim();
    if (contact_email !== undefined) updateData.contact_email = contact_email ? contact_email.trim().toLowerCase() : null;
    if (relationship !== undefined) updateData.relationship = relationship || null;
    if (notes !== undefined) updateData.notes = notes || null;
    // Co-parent specific fields
    if (separation_date !== undefined) updateData.separation_date = separation_date || null;
    if (address !== undefined) updateData.address = address || null;
    if (difficult_aspects !== undefined) updateData.difficult_aspects = difficult_aspects || null;
    if (friction_situations !== undefined) updateData.friction_situations = friction_situations || null;
    if (legal_matters !== undefined) updateData.legal_matters = legal_matters || null;
    if (safety_concerns !== undefined) updateData.safety_concerns = safety_concerns || null;
    if (substance_mental_health !== undefined) updateData.substance_mental_health = substance_mental_health || null;
    if (neglect_abuse_concerns !== undefined) updateData.neglect_abuse_concerns = neglect_abuse_concerns || null;
    if (additional_thoughts !== undefined) updateData.additional_thoughts = additional_thoughts || null;
    if (other_parent !== undefined) updateData.other_parent = other_parent || null;
    // New relationship-specific fields
    if (child_age !== undefined) updateData.child_age = child_age || null;
    if (child_birthdate !== undefined) updateData.child_birthdate = child_birthdate || null;
    if (school !== undefined) updateData.school = school || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (partner_duration !== undefined) updateData.partner_duration = partner_duration || null;
    if (has_children !== undefined) updateData.has_children = has_children || null;
    if (custody_arrangement !== undefined) updateData.custody_arrangement = custody_arrangement || null;
    if (linked_contact_id !== undefined) updateData.linked_contact_id = linked_contact_id || null;

    await dbSafe.safeUpdate('contacts', updateData, { id: contactId });
    require('./db').saveDatabase();

    // Auto-complete onboarding tasks if conditions are met
    try {
      await autoCompleteOnboardingTasks(userId);
    } catch (error) {
      console.error('Error auto-completing onboarding tasks:', error);
      // Don't fail contact update if this fails
    }

    res.json({
      success: true,
      message: 'Contact updated successfully'
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete contact
app.delete('/api/contacts/:contactId', async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId);
    const username = req.query.username || req.body.username;

    if (!contactId || isNaN(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = await require('./db').getDb();

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify contact belongs to user
    const contactResult = await dbSafe.safeSelect('contacts', { id: contactId }, { limit: 1 });
    const contacts = dbSafe.parseResult(contactResult);

    if (contacts.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (contacts[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete contact
    await dbSafe.safeDelete('contacts', { id: contactId });
    require('./db').saveDatabase();

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: error.message });
  }
});

// ======================================
// AI Contact Intelligence Endpoints
// ======================================
const contactIntelligence = require('./contactIntelligence');

// Detect contact mentions in a message
app.post('/api/contacts/detect-mentions', async (req, res) => {
  try {
    const { messageText, username, roomId } = req.body;

    if (!messageText || !username) {
      return res.status(400).json({ error: 'Message text and username are required' });
    }

    const db = await require('./db').getDb();

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Get user's existing contacts
    const contactsResult = await dbSafe.safeSelect('contacts', { user_id: userId });
    const existingContacts = dbSafe.parseResult(contactsResult);

    // Get recent messages for context
    let recentMessages = [];
    if (roomId) {
      const messagesResult = await dbSafe.safeSelect('messages', { room_id: roomId }, {
        orderBy: 'timestamp',
        orderDirection: 'DESC',
        limit: 10
      });
      recentMessages = dbSafe.parseResult(messagesResult);
    }

    // Detect mentions
    const result = await contactIntelligence.detectContactMentions(
      messageText,
      existingContacts,
      recentMessages
    );

    if (!result) {
      return res.json({ detectedPeople: [], shouldPrompt: false });
    }

    res.json(result);
  } catch (error) {
    console.error('Error detecting contact mentions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate AI-assisted contact profile suggestions
app.post('/api/contacts/generate-profile', async (req, res) => {
  try {
    const { contactData, username, roomId } = req.body;

    if (!contactData || !contactData.contact_name || !contactData.relationship || !username) {
      return res.status(400).json({ error: 'Contact data (name, relationship) and username are required' });
    }

    const db = await require('./db').getDb();

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Get user's existing contacts for relationship context
    const contactsResult = await dbSafe.safeSelect('contacts', { user_id: userId });
    const userContacts = dbSafe.parseResult(contactsResult);

    // Get recent messages for context
    let recentMessages = [];
    if (roomId) {
      const messagesResult = await dbSafe.safeSelect('messages', { room_id: roomId }, {
        orderBy: 'timestamp',
        orderDirection: 'DESC',
        limit: 15
      });
      recentMessages = dbSafe.parseResult(messagesResult);
    }

    // Generate profile suggestions
    const suggestions = await contactIntelligence.generateContactProfile(
      contactData,
      userContacts,
      recentMessages
    );

    if (!suggestions) {
      return res.json({
        suggestedFields: [],
        helpfulQuestions: [],
        linkedContactSuggestion: { shouldLink: false },
        profileCompletionTips: 'Fill out the profile with as much detail as you feel comfortable sharing.'
      });
    }

    res.json(suggestions);
  } catch (error) {
    console.error('Error generating contact profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Map contact relationships and provide suggestions
app.get('/api/contacts/relationship-map', async (req, res) => {
  try {
    const username = req.query.username;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const db = await require('./db').getDb();

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Get relationship map
    const relationshipMap = await contactIntelligence.mapContactRelationships(userId);

    res.json(relationshipMap);
  } catch (error) {
    console.error('Error mapping contact relationships:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enrich contact from conversation history
app.post('/api/contacts/:contactId/enrich', async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId);
    const { username, roomId } = req.body;

    if (!contactId || isNaN(contactId) || !username) {
      return res.status(400).json({ error: 'Contact ID and username are required' });
    }

    const db = await require('./db').getDb();

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Get messages from room
    let messages = [];
    if (roomId) {
      const messagesResult = await dbSafe.safeSelect('messages', { room_id: roomId }, {
        orderBy: 'timestamp',
        orderDirection: 'DESC',
        limit: 100
      });
      messages = dbSafe.parseResult(messagesResult);
    }

    // Enrich contact
    const enrichment = await contactIntelligence.enrichContactFromMessages(
      contactId,
      userId,
      messages
    );

    if (!enrichment) {
      return res.json({ enrichments: [], newInsights: [], shouldUpdate: false });
    }

    res.json(enrichment);
  } catch (error) {
    console.error('Error enriching contact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Backfill co-parent contacts for existing shared rooms
app.post('/api/admin/backfill-contacts', async (req, res) => {
  try {
    const db = await require('./db').getDb();

    // Find all shared rooms (rooms with more than one member)
    const sharedRoomsQuery = `
      SELECT rm.room_id, GROUP_CONCAT(rm.user_id) as user_ids, COUNT(rm.user_id) as member_count
      FROM room_members rm
      GROUP BY rm.room_id
      HAVING member_count > 1
    `;

    const roomsResult = db.exec(sharedRoomsQuery);
    const rooms = dbSafe.parseResult(roomsResult);

    let createdCount = 0;
    const now = new Date().toISOString();

    for (const room of rooms) {
      const userIds = room.user_ids.split(',').map(id => parseInt(id));

      // Get user info for all members
      const users = [];
      for (const userId of userIds) {
        const userResult = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
        const userList = dbSafe.parseResult(userResult);
        if (userList.length > 0) {
          users.push(userList[0]);
        }
      }

      // Create contacts for each pair
      for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
          const user1 = users[i];
          const user2 = users[j];

          // Check if contact already exists (user1 -> user2)
          const check1 = await dbSafe.safeSelect('contacts', {
            user_id: user1.id,
            contact_name: user2.username,
            relationship: 'co-parent'
          }, { limit: 1 });

          if (dbSafe.parseResult(check1).length === 0) {
            await dbSafe.safeInsert('contacts', {
              user_id: user1.id,
              contact_name: user2.username,
              contact_email: user2.email || null,
              relationship: 'co-parent',
              notes: `Connected via shared room`,
              separation_date: null,
              address: null,
              difficult_aspects: null,
              friction_situations: null,
              legal_matters: null,
              safety_concerns: null,
              substance_mental_health: null,
              neglect_abuse_concerns: null,
              additional_thoughts: null,
              created_at: now,
              updated_at: now
            });
            createdCount++;
          }

          // Check if contact already exists (user2 -> user1)
          const check2 = await dbSafe.safeSelect('contacts', {
            user_id: user2.id,
            contact_name: user1.username,
            relationship: 'co-parent'
          }, { limit: 1 });

          if (dbSafe.parseResult(check2).length === 0) {
            await dbSafe.safeInsert('contacts', {
              user_id: user2.id,
              contact_name: user1.username,
              contact_email: user1.email || null,
              relationship: 'co-parent',
              notes: `Connected via shared room`,
              separation_date: null,
              address: null,
              difficult_aspects: null,
              friction_situations: null,
              legal_matters: null,
              safety_concerns: null,
              substance_mental_health: null,
              neglect_abuse_concerns: null,
              additional_thoughts: null,
              created_at: now,
              updated_at: now
            });
            createdCount++;
          }
        }
      }
    }

    require('./db').saveDatabase();

    res.json({
      success: true,
      message: `Backfilled ${createdCount} co-parent contacts`,
      created: createdCount
    });
  } catch (error) {
    console.error('Error backfilling contacts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Backfill contacts for current user's shared room (helper endpoint)
app.post('/api/room/backfill-contacts', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = await auth.getUser(username);
    if (!user || !user.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    const room = await roomManager.getUserRoom(user.id);
    if (!room) {
      return res.status(404).json({ error: 'User has no room' });
    }

    console.log(`🔄 Backfilling contacts for room ${room.roomId}`);
    await roomManager.ensureContactsForRoomMembers(room.roomId);

    res.json({ success: true, message: 'Contacts backfilled for shared room' });
  } catch (error) {
    console.error('Error backfilling contacts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if user is in a shared room (has more than one member)
app.get('/api/room/shared-check/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await auth.getUser(username);
    if (!user || !user.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    const db = await require('./db').getDb();
    // Check if user is in a room with more than one member
    const query = `
      SELECT COUNT(rm2.user_id) as member_count
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
      LEFT JOIN room_members rm2 ON r.id = rm2.room_id
      WHERE rm.user_id = ${parseInt(user.id)}
      GROUP BY r.id
      HAVING member_count > 1
      LIMIT 1
    `;

    const result = db.exec(query);
    const isShared = result.length > 0 && result[0].values.length > 0;

    res.json({ isShared });
  } catch (error) {
    console.error('Error checking shared room:', error);
    res.status(500).json({ error: error.message });
  }
});

// Room API endpoints
// Get user's room
app.get('/api/room/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await auth.getUser(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let room = user.room;
    if (!room && user.id) {
      room = await roomManager.getUserRoom(user.id);
    }
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get or create invite for room (optimized - returns existing active invite if available)
app.get('/api/room/invite', verifyAuth, async (req, res) => {
  try {
    // Get username from authenticated session
    const username = req.user?.username;
    if (!username) {
      console.error('Invite API: No username in JWT token', req.user);
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log('Invite API: Looking up user:', username);
    const user = await auth.getUser(username);
    if (!user) {
      console.error('Invite API: User not found in database:', username);
      return res.status(404).json({ error: 'User not found. Please try logging out and back in.' });
    }

    if (!user.id) {
      console.error('Invite API: User found but missing ID:', user);
      return res.status(404).json({ error: 'User not found. Please try logging out and back in.' });
    }

    console.log('Invite API: User found, ID:', user.id);
    let room = user.room;
    if (!room) {
      console.log('Invite API: No room in user object, checking getUserRoom...');
      room = await roomManager.getUserRoom(user.id);
    }
    if (!room) {
      console.log('Invite API: No room found, creating one for user:', user.id);
      // Auto-create a room if one doesn't exist
      try {
        room = await roomManager.createPrivateRoom(user.id, user.username);
        console.log('Invite API: Created new room:', room.roomId);
      } catch (roomError) {
        console.error('Invite API: Failed to create room:', roomError);
        return res.status(500).json({ error: 'Failed to create room. Please try again.' });
      }
    }
    console.log('Invite API: Room found:', room.roomId);

    // Check for existing active invite first
    const existingInvites = await roomManager.getRoomInvites(room.roomId);
    const activeInvite = existingInvites.find(
      (inv) => !inv.used_by && (!inv.expires_at || new Date(inv.expires_at) > new Date())
    );

    let invite;
    if (activeInvite) {
      // Reuse existing invite
      invite = {
        inviteCode: activeInvite.invite_code,
        inviteId: activeInvite.id,
        roomId: room.roomId,
        expiresAt: activeInvite.expires_at,
      };
      console.log(`API: Returning existing invite code: ${invite.inviteCode}`);
    } else {
      // Create new invite
      invite = await roomManager.createInvite(room.roomId, user.id);
      console.log(`API: Created new invite code: ${invite.inviteCode} (length: ${invite.inviteCode.length})`);
    }

    res.json({
      success: true,
      inviteCode: invite.inviteCode,
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?invite=${invite.inviteCode}`,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error('Error getting/creating invite:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create invite for room (POST - kept for backward compatibility)
app.post('/api/room/invite', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = await auth.getUser(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    let room = user.room;
    if (!room) {
      room = await roomManager.getUserRoom(user.id);
    }
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Create invite
    const invite = await roomManager.createInvite(room.roomId, user.id);

    console.log(`API: Returning invite code: ${invite.inviteCode} (length: ${invite.inviteCode.length})`);

    res.json({
      success: true,
      inviteCode: invite.inviteCode,
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?invite=${invite.inviteCode}`,
      expiresAt: invite.expiresAt
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ error: error.message });
  }
});

// Validate invite code
app.get('/api/room/invite/:inviteCode', async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const invite = await roomManager.validateInvite(inviteCode);

    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invite code' });
    }

    res.json({
      valid: true,
      roomId: invite.roomId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept invite (join room)
app.post('/api/room/join', async (req, res) => {
  try {
    const { inviteCode, username } = req.body;

    if (!inviteCode || !username) {
      return res.status(400).json({ error: 'Invite code and username are required' });
    }

    const user = await auth.getUser(username);
    if (!user || !user.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Use invite
    const result = await roomManager.useInvite(inviteCode, user.id);

    // Auto-complete onboarding tasks after using invite (contacts may have been created)
    try {
      await autoCompleteOnboardingTasks(user.id);
      // Also complete tasks for other room members if contacts were created
      if (result.roomId) {
        const roomMembers = await roomManager.getRoomMembers(result.roomId);
        for (const member of roomMembers) {
          if (member.user_id !== user.id) {
            await autoCompleteOnboardingTasks(member.user_id);
          }
        }
      }
    } catch (error) {
      console.error('Error auto-completing onboarding tasks after using invite:', error);
      // Don't fail the request if this fails
    }

    res.json({
      success: true,
      roomId: result.roomId
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get room members
app.get('/api/room/:roomId/members', async (req, res) => {
  try {
    const { roomId } = req.params;
    const members = await roomManager.getRoomMembers(roomId);
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if current user's room has multiple members (for hiding invite button)
app.get('/api/room/members/check', verifyAuth, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await auth.getUser(username);
    if (!user || !user.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    let room = user.room;
    if (!room) {
      room = await roomManager.getUserRoom(user.id);
    }
    if (!room) {
      return res.json({ hasMultipleMembers: false, memberCount: 0 });
    }

    const members = await roomManager.getRoomMembers(room.roomId);
    const hasMultipleMembers = members.length >= 2;

    res.json({
      hasMultipleMembers,
      memberCount: members.length,
    });
  } catch (error) {
    console.error('Error checking room members:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active invites for room
app.get('/api/room/:roomId/invites', async (req, res) => {
  try {
    const { roomId } = req.params;
    const invites = await roomManager.getRoomInvites(roomId);
    res.json(invites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Email-based Invitation & Connection APIs
// ============================================

// Send invitation by email
app.post('/api/invite', async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    if (!connectionManager.validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get inviter user
    const inviter = await auth.getUser(username);
    if (!inviter || !inviter.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email already exists in database
    const emailExists = await connectionManager.emailExists(email);
    const inviteeUser = emailExists ? await connectionManager.getUserByEmail(email) : null;

    // Create pending connection
    const connection = await connectionManager.createPendingConnection(inviter.id, email);

    // Send appropriate email based on whether user exists
    if (emailExists && inviteeUser) {
      // Existing user - send connection request notification
      await emailService.sendExistingUserInvite(
        email,
        inviter.username,
        process.env.APP_NAME || 'Co-Parent Chat'
      );
    } else {
      // New user - send invitation with token link
      await emailService.sendNewUserInvite(
        email,
        inviter.username,
        connection.token,
        process.env.APP_NAME || 'Co-Parent Chat'
      );
    }

    res.json({
      success: true,
      message: emailExists
        ? 'Connection request sent to existing user'
        : 'Invitation email sent to new user',
      isExistingUser: emailExists
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Validate connection token (for join page)
app.get('/api/join', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const connection = await connectionManager.validateConnectionToken(token);

    if (!connection) {
      return res.status(404).json({
        error: 'Invalid or expired invitation token',
        valid: false
      });
    }

    // Check if invitee email has an account
    const inviteeUser = await connectionManager.getUserByEmail(connection.inviteeEmail);

    res.json({
      valid: true,
      inviteeEmail: connection.inviteeEmail,
      inviteeHasAccount: !!inviteeUser,
      expiresAt: connection.expiresAt
    });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept invitation and create connection (used after signup/login)
app.post('/api/join/accept', async (req, res) => {
  try {
    const { token, username } = req.body;

    if (!token || !username) {
      return res.status(400).json({ error: 'Token and username are required' });
    }

    // Validate token
    const connection = await connectionManager.validateConnectionToken(token);
    if (!connection) {
      return res.status(404).json({ error: 'Invalid or expired invitation token' });
    }

    // Get user
    const user = await auth.getUser(username);
    if (!user || !user.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify email matches (if user has email set)
    if (user.email && user.email.toLowerCase() !== connection.inviteeEmail.toLowerCase()) {
      return res.status(403).json({
        error: 'This invitation was sent to another email address. Please log out and try again.'
      });
    }

    // If user doesn't have email set, set it now (from invitation)
    if (!user.email) {
      const db = await require('./db').getDb();
      // Update user email using safe update
      await dbSafe.safeUpdate('users', { email: connection.inviteeEmail }, { id: user.id });
    }

    // Accept connection
    const result = await connectionManager.acceptPendingConnection(token, user.id);

    // Auto-complete onboarding tasks for both users after accepting invite
    try {
      await autoCompleteOnboardingTasks(user.id);
      // Also complete tasks for the inviter
      const connection = await connectionManager.validateConnectionToken(token);
      if (connection && connection.inviterId) {
        await autoCompleteOnboardingTasks(connection.inviterId);
      }
    } catch (error) {
      console.error('Error auto-completing onboarding tasks after invite acceptance:', error);
      // Don't fail the request if this fails
    }

    res.json({
      success: true,
      message: 'Connection created successfully',
      roomId: result.inviterRoom
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Signup with email from invitation token
app.post('/api/auth/signup-with-token', async (req, res) => {
  try {
    const { username, password, token, context } = req.body;

    if (!username || !password || !token) {
      return res.status(400).json({ error: 'Username, password, and token are required' });
    }

    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 2-20 characters' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    // Validate token
    const connection = await connectionManager.validateConnectionToken(token);
    if (!connection) {
      return res.status(404).json({ error: 'Invalid or expired invitation token' });
    }

    // Create user with email from invitation
    const user = await auth.createUser(username, password, context || {}, connection.inviteeEmail);

    // Immediately accept the connection
    await connectionManager.acceptPendingConnection(token, user.id);

    res.json({
      success: true,
      user,
      message: 'Account created and connection established'
    });
  } catch (error) {
    if (error.message === 'Username already exists' || error.message === 'Email already exists') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// Figma API Endpoints
// ========================================

// Check Figma service availability
app.get('/api/figma/status', (req, res) => {
  res.json({
    available: !!figmaService,
    message: figmaService
      ? 'Figma API service is available'
      : 'Figma API service not configured. Set FIGMA_ACCESS_TOKEN environment variable.'
  });
});

// Get file data from Figma
app.get('/api/figma/file/:fileKey', async (req, res) => {
  if (!figmaService) {
    return res.status(503).json({ error: 'Figma API service not configured' });
  }

  try {
    const { fileKey } = req.params;
    const { version, ids, depth, geometry, plugin_data, styles } = req.query;

    const options = {};
    if (version) options.version = version;
    if (ids) options.ids = ids.split(',');
    if (depth) options.depth = parseInt(depth);
    if (geometry === 'true') options.geometry = 'paths';
    if (plugin_data === 'true') options.plugin_data = true;
    if (styles === 'true') options.styles = true;

    const fileData = await figmaService.getFile(fileKey, options);
    res.json(fileData);
  } catch (error) {
    console.error('Error fetching Figma file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific nodes from a Figma file
app.get('/api/figma/file/:fileKey/nodes', async (req, res) => {
  if (!figmaService) {
    return res.status(503).json({ error: 'Figma API service not configured' });
  }

  try {
    const { fileKey } = req.params;
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ error: 'ids parameter is required' });
    }

    const nodeIds = ids.split(',');
    const nodeData = await figmaService.getFileNodes(fileKey, nodeIds);
    res.json(nodeData);
  } catch (error) {
    console.error('Error fetching Figma nodes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export images from Figma
app.get('/api/figma/images/:fileKey', async (req, res) => {
  if (!figmaService) {
    return res.status(503).json({ error: 'Figma API service not configured' });
  }

  try {
    const { fileKey } = req.params;
    const { ids, format = 'png', scale = 1, use_absolute_bounds } = req.query;

    if (!ids) {
      return res.status(400).json({ error: 'ids parameter is required' });
    }

    const nodeIds = ids.split(',');
    const imageData = await figmaService.getImages(fileKey, nodeIds, {
      format,
      scale: parseFloat(scale),
      use_absolute_bounds: use_absolute_bounds === 'true'
    });
    res.json(imageData);
  } catch (error) {
    console.error('Error exporting Figma images:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get comments from a Figma file
app.get('/api/figma/file/:fileKey/comments', async (req, res) => {
  if (!figmaService) {
    return res.status(503).json({ error: 'Figma API service not configured' });
  }

  try {
    const { fileKey } = req.params;
    const comments = await figmaService.getComments(fileKey);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching Figma comments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Post a comment to a Figma file
app.post('/api/figma/file/:fileKey/comments', verifyAuth, async (req, res) => {
  if (!figmaService) {
    return res.status(503).json({ error: 'Figma API service not configured' });
  }

  try {
    const { fileKey } = req.params;
    const { message, comment_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const comment = await figmaService.postComment(fileKey, message, comment_id);
    res.json(comment);
  } catch (error) {
    console.error('Error posting Figma comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Extract file key from Figma URL
app.post('/api/figma/extract', (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const fileKey = FigmaService.extractFileKey(url);
    const nodeId = FigmaService.extractNodeId(url);

    res.json({
      fileKey,
      nodeId,
      valid: !!fileKey
    });
  } catch (error) {
    console.error('Error extracting Figma data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync design tokens from Figma plugin
app.post('/api/figma/sync-tokens', async (req, res) => {
  try {
    const { fileKey, tokens } = req.body;

    if (!tokens) {
      return res.status(400).json({ error: 'tokens are required' });
    }

    // Store or process tokens
    // For now, we'll log them and return success
    // You can extend this to save to a file or database

    console.log('Received tokens from Figma:', {
      fileKey: fileKey || 'unknown',
      tokenCount: {
        colors: Object.keys(tokens.colors || {}).length,
        spacing: Object.keys(tokens.spacing || {}).length,
        typography: Object.keys(tokens.typography || {}).length
      }
    });

    // TODO: Save tokens to .design-tokens-mcp/tokens.json or merge with existing tokens

    res.json({
      success: true,
      message: 'Tokens synced successfully',
      tokens: tokens
    });
  } catch (error) {
    console.error('Error syncing tokens:', error);
    res.status(500).json({ error: error.message });
  }
});

// Scan components from codebase
app.get('/api/figma/scan-components', async (req, res) => {
  try {
    const scanner = new ComponentScanner();
    const components = await scanner.scanComponents();

    res.json({
      success: true,
      count: components.length,
      components: components.map(c => ({
        name: c.name,
        category: c.category,
        filename: c.filename,
        props: c.props,
        tokens: c.tokens,
        children: c.children.map(ch => ch.name),
      }))
    });
  } catch (error) {
    console.error('Error scanning components:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate Figma structure from components
app.post('/api/figma/generate-structure', async (req, res) => {
  try {
    const { componentNames, pageType = 'wireframes', fileKey } = req.body;

    const scanner = new ComponentScanner();
    const allComponents = await scanner.scanComponents();

    // Filter to requested components, or use all if none specified
    const components = componentNames && componentNames.length > 0
      ? allComponents.filter(c => componentNames.includes(c.name))
      : allComponents;

    // Generate Figma structure
    const generator = new FigmaGenerator(figmaService, fileKey);
    const figmaPage = await generator.generateFigmaPage(components, pageType);

    // Convert to plugin format
    const pluginFormat = generator.toFigmaPluginFormat(figmaPage);

    res.json({
      success: true,
      page: figmaPage,
      pluginFormat: pluginFormat,
      components: components.map(c => c.name)
    });
  } catch (error) {
    console.error('Error generating Figma structure:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync components to Figma (sends data to plugin)
app.post('/api/figma/sync-components', async (req, res) => {
  try {
    const { componentNames, pageType = 'wireframes', fileKey } = req.body;

    if (!fileKey && !figmaService) {
      return res.status(400).json({
        error: 'fileKey is required, or set FIGMA_ACCESS_TOKEN to auto-create file'
      });
    }

    // Scan components
    const scanner = new ComponentScanner();
    const allComponents = await scanner.scanComponents();

    const components = componentNames && componentNames.length > 0
      ? allComponents.filter(c => componentNames.includes(c.name))
      : allComponents;

    // Generate Figma structure - use design generator for styled pages
    let generator;
    if (pageType === 'design') {
      const FigmaDesignGenerator = require('./figmaDesignGenerator');
      generator = new FigmaDesignGenerator(figmaService, fileKey);
    } else {
      generator = new FigmaGenerator(figmaService, fileKey);
    }
    const figmaPage = await generator.generateFigmaPage(components, pageType);

    // Return data for plugin to consume
    // The plugin will need to be running and listening for this data
    res.json({
      success: true,
      message: `Generated structure for ${components.length} components. Use Figma plugin to render.`,
      data: {
        command: 'create-structure',
        structure: figmaPage,
        components: components.map(c => ({
          name: c.name,
          category: c.category,
          structure: c.structure,
          styles: c.styles,
        }))
      }
    });
  } catch (error) {
    console.error('Error syncing components to Figma:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get component details for a specific component
app.get('/api/figma/component/:componentName', async (req, res) => {
  try {
    const { componentName } = req.params;

    const scanner = new ComponentScanner();
    const components = await scanner.scanComponents();

    const component = components.find(c =>
      c.name.toLowerCase() === componentName.toLowerCase()
    );

    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Generate wireframe for this component
    const generator = new FigmaGenerator(figmaService, null);
    const wireframe = generator.generateWireframe(component);

    res.json({
      success: true,
      component: {
        name: component.name,
        category: component.category,
        props: component.props,
        structure: component.structure,
        styles: component.styles,
        tokens: component.tokens,
      },
      wireframe: wireframe
    });
  } catch (error) {
    console.error('Error getting component:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handlers - catch unhandled errors to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit immediately - let the server try to handle it
  // In production, you might want to exit after logging
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Don't exit - log and continue
});

// Server already started earlier (line ~60) for Railway health check
// Log final startup information
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
console.log(`   Press Ctrl+C to stop`);

// Log database initialization status (non-blocking)
const dbModule = require('./db');
dbModule.getDb().then(() => {
  console.log('✅ Database initialization completed');
}).catch(err => {
  console.warn('⚠️  Database initialization still in progress or failed:', err.message);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown doesn't complete
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown doesn't complete
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});
