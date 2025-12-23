#!/usr/bin/env node
/**
 * Test Neo4j Connection
 * 
 * Tests the Neo4j connection with current credentials and provides
 * helpful error messages if connection fails.
 * 
 * Usage:
 *   node scripts/test-neo4j-connection.js
 */

require('dotenv').config();
const neo4j = require('neo4j-driver');

const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

console.log('\n🔍 Testing Neo4j Connection...\n');

// Check configuration
if (!NEO4J_URI) {
  console.error('❌ NEO4J_URI is not set in .env');
  process.exit(1);
}

if (!NEO4J_PASSWORD) {
  console.error('❌ NEO4J_PASSWORD is not set in .env');
  process.exit(1);
}

console.log('Configuration:');
console.log(`  URI: ${NEO4J_URI}`);
console.log(`  User: ${NEO4J_USER}`);
console.log(`  Database: ${NEO4J_DATABASE}`);
console.log(`  Password: ${NEO4J_PASSWORD.length} characters`);
console.log('');

// Check for common issues
const passwordIssues = [];
if (NEO4J_PASSWORD.startsWith(' ')) {
  passwordIssues.push('⚠️  Password has leading space');
}
if (NEO4J_PASSWORD.endsWith(' ')) {
  passwordIssues.push('⚠️  Password has trailing space');
}
if (NEO4J_PASSWORD.includes('\n')) {
  passwordIssues.push('⚠️  Password contains newline character');
}
if (NEO4J_PASSWORD.includes('\r')) {
  passwordIssues.push('⚠️  Password contains carriage return');
}

if (passwordIssues.length > 0) {
  console.log('Password Issues:');
  passwordIssues.forEach(issue => console.log(`  ${issue}`));
  console.log('');
}

// Test connection
console.log('Attempting connection...');
const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD.trim()), // Trim password to remove whitespace
  {
    maxConnectionLifetime: 3 * 60 * 60 * 1000,
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 2 * 60 * 1000,
    disableLosslessIntegers: true,
  }
);

const session = driver.session({ database: NEO4J_DATABASE });

session
  .run('RETURN 1 as test')
  .then(result => {
    console.log('✅ Neo4j connection successful!');
    console.log(`   Test query returned: ${result.records[0].get('test')}`);
    
    // Try to get server info
    return session.run('CALL dbms.components() YIELD name, versions, edition RETURN name, versions[0] as version, edition');
  })
  .then(result => {
    if (result.records.length > 0) {
      const record = result.records[0];
      console.log(`   Server: ${record.get('name')} ${record.get('version')} (${record.get('edition')})`);
    }
    
    session.close();
    driver.close();
    console.log('\n✅ Connection test complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Neo4j connection failed!');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication failed. Possible causes:');
      console.error('   1. Wrong password in .env file');
      console.error('   2. Password has extra spaces (check .env file)');
      console.error('   3. Neo4j password was changed but .env not updated');
      console.error('   4. Wrong username (default should be "neo4j")');
      console.error('\n   To fix:');
      console.error('   1. Check Neo4j Desktop or server for correct password');
      console.error('   2. Update NEO4J_PASSWORD in .env file');
      console.error('   3. Make sure there are no spaces around the password');
      console.error('   4. Restart the server after updating .env');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Connection refused. Possible causes:');
      console.error('   1. Neo4j server is not running');
      console.error('   2. Wrong port in NEO4J_URI');
      console.error('   3. Firewall blocking connection');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Connection timeout. Possible causes:');
      console.error('   1. Neo4j server is slow to respond');
      console.error('   2. Network issues');
      console.error('   3. Server is overloaded');
    }
    
    session.close();
    driver.close();
    process.exit(1);
  });

