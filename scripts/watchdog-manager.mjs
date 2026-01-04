#!/usr/bin/env node
/**
 * Watchdog Manager
 * 
 * Manages watchdog lifecycle (start, stop, status).
 * Single Responsibility: Watchdog orchestration only.
 * 
 * Usage:
 *   node scripts/watchdog-manager.mjs [start|stop|status]
 */

import { spawn } from 'child_process';
import { createLogger } from './lib/logger.js';
import { PidManager } from './lib/pid-manager.js';
import { isProcessRunning, killProcess } from './lib/process-utils.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PID_FILE = '/tmp/cpu-watchdog.pid';
const logger = createLogger({ color: true });

/**
 * Start the watchdog
 */
async function start() {
  const pidManager = new PidManager(PID_FILE);

  // Check if already running
  if (pidManager.exists()) {
    const pid = pidManager.read();
    if (pid && await isProcessRunning(pid)) {
      logger.warn(`Watchdog already running (PID: ${pid})`);
      return;
    }
  }

  logger.info('Starting CPU watchdog...');

  const watchdogPath = join(__dirname, 'watchdog.mjs');
  const watchdog = spawn('node', [watchdogPath], {
    detached: false,
    stdio: 'inherit',
  });

  watchdog.on('error', (error) => {
    logger.error(`Failed to start watchdog: ${error.message}`);
    process.exit(1);
  });

  // Give it a moment to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Verify it started
  if (pidManager.exists()) {
    const pid = pidManager.read();
    if (pid && await isProcessRunning(pid)) {
      logger.info(`✓ CPU watchdog running (PID: ${pid})`);
      logger.info('  Settings: CPU threshold 80%, check every 5s, kill after 3 consecutive high readings');
      logger.info('  Log file: /tmp/cpu-watchdog.log');
    } else {
      logger.warn('⚠ CPU watchdog may have failed to start');
    }
  }
}

/**
 * Stop the watchdog
 */
async function stop() {
  const pidManager = new PidManager(PID_FILE);

  if (!pidManager.exists()) {
    logger.warn('Watchdog is not running');
    return;
  }

  const pid = pidManager.read();
  if (!pid) {
    logger.warn('Invalid PID file, cleaning up...');
    pidManager.remove();
    return;
  }

  if (!(await isProcessRunning(pid))) {
    logger.warn('Watchdog process not found, cleaning up PID file...');
    pidManager.remove();
    return;
  }

  logger.info(`Stopping CPU watchdog (PID: ${pid})...`);
  const killed = await killProcess(pid, { timeout: 2000 });

  if (killed) {
    pidManager.remove();
    logger.info('✓ Watchdog stopped');
  } else {
    logger.error('Failed to stop watchdog');
    process.exit(1);
  }
}

/**
 * Check watchdog status
 */
async function status() {
  const pidManager = new PidManager(PID_FILE);

  if (!pidManager.exists()) {
    logger.info('Watchdog is not running');
    return;
  }

  const pid = pidManager.read();
  if (!pid) {
    logger.warn('Invalid PID file');
    return;
  }

  if (await isProcessRunning(pid)) {
    logger.info(`Watchdog is running (PID: ${pid})`);
    logger.info('  Log file: /tmp/cpu-watchdog.log');
    logger.info('  Use "npm run watchdog:stop" to stop it');
  } else {
    logger.warn('Watchdog PID file exists but process is not running');
    logger.info('Cleaning up stale PID file...');
    pidManager.remove();
  }
}

/**
 * Main entry point
 */
async function main() {
  const command = process.argv[2] || 'status';

  try {
    switch (command) {
      case 'start':
        await start();
        break;
      case 'stop':
        await stop();
        break;
      case 'status':
        await status();
        break;
      default:
        logger.error(`Unknown command: ${command}`);
        logger.info('Usage: node scripts/watchdog-manager.mjs [start|stop|status]');
        process.exit(1);
    }
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

