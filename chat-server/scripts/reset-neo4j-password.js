#!/usr/bin/env node
/**
 * Reset Neo4j Password
 * 
 * Helps reset the Neo4j password by connecting via HTTP API
 * and changing the password.
 * 
 * Usage:
 *   node scripts/reset-neo4j-password.js <new-password>
 * 
 * Example:
 *   node scripts/reset-neo4j-password.js "newpassword123"
 * 
 * Note: This requires knowing the current password or having
 * access to Neo4j Desktop to reset it there.
 */

require('dotenv').config();

const http = require('http');

const NEO4J_URI = process.env.NEO4J_URI || 'http://localhost:7474';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const currentPassword = process.env.NEO4J_PASSWORD;
const newPassword = process.argv[2];

if (!newPassword) {
  console.error('Usage: node scripts/reset-neo4j-password.js <new-password>');
  console.error('Example: node scripts/reset-neo4j-password.js "newpassword123"');
  process.exit(1);
}

console.log('\n🔐 Resetting Neo4j Password...\n');
console.log('Current config:');
console.log(`  URI: ${NEO4J_URI}`);
console.log(`  User: ${NEO4J_USER}`);
console.log(`  Current password: ${currentPassword ? currentPassword.length + ' chars' : 'NOT SET'}`);
console.log(`  New password: ${newPassword.length} chars\n`);

// Extract host and port from URI
const uriMatch = NEO4J_URI.match(/^(?:neo4j\+?s?:\/\/)?([^:]+):?(\d+)?/);
const host = uriMatch ? uriMatch[1] : 'localhost';
const port = uriMatch ? (uriMatch[2] || '7474') : '7474';

console.log(`Attempting to connect to Neo4j at ${host}:${port}...`);

// Try to reset password via HTTP API
// Note: This requires the current password to be correct
// If current password is wrong, use Neo4j Desktop instead

const auth = Buffer.from(`${NEO4J_USER}:${currentPassword}`).toString('base64');

const options = {
  hostname: host,
  port: port,
  path: '/user/neo4j/password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`,
  },
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Password reset successful!');
      console.log('\n💡 Next steps:');
      console.log(`   1. Update .env file:`);
      console.log(`      NEO4J_PASSWORD=${newPassword}`);
      console.log(`   2. Restart the server`);
      console.log(`   3. Test connection: node scripts/test-neo4j-connection.js`);
    } else {
      console.error(`❌ Password reset failed (Status: ${res.statusCode})`);
      console.error(`   Response: ${data}`);
      console.error('\n💡 If this fails, use Neo4j Desktop to reset the password:');
      console.error('   1. Open Neo4j Desktop');
      console.error('   2. Right-click your database');
      console.error('   3. Select "Reset Password" or "Change Password"');
      console.error('   4. Set password to:', newPassword);
      console.error('   5. Update .env with the new password');
    }
  });
});

req.on('error', error => {
  console.error('❌ Connection error:', error.message);
  console.error('\n💡 Alternative: Reset password via Neo4j Desktop');
  console.error('   1. Open Neo4j Desktop');
  console.error('   2. Right-click your database → "Reset Password"');
  console.error('   3. Set new password');
  console.error('   4. Update .env file');
});

req.write(JSON.stringify({ password: newPassword }));
req.end();

