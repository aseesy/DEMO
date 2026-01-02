/**
 * API Route Management
 */

const express = require('express');

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
  // Admin & Import Routes (Extracted)
  // ========================================
  const adminImportRoutes = require('./routes/admin/importRoutes');
  const adminAdminRoutes = require('./routes/admin/adminRoutes');
  app.use('/api', adminImportRoutes);
  app.use('/', adminAdminRoutes);

  // ========================================
  // Static Assets (Extracted)
  // ========================================
  const { setupStaticAssets } = require('./middleware/staticAssets');
  setupStaticAssets(app);
}

module.exports = { setupRoutes };
