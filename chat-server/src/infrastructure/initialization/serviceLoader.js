/**
 * Service Loader
 *
 * Single Responsibility: Load and configure all application services.
 *
 * Handles:
 * - Service instantiation
 * - Dependency injection
 * - Event listener registration
 * - Utility function injection
 */

const { defaultLogger } = require('../logging/logger');

const logger = defaultLogger.child({
  module: 'serviceLoader',
});

/**
 * Load all database-dependent services
 *
 * @returns {Object} Services object
 */
function loadServices() {
  if (!process.env.DATABASE_URL) {
    return {};
  }

  const services = {
    aiMediator: require('../../../aiMediator'),
    userContext: require('../../../userContext'),
    auth: require('../../../auth'),
    messageStore: require('../../../messageStore'),
    roomManager: require('../../../roomManager'),
    emailService: require('../../../emailService'),
    dbSafe: require('../../../dbSafe'),
    communicationStats: require('../../../communicationStats'),
    invitationManager: require('../../../libs/invitation-manager'),
    notificationManager: require('../../../libs/notification-manager'),
    pairingManager: require('../../../libs/pairing-manager'),
    db: require('../../../dbPostgres'),
    dbPostgres: require('../../../dbPostgres'),
    contactIntelligence: require('../../../contactIntelligence'),
    threadManager: require('../../../threadManager'),
  };

  // Add services from services layer
  const { profileService, userSessionService } = require('../../services');
  services.profileService = profileService;
  services.userSessionService = userSessionService;

  // Phase 2: Add EventBus and TaskManager to services
  const { eventBus } = require('../events/EventBus');
  const { taskManager } = require('../tasks/TaskManager');
  services.eventBus = eventBus;
  services.taskManager = taskManager;

  // Phase 1: Initialize UserSessionService (load sessions from database)
  if (userSessionService && userSessionService.initialize) {
    userSessionService.initialize().catch(err => {
      logger.warn('[ServiceLoader] UserSessionService initialization failed (non-blocking)', {
        message: err.message,
      });
    });
  }

  // Register domain event listeners (decoupled side effects)
  // This breaks dependency cycles by using events instead of direct calls
  try {
    const {
      registerThreadEventListeners,
    } = require('../../../src/core/events/listeners/ThreadEventListeners');
    registerThreadEventListeners();
    logger.debug('✅ Domain event listeners registered');
  } catch (err) {
    logger.warn('⚠️  Failed to register thread event listeners', {
      message: err.message,
    });
  }

  // Add specific utility functions
  const { isValidEmail } = require('../validation/validators');

  services.isValidEmail = isValidEmail;
  // Note: ensureProfileColumnsExist removed - schema changes must be done via migrations

  // Add proactive coach and feedback learner
  services.proactiveCoach = require('../../../proactiveCoach');
  services.feedbackLearner = require('../../../feedbackLearner');

  return services;
}

module.exports = {
  loadServices,
};
