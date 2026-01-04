#!/usr/bin/env node
/**
 * Test Runner - Run tests with proper exit code propagation
 * 
 * Runs test suites and ensures exit codes are properly propagated.
 * Standard: CI scripts must propagate exit codes. Final exit code reflects failures.
 * 
 * Usage:
 *   node scripts/test-runner.mjs [--continue-on-error] [--coverage] [backend|frontend|all]
 * 
 * Options:
 *   --continue-on-error  Run all suites even if one fails (exit code still reflects failures)
 *   --coverage           Run with coverage reporting
 */

import { spawn } from 'child_process';
import { createLogger } from './lib/logger.js';

const logger = createLogger({ color: true });

/**
 * Run a test suite
 * 
 * @param {string} workspace - Workspace name (chat-server or chat-client-vite)
 * @param {string[]} testArgs - Additional test arguments (e.g., --coverage, --run)
 * @returns {Promise<number>} Exit code (0 = success, non-zero = failure)
 */
function runTestSuite(workspace, testArgs = []) {
  return new Promise((resolve) => {
    logger.info(`Running tests for ${workspace}...`);
    
    // Build command args
    const args = ['test', '-w', workspace, '--', '--passWithNoTests', ...testArgs];
    
    const proc = spawn('npm', args, {
      stdio: 'inherit',
      shell: false,
    });

    proc.on('close', (code) => {
      const exitCode = code || 0;
      if (exitCode === 0) {
        logger.info(`✓ ${workspace} tests passed`);
      } else {
        logger.error(`✗ ${workspace} tests failed (exit code: ${exitCode})`);
      }
      resolve(exitCode);
    });

    proc.on('error', (error) => {
      logger.error(`Failed to run tests for ${workspace}: ${error.message}`);
      resolve(1);
    });
  });
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const continueOnError = args.includes('--continue-on-error');
  const coverage = args.includes('--coverage');
  const target = args.find(arg => !arg.startsWith('--')) || 'all';

  let exitCode = 0;
  const results = [];

  try {
    if (target === 'all' || target === 'backend') {
      const backendArgs = coverage ? ['--coverage'] : [];
      const code = await runTestSuite('chat-server', backendArgs);
      results.push({ suite: 'backend', code });
      if (code !== 0) {
        exitCode = code;
        if (!continueOnError) {
          logger.error('Stopping due to test failure (use --continue-on-error to run all suites)');
          process.exit(exitCode);
        }
      }
    }

    if (target === 'all' || target === 'frontend') {
      const frontendArgs = coverage ? ['--run', '--coverage'] : ['--run'];
      const code = await runTestSuite('chat-client-vite', frontendArgs);
      results.push({ suite: 'frontend', code });
      if (code !== 0) {
        exitCode = code; // Track worst exit code
      }
    }

    // Summary
    logger.info('');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (exitCode === 0) {
      logger.info('✓ All tests passed');
    } else {
      logger.error(`✗ Test suite completed with failures (exit code: ${exitCode})`);
      results.forEach(({ suite, code }) => {
        if (code !== 0) {
          logger.error(`  - ${suite}: failed (exit code: ${code})`);
        }
      });
    }
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Exit with proper code - CI will see failures
    process.exit(exitCode);
  } catch (error) {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

main();
