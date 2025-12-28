#!/usr/bin/env node
/**
 * Development Stack Bootstrap Script
 *
 * Starts all development services with one command:
 * - API server
 * - Frontend dev server
 * - WebSocket server (via API)
 *
 * Usage: npm run dev:stack
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Central configuration - Single Source of Truth
const { SERVER_PORT } = require('../config');

const ROOT_DIR = path.join(__dirname, '../..');
const SERVER_DIR = path.join(ROOT_DIR, 'chat-server');
const CLIENT_DIR = path.join(ROOT_DIR, 'chat-client-vite');
const FRONTEND_PORT = 5173;

console.log('🚀 Starting LiaiZen Development Stack\n');

// Check if services are already running
function checkPort(port) {
  return new Promise(resolve => {
    const { exec } = require('child_process');
    exec(`lsof -ti:${port}`, error => {
      resolve(!error); // Port is in use if no error
    });
  });
}

async function startServices() {
  // Check ports using config values
  const backendRunning = await checkPort(SERVER_PORT);
  const frontendRunning = await checkPort(FRONTEND_PORT);

  if (backendRunning) {
    console.log(`⚠️  Backend already running on port ${SERVER_PORT}`);
  } else {
    console.log('📡 Starting backend server...');
    const backend = spawn('node', ['server.js'], {
      cwd: SERVER_DIR,
      stdio: 'inherit',
      shell: true,
    });

    backend.on('error', error => {
      console.error('❌ Backend error:', error);
    });
  }

  if (frontendRunning) {
    console.log(`⚠️  Frontend already running on port ${FRONTEND_PORT}`);
  } else {
    console.log('🎨 Starting frontend dev server...');

    // Check if node_modules exists
    if (!fs.existsSync(path.join(CLIENT_DIR, 'node_modules'))) {
      console.log('📦 Installing frontend dependencies...');
      const install = spawn('npm', ['install'], {
        cwd: CLIENT_DIR,
        stdio: 'inherit',
        shell: true,
      });

      await new Promise(resolve => {
        install.on('close', resolve);
      });
    }

    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: CLIENT_DIR,
      stdio: 'inherit',
      shell: true,
    });

    frontend.on('error', error => {
      console.error('❌ Frontend error:', error);
    });
  }

  console.log('\n✅ Development stack starting...');
  console.log(`📍 Backend:  http://localhost:${SERVER_PORT}`);
  console.log(`📍 Frontend: http://localhost:${FRONTEND_PORT}`);
  console.log('\n💡 Press Ctrl+C to stop all services');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down development stack...');
  process.exit(0);
});

startServices();
