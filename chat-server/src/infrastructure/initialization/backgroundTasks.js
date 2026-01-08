/**
 * Background Tasks Initialization
 *
 * Single Responsibility: Schedule and manage background database tasks.
 *
 * Handles:
 * - Schema validation scheduling
 * - Migration scheduling
 * - Neo4j initialization and sync
 * - Relationship sync jobs
 */

const { defaultLogger } = require('../logging/logger');

const logger = defaultLogger.child({
  module: 'backgroundTasks',
});

/**
 * Schedule all background database tasks
 *
 * @param {Object} taskManager - Task manager instance
 * @param {boolean} dbConnected - Whether database is connected
 */
function scheduleBackgroundTasks(taskManager, dbConnected) {
  if (!dbConnected) {
    return;
  }

  // Validate schema on startup (non-blocking)
  taskManager.schedule(
    'schema-validation',
    async () => {
      try {
        const schemaValidator = require('../database/schemaValidator');
        const validation = await schemaValidator.validateCoreSchema();

        if (validation.valid) {
          logger.debug('Log message', {
            value: `✅ Schema validation passed (${validation.tableCount} tables)`,
          });
          if (validation.warnings.length > 0) {
            validation.warnings.forEach(warning =>
              logger.debug('Log message', {
                value: `   ℹ️  ${warning}`,
              })
            );
          }
        } else {
          logger.warn('⚠️  Schema validation found issues:');
          validation.errors.forEach(error =>
            logger.warn('Log message', {
              value: `   - ${error}`,
            })
          );
          logger.warn('💡 Run migrations to fix schema issues');
        }

        // Show migration status
        const migrationStatus = await schemaValidator.getMigrationStatus();
        if (migrationStatus.total > 0) {
          logger.debug('Log message', {
            value: `📋 Migration status: ${migrationStatus.executed} executed, ${migrationStatus.failed} failed`,
          });
        }
      } catch (err) {
        logger.warn('⚠️  Schema validation failed (non-blocking)', {
          message: err.message,
        });
      }
    },
    1000
  );

  // Run PostgreSQL migration in background
  taskManager.schedule(
    'run-migration',
    async () => {
      const { runMigration } = require('../../../run-migration');
      await runMigration().catch(err => {
        logger.error('⚠️  Migration error (non-blocking)', {
          message: err.message,
        });
      });
    },
    2000
  );

  // Initialize Neo4j indexes and sync
  taskManager.schedule(
    'neo4j-init',
    async () => {
      try {
        const neo4jClient = require('../database/neo4jClient');
        if (neo4jClient.isAvailable()) {
          logger.debug('🔄 Initializing Neo4j indexes...');
          await neo4jClient.initializeIndexes().catch(err => {
            logger.warn('⚠️  Neo4j index initialization failed (non-blocking)', {
              message: err.message,
            });
          });

          // Run initial sync validation with auto-fix enabled
          taskManager.schedule(
            'db-sync-validation',
            async () => {
              const dbSyncValidator = require('../../services/sync/dbSyncValidator');
              await dbSyncValidator.runFullValidation(true).catch(err => {
                logger.warn('⚠️  Database sync validation failed (non-blocking)', {
                  message: err.message,
                });
              });
            },
            5000
          );

          // Start periodic relationship metadata sync job
          taskManager.schedule(
            'relationship-sync',
            async () => {
              try {
                const relationshipSync = require('../../services/sync/relationshipSync');
                relationshipSync.startSyncJob(60);
              } catch (err) {
                logger.warn('⚠️  Failed to start relationship sync job', {
                  message: err.message,
                });
              }
            },
            10000
          );
        }
      } catch (err) {
        logger.debug('ℹ️  Neo4j not configured or unavailable (optional)');
      }
    },
    3000
  );
}

module.exports = {
  scheduleBackgroundTasks,
};
