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
    figmaService,
    invitationManager,
    notificationManager,
    pairingManager,
    dbPostgres,
  } = services;

  // ========================================
  // Onboarding Helpers
  // ========================================

  /**
   * Check if user has a connected co-parent
   */
  async function checkUserHasCoParent(userId) {
    try {
      const pairings = await dbSafe.safeSelect('pairing_sessions', { status: 'completed' });
      for (const pairing of pairings) {
        if (pairing.initiator_id === userId || pairing.invitee_id === userId) return true;
      }

      const roomMembers = await dbSafe.safeSelect('room_members', { user_id: userId });
      for (const member of roomMembers) {
        const otherMembers = await dbSafe.safeSelect('room_members', { room_id: member.room_id });
        if (otherMembers.length === 2) return true;
      }

      const contacts = await dbSafe.safeSelect('contacts', { user_id: userId });
      const hasCoparentContact = contacts.some(
        c =>
          c.relationship === 'My Co-Parent' ||
          c.relationship === 'co-parent' ||
          c.relationship === "My Partner's Co-Parent"
      );
      return hasCoparentContact;
    } catch (error) {
      console.error('Error checking co-parent status:', error);
      return false;
    }
  }

  /**
   * Auto-complete onboarding tasks when conditions are met
   */
  async function autoCompleteOnboardingTasks(userId) {
    try {
      const users = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
      if (users.length === 0) return;
      const user = users[0];
      const now = new Date().toISOString();

      const filledFields = [
        user.first_name,
        user.last_name,
        user.address,
        user.communication_style,
        user.communication_triggers,
        user.communication_goals,
        user.email,
      ].filter(field => field && field.trim().length > 0).length;

      const profileComplete = filledFields >= 2;
      const coparentResult = await dbSafe.safeSelect('contacts', { user_id: userId });
      const allContacts = dbSafe.parseResult(coparentResult);

      const hasCoparent = allContacts.some(c => {
        const rel = (c.relationship || '').toLowerCase();
        return rel === 'my co-parent' || rel === 'co-parent' || rel === "my partner's co-parent";
      });

      const hasChildren = allContacts.some(c => {
        const rel = (c.relationship || '').toLowerCase();
        return rel === 'my child' || rel === "my partner's child" || rel === "my co-parent's child";
      });

      const tasks = await dbSafe.safeSelect('tasks', { user_id: userId, status: 'open' });
      for (const task of tasks) {
        let shouldComplete = false;
        if (task.title === 'Complete Your Profile' && profileComplete) shouldComplete = true;
        if (
          (task.title === 'Add Your Co-parent' || task.title === 'Invite Your Co-Parent') &&
          hasCoparent
        )
          shouldComplete = true;
        if (task.title === 'Add Your Children' && hasChildren) shouldComplete = true;

        if (shouldComplete) {
          await dbSafe.safeUpdate(
            'tasks',
            { status: 'completed', completed_at: now, updated_at: now },
            { id: task.id }
          );
          console.log(`✅ Auto-completed task "${task.title}" for user ${userId}`);
        }
      }
    } catch (error) {
      console.error('Error in autoCompleteOnboardingTasks:', error);
    }
  }

  /**
   * Backfill onboarding tasks for users
   */
  async function backfillOnboardingTasks(userId) {
    const now = new Date().toISOString();
    try {
      const users = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
      if (users.length === 0) return;
      const hasCoParent = await checkUserHasCoParent(userId);
      const contacts = await dbSafe.safeSelect('contacts', { user_id: userId });
      const hasChildren = contacts.some(c => {
        const rel = (c.relationship || '').toLowerCase();
        return rel === 'my child' || rel === "my partner's child" || rel === "my co-parent's child";
      });

      const existingTasks = await dbSafe.safeSelect('tasks', { user_id: userId });
      const existingTitles = existingTasks.map(t => t.title);

      const onboardingTasks = [
        {
          title: 'Complete Your Profile',
          description: 'Fill out your communication preferences and goals.',
          status: 'open',
        },
        {
          title: 'Invite Your Co-Parent',
          description: 'Connect with your co-parent to start mediating messages.',
          status: hasCoParent ? 'completed' : 'open',
        },
        {
          title: 'Add Your Children',
          description: 'Add your children to the contacts list for context.',
          status: hasChildren ? 'completed' : 'open',
        },
      ];

      for (const taskData of onboardingTasks) {
        if (!existingTitles.includes(taskData.title)) {
          await dbSafe.safeInsert('tasks', {
            user_id: userId,
            title: taskData.title,
            description: taskData.description,
            status: taskData.status,
            priority: 'medium',
            category: 'onboarding',
            created_at: now,
            updated_at: now,
            completed_at: taskData.status === 'completed' ? now : null,
          });
        }
      }
    } catch (error) {
      console.error('Error in backfillOnboardingTasks:', error);
    }
  }

  // ========================================
  // Initialize Route Module Helpers
  // ========================================
  const authRoutes = require('./routes/auth');
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
  const adminRoutes = require('./routes/admin');
  const figmaRoutes = require('./routes/figma');
  const aiRoutes = require('./routes/ai');
  const connectionsRoutes = require('./routes/connections');
  const profileRoutes = require('./routes/profile');

  tasksRoutes.setHelpers({ autoCompleteOnboardingTasks, backfillOnboardingTasks });
  pairingRoutes.setHelpers({ roomManager });
  roomsRoutes.setHelpers({ auth, roomManager, autoCompleteOnboardingTasks });
  adminRoutes.setHelpers({ roomManager });
  figmaRoutes.setHelpers({ figmaService, ...services }); // Figma needs multiple components
  aiRoutes.setHelpers({ aiMediator });
  connectionsRoutes.setHelpers({ auth, autoCompleteOnboardingTasks });
  userRoutes.setHelpers({
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
    autoCompleteOnboardingTasks,
  });
  contactsRoutes.setHelpers({ autoCompleteOnboardingTasks, contactIntelligence });
  
  // Inject services into profile routes
  if (services.profileService && profileRoutes.setServices) {
    profileRoutes.setServices({ profileService: services.profileService });
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
  app.use('/api', adminRoutes);
  app.use('/api/figma', figmaRoutes);
  app.use('/api', aiRoutes);
  app.use('/api', connectionsRoutes);

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
}

module.exports = { setupRoutes };
