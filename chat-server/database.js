/**
 * Database Initialization and Service Loading - Facade
 *
 * REFACTORED: This file is now a facade that delegates to focused initialization modules.
 *
 * The original monolithic file (193 lines, 2 responsibilities) has been split into:
 * - initialization/databaseInit.js - Database connection initialization
 * - initialization/backgroundTasks.js - Background task scheduling
 * - initialization/serviceLoader.js - Service loading and dependency injection
 *
 * This facade maintains backward compatibility - all existing imports continue to work.
 */

const {
  initDatabase: initDatabaseConnection,
} = require('./src/infrastructure/initialization/databaseInit');
const { scheduleBackgroundTasks } = require('./src/infrastructure/initialization/backgroundTasks');
const {
  loadServices: loadAllServices,
} = require('./src/infrastructure/initialization/serviceLoader');

/**
 * Initialize PostgreSQL and Neo4j connections and background jobs
 *
 * REFACTORED: Delegates to focused modules
 */
async function initDatabase() {
  const { dbConnected, dbError, redisConnected, redisError } = await initDatabaseConnection();

  // Schedule background tasks if connected
  if (dbConnected) {
    const { taskManager } = require('./src/infrastructure/tasks/TaskManager');
    scheduleBackgroundTasks(taskManager, dbConnected);
  }

  return { dbConnected, dbError, redisConnected, redisError };
}

/**
 * Load all database-dependent services
 *
 * REFACTORED: Delegates to service loader
 */
function loadServices() {
  return loadAllServices();
}

module.exports = {
  initDatabase,
  loadServices,
};
