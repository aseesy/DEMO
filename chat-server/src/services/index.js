/**
 * Services Index
 *
 * Central export point for all services.
 * Import services from here rather than individual files.
 *
 * Example:
 *   const { invitationService, roomService } = require('./src/services');
 */

// Base class and errors (for extending services)
const { BaseService } = require('./BaseService');
const errors = require('./errors');

// ─────────────────────────────────────────────────────────────
// Service Instances
// Services are singletons - import and use directly
// ─────────────────────────────────────────────────────────────

// Admin services (Phase 2.1) ✅
const { debugService, statisticsService, cleanupService } = require('./admin');

// Invitation services (Phase 2.2) ✅
const { invitationService, invitationEmailService } = require('./invitation');

// Room services (Phase 2.3) ✅
const { roomService } = require('./room');

// Message services (Phase 3)
// const { messageHistoryService } = require('./message/messageHistoryService');
// const { messageSearchService } = require('./message/messageSearchService');
// const { messageValidator } = require('./message/messageValidator');

// Profile services (Phase 2.4) ✅
const { profileService } = require('./profile');

// Task services (Phase 2.5) ✅
const { taskService } = require('./task');

// Pairing services (Phase 2.6) ✅
const { pairingService } = require('./pairing');

// Mediation services (Phase 2.7) ✅
const { mediationService } = require('./mediation/mediationService');

// Session services (Phase 2.8) ✅
const { userSessionService } = require('./session/userSessionService');

// Auth services (Phase 2.9) ✅
const { authService } = require('./auth/authService');

// Connection services (Phase 4.2)
// const { connectionTokenService } = require('./connection/connectionTokenService');
// const { pendingConnectionService } = require('./connection/pendingConnectionService');
// const { coParentContactService } = require('./connection/coParentContactService');

module.exports = {
  // Base class for extending
  BaseService,

  // Error classes
  ...errors,

  // Admin services ✅
  debugService,
  statisticsService,
  cleanupService,

  // Invitation services ✅
  invitationService,
  invitationEmailService,

  // Room services ✅
  roomService,

  // Profile services ✅
  profileService,

  // Task services ✅
  taskService,

  // Pairing services ✅
  pairingService,

  // Mediation services ✅
  mediationService,

  // Session services ✅
  userSessionService,

  // Auth services ✅
  authService,
  // messageSearchService,
  // messageValidator,
  // profileService,
  // profileCompletionService,
  // privacyService,
  // taskService,
  // taskSearchService,
  // onboardingTaskService,
  // pairingService,
  // mutualPairingService,
  // connectionTokenService,
  // pendingConnectionService,
  // coParentContactService,
};
