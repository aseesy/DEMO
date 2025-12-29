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
    console.error('❌ WARNING: DATABASE_URL not set!');
    console.error('⚠️  PostgreSQL is required for full functionality.');
    console.error('💡 Add PostgreSQL service in Railway dashboard to get DATABASE_URL');
    // Don't return error - allow server to start without database
    // Database will be unavailable but server can still respond to health checks
    return { dbConnected: false, dbError: 'DATABASE_URL not configured' };
  }

  console.log('🐘 PostgreSQL mode: DATABASE_URL detected');

  try {
    // Initialize PostgreSQL client (non-blocking)
    // Connection pool is created but connection test happens asynchronously
    require('./dbPostgres');
    // Mark as connected immediately - actual connection test happens in background
    // This allows server to start even if database is slow to connect
    dbConnected = true;
    console.log('📊 Using PostgreSQL database (connection testing in background)');
  } catch (err) {
    dbError = err.message;
    console.error('❌ Database initialization error:', err.message);
    // Don't throw - allow server to start even if database fails
    // Health check will report database status but server stays up
  }

  // Run background tasks if connected
  if (dbConnected) {
    // Validate schema on startup (non-blocking)
    setTimeout(async () => {
      try {
        const schemaValidator = require('./src/infrastructure/database/schemaValidator');
        const validation = await schemaValidator.validateCoreSchema();

        if (validation.valid) {
          console.log(`✅ Schema validation passed (${validation.tableCount} tables)`);
          if (validation.warnings.length > 0) {
            validation.warnings.forEach(warning => console.log(`   ℹ️  ${warning}`));
          }
        } else {
          console.warn('⚠️  Schema validation found issues:');
          validation.errors.forEach(error => console.warn(`   - ${error}`));
          console.warn('   💡 Run migrations to fix schema issues');
        }

        // Show migration status
        const migrationStatus = await schemaValidator.getMigrationStatus();
        if (migrationStatus.total > 0) {
          console.log(
            `📋 Migration status: ${migrationStatus.executed} executed, ${migrationStatus.failed} failed`
          );
        }
      } catch (err) {
        console.warn('⚠️  Schema validation failed (non-blocking):', err.message);
      }
    }, 1000);

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
  };

  // Register domain event listeners (decoupled side effects)
  // This breaks dependency cycles by using events instead of direct calls
  try {
    const {
      registerThreadEventListeners,
    } = require('./src/core/events/listeners/ThreadEventListeners');
    registerThreadEventListeners();
    console.log('✅ Domain event listeners registered');
  } catch (err) {
    console.warn('⚠️  Failed to register thread event listeners:', err.message);
  }

  // Add services from services layer
  const { profileService, userSessionService } = require('./src/services');
  services.profileService = profileService;
  services.userSessionService = userSessionService;

  // Add specific utility functions
  const { isValidEmail } = require('./src/infrastructure/validation/validators');
  const { ensureProfileColumnsExist } = require('./src/infrastructure/database/schema');

  services.isValidEmail = isValidEmail;
  services.ensureProfileColumnsExist = ensureProfileColumnsExist;

  // Add proactive coach and feedback learner
  services.proactiveCoach = require('./proactiveCoach');
  services.feedbackLearner = require('./feedbackLearner');

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
