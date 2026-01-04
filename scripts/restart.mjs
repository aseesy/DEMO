#!/usr/bin/env node
/**
 * Cross-platform server restarter
 * 
 * Restarts frontend and/or backend development servers.
 * Works on Mac, Linux, and Windows.
 * 
 * Usage:
 *   node scripts/restart.mjs [all|backend|frontend]
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import stop and dev functions
async function restart(target = 'all') {
  // Stop servers first
  const stopProcess = spawn('node', [join(__dirname, 'stop.mjs')], {
    stdio: 'inherit',
    shell: false,
  });

  await new Promise((resolve) => {
    stopProcess.on('close', resolve);
  });

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Start servers
  const devProcess = spawn('node', [join(__dirname, 'dev.mjs'), target], {
    stdio: 'inherit',
    shell: false,
  });

  await new Promise((resolve) => {
    devProcess.on('close', resolve);
  });
}

const target = process.argv[2] || 'all';
restart(target);

