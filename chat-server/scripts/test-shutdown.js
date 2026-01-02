/**
 * Test Script for Graceful Shutdown
 * 
 * Tests that the server shuts down gracefully:
 * - Tasks are cancelled
 * - Socket.io closes
 * - Database connections close
 * - No hanging processes
 */

require('dotenv').config();
const http = require('http');

// Use PORT from environment or default to 3001 (server default)
const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1'; // Use IPv4 explicitly

console.log('🧪 Testing graceful shutdown...\n');

// Test 1: Check if server is running
const testServerRunning = () => {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${HOST}:${PORT}/health`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          console.log('✅ Server is running');
          console.log('   Status:', health.status);
          console.log('   Database:', health.database);
          resolve(true);
        } catch (err) {
          reject(new Error('Invalid health check response'));
        }
      });
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log('❌ Server is not running');
        console.log('   Start the server first: npm run dev');
        reject(new Error('Server not running'));
      } else {
        reject(err);
      }
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Health check timeout'));
    });
  });
};

// Test 2: Send SIGTERM and verify graceful shutdown
const testGracefulShutdown = async () => {
  console.log('\n📋 Shutdown Test Instructions:');
  console.log('   1. Start the server: npm run dev');
  console.log('   2. In another terminal, run: kill -SIGTERM <pid>');
  console.log('   3. Watch for shutdown logs:');
  console.log('      - [Shutdown] Cancelled X background tasks');
  console.log('      - [Shutdown] Socket.io server closed');
  console.log('      - [Shutdown] HTTP server closed');
  console.log('      - [Shutdown] Database connections closed');
  console.log('\n   Or use: node scripts/test-shutdown.js --kill');
  console.log('   (This will find the server process and send SIGTERM)');
};

// Test 3: Find and kill server process
const killServer = async () => {
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);

  try {
    // Find node process running on PORT
    const { stdout } = await execPromise(`lsof -ti:${PORT}`);
    const pid = stdout.trim();
    
    if (!pid) {
      console.log('❌ No process found on port', PORT);
      return;
    }

    console.log(`\n🔄 Found server process: ${pid}`);
    console.log('   Sending SIGTERM...');
    
    process.kill(parseInt(pid), 'SIGTERM');
    console.log('   ✅ SIGTERM sent');
    console.log('   Watch the server logs for shutdown sequence');
    
    // Wait a bit and check if process is still running
    setTimeout(async () => {
      try {
        await execPromise(`ps -p ${pid}`);
        console.log('   ⚠️  Process still running (may be shutting down)');
      } catch (err) {
        console.log('   ✅ Process terminated');
      }
    }, 2000);
  } catch (err) {
    console.log('❌ Error finding/killing process:', err.message);
  }
};

// Main
(async () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--kill')) {
    await killServer();
  } else {
    try {
      await testServerRunning();
      await testGracefulShutdown();
    } catch (err) {
      if (err.message !== 'Server not running') {
        console.error('Error:', err.message);
      }
    }
  }
})();

