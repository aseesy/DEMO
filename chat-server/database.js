/**
 * Database Initialization and Service Loading
 */

const dbModule = require('./dbPostgres');

/**
 * Initialize PostgreSQL and Neo4j connections and background jobs
 */
async function initDatabase() {
  let dbConnected = false;
  let dbError = null;

  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not set!');
    console.error('❌ PostgreSQL is required in all environments.');
    return { dbConnected: false, dbError: 'DATABASE_URL not configured' };
  }

  console.log('🐘 PostgreSQL mode: DATABASE_URL detected');

  try {
    // Initialize PostgreSQL client
    require('./dbPostgres');
    dbConnected = true;
    console.log('📊 Using PostgreSQL database');
  } catch (err) {
    dbError = err.message;
    console.error('❌ Database initialization error:', err.message);
  }

  // Run background tasks if connected
  if (dbConnected) {
    // Run PostgreSQL migration in background
    setTimeout(() => {
      const { runMigration } = require('./run-migration');
      runMigration().catch(err => {
        console.error('⚠️  Migration error (non-blocking):', err.message);
      });
    }, 2000);

    // Initialize Neo4j indexes and sync
    setTimeout(() => {
      try {
        const neo4jClient = require('./src/infrastructure/database/neo4jClient');
        if (neo4jClient.isAvailable()) {
          console.log('🔄 Initializing Neo4j indexes...');
          neo4jClient.initializeIndexes().catch(err => {
            console.warn('⚠️  Neo4j index initialization failed (non-blocking):', err.message);
          });

          // Run initial sync validation with auto-fix enabled
          setTimeout(() => {
            const dbSyncValidator = require('./src/services/sync/dbSyncValidator');
            dbSyncValidator.runFullValidation(true).catch(err => {
              console.warn('⚠️  Database sync validation failed (non-blocking):', err.message);
            });
          }, 5000);

          // Start periodic relationship metadata sync job
          setTimeout(() => {
            try {
              const relationshipSync = require('./src/services/sync/relationshipSync');
              relationshipSync.startSyncJob(60);
            } catch (err) {
              console.warn('⚠️  Failed to start relationship sync job:', err.message);
            }
          }, 10000);
        }
      } catch (err) {
        console.log('ℹ️  Neo4j not configured or unavailable (optional)');
      }
    }, 3000);
  }

  return { dbConnected, dbError };
}

/**
 * Load all database-dependent services
 */
function loadServices() {
  if (!process.env.DATABASE_URL) {
    return {};
  }

  const services = {
    aiMediator: require('./aiMediator'),
    userContext: require('./userContext'),
    auth: require('./auth'),
    messageStore: require('./messageStore'),
    roomManager: require('./roomManager'),
    connectionManager: require('./connectionManager'),
    emailService: require('./emailService'),
    dbSafe: require('./dbSafe'),
    FigmaService: require('./figmaService'),
    ComponentScanner: require('./componentScanner'),
    FigmaGenerator: require('./figmaGenerator'),
    communicationStats: require('./communicationStats'),
    invitationManager: require('./libs/invitation-manager'),
    notificationManager: require('./libs/notification-manager'),
    pairingManager: require('./libs/pairing-manager'),
    db: require('./dbPostgres'),
    dbPostgres: require('./dbPostgres'),
    contactIntelligence: require('./contactIntelligence'),
    threadManager: require('./threadManager'),
    proactiveCoach: require('./proactiveCoach'),
    feedbackLearner: require('./feedbackLearner'),
  };

  // Add services from services layer
  const { profileService, userSessionService } = require('./src/services');
  services.profileService = profileService;
  services.userSessionService = userSessionService;

  // Add specific utility functions
  const { isValidEmail } = require('./src/infrastructure/validation/validators');
  const { ensureProfileColumnsExist } = require('./src/infrastructure/database/schema');

  services.isValidEmail = isValidEmail;
  services.ensureProfileColumnsExist = ensureProfileColumnsExist;

  // Initialize Figma service if API token is provided
  services.figmaService = null;
  if (process.env.FIGMA_ACCESS_TOKEN) {
    try {
      services.figmaService = new services.FigmaService(process.env.FIGMA_ACCESS_TOKEN);
      console.log('✅ Figma API service initialized');
    } catch (error) {
      console.warn('⚠️  Figma API service not available:', error.message);
    }
  }

  return services;
}

module.exports = {
  initDatabase,
  loadServices,
};
