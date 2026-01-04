#!/usr/bin/env node
/**
 * Emergency Kill
 * 
 * Nuclear option for frozen development - kills all Node-related processes.
 * Single Responsibility: Emergency process termination only.
 * 
 * Usage:
 *   node scripts/kill-emergency.mjs
 */

import { createLogger } from './lib/logger.js';
import { PidManager } from './lib/pid-manager.js';
import { killProcessesByPattern, killProcessOnPort } from './lib/process-utils.js';

const logger = createLogger({ color: true });

/**
 * Process patterns to kill
 */
const PROCESS_PATTERNS = ['node', 'npm', 'vite', 'esbuild', 'vitest', 'jest'];

/**
 * Ports to check and kill
 */
const PORTS = [3000, 5173, 8080];

/**
 * Main emergency kill procedure
 */
async function main() {
  logger.warn('🚨 EMERGENCY KILL - Terminating all Node processes...');
  logger.info('');

  let totalKilled = 0;

  // Kill by process name
  for (const pattern of PROCESS_PATTERNS) {
    try {
      const killed = await killProcessesByPattern([pattern], { timeout: 500 });
      if (killed > 0) {
        logger.info(`✓ Killed ${killed} ${pattern} process${killed > 1 ? 'es' : ''}`);
        totalKilled += killed;
      } else {
        logger.info(`- No ${pattern} processes`);
      }
    } catch (error) {
      logger.warn(`Error killing ${pattern} processes: ${error.message}`);
    }
  }

  // Kill by port
  for (const port of PORTS) {
    try {
      const killed = await killProcessOnPort(port);
      if (killed) {
        logger.info(`✓ Killed process on port ${port}`);
        totalKilled++;
      }
    } catch (error) {
      // Port might not be in use
    }
  }

  // Clean up watchdog PID file
  const pidManager = new PidManager('/tmp/cpu-watchdog.pid');
  if (pidManager.exists()) {
    pidManager.remove();
    logger.info('✓ Cleaned up watchdog PID file');
  }

  logger.info('');
  logger.info(`✅ Emergency kill complete. ${totalKilled} process${totalKilled !== 1 ? 'es' : ''} terminated.`);
  logger.info('Your system should recover shortly.');
  logger.info('');

  if (process.platform === 'darwin') {
    logger.info('If still frozen, try: sudo purge (clears disk cache)');
  }
}

main().catch((error) => {
  logger.error(`Fatal error: ${error.message}`);
  process.exit(1);
});

