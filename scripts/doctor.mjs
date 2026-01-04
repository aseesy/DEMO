#!/usr/bin/env node
/**
 * Doctor - Validate environment, ports, and dependencies
 * 
 * Checks:
 * - Node.js version
 * - Required environment variables
 * - Port availability
 * - Required files and directories
 * 
 * Usage: npm run doctor
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const BACKEND_DIR = join(ROOT_DIR, 'chat-server');
const FRONTEND_DIR = join(ROOT_DIR, 'chat-client-vite');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log('green', `✓ ${message}`);
}

function warning(message) {
  log('yellow', `⚠ ${message}`);
}

function error(message) {
  log('red', `✗ ${message}`);
}

function info(message) {
  log('cyan', `ℹ ${message}`);
}

// Check Node.js version
async function checkNodeVersion() {
  const requiredVersion = 20;
  const currentVersion = parseInt(process.version.slice(1).split('.')[0]);
  
  if (currentVersion >= requiredVersion) {
    success(`Node.js version: ${process.version} (required: >= ${requiredVersion}.0.0)`);
    return true;
  } else {
    error(`Node.js version: ${process.version} (required: >= ${requiredVersion}.0.0)`);
    return false;
  }
}

// Check if port is available
async function checkPort(port, name) {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      if (stdout.trim()) {
        warning(`${name} port ${port} is in use`);
        return false;
      }
    } else {
      await execAsync(`lsof -ti:${port}`);
      warning(`${name} port ${port} is in use`);
      return false;
    }
  } catch (e) {
    // Port is free (command failed = no process found)
  }
  success(`${name} port ${port} is available`);
  return true;
}

// Check required files
function checkFile(path, name) {
  if (existsSync(path)) {
    success(`${name}: ${path}`);
    return true;
  } else {
    error(`${name} not found: ${path}`);
    return false;
  }
}

// Check required directories
function checkDirectory(path, name) {
  if (existsSync(path)) {
    success(`${name}: ${path}`);
    return true;
  } else {
    error(`${name} not found: ${path}`);
    return false;
  }
}

// Check environment variables (optional, just warn if missing)
function checkEnvVar(name, required = false) {
  const value = process.env[name];
  if (value) {
    success(`Environment variable ${name} is set`);
    return true;
  } else if (required) {
    error(`Required environment variable ${name} is not set`);
    return false;
  } else {
    warning(`Environment variable ${name} is not set (optional)`);
    return true; // Not a failure for optional vars
  }
}

// Load .env file if exists
function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  
  const env = {};
  const content = readFileSync(path, 'utf8');
  
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  }
  
  return env;
}

async function main() {
  log('bold', '\n🔍 LiaiZen Doctor - Environment Validation\n');
  log('blue', '═══════════════════════════════════════════════════════════\n');
  
  let allPassed = true;
  
  // Check Node.js version
  log('cyan', 'Node.js Version:');
  if (!(await checkNodeVersion())) allPassed = false;
  console.log('');
  
  // Check ports
  log('cyan', 'Port Availability:');
  await checkPort(3000, 'Backend');
  await checkPort(5173, 'Frontend');
  console.log('');
  
  // Check required files
  log('cyan', 'Required Files:');
  if (!checkFile(join(BACKEND_DIR, 'server.js'), 'Backend server.js')) allPassed = false;
  if (!checkFile(join(BACKEND_DIR, 'package.json'), 'Backend package.json')) allPassed = false;
  if (!checkFile(join(FRONTEND_DIR, 'package.json'), 'Frontend package.json')) allPassed = false;
  console.log('');
  
  // Check required directories
  log('cyan', 'Required Directories:');
  if (!checkDirectory(BACKEND_DIR, 'Backend directory')) allPassed = false;
  if (!checkDirectory(FRONTEND_DIR, 'Frontend directory')) allPassed = false;
  console.log('');
  
  // Check environment files (optional)
  log('cyan', 'Environment Files:');
  const backendEnv = loadEnvFile(join(BACKEND_DIR, '.env'));
  const frontendEnv = loadEnvFile(join(FRONTEND_DIR, '.env'));
  
  if (Object.keys(backendEnv).length > 0) {
    success(`Backend .env file exists (${Object.keys(backendEnv).length} variables)`);
  } else {
    warning('Backend .env file not found (optional for development)');
  }
  
  if (Object.keys(frontendEnv).length > 0) {
    success(`Frontend .env file exists (${Object.keys(frontendEnv).length} variables)`);
  } else {
    info('Frontend .env file not found (optional for development)');
  }
  console.log('');
  
  // Check critical environment variables (from backend .env)
  log('cyan', 'Environment Variables (from .env files):');
  if (backendEnv.PORT || process.env.PORT) {
    success('PORT is set');
  } else {
    info('PORT not set (will default to 3000)');
  }
  
  if (backendEnv.JWT_SECRET || process.env.JWT_SECRET) {
    success('JWT_SECRET is set');
  } else {
    warning('JWT_SECRET not set (required for authentication)');
    allPassed = false;
  }
  
  if (backendEnv.DATABASE_URL || process.env.DATABASE_URL) {
    success('DATABASE_URL is set');
  } else {
    warning('DATABASE_URL not set (will use SQLite default)');
  }
  console.log('');
  
  // Summary
  log('blue', '═══════════════════════════════════════════════════════════');
  if (allPassed) {
    success('\n✅ All critical checks passed!\n');
    process.exit(0);
  } else {
    error('\n❌ Some checks failed. Please fix the errors above.\n');
    process.exit(1);
  }
}

main();

