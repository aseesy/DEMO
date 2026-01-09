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
    logger.warn('⚠️ DATABASE_URL not set - services will not be loaded');
    return {};
  }

  logger.debug('📦 Loading services...');

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

  // Log service availability for debugging
  logger.info('✅ Services loaded', {
    hasAiMediator: !!services.aiMediator,
    hasUserSessionService: !!services.userSessionService,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    openaiConfigured: services.aiMediator?.analyzeMessage ? 'checking...' : 'N/A',
    servicesCount: Object.keys(services).length,
  });

  // Check if OpenAI is configured
  if (services.aiMediator) {
    try {
      // Try multiple paths for the client module
      let openaiClient;
      try {
        openaiClient = require('../../core/engine/client');
      } catch (e1) {
        try {
          openaiClient = require('../engine/client');
        } catch (e2) {
          // If both fail, that's okay - the mediator will check it
          logger.debug('Could not import OpenAI client directly (will be checked by mediator)');
        }
      }

      if (openaiClient) {
        const isConfigured = openaiClient.isConfigured();
        if (!isConfigured) {
          logger.warn('⚠️ OPENAI_API_KEY not configured - AI mediation will be disabled');
          logger.warn('💡 Messages will be sent without mediation. Set OPENAI_API_KEY to enable.');
        } else {
          logger.info('✅ OpenAI is configured - AI mediation is enabled');
        }
      }
    } catch (err) {
      logger.warn('⚠️ Could not check OpenAI configuration', { error: err.message });
      // Non-fatal - mediator will check it at runtime
    }
  }

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
