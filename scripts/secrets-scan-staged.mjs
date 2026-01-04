#!/usr/bin/env node
/**
 * Scan staged files for secrets
 * 
 * Cross-platform replacement for: git diff --cached --name-only | xargs secretlint
 * 
 * Usage: npm run secrets:scan:staged
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { xargs } from './lib/cross-platform.js';
import { createLogger } from './lib/logger.js';

const execAsync = promisify(exec);
const logger = createLogger({ color: true });

async function main() {
  try {
    // Get staged files
    const { stdout } = await execAsync('git diff --cached --name-only', { timeout: 10000 });
    const stagedFiles = stdout
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    
    if (stagedFiles.length === 0) {
      logger.info('No staged files to scan');
      process.exit(0);
    }
    
    logger.info(`Scanning ${stagedFiles.length} staged file(s) for secrets...`);
    
    // Process files using cross-platform xargs
    const results = await xargs(stagedFiles, 'npx secretlint {}');
    
    let hasErrors = false;
    
    for (const result of results) {
      if (result.error && !result.error.includes('No issues found')) {
        logger.error(`Error scanning ${result.input}: ${result.error}`);
        hasErrors = true;
      } else if (result.output && !result.output.includes('No issues found')) {
        console.log(result.output);
        hasErrors = true;
      }
    }
    
    if (hasErrors) {
      logger.error('Secrets found in staged files. Please review and remove before committing.');
      process.exit(1);
    } else {
      logger.info('✓ No secrets found in staged files');
      process.exit(0);
    }
  } catch (error) {
    logger.error(`Failed to scan staged files: ${error.message}`);
    process.exit(1);
  }
}

main();

