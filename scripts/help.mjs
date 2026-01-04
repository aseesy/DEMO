#!/usr/bin/env node
/**
 * Command Discovery - Show all canonical commands
 * 
 * Automatically reads package.json to ensure accuracy.
 * Usage: npm run help
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Read package.json to ensure accuracy
const packageJson = JSON.parse(
  readFileSync(join(ROOT_DIR, 'package.json'), 'utf8')
);

const scripts = packageJson.scripts || {};

// Categorize commands
const categories = {
  'Development': {
    patterns: [/^dev/],
    priority: 1,
  },
  'Production': {
    patterns: [/^start$/],
    priority: 2,
  },
  'Stop & Restart': {
    patterns: [/^stop$/, /^restart/],
    priority: 3,
  },
  'Testing': {
    patterns: [/^test/],
    priority: 4,
  },
  'Code Quality': {
    patterns: [/^lint/, /^format/, /^secrets:scan/],
    priority: 5,
  },
  'Build': {
    patterns: [/^build/],
    priority: 6,
  },
  'Database': {
    patterns: [/^migrate/, /^db:/],
    priority: 7,
  },
  'Process Management': {
    patterns: [/^watchdog/, /^kill:/, /^dev:safe/],
    priority: 8,
  },
  'Utilities': {
    patterns: [/^help$/, /^doctor/, /^preflight/, /^validate/],
    priority: 9,
  },
  'Tools': {
    patterns: [/^tools:/],
    priority: 10,
  },
  'Monitor': {
    patterns: [/^monitor:/],
    priority: 11,
  },
};

// Descriptions for common commands (can be extended)
const descriptions = {
  'dev': 'Start all development servers (frontend + backend)',
  'dev:all': 'Alias for dev (start all servers)',
  'dev:backend': 'Start backend server only',
  'dev:frontend': 'Start frontend server only',
  'dev:safe': 'Start with CPU watchdog (optional safety)',
  'dev:safe:all': 'Start all servers with watchdog protection',
  'dev:safe:backend': 'Start backend with watchdog protection',
  'dev:safe:frontend': 'Start frontend with watchdog protection',
  'start': 'Start production server (Railway/Vercel compatible)',
  'stop': 'Stop all development servers',
  'restart': 'Restart all development servers',
  'restart:backend': 'Restart backend server only',
  'restart:frontend': 'Restart frontend server only',
  'test': 'Run all tests (backend + frontend)',
  'test:backend': 'Run backend tests only',
  'test:frontend': 'Run frontend tests only',
  'test:coverage': 'Run all tests with coverage',
  'lint:fix': 'Auto-fix linting issues',
  'format': 'Format code with Prettier',
  'format:check': 'Check formatting without fixing',
  'secrets:scan': 'Scan for secrets in codebase',
  'secrets:scan:staged': 'Scan staged files for secrets',
  'build': 'Build frontend client for production',
  'build:client': 'Alias for build',
  'help': 'Show this help message',
  'doctor': 'Validate environment, ports, and dependencies',
  'preflight': 'Run pre-deployment checks',
  'preflight:quick': 'Quick preflight (skip build)',
  'preflight:full': 'Full preflight with health check',
  'watchdog': 'Start CPU watchdog monitor (cross-platform)',
  'watchdog:start': 'Start watchdog via manager (cross-platform)',
  'watchdog:stop': 'Stop watchdog (cross-platform)',
  'watchdog:status': 'Check watchdog status (cross-platform)',
  'kill:emergency': 'Emergency kill all Node processes (cross-platform)',
};

// Group scripts by category
const categorized = {};
const uncategorized = [];

for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
  // Skip internal/deprecated commands
  if (scriptName.startsWith('_')) continue;
  
  let categorized_flag = false;
  
  for (const [categoryName, config] of Object.entries(categories)) {
    if (config.patterns.some(pattern => pattern.test(scriptName))) {
      if (!categorized[categoryName]) {
        categorized[categoryName] = [];
      }
      categorized[categoryName].push({
        name: scriptName,
        command: scriptCommand,
        description: descriptions[scriptName] || scriptCommand.substring(0, 60) + '...',
      });
      categorized_flag = true;
      break;
    }
  }
  
  if (!categorized_flag) {
    uncategorized.push({
      name: scriptName,
      command: scriptCommand,
      description: descriptions[scriptName] || scriptCommand.substring(0, 60) + '...',
    });
  }
}

// Sort categories by priority
const sortedCategories = Object.keys(categories).sort(
  (a, b) => categories[a].priority - categories[b].priority
);

// Colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

console.log(`${colors.bold}${colors.cyan}LiaiZen - Canonical Commands${colors.reset}`);
console.log(`${colors.gray}═══════════════════════════════════════════════════════════${colors.reset}\n`);

// Display categorized commands
for (const category of sortedCategories) {
  if (categorized[category] && categorized[category].length > 0) {
    // Sort commands alphabetically within category
    categorized[category].sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`${colors.bold}${colors.blue}${category}${colors.reset}`);
    for (const { name, description } of categorized[category]) {
      const cmd = name.startsWith('test:') || name === 'stop' || name === 'start'
        ? `npm ${name}`
        : `npm run ${name}`;
      console.log(`  ${colors.green}${cmd.padEnd(30)}${colors.reset} ${description}`);
    }
    console.log('');
  }
}

// Display uncategorized if any
if (uncategorized.length > 0) {
  console.log(`${colors.bold}${colors.blue}Other${colors.reset}`);
  for (const { name, description } of uncategorized) {
    const cmd = `npm run ${name}`;
    console.log(`  ${colors.green}${cmd.padEnd(30)}${colors.reset} ${description}`);
  }
  console.log('');
}

console.log(`${colors.gray}═══════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.yellow}💡 Tip:${colors.reset} Use ${colors.green}npm run doctor${colors.reset} to validate your setup\n`);
