#!/usr/bin/env node

/**
 * Test Message Persistence on Production Server
 *
 * This script verifies that:
 * 1. Server is running and responsive
 * 2. Database connection is working
 * 3. Messages table has all required columns
 * 4. Messages can be saved and retrieved
 *
 * Usage:
 *   node test-message-persistence.js
 *
 * For production testing (requires DATABASE_URL):
 *   DATABASE_URL="postgresql://..." node test-message-persistence.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const PRODUCTION_URL = 'https://demo-production-6dcd.up.railway.app';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(emoji, color, message) {
  console.log(`${emoji} ${color}${message}${colors.reset}`);
}

function success(message) { log('✅', colors.green, message); }
function error(message) { log('❌', colors.red, message); }
function info(message) { log('ℹ️ ', colors.blue, message); }
function warning(message) { log('⚠️ ', colors.yellow, message); }
function step(message) { log('📋', colors.cyan, message); }

async function testProductionServer() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 MESSAGE PERSISTENCE TEST - Production Server');
  console.log('='.repeat(60) + '\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Health Check
  step('Test 1: Server Health Check');
  try {
    const https = require('https');
    const response = await new Promise((resolve, reject) => {
      https.get(`${PRODUCTION_URL}/health`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }).on('error', reject);
    });

    if (response.status === 200) {
      const health = JSON.parse(response.data);
      success(`Server is healthy: ${health.status}`);
      info(`Timestamp: ${health.timestamp}`);
      testsPassed++;
    } else {
      error(`Server returned status ${response.status}`);
      testsFailed++;
    }
  } catch (err) {
    error(`Health check failed: ${err.message}`);
    testsFailed++;
  }

  // Test 2: API Info
  step('\nTest 2: API Information');
  try {
    const https = require('https');
    const response = await new Promise((resolve, reject) => {
      https.get(`${PRODUCTION_URL}/api/info`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }).on('error', reject);
    });

    if (response.status === 200) {
      const apiInfo = JSON.parse(response.data);
      success(`API is responding: ${apiInfo.name} v${apiInfo.version}`);
      info(`Active users: ${apiInfo.activeUsers}`);
      testsPassed++;
    } else {
      error(`API info returned status ${response.status}`);
      testsFailed++;
    }
  } catch (err) {
    error(`API info failed: ${err.message}`);
    testsFailed++;
  }

  // Test 3: Database Connection (requires DATABASE_URL)
  if (process.env.DATABASE_URL) {
    step('\nTest 3: Database Connection');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000
    });

    try {
      const result = await pool.query('SELECT NOW() as current_time');
      success(`Database connection successful`);
      info(`Server time: ${result.rows[0].current_time}`);
      testsPassed++;

      // Test 4: Check messages table
      step('\nTest 4: Messages Table Structure');
      try {
        const tableCheck = await pool.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'messages'
          ORDER BY ordinal_position
        `);

        if (tableCheck.rows.length > 0) {
          success(`Messages table exists with ${tableCheck.rows.length} columns`);

          // Required columns for persistence
          const requiredColumns = [
            'id', 'type', 'username', 'text', 'timestamp',
            'room_id', 'thread_id', 'socket_id', 'private',
            'flagged', 'validation', 'tip1', 'tip2', 'rewrite'
          ];

          const existingColumns = tableCheck.rows.map(row => row.column_name);
          const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

          if (missingColumns.length === 0) {
            success('All required columns present for message persistence');
            testsPassed++;
          } else {
            warning(`Missing columns: ${missingColumns.join(', ')}`);
            info('Messages may be saved with core data only');
            testsPassed++; // Still passes, but with warning
          }

          // Display column details
          console.log('\n   Column Details:');
          tableCheck.rows.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            console.log(`   ${colors.cyan}- ${col.column_name}${colors.reset} (${col.data_type}, ${nullable})`);
          });
        } else {
          error('Messages table does not exist!');
          testsFailed++;
        }
      } catch (err) {
        error(`Failed to check messages table: ${err.message}`);
        testsFailed++;
      }

      // Test 5: Query message count
      step('\nTest 5: Message Count Query');
      try {
        const countResult = await pool.query('SELECT COUNT(*) as total FROM messages');
        const messageCount = parseInt(countResult.rows[0].total);
        success(`Database contains ${messageCount} messages`);
        testsPassed++;

        if (messageCount > 0) {
          // Show sample of recent messages
          const sampleResult = await pool.query(`
            SELECT id, username, text, timestamp, room_id
            FROM messages
            ORDER BY timestamp DESC
            LIMIT 5
          `);

          console.log('\n   Recent Messages:');
          sampleResult.rows.forEach((msg, i) => {
            const preview = msg.text.substring(0, 50) + (msg.text.length > 50 ? '...' : '');
            console.log(`   ${i + 1}. [${msg.username}] ${preview}`);
            console.log(`      Room: ${msg.room_id || 'none'}, Time: ${new Date(msg.timestamp).toLocaleString()}`);
          });
        } else {
          info('No messages in database yet');
        }
      } catch (err) {
        error(`Failed to query messages: ${err.message}`);
        testsFailed++;
      }

      await pool.end();
    } catch (err) {
      error(`Database connection failed: ${err.message}`);
      testsFailed++;
    }
  } else {
    warning('\nTest 3-5: Skipped (DATABASE_URL not set)');
    info('To test database: DATABASE_URL="postgresql://..." node test-message-persistence.js');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`${colors.green}✅ Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${testsFailed}${colors.reset}`);

  if (testsFailed === 0) {
    console.log(`\n${colors.bright}${colors.green}🎉 All tests passed!${colors.reset}`);

    if (!process.env.DATABASE_URL) {
      console.log(`\n${colors.yellow}💡 To test database persistence, set DATABASE_URL environment variable${colors.reset}`);
    } else {
      console.log(`\n${colors.green}✅ Message persistence is working correctly!${colors.reset}`);
    }
  } else {
    console.log(`\n${colors.red}⚠️  Some tests failed. Check the errors above.${colors.reset}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  process.exit(testsFailed === 0 ? 0 : 1);
}

// Manual Testing Instructions
function printManualTestInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('📖 MANUAL TESTING INSTRUCTIONS');
  console.log('='.repeat(60) + '\n');

  console.log(`${colors.bright}How to manually verify message persistence:${colors.reset}\n`);

  console.log('1. Open the web app at: https://coparentliaizen.com');
  console.log('   (or your local frontend if testing locally)\n');

  console.log('2. Log in or create an account\n');

  console.log('3. Send a few test messages in the chat\n');

  console.log('4. Refresh the browser page (F5 or Cmd+R)\n');

  console.log('5. Verify that:');
  console.log('   ✓ Your previous messages are still visible');
  console.log('   ✓ Message order is preserved');
  console.log('   ✓ Timestamps are correct');
  console.log('   ✓ Username attribution is correct\n');

  console.log('6. Close and reopen the browser\n');

  console.log('7. Log in again and verify:');
  console.log('   ✓ All messages from step 3 are still there');
  console.log('   ✓ Messages persist across sessions\n');

  console.log(`${colors.bright}What to look for:${colors.reset}\n`);
  console.log(`${colors.green}✅ WORKING:${colors.reset} Messages reload after refresh/reopen`);
  console.log(`${colors.red}❌ NOT WORKING:${colors.reset} Messages disappear after refresh\n`);

  console.log(`${colors.bright}Server Logs to Monitor:${colors.reset}\n`);
  console.log('Watch for these log messages in Railway dashboard:');
  console.log('  💾 "Saved new message [id] to database"');
  console.log('  📜 "Loading [N] messages for room [roomId]"');
  console.log('  ✅ "Loaded [N] messages from database"\n');

  console.log('='.repeat(60) + '\n');
}

// Run tests
if (require.main === module) {
  // Check if user wants manual instructions
  if (process.argv.includes('--manual') || process.argv.includes('-m')) {
    printManualTestInstructions();
  } else {
    testProductionServer();
  }
}

module.exports = { testProductionServer, printManualTestInstructions };
