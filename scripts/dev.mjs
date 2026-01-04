#!/usr/bin/env node
/**
 * Cross-platform development server starter
 * 
 * Starts frontend and/or backend development servers.
 * Works on Mac, Linux, and Windows.
 * 
 * Usage:
 *   node scripts/dev.mjs [all|backend|frontend]
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const BACKEND_DIR = join(ROOT_DIR, 'chat-server');
const FRONTEND_DIR = join(ROOT_DIR, 'chat-client-vite');

// Port configuration
const BACKEND_PORT = process.env.PORT || 3000;
const FRONTEND_PORT = 5173;

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Check if port is in use
async function isPortInUse(port) {
  try {
    if (process.platform === 'win32') {
      await execAsync(`netstat -ano | findstr :${port}`);
      return true; // Port is in use if command succeeds
    } else {
      await execAsync(`lsof -ti:${port}`);
      return true; // Port is in use if command succeeds
    }
  } catch (error) {
    return false; // Port is not in use if command fails
  }
}

// Start backend server
async function startBackend() {
  const portInUse = await isPortInUse(BACKEND_PORT);
  if (portInUse) {
    log('yellow', `⚠️  Backend already running on port ${BACKEND_PORT}`);
    return null;
  }

  log('blue', `🚀 Starting backend server on port ${BACKEND_PORT}...`);
  
  if (!existsSync(join(BACKEND_DIR, 'server.js'))) {
    log('red', `❌ Backend server.js not found in ${BACKEND_DIR}`);
    return null;
  }

  const backend = spawn('node', ['server.js'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, PORT: BACKEND_PORT },
  });

  backend.on('error', (error) => {
    log('red', `❌ Failed to start backend: ${error.message}`);
  });

  log('green', `✅ Backend server started (PID: ${backend.pid})`);
  return backend;
}

// Start frontend server
async function startFrontend() {
  const portInUse = await isPortInUse(FRONTEND_PORT);
  if (portInUse) {
    log('yellow', `⚠️  Frontend already running on port ${FRONTEND_PORT}`);
    return null;
  }

  log('blue', `🚀 Starting frontend server on port ${FRONTEND_PORT}...`);

  if (!existsSync(join(FRONTEND_DIR, 'package.json'))) {
    log('red', `❌ Frontend package.json not found in ${FRONTEND_DIR}`);
    return null;
  }

  // Check if node_modules exists
  if (!existsSync(join(FRONTEND_DIR, 'node_modules'))) {
    log('yellow', '📦 Installing frontend dependencies...');
    const install = spawn('npm', ['install'], {
      cwd: FRONTEND_DIR,
      stdio: 'inherit',
      shell: true,
    });

    await new Promise((resolve) => {
      install.on('close', (code) => {
        if (code !== 0) {
          log('red', '❌ Failed to install dependencies');
          process.exit(1);
        }
        resolve();
      });
    });
  }

  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: FRONTEND_DIR,
    stdio: 'inherit',
    shell: true,
  });

  frontend.on('error', (error) => {
    log('red', `❌ Failed to start frontend: ${error.message}`);
  });

  log('green', `✅ Frontend server started (PID: ${frontend.pid})`);
  return frontend;
}

// Main execution
async function main() {
  const target = process.argv[2] || 'all';

  log('blue', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('green', '🚀 Starting LiaiZen Development Servers');
  log('blue', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const processes = [];

  try {
    if (target === 'all' || target === 'backend') {
      const backend = await startBackend();
      if (backend) processes.push(backend);
    }

    if (target === 'all' || target === 'frontend') {
      const frontend = await startFrontend();
      if (frontend) processes.push(frontend);
    }

    if (processes.length === 0 && target === 'all') {
      log('yellow', '⚠️  All servers already running!');
      console.log('');
      log('green', `📍 Backend:  http://localhost:${BACKEND_PORT}`);
      log('green', `📍 Frontend: http://localhost:${FRONTEND_PORT}`);
      process.exit(0);
    }

    console.log('');
    log('green', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('green', '✅ Development servers are ready!');
    log('green', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    log('green', `📍 Backend:  http://localhost:${BACKEND_PORT}`);
    log('green', `📍 Frontend: http://localhost:${FRONTEND_PORT}`);
    console.log('');
    log('blue', '💡 Press Ctrl+C to stop all servers');
    console.log('');

    // Handle shutdown
    process.on('SIGINT', () => {
      console.log('');
      log('yellow', 'Shutting down servers...');
      processes.forEach(p => {
        if (p && !p.killed) {
          p.kill();
        }
      });
      process.exit(0);
    });

    // Wait for processes
    await Promise.all(
      processes.map(p => new Promise((resolve) => {
        if (p) {
          p.on('exit', resolve);
          p.on('error', resolve);
        } else {
          resolve();
        }
      }))
    );

  } catch (error) {
    log('red', `❌ Error: ${error.message}`);
    processes.forEach(p => {
      if (p && !p.killed) {
        p.kill();
      }
    });
    process.exit(1);
  }
}

main();

