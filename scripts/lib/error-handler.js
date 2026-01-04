#!/usr/bin/env node
/**
 * Error Handler Utility
 *
 * Standardized error handling for scripts.
 * Single Responsibility: Error handling and exit codes.
 *
 * @module lib/error-handler
 */

import { createLogger } from './logger.js';

const logger = createLogger({ color: true });

/**
 * Standard exit codes
 */
export const ExitCode = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  USAGE_ERROR: 2,
  MISSING_DEPENDENCY: 3,
  PERMISSION_ERROR: 4,
  FILE_NOT_FOUND: 5,
  NETWORK_ERROR: 6,
  VALIDATION_ERROR: 7,
};

/**
 * Handle error and exit with appropriate code
 *
 * @param {Error|string} error - Error object or message
 * @param {number} exitCode - Exit code (default: GENERAL_ERROR)
 * @param {boolean} showStack - Show stack trace (default: false)
 */
export function handleError(error, exitCode = ExitCode.GENERAL_ERROR, showStack = false) {
  const message = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : null;

  logger.error(`Error: ${message}`);

  if (showStack && stack) {
    console.error(stack);
  }

  process.exit(exitCode);
}

/**
 * Validate script prerequisites
 *
 * @param {Object} checks - Validation checks
 * @param {boolean} checks.nodeVersion - Check Node.js version
 * @param {string[]} checks.requiredFiles - Required file paths
 * @param {string[]} checks.requiredCommands - Required commands in PATH
 * @returns {Promise<boolean>} True if all checks pass
 */
export async function validatePrerequisites({
  nodeVersion = true,
  requiredFiles = [],
  requiredCommands = [],
} = {}) {
  let allPassed = true;

  // Check Node.js version
  if (nodeVersion) {
    const required = 20;
    const current = parseInt(process.version.slice(1).split('.')[0]);
    if (current < required) {
      logger.error(`Node.js ${required}+ required, found ${current}`);
      allPassed = false;
    }
  }

  // Check required files
  const { existsSync } = await import('fs');
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      logger.error(`Required file not found: ${file}`);
      allPassed = false;
    }
  }

  // Check required commands
  const { commandExists } = await import('./cross-platform.js');
  for (const cmd of requiredCommands) {
    if (!(await commandExists(cmd))) {
      logger.error(`Required command not found: ${cmd}`);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Wrap async function with error handling
 *
 * @param {Function} fn - Async function to wrap
 * @param {number} exitCode - Exit code on error
 */
export function wrapAsync(fn, exitCode = ExitCode.GENERAL_ERROR) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (error) {
      handleError(error, exitCode, process.env.DEBUG === 'true');
    }
  };
}
