require('dotenv').config();

// Initialize database (must be before other imports that might use it)
require('./db');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const aiMediator = require('./aiMediator');
const userContext = require('./userContext');
const auth = require('./auth');
const messageStore = require('./messageStore');
const roomManager = require('./roomManager');
const connectionManager = require('./connectionManager');
const emailService = require('./emailService');
const dbSafe = require('./dbSafe');

const app = express();
const server = http.createServer(app);

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
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
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

    // Allow same-origin requests (for admin page)
    if (origin.startsWith(`http://localhost:${serverPort}`) || 
        origin.startsWith(`https://localhost:${serverPort}`)) {
      return callback(null, true);
    }

    // Check if origin is allowed (supports wildcard patterns for Vercel)
    if (isOriginAllowed(origin, allowedOrigins)) {
      callback(null, true);
    } else {
      // For development, allow localhost from any port
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Allow same-origin requests
      if (origin.startsWith(`http://localhost:${serverPort}`) || 
          origin.startsWith(`https://localhost:${serverPort}`)) {
        return callback(null, true);
      }
      
      // Check if origin is allowed (supports wildcard patterns for Vercel)
      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
      } else {
        // For development, allow localhost from any port
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
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

      // Load room message history from database using safe query
      const db = await require('./db').getDb();
      const historyQuery = `
        SELECT * FROM messages
        WHERE room_id = ${dbSafe.escapeSQL(roomId)}
        AND private = 0
        AND flagged = 0
        AND (deleted = 0 OR deleted IS NULL)
        ORDER BY timestamp ASC
        LIMIT 500
      `;
      const historyResult = db.exec(historyQuery);
      const messages = dbSafe.parseResult(historyResult);

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

  // Handle new messages
  socket.on('send_message', async ({ text }) => {
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

      // Don't add to history yet - wait for AI analysis
      // We'll add it later if it's approved
      aiMediator.updateContext(message);

      // Check if AI mediator should intervene (async, non-blocking)
      // We analyze BEFORE broadcasting to decide if message should be shown to others
      // IMPORTANT: Message is NOT broadcast yet - we wait for AI analysis
      console.log(`⏳ Message from ${user.username} queued for AI analysis - NOT broadcasting yet`);
      
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
            const db = await require('./db').getDb();
            const userResult = await dbSafe.safeSelect('users', { username: user.username.toLowerCase() }, { limit: 1 });
            const users = dbSafe.parseResult(userResult);
            if (users.length > 0) {
              const contactsResult = await dbSafe.safeSelect('contacts', { user_id: users[0].id });
              const fullContacts = dbSafe.parseResult(contactsResult);
              existingContacts = fullContacts.map(c => c.contact_name);
              
              // Format contacts with relationships and context for AI mediator
              if (fullContacts.length > 0) {
                const contactInfo = fullContacts.map(contact => {
                  const parts = [];
                  parts.push(contact.contact_name);
                  if (contact.relationship) {
                    parts.push(`(relationship: ${contact.relationship})`);
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
                
                contactContextForAI = `Contacts and Relationships:\n${contactInfo}`;
              }
            }
          } catch (contactErr) {
            console.error('Error fetching contacts for AI context:', contactErr);
          }
          
          const intervention = await aiMediator.analyzeAndIntervene(message, context.recentMessages, participantUsernames, existingContacts, contactContextForAI);
          
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
            // Message needs intervention - only show to sender
            console.log(`⚠️ Message from ${user.username} flagged - only showing to sender`);
            
            // Send original message only to sender (with flag that it was problematic)
            // Do NOT add to public message history
            socket.emit('new_message', {
              ...message,
              flagged: true,
              private: true
            });

            const aiMessage = {
              id: `ai-${Date.now()}`,
              type: intervention.type === 'ai_intervention' ? 'ai_intervention' : 'ai_comment',
              username: 'AI Moderator',
              validation: intervention.validation,
              tip1: intervention.tip1,
              tip2: intervention.tip2,
              rewrite: intervention.rewrite,
              timestamp: new Date().toISOString(),
              originalMessage: {
                username: message.username,
                text: message.text
              },
              private: true // Only show to sender
            };

            // Do NOT add AI message to public history (it's private)
            socket.emit('new_message', aiMessage);
            
            console.log(`✅ AI ${intervention.type === 'ai_intervention' ? 'intervened' : 'commented'} - private message to sender only`);
          } else {
            // Message is fine - broadcast to room only and save to database
            console.log(`✅ Message from ${user.username} approved - broadcasting to room ${user.roomId}`);

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
      const messageQuery = `
        SELECT * FROM messages
        WHERE id = ${dbSafe.escapeSQL(messageId)}
        AND username = ${dbSafe.escapeSQL(user.username)}
        AND room_id = ${dbSafe.escapeSQL(user.roomId)}
        LIMIT 1
      `;
      const messageResult = db.exec(messageQuery);
      const messages = dbSafe.parseResult(messageResult);

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
      const messageQuery = `
        SELECT * FROM messages
        WHERE id = ${dbSafe.escapeSQL(messageId)}
        AND username = ${dbSafe.escapeSQL(user.username)}
        AND room_id = ${dbSafe.escapeSQL(user.roomId)}
        LIMIT 1
      `;
      const messageResult = db.exec(messageQuery);
      const messages = dbSafe.parseResult(messageResult);

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
      const db = await require('./db').getDb();
      const messageQuery = `
        SELECT * FROM messages
        WHERE id = ${dbSafe.escapeSQL(messageId)}
        AND room_id = ${dbSafe.escapeSQL(user.roomId)}
        AND deleted = 0
        LIMIT 1
      `;
      const messageResult = db.exec(messageQuery);
      const messages = dbSafe.parseResult(messageResult);

      if (messages.length === 0) {
        socket.emit('error', { message: 'Message not found.' });
        return;
      }

      // Get existing reactions for this message
      const reactionsQuery = `
        SELECT reactions FROM messages
        WHERE id = ${dbSafe.escapeSQL(messageId)}
        LIMIT 1
      `;
      const reactionsResult = db.exec(reactionsQuery);
      const reactionsData = dbSafe.parseResult(reactionsResult);
      
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

  // Handle user flagging a message as triggering
  socket.on('flag_message', async ({ messageId, reason }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before flagging messages.' });
        return;
      }

      // Get message from database to verify it exists in this room
      const db = await require('./db').getDb();
      const messageQuery = `
        SELECT * FROM messages
        WHERE id = ${dbSafe.escapeSQL(messageId)}
        AND room_id = ${dbSafe.escapeSQL(user.roomId)}
        AND deleted = 0
        LIMIT 1
      `;
      const messageResult = db.exec(messageQuery);
      const messages = dbSafe.parseResult(messageResult);

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
        const db = await require('./db').getDb();
        db.run(`
          INSERT INTO messages (id, type, username, text, timestamp, socket_id, room_id)
          VALUES ('${systemMessage.id}', '${systemMessage.type}', '${systemMessage.username}', '${systemMessage.text.replace(/'/g, "''")}', '${systemMessage.timestamp}', '${socket.id}', '${roomId.replace(/'/g, "''")}')
        `);
        require('./db').saveDatabase();
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeUsers: activeUsers.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

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
    const db = await require('./db').getDb();
    const result = db.exec(`
      SELECT 
        id, 
        username, 
        email, 
        created_at, 
        last_login 
      FROM users 
      ORDER BY created_at DESC
    `);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.json({ users: [], count: 0 });
    }

    const row = result[0];
    const columns = row.columns;
    const users = row.values.map(values => {
      const user = {};
      values.forEach((value, index) => {
        user[columns[index]] = value;
      });
      return {
        id: user.id,
        username: user.username,
        email: user.email || null,
        created_at: user.created_at,
        last_login: user.last_login || null
      };
    });

    res.json({
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
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

// API info endpoint (moved to /api/info)
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Multi-User Chat Server',
    version: '1.0.0',
    activeUsers: activeUsers.size
  });
});

// Authentication API endpoints
// Sign up (create new account)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password, email, context } = req.body;
    
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 2-20 characters' });
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

    const user = await auth.createUser(username, password, context || {}, cleanEmail);
    res.json({ success: true, user });
  } catch (error) {
    if (error.message === 'Username already exists') {
      return res.status(409).json({ error: error.message });
    }
    if (error.message === 'Email already exists') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await auth.authenticateUser(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ success: true, user });
  } catch (error) {
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
    
    // Get tasks with optional filtering
    const status = req.query.status || req.query.filter;
    const search = req.query.search;
    
    let tasksResult;
    if (status && status !== 'all') {
      tasksResult = await dbSafe.safeSelect('tasks', {
        user_id: userId,
        status: status
      }, { 
        orderBy: 'created_at',
        orderDirection: 'DESC'
      });
    } else {
      tasksResult = await dbSafe.safeSelect('tasks', {
        user_id: userId
      }, { 
        orderBy: 'created_at',
        orderDirection: 'DESC'
      });
    }
    
    let tasks = dbSafe.parseResult(tasksResult);
    
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
    const { username, title, description, status, priority, due_date } = req.body;
    
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
    const { username, title, description, status, priority, due_date } = req.body;
    
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
    
    if (email !== undefined) updateData.email = email ? email.trim().toLowerCase() : null;
    if (first_name !== undefined) updateData.first_name = first_name != null ? String(first_name).trim() : null;
    if (last_name !== undefined) updateData.last_name = last_name != null ? String(last_name).trim() : null;
    if (address !== undefined) updateData.address = address != null ? String(address).trim() : null;
    if (household_members !== undefined) updateData.household_members = household_members != null ? String(household_members).trim() : null;
    if (occupation !== undefined) updateData.occupation = occupation != null ? String(occupation).trim() : null;
    if (parenting_philosophy !== undefined) updateData.parenting_philosophy = parenting_philosophy != null ? String(parenting_philosophy).trim() : null;
    if (personal_growth !== undefined) {
      // Handle personal_growth - preserve empty strings
      updateData.personal_growth = personal_growth != null ? String(personal_growth).trim() : null;
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

    const db = await require('./db').getDb();
    
    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;
    
    // Get contacts
    const contactsResult = await dbSafe.safeSelect('contacts', { user_id: userId }, { orderBy: 'created_at', orderDirection: 'DESC' });
    const contacts = dbSafe.parseResult(contactsResult);
    
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
            substance_mental_health, neglect_abuse_concerns, additional_thoughts, other_parent } = req.body;
    
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
      created_at: now,
      updated_at: now
    });
    
    require('./db').saveDatabase();

    console.log('Contact created successfully:', {
      contactId,
      userId,
      contact_name: contact_name.trim()
    });

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
            substance_mental_health, neglect_abuse_concerns, additional_thoughts, other_parent } = req.body;
    
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
    
    await dbSafe.safeUpdate('contacts', updateData, { id: contactId });
    require('./db').saveDatabase();

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

// Create invite for room
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

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Chat server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log(`   Press Ctrl+C to stop`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
