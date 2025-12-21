/**
 * Admin Services Index
 */

const { debugService, DebugService } = require('./debugService');
const { statisticsService, StatisticsService } = require('./statisticsService');
const { cleanupService, CleanupService } = require('./cleanupService');

module.exports = {
  debugService,
  DebugService,
  statisticsService,
  StatisticsService,
  cleanupService,
  CleanupService,
};
