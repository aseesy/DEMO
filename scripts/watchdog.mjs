#!/usr/bin/env node
/**
 * CPU Watchdog
 * 
 * Monitors CPU usage and kills runaway Node processes.
 * Single Responsibility: CPU monitoring daemon.
 * 
 * Usage:
 *   node scripts/watchdog.mjs [options]
 * 
 * Environment variables:
 *   CPU_THRESHOLD=80      # CPU threshold % (default: 80)
 *   CHECK_INTERVAL=5      # Check interval in seconds (default: 5)
 *   GRACE_PERIOD=3        # Consecutive violations before kill (default: 3)
 */

import { createLogger } from './lib/logger.js';
import { PidManager } from './lib/pid-manager.js';
import { isProcessRunning } from './lib/process-utils.js';
import { CpuMonitor } from './lib/cpu-monitor.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { platform } from 'os';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration from environment
const CPU_THRESHOLD = parseInt(process.env.CPU_THRESHOLD || '80', 10);
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL || '5', 10) * 1000;
const GRACE_PERIOD = parseInt(process.env.GRACE_PERIOD || '3', 10);

// File paths
const PID_FILE = '/tmp/cpu-watchdog.pid';
const LOG_FILE = '/tmp/cpu-watchdog.log';

// Create logger
const logger = createLogger({
  logFile: LOG_FILE,
  level: 2, // INFO
  color: true,
});

// Create PID manager
const pidManager = new PidManager(PID_FILE);

/**
 * Send desktop notification (macOS/Linux)
 * 
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
async function sendNotification(title, message) {
  try {
    if (platform() === 'darwin') {
      // macOS
      await execAsync(
        `osascript -e 'display notification "${message}" with title "${title}" sound name "Basso"'`
      );
    } else if (platform() === 'linux') {
      // Linux (requires notify-send)
      await execAsync(`notify-send "${title}" "${message}"`);
    }
    // Windows notifications would go here
  } catch (error) {
    // Notifications are optional, fail silently
  }
}

/**
 * Check if watchdog is already running
 */
async function checkAlreadyRunning() {
  if (!pidManager.exists()) {
    return false;
  }

  const oldPid = pidManager.read();
  if (!oldPid) {
    return false;
  }

  if (await isProcessRunning(oldPid)) {
    logger.warn(`Watchdog already running (PID: ${oldPid}). Use 'npm run watchdog:stop' to stop it.`);
    return true;
  }

  // Stale PID file, remove it
  pidManager.remove();
  return false;
}

/**
 * Cleanup handler
 */
async function cleanup() {
  logger.info('CPU Watchdog shutting down...');
  pidManager.remove();
  process.exit(0);
}

/**
 * Main watchdog loop
 */
async function main() {
  // Check if already running
  if (await checkAlreadyRunning()) {
    process.exit(1);
  }

  // Save our PID
  pidManager.write(process.pid);

  // Set up cleanup handlers
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Create CPU monitor
  const monitor = new CpuMonitor({
    threshold: CPU_THRESHOLD,
    gracePeriod: GRACE_PERIOD,
  });

  logger.info(`CPU Watchdog started (PID: ${process.pid})`);
  logger.info(`Settings: threshold=${CPU_THRESHOLD}%, interval=${CHECK_INTERVAL / 1000}s, grace=${GRACE_PERIOD} checks`);
  logger.info('Monitoring node, npm, vitest, jest, esbuild, vite processes...');

  // Main monitoring loop
  while (true) {
    try {
      const violations = await monitor.check();

      for (const violation of violations) {
        logger.warn(
          `High CPU detected: PID ${violation.pid} (${violation.name}) at ${violation.cpu}% [${violation.violations}/${GRACE_PERIOD}]`
        );

        if (monitor.shouldKill(violation.violations)) {
          logger.error(
            `KILLING runaway process: PID ${violation.pid} (${violation.name}) - sustained ${violation.cpu}% CPU`
          );

          const killed = await monitor.killViolator(violation.pid);
          
          if (killed) {
            await sendNotification(
              'CPU Watchdog',
              `Killed runaway process: ${violation.name} (PID ${violation.pid})`
            );
          }
        }
      }
    } catch (error) {
      logger.error(`Error during monitoring: ${error.message}`);
    }

    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
}

// Run watchdog
main().catch(error => {
  logger.error(`Fatal error: ${error.message}`);
  cleanup();
  process.exit(1);
});

