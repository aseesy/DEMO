#!/usr/bin/env node
/**
 * Deprecation wrapper for old commands
 * 
 * Shows warning and calls new canonical command.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const deprecations = {
  'start-dev': {
    old: 'npm start',
    new: 'npm run dev',
    script: 'dev.mjs',
  },
  'dev-stack': {
    old: 'npm run dev:stack',
    new: 'npm run dev',
    script: 'dev.mjs',
  },
};

const command = process.argv[2];
const deprecation = deprecations[command];

if (!deprecation) {
  console.error(`Unknown deprecation command: ${command}`);
  process.exit(1);
}

console.warn('');
console.warn('⚠️  DEPRECATED: This command has been deprecated.');
console.warn(`   Old: ${deprecation.old}`);
console.warn(`   New: ${deprecation.new}`);
console.warn('');
console.warn('   This command will be removed in a future version.');
console.warn('   Please update your scripts and documentation.');
console.warn('');

// Forward arguments (skip script name and command)
const args = process.argv.slice(3);

// Call new script
const newScript = join(__dirname, deprecation.script);
const proc = spawn('node', [newScript, ...args], {
  stdio: 'inherit',
  shell: false,
});

proc.on('close', (code) => {
  process.exit(code || 0);
});

