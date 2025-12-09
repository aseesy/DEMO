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
const invitationManager = require('./libs/invitation-manager');
const notificationManager = require('./libs/notification-manager');
const pairingManager = require('./libs/pairing-manager');
const db = require('./dbPostgres'); // Database pool for invitation/notification libraries
const contactIntelligence = require('./contactIntelligence'); // AI contact intelligence
const { isValidEmail } = require('./src/utils/validators'); // Generic validation utilities
const { ensureProfileColumnsExist } = require('./src/utils/schema'); // Schema utilities for runtime column checks

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

// Schema health check endpoint
app.get('/api/health/schema', async (req, res) => {
  try {
    const { getSchemaHealth } = require('./src/utils/schema');
    const health = await getSchemaHealth();
    
    if (health.healthy) {
      res.status(200).json({
        status: 'healthy',
        message: 'All required profile columns exist',
        existing: health.existing,
        timestamp: health.timestamp
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        message: 'Some required profile columns are missing',
        missing: health.missing,
        existing: health.existing,
        timestamp: health.timestamp
      });
    }
  } catch (error) {
    console.error('Error checking schema health:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check schema health',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
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
  optionsSuccessStatus: 200, // Some legacy browsers (IE11) choke on 204
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Rate limiting - general API protection (exclude auth endpoints)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 1000, // 500 requests per 15 min in production
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
app.use('/api/profile', require('./routes/profile'));

// ========================================
// Route Modules (extracted from server.js)
// ========================================
const authRoutes = require('./routes/auth');
const notificationsRoutes = require('./routes/notifications');
const tasksRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const invitationsRoutes = require('./routes/invitations');
const pairingRoutes = require('./routes/pairing');
const contactsRoutes = require('./routes/contacts');
const activitiesRoutes = require('./routes/activities');
const userRoutes = require('./routes/user');
const roomsRoutes = require('./routes/rooms');
const adminRoutes = require('./routes/admin');
const figmaRoutes = require('./routes/figma');

app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invitations', invitationsRoutes);
app.use('/api/pairing', pairingRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/user', userRoutes);
app.use('/api/room', roomsRoutes);
app.use('/api', adminRoutes);
app.use('/api/figma', figmaRoutes);
// ========================================

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
      user.communication_style,
      user.communication_triggers,
      user.communication_goals,
      user.email
    ].filter(field => field && field.trim().length > 0).length;

    // Profile is considered complete if at least 2 fields are filled out
    const profileComplete = filledFields >= 2;

    // Check if co-parent exists
    const coparentResult = await dbSafe.safeSelect('contacts', {
      user_id: userId
    }, {});
    const allContacts = dbSafe.parseResult(coparentResult);

    const hasCoparent = allContacts.some(c => {
      const rel = (c.relationship || '').toLowerCase();
      return rel === 'my co-parent' ||
             rel === 'co-parent' ||
             rel === "my partner's co-parent";
    });

    // Check if children exist (any child relationship type) - case insensitive
    const hasChildren = allContacts.some(c => {
      const rel = (c.relationship || '').toLowerCase();
      return rel === 'my child' ||
             rel === "my partner's child" ||
             rel === "my co-parent's child";
    });

    // Get all onboarding tasks for this user (including new "Invite Your Co-Parent" task)
    const onboardingTaskTitles = [
      'Complete Your Profile',
      'Add Your Co-parent',
      'Invite Your Co-Parent', // New task title from Feature 005
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
        } else if (taskTitle === 'Invite Your Co-Parent' && hasCoparent) {
          // New invite task - auto-completes when co-parent is connected
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

    // PostgreSQL auto-commits, no manual save needed
  } catch (error) {
    console.error('Error in autoCompleteOnboardingTasks:', error);
    throw error;
  }
}

// Set helpers for user routes (after autoCompleteOnboardingTasks is defined)
userRoutes.setHelpers({
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  autoCompleteOnboardingTasks
});

// Set helpers for contacts routes
contactsRoutes.setHelpers({
  autoCompleteOnboardingTasks,
  contactIntelligence
});

/**
 * Check if user has a connected co-parent
 * Checks both pairing_sessions and room memberships
 */
async function checkUserHasCoParent(userId) {
  try {
    // Check pairing_sessions for completed pairing
    const pairings = await dbSafe.safeSelect('pairing_sessions', {
      status: 'completed'
    });

    for (const pairing of pairings) {
      if (pairing.initiator_id === userId || pairing.invitee_id === userId) {
        return true;
      }
    }

    // Also check rooms for 2-member rooms (legacy pairings)
    const roomMembers = await dbSafe.safeSelect('room_members', { user_id: userId });
    for (const member of roomMembers) {
      const otherMembers = await dbSafe.safeSelect('room_members', {
        room_id: member.room_id
      });
      if (otherMembers.length === 2) {
        return true;
      }
    }

    // Also check contacts for co-parent relationship
    const contacts = await dbSafe.safeSelect('contacts', { user_id: userId });
    const hasCoparentContact = contacts.some(c =>
      c.relationship === 'My Co-Parent' ||
      c.relationship === 'co-parent' ||
      c.relationship === "My Partner's Co-Parent"
    );
    if (hasCoparentContact) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking co-parent status:', error);
    return false;
  }
}

/**
 * Backfill onboarding tasks for users who don't have any
 * This ensures users from migrations or failed task creation get their tasks
 */
async function backfillOnboardingTasks(userId) {
  const now = new Date().toISOString();
  console.log(`📋 [TASK BACKFILL] Starting backfill for user ${userId}`);

  try {
    // Get user details
    const users = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
    if (users.length === 0) {
      console.warn(`[TASK BACKFILL] User ${userId} not found`);
      return;
    }
    const user = users[0];

    // Check current conditions
    const hasCoParent = await checkUserHasCoParent(userId);

    // Check if children exist (any child relationship type) - case insensitive
    const contacts = await dbSafe.safeSelect('contacts', { user_id: userId });
    const hasChildren = contacts.some(c => {
      const rel = (c.relationship || '').toLowerCase();
      return rel === 'my child' ||
             rel === "my partner's child" ||
             rel === "my co-parent's child";
    });

    // Check profile completeness
    const filledFields = [
      user.first_name,
      user.last_name,
      user.address,
      user.occupation,
      user.communication_style,
      user.communication_triggers,
      user.communication_goals,
      user.email
    ].filter(field => field && String(field).trim().length > 0).length;
    const profileComplete = filledFields >= 2;

    // Define onboarding tasks with auto-complete conditions
    const welcomeDescription = `LiaiZen is contextual and adapts to your unique situation over time as it learns from your interactions.

We hope you enjoy the platform, but feedback is golden. Let us know what you like and don't like. Stay tuned for new features like calendar, expense sharing, and document sharing.`;

    const inviteDescription = `Connect with your co-parent to start communicating on LiaiZen.

Click this task to send an invite link, generate a short code, or enter a code you received from your co-parent.`;

    const onboardingTasks = [
      {
        title: 'Welcome to LiaiZen',
        description: welcomeDescription,
        priority: 'medium',
        type: 'onboarding',
        autoComplete: false // Manual completion only
      },
      {
        title: 'Complete Your Profile',
        description: 'Help LiaiZen understand the dynamics of your co-parenting situation.\n\nThe more context you provide—your details, your children, your schedule—the better LiaiZen can guide your communication and tailor support to your needs.\n\n\n\nUpdate your profile to get the most accurate, personalized mediation.',
        priority: 'high',
        type: 'onboarding',
        autoComplete: profileComplete
      },
      {
        title: 'Invite Your Co-Parent',
        description: inviteDescription,
        priority: 'high',
        type: 'onboarding',
        autoComplete: hasCoParent
      },
      {
        title: 'Add Your Children',
        description: 'Add your children as contacts so LiaiZen can help you coordinate their care and activities.',
        priority: 'medium',
        type: 'onboarding',
        autoComplete: hasChildren
      }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const task of onboardingTasks) {
      // Check if task already exists (by title)
      const existing = await dbSafe.safeSelect('tasks', {
        user_id: userId,
        title: task.title
      }, { limit: 1 });

      if (existing.length === 0) {
        // Also check for old "Add Your Co-parent" task to avoid duplicate invite tasks
        if (task.title === 'Invite Your Co-Parent') {
          const oldCoparentTask = await dbSafe.safeSelect('tasks', {
            user_id: userId,
            title: 'Add Your Co-parent'
          }, { limit: 1 });
          if (oldCoparentTask.length > 0) {
            console.log(`[TASK BACKFILL] User ${userId} already has "Add Your Co-parent" task, skipping invite task`);
            skippedCount++;
            continue;
          }
        }

        const taskId = await dbSafe.safeInsert('tasks', {
          user_id: userId,
          title: task.title,
          description: task.description,
          priority: task.priority || 'medium',
          type: task.type || 'onboarding',
          status: task.autoComplete ? 'completed' : 'open',
          created_at: now,
          updated_at: now,
          completed_at: task.autoComplete ? now : null
        });
        console.log(`✅ [TASK BACKFILL] Created task "${task.title}" (ID: ${taskId}) for user ${userId}, status: ${task.autoComplete ? 'completed' : 'open'}`);
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`✅ [TASK BACKFILL] Completed for user ${userId}: ${createdCount} created, ${skippedCount} skipped`);
    // PostgreSQL auto-commits, no manual save needed
  } catch (error) {
    console.error(`❌ [TASK BACKFILL] Error for user ${userId}:`, error);
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
    // Set req.user with both id and userId for backward compatibility
    // JWT token contains 'id', but some endpoints expect 'userId'
    req.user = {
      ...decoded,
      userId: decoded.id, // Add userId alias for backward compatibility
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication middleware
 * Tries to authenticate but doesn't fail if token is missing or invalid
 * Sets req.user if authenticated, otherwise req.user is undefined
 */
async function optionalAuth(req, res, next) {
  try {
    // Check for token in cookie or Authorization header
    const token = req.cookies.auth_token ||
      (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        // Set req.user with both id and userId for backward compatibility
        req.user = {
          ...decoded,
          userId: decoded.id, // Add userId alias for backward compatibility
        };
      } catch (err) {
        // Token invalid or expired - silently continue without auth
        req.user = undefined;
      }
    }
    // No token - continue without auth
    next();
  } catch (err) {
    // Any other error - continue without auth
    next();
  }
}

// ========================================
// Initialize Route Module Helpers
// ========================================
tasksRoutes.setHelpers({
  autoCompleteOnboardingTasks,
  backfillOnboardingTasks
});
pairingRoutes.setHelpers({
  roomManager
});
roomsRoutes.setHelpers({
  auth,
  roomManager,
  autoCompleteOnboardingTasks
});
adminRoutes.setHelpers({
  roomManager
});
figmaRoutes.setHelpers({
  figmaService,
  FigmaService,
  ComponentScanner,
  FigmaGenerator
});
// ========================================

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
      console.log(`🔵 Join request received for username: ${username}`);
      const cleanUsername = sanitizeInput(username);
      console.log(`🔵 Cleaned username: ${cleanUsername}`);

      // Validate username
      if (!validateUsername(cleanUsername)) {
        console.log(`❌ Username validation failed: ${cleanUsername}`);
        socket.emit('error', { message: 'Invalid username. Must be 2-20 characters.' });
        return;
      }

      // Get user and their room
      console.log(`🔵 Looking up user: ${cleanUsername}`);
      const user = await auth.getUser(cleanUsername);
      if (!user) {
        console.log(`❌ User not found: ${cleanUsername}`);
        socket.emit('error', { message: 'User not found.' });
        return;
      }
      console.log(`✅ User found: ${user.username} (id: ${user.id})`);

      // If user doesn't have a room (old user from before rooms were added), create one
      let roomId;
      if (!user.room) {
        console.log(`🔵 User ${cleanUsername} has no room, creating one...`);
        try {
          if (!user.id) {
            console.log(`❌ User missing ID: ${JSON.stringify(user)}`);
            socket.emit('error', { message: 'User not found.' });
            return;
          }

          console.log(`🔵 Creating private room for user ${user.id} (${cleanUsername})`);
          const newRoom = await roomManager.createPrivateRoom(user.id, cleanUsername);
          roomId = newRoom.roomId;
          user.room = newRoom;
          console.log(`✅ Created room ${roomId} for user ${cleanUsername}`);
        } catch (err) {
          console.error('❌ Error creating room:', err);
          console.error('❌ Error stack:', err.stack);
          socket.emit('error', { message: 'Failed to create chat room.' });
          return;
        }
      } else {
        roomId = user.room.roomId;
        console.log(`✅ User has existing room: ${roomId}`);
      }

      // Check if user is already connected in another tab/socket
      // If so, disconnect the old connection to allow the new one
      const existingSocketIds = [];
      for (const [socketId, userData] of activeUsers.entries()) {
        if (userData.roomId === roomId && userData.username.toLowerCase() === cleanUsername.toLowerCase() && socketId !== socket.id) {
          existingSocketIds.push(socketId);
        }
      }

      // Disconnect old connections to allow new tab/connection
      if (existingSocketIds.length > 0) {
        console.log(`🔄 User ${cleanUsername} reconnecting - disconnecting ${existingSocketIds.length} old connection(s)`);
        for (const oldSocketId of existingSocketIds) {
          const oldSocket = io.sockets.sockets.get(oldSocketId);
          if (oldSocket) {
            oldSocket.emit('replaced_by_new_connection', { message: 'You opened this chat in another tab. This tab is now disconnected.' });
            oldSocket.disconnect(true);
          }
          activeUsers.delete(oldSocketId);
        }
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
      console.log(`🔵 Getting room members for room: ${roomId}`);
      const members = await roomManager.getRoomMembers(roomId);
      console.log(`✅ Found ${members.length} room members`);

      // Ensure contacts exist for all users in shared rooms
      if (members.length > 1) {
        console.log(`🔗 Ensuring contacts for room ${roomId} with ${members.length} members`);
        await roomManager.ensureContactsForRoomMembers(roomId);
      }

      // Load room message history from database using PostgreSQL
      const dbPostgres = require('./dbPostgres');
      // Note: messages table doesn't have private/flagged/deleted columns in PostgreSQL schema
      const historyQuery = `
        SELECT * FROM messages
        WHERE room_id = $1
        ORDER BY timestamp ASC
        LIMIT 500
      `;
      console.log(`🔵 Loading message history for room: ${roomId}`);
      const result = await dbPostgres.query(historyQuery, [roomId]);
      const messages = result.rows;
      console.log(`✅ Loaded ${messages.length} messages from history`);

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
      // Note: messages table doesn't have socket_id or private columns in PostgreSQL
      try {
        await dbSafe.safeInsert('messages', {
          id: systemMessage.id,
          type: systemMessage.type,
          username: systemMessage.username,
          text: systemMessage.text,
          timestamp: systemMessage.timestamp,
          room_id: roomId
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
      console.error('❌ Error in join handler:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name,
        username: username
      });
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
      const db = require('./dbPostgres');
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
  socket.on('send_message', async ({ text, isPreApprovedRewrite, originalRewrite, bypassMediation }) => {
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
            const db = require('./dbPostgres');
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

      // Feature 006: User chose "Send Original Anyway" - bypass mediation
      if (bypassMediation) {
        console.log(`⚠️ User bypassed mediation - sending original message`);

        // Update communication stats - message sent despite intervention
        try {
          const db = require('./dbPostgres');
          const userResult = await dbSafe.safeSelect('users', { username: user.username.toLowerCase() }, { limit: 1 });
          const users = dbSafe.parseResult(userResult);
          if (users.length > 0) {
            // Record this as a message that bypassed mediation
            await communicationStats.updateCommunicationStats(users[0].id, user.roomId, false);
          }
        } catch (statsErr) {
          console.error('Error updating communication stats for bypassed message:', statsErr);
        }

        // Add to history
        messageHistory.push(message);
        if (messageHistory.length > 100) {
          messageHistory.shift();
        }

        // Save to database
        messageStore.saveMessage({
          ...message,
          roomId: user.roomId,
          bypassedMediation: true
        }).catch(err => {
          console.error('Error saving bypassed message to database:', err);
        });

        // Mark as bypassed (for analytics)
        message.bypassedMediation = true;

        // Broadcast to all users in the room
        io.to(user.roomId).emit('new_message', message);
        return; // Exit early - skip AI mediation
      }

      // Don't add to history yet - wait for AI analysis
      // We'll add it later if it's approved
      aiMediator.updateContext(message);

      // Get recent messages from database for AI analysis
      const dbModule = require('./dbPostgres');
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
            const db = require('./dbPostgres');
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
            const db = require('./dbPostgres');
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

          // Build role context for sender/receiver distinction (Feature 002)
          // In a co-parenting room, the receiver is the other participant
          const otherParticipants = participantUsernames.filter(
            u => u.toLowerCase() !== user.username.toLowerCase()
          );
          const roleContext = {
            senderId: user.username.toLowerCase(),
            receiverId: otherParticipants.length > 0 ? otherParticipants[0].toLowerCase() : null
          };

          const intervention = await aiMediator.analyzeMessage(
            message,
            recentMessages,  // Use recentMessages from database query above
            participantUsernames,
            existingContacts,
            contactContextForAI,
            user.roomId,
            taskContextForAI,
            flaggedMessagesContext,
            roleContext  // NEW: Role-aware context for sender/receiver distinction
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
                const db = require('./dbPostgres');
                const userResult = await dbSafe.safeSelect('users', { username: user.username.toLowerCase() }, { limit: 1 });
                const users = dbSafe.parseResult(userResult);
                if (users.length > 0) {
                  await communicationStats.updateCommunicationStats(users[0].id, user.roomId, true);
                }
              } catch (statsErr) {
                console.error('Error updating communication stats for intervention:', statsErr);
              }

              // First, send the original message as a "pending" message ONLY to the sender
              // This allows the sender to see what they wrote while reviewing the intervention
              // Generate IDs atomically to prevent race conditions
              const baseTimestamp = Date.now();
              const interventionId = `ai-intervention-${baseTimestamp}`;
              const pendingOriginalId = `pending-original-${baseTimestamp}`;

              const pendingOriginalMessage = {
                id: pendingOriginalId,
                type: 'pending_original',
                username: message.username,
                text: message.text,
                timestamp: message.timestamp,
                roomId: user.roomId, // Required for frontend filtering
                interventionId: interventionId // Link to the intervention
              };

              socket.emit('new_message', pendingOriginalMessage);

              // Then send intervention UI ONLY to the sender (private message)
              const interventionMessage = {
                id: interventionId, // Use the same pre-generated ID
                type: 'ai_intervention',
                personalMessage: intervention.personalMessage,
                tip1: intervention.tip1,
                rewrite1: intervention.rewrite1,
                rewrite2: intervention.rewrite2,
                originalMessage: message,
                pendingOriginalId: pendingOriginalId, // Link back to pending message for removal
                escalation: intervention.escalation,
                emotion: intervention.emotion,
                timestamp: message.timestamp // Use same timestamp source for consistency
              };

              // Send ONLY to the sender (not to the room)
              socket.emit('new_message', interventionMessage);

              console.log(`✅ Pending original + Intervention UI sent to ${user.username} privately - message NOT visible to others`);
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
              const db = require('./dbPostgres');
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
      const db = require('./dbPostgres');
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

      // PostgreSQL auto-commits, no manual save needed

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
      const db = require('./dbPostgres');
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

      // PostgreSQL auto-commits, no manual save needed

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
        -- Note: deleted column doesn't exist in PostgreSQL messages table
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

      // PostgreSQL auto-commits, no manual save needed

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

  // Handle accepted rewrite (Feature 002: Sender Profile Mediation)
  // Called when user clicks to use a suggested rewrite
  socket.on('accept_rewrite', async ({ original, rewrite, tip }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before accepting rewrites.' });
        return;
      }

      // Record the accepted rewrite in the sender's profile
      const success = await aiMediator.recordAcceptedRewrite(user.username, {
        original,
        rewrite,
        tip
      });

      if (success) {
        socket.emit('rewrite_recorded', { success: true });
        console.log(`📝 Accepted rewrite recorded for ${user.username}`);
      } else {
        console.log(`⚠️ Could not record accepted rewrite for ${user.username} (profile library not available)`);
      }

    } catch (error) {
      console.error('Error recording accepted rewrite:', error);
      // Non-critical - don't emit error to user
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
      const db = require('./dbPostgres');
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
        -- Note: deleted column doesn't exist in PostgreSQL messages table
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

      // PostgreSQL auto-commits, no manual save needed

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

          const db = require('./dbPostgres');
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
          // PostgreSQL auto-commits, no manual save needed

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
        const db = require('./dbPostgres');
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
          // PostgreSQL auto-commits, no manual save needed

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
        // Note: messages table doesn't have socket_id column in PostgreSQL
        await dbPostgres.query(`
          INSERT INTO messages (id, type, username, text, timestamp, room_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [systemMessage.id, systemMessage.type, systemMessage.username, systemMessage.text, systemMessage.timestamp, roomId]);
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
    if (!isValidEmail(email)) {
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
// ======================================
// Observer/Mediator Analysis Endpoint
// ======================================
app.post('/api/mediate/analyze', verifyAuth, async (req, res) => {
  try {
    const { text, senderProfile = {}, receiverProfile = {} } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const user = req.user;
    const db = require('./dbPostgres');
    const dbSafe = require('./dbSafe');

    // Get recent messages for context
    const userResult = await dbSafe.safeSelect('users', { username: user.username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;
    const roomId = user.roomId || null;

    // Get recent messages
    let recentMessages = [];
    if (roomId) {
      const messagesQuery = `
        SELECT * FROM messages
        WHERE room_id = $1
        ORDER BY timestamp DESC
        LIMIT 15
      `;
      const messagesResult = await db.query(messagesQuery, [roomId]);
      recentMessages = messagesResult.rows.length > 0 ? messagesResult.rows.reverse() : [];
    }

    // Get participant usernames
    const participantUsernames = roomId 
      ? await dbSafe.safeSelect('room_members', { room_id: roomId })
          .then(result => dbSafe.parseResult(result).map(m => m.username))
      : [user.username];

    // Get contacts for context
    // Mediator expects: array of objects with { name, relationship } OR array of strings (contact names)
    // For language analyzer, it needs objects with name/relationship
    // For contact context string, we format it separately
    const contactsResult = await dbSafe.safeSelect('contacts', { user_id: userId });
    const contactsData = dbSafe.parseResult(contactsResult);
    
    // Format as objects for mediator (used by language analyzer for child detection)
    const existingContacts = contactsData.map(c => ({
      name: c.contact_name,
      relationship: c.relationship || 'contact',
    }));
    
    // Format contact context string for AI prompt
    const contactContextForAI = contactsData.length > 0
      ? contactsData.map(c => `${c.contact_name} (${c.relationship || 'contact'})`).join(', ')
      : null;

    // Create message object for analysis
    const message = {
      text: text.trim(),
      username: user.username,
      timestamp: new Date().toISOString(),
    };

    // Analyze using the Observer/Mediator framework
    const analysis = await aiMediator.analyzeMessage(
      message,
      recentMessages,
      participantUsernames,
      existingContacts,
      contactContextForAI,
      roomId,
      null, // taskContextForAI
      null, // flaggedMessagesContext
      null  // roleContext (can be enhanced with senderProfile/receiverProfile)
    );

    if (!analysis) {
      // No intervention needed (STAY_SILENT)
      return res.json({
        action: 'STAY_SILENT',
        escalation: { riskLevel: 'low', confidence: 0, reasons: [] },
        emotion: {
          currentEmotion: 'neutral',
          stressLevel: 0,
          stressTrajectory: 'stable',
          emotionalMomentum: 0,
          triggers: [],
          conversationEmotion: 'neutral',
        },
        intervention: null,
        originalText: text.trim(),
      });
    }

    // Map the mediator's return format to the expected API format
    // Mediator returns: { type: 'ai_intervention'|'ai_comment', action: 'INTERVENE'|'COMMENT', ... }
    const result = {
      action: analysis.action || 'STAY_SILENT',
      escalation: analysis.escalation || {
        riskLevel: 'low',
        confidence: 0,
        reasons: [],
      },
      emotion: analysis.emotion || {
        currentEmotion: 'neutral',
        stressLevel: 0,
        stressTrajectory: 'stable',
        emotionalMomentum: 0,
        triggers: [],
        conversationEmotion: 'neutral',
      },
      intervention: null,
      originalText: text.trim(),
    };

    // Map intervention data based on type
    if (analysis.type === 'ai_intervention' && analysis.action === 'INTERVENE') {
      result.intervention = {
        personalMessage: analysis.personalMessage || '',
        tip1: analysis.tip1 || '',
        rewrite1: analysis.rewrite1 || '',
        rewrite2: analysis.rewrite2 || '',
        comment: null,
      };
    } else if (analysis.type === 'ai_comment' && analysis.action === 'COMMENT') {
      result.intervention = {
        personalMessage: null,
        tip1: null,
        rewrite1: null,
        rewrite2: null,
        comment: analysis.text || '',
      };
    }

    res.json(result);
  } catch (error) {
    console.error('Error analyzing message:', error);
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
      const db = require('./dbPostgres');
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
const dbModule = require('./dbPostgres');
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

// =============================================================================

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
