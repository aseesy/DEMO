#!/usr/bin/env node
/**
 * Cross-platform server stopper
 * 
 * Stops frontend and backend development servers by killing processes on their ports.
 * Works on Mac, Linux, and Windows.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Port configuration
const BACKEND_PORT = process.env.PORT || 3000;
const FRONTEND_PORT = 5173;

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Kill process on port (cross-platform)
async function killPort(port, name) {
  try {
    let command;
    if (process.platform === 'win32') {
      // Windows: Find PID using netstat, then kill with taskkill
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split('\n');
      const pids = new Set();
      
      for (const line of lines) {
        const match = line.trim().match(/\s+(\d+)$/);
        if (match) {
          pids.add(match[1]);
        }
      }
      
      if (pids.size > 0) {
        for (const pid of pids) {
          try {
            await execAsync(`taskkill /F /PID ${pid}`);
          } catch (e) {
            // PID might not exist, continue
          }
        }
        return true;
      }
      return false;
    } else {
      // Unix-like: Use lsof to find and kill
      try {
        const { stdout } = await execAsync(`lsof -ti:${port}`);
        const pids = stdout.trim().split('\n').filter(Boolean);
        
        if (pids.length > 0) {
          await execAsync(`kill -9 ${pids.join(' ')}`);
          return true;
        }
        return false;
      } catch (e) {
        // No process on port
        return false;
      }
    }
  } catch (error) {
    // Port not in use or command failed
    return false;
  }
}

async function main() {
  log('blue', '🛑 Stopping Development Servers');
  log('blue', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  let stopped = false;

  // Stop backend
  log('blue', `Stopping backend server (port ${BACKEND_PORT})...`);
  if (await killPort(BACKEND_PORT, 'Backend')) {
    log('green', '✅ Backend server stopped');
    stopped = true;
  } else {
    log('yellow', '⚠️  Backend server not running');
  }

  // Stop frontend
  log('blue', `Stopping frontend server (port ${FRONTEND_PORT})...`);
  if (await killPort(FRONTEND_PORT, 'Frontend')) {
    log('green', '✅ Frontend server stopped');
    stopped = true;
  } else {
    log('yellow', '⚠️  Frontend server not running');
  }

  console.log('');
  if (stopped) {
    log('green', '✅ All servers stopped');
  } else {
    log('yellow', '⚠️  No servers were running');
  }
}

main();

