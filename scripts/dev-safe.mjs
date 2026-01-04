#!/usr/bin/env node
/**
 * Safe Development Server Starter
 * 
 * Starts development servers with CPU watchdog protection.
 * Single Responsibility: Orchestrating dev servers + watchdog.
 * 
 * Usage:
 *   node scripts/dev-safe.mjs [all|backend|frontend]
 */

import { spawn } from 'child_process';
import { createLogger } from './lib/logger.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = createLogger({ color: true });

/**
 * Start watchdog
 */
async function startWatchdog() {
  const watchdogManagerPath = join(__dirname, 'watchdog-manager.mjs');
  
  return new Promise((resolve) => {
    const proc = spawn('node', [watchdogManagerPath, 'start'], {
      stdio: 'inherit',
      shell: false,
    });

    proc.on('close', (code) => {
      resolve(code === 0);
    });

    proc.on('error', (error) => {
      logger.warn(`Failed to start watchdog: ${error.message}`);
      logger.warn('Continuing without watchdog protection...');
      resolve(false);
    });
  });
}

/**
 * Stop watchdog
 */
async function stopWatchdog() {
  const watchdogManagerPath = join(__dirname, 'watchdog-manager.mjs');
  
  return new Promise((resolve) => {
    const proc = spawn('node', [watchdogManagerPath, 'stop'], {
      stdio: 'inherit',
      shell: false,
    });

    proc.on('close', resolve);
    proc.on('error', resolve);
  });
}

/**
 * Start dev servers
 */
async function startDevServers(target) {
  const devPath = join(__dirname, 'dev.mjs');
  const dev = spawn('node', [devPath, target], {
    stdio: 'inherit',
    shell: false,
  });

  return dev;
}

/**
 * Cleanup handler
 */
async function cleanup() {
  console.log('');
  logger.warn('Shutting down...');

  // Stop watchdog
  await stopWatchdog();

  // Stop dev servers (handled by dev.mjs's own cleanup)
  logger.info('Cleanup complete');
  process.exit(0);
}

/**
 * Main entry point
 */
async function main() {
  const target = process.argv[2] || 'all';

  // Set up cleanup handlers
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Header
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('🛡️  Starting development with CPU watchdog protection');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Start watchdog
  logger.info('');
  await startWatchdog();

  // Start dev servers
  logger.info('');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('Starting dev servers...');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('');

  const devProcess = await startDevServers(target);

  devProcess.on('close', async (code) => {
    await cleanup();
    process.exit(code || 0);
  });

  devProcess.on('error', async (error) => {
    logger.error(`Failed to start dev servers: ${error.message}`);
    await cleanup();
    process.exit(1);
  });
}

main().catch(async (error) => {
  logger.error(`Fatal error: ${error.message}`);
  await cleanup();
  process.exit(1);
});

