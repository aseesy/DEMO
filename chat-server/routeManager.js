/**
 * API Route Management
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

/**
 * Configure all API routes and static asset serving
 */
function setupRoutes(app, services) {
  const {
    dbSafe,
    auth,
    roomManager,
    contactIntelligence,
    aiMediator,
    invitationManager,
    notificationManager,
    pairingManager,
    dbPostgres,
  } = services;

  // ========================================
  // Initialize Onboarding Service
  // ========================================
  const { onboardingService } = require('./src/services');
  onboardingService.setDbSafe(dbSafe);

  // Create bound helper functions for route injection
  const autoCompleteOnboardingTasks = userId =>
    onboardingService.autoCompleteOnboardingTasks(userId);
  const backfillOnboardingTasks = userId => onboardingService.backfillOnboardingTasks(userId);

  // ========================================
  // Initialize Route Module Helpers
  // ========================================
  const authRoutes = require('./routes/auth');
  const loginRoutes = require('./routes/auth/login');
  const waitlistRoutes = require('./routes/waitlist');
  const notificationsRoutes = require('./routes/notifications');
  const tasksRoutes = require('./routes/tasks');
  const dashboardRoutes = require('./routes/dashboard');
  const invitationsRoutes = require('./routes/invitations');
  const pairingRoutes = require('./routes/pairing');
  const contactsRoutes = require('./routes/contacts');
  const activitiesRoutes = require('./routes/activities');
  const userRoutes = require('./routes/user');
  const roomsRoutes = require('./routes/rooms');
  const messagesRoutes = require('./routes/messages');
  const adminRoutes = require('./routes/admin');
  const aiRoutes = require('./routes/ai');
  const connectionsRoutes = require('./routes/connections');
  const profileRoutes = require('./routes/profile');
  const blogImagesRoutes = require('./routes/blogImages');

  tasksRoutes.setHelpers({ autoCompleteOnboardingTasks, backfillOnboardingTasks });
  pairingRoutes.setHelpers({ roomManager });
  roomsRoutes.setHelpers({ auth, roomManager, autoCompleteOnboardingTasks });
  adminRoutes.setHelpers({ roomManager });
  // Load mediation service and inject dependencies
  const { mediationService, authService } = require('./src/services');
  mediationService.setAiMediator(aiMediator);
  aiRoutes.setHelpers({ aiMediator, mediationService });
  connectionsRoutes.setHelpers({ auth, autoCompleteOnboardingTasks });

  // Inject authService into login route
  if (loginRoutes.setService) {
    loginRoutes.setService(authService);
  }
  userRoutes.setHelpers({
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
    autoCompleteOnboardingTasks,
  });
  contactsRoutes.setHelpers({ autoCompleteOnboardingTasks, contactIntelligence });

  // Inject services into profile routes
  if (services.profileService && profileRoutes.setHelpers) {
    profileRoutes.setHelpers({ profileService: services.profileService });
  }

  // ========================================
  // API Route Registration
  // ========================================
  app.use('/api/userContext', require('./routes/userContext'));
  app.use('/api/profile', profileRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/waitlist', waitlistRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/tasks', tasksRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/invitations', invitationsRoutes);
  app.use('/api/pairing', pairingRoutes);
  app.use('/api/contacts', contactsRoutes);
  app.use('/api/activities', activitiesRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/room', roomsRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api', adminRoutes);
  app.use('/api', aiRoutes);
  app.use('/api', connectionsRoutes);
  app.use('/api/blog/images', blogImagesRoutes);
  app.use('/api/push', require('./routes/pushNotifications'));

  // ========================================
  // Admin & Import Routes (Inline)
  // ========================================

  app.get('/admin', (req, res) => {
    const adminPath = path.join(__dirname, 'admin.html');
    res.sendFile(adminPath, err => {
      if (err) res.status(500).send('Error loading admin page');
    });
  });

  app.post('/api/import/messages', express.json({ limit: '50mb' }), async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${process.env.JWT_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { messages, roomId } = req.body;
      if (!messages || !Array.isArray(messages) || !roomId) {
        return res.status(400).json({ error: 'messages array and roomId required' });
      }
      let imported = 0;
      for (const msg of messages) {
        const messageId = `${Date.now()}-import-${Math.random().toString(36).substr(2, 9)}`;
        await dbPostgres.query(
          `INSERT INTO messages (id, type, username, text, timestamp, room_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          [messageId, 'message', msg.username, msg.text, msg.timestamp, roomId]
        );
        imported++;
      }
      res.json({ success: true, imported, total: messages.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/update-display-names', express.json(), async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${process.env.JWT_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { updates } = req.body;
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ error: 'updates array required' });
      }
      let updated = 0;
      for (const { username, displayName, firstName, preferredName } of updates) {
        if (!username) continue;
        const fields = [];
        const values = [];
        let paramIndex = 1;
        if (displayName !== undefined) {
          fields.push(`display_name = $${paramIndex++}`);
          values.push(displayName);
        }
        if (firstName !== undefined) {
          fields.push(`first_name = $${paramIndex++}`);
          values.push(firstName);
        }
        if (preferredName !== undefined) {
          fields.push(`preferred_name = $${paramIndex++}`);
          values.push(preferredName);
        }
        if (fields.length === 0) continue;
        values.push(username);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE LOWER(username) = LOWER($${paramIndex})`;
        const result = await dbPostgres.query(query, values);
        if (result.rowCount > 0) updated++;
      }
      res.json({ success: true, updated });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/import/cleanup', express.json(), async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${process.env.JWT_SECRET}`)
        return res.status(401).json({ error: 'Unauthorized' });
      const { roomId, patterns } = req.body;
      if (!roomId) return res.status(400).json({ error: 'roomId required' });
      const cleanupPatterns = patterns || [
        '__kIMMessagePartAttributeName',
        '__kIMFileTransferGUIDAttributeName',
        '__kIMDataDetectedAttributeName',
      ];
      let totalDeleted = 0;
      for (const pattern of cleanupPatterns) {
        const result = await dbPostgres.query(
          `DELETE FROM messages WHERE room_id = $1 AND text = $2`,
          [roomId, pattern]
        );
        totalDeleted += result.rowCount || 0;
      }
      const stripResult = await dbPostgres.query(
        `UPDATE messages SET text = SUBSTRING(text FROM 3) WHERE room_id = $1 AND text LIKE '+#%'`,
        [roomId]
      );
      res.json({
        success: true,
        deleted: totalDeleted,
        prefixesStripped: stripResult.rowCount || 0,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========================================
  // Static Assets (Production)
  // ========================================
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath, { maxAge: '1y', etag: true, lastModified: true }));
    app.get('/favicon.ico', (req, res) => {
      const fav = path.join(distPath, 'favicon.ico');
      if (fs.existsSync(fav)) res.sendFile(fav);
      else res.status(404).end();
    });
    app.get('*', (req, res, next) => {
      if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/admin') ||
        req.path.startsWith('/health')
      )
        return next();
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) res.sendFile(indexPath);
      else next();
    });
  } else {
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
    console.log(`[CLIENT-DEBUG] ${timestamp} - ${message}`, JSON.stringify(data || {}, null, 2));
    res.json({ received: true });
  });
}

module.exports = { setupRoutes };
