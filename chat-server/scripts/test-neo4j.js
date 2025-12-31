#!/usr/bin/env node
/**
 * Test Neo4j Connection and Instance
 *
 * Tests connection, shows server info, database stats, and provides
 * helpful error messages if connection fails.
 *
 * Usage:
 *   node scripts/test-neo4j.js           - Full test
 *   node scripts/test-neo4j.js --quick   - Quick connection test only
 */

require('dotenv').config();
const neo4j = require('neo4j-driver');

const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

const quickMode = process.argv.includes('--quick');

console.log('\nNeo4j Connection Test\n' + '='.repeat(40));

// Check configuration
if (!NEO4J_URI) {
  console.error('NEO4J_URI is not set in .env');
  process.exit(1);
}

if (!NEO4J_PASSWORD) {
  console.error('NEO4J_PASSWORD is not set in .env');
  process.exit(1);
}

console.log('\nConfiguration:');
console.log(`  URI: ${NEO4J_URI}`);
console.log(`  User: ${NEO4J_USER}`);
console.log(`  Database: ${NEO4J_DATABASE}`);
console.log(`  Password: ${NEO4J_PASSWORD.length} characters`);

// Check for password issues
const passwordIssues = [];
if (NEO4J_PASSWORD.startsWith(' ')) passwordIssues.push('has leading space');
if (NEO4J_PASSWORD.endsWith(' ')) passwordIssues.push('has trailing space');
if (NEO4J_PASSWORD.includes('\n')) passwordIssues.push('contains newline');

if (passwordIssues.length > 0) {
  console.log(`  Password issues: ${passwordIssues.join(', ')}`);
}

// Connect
const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD.trim()),
  {
    maxConnectionLifetime: 3 * 60 * 60 * 1000,
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 2 * 60 * 1000,
    disableLosslessIntegers: true,
  }
);

const session = driver.session({ database: NEO4J_DATABASE });

async function runTest() {
  try {
    // Basic connection test
    console.log('\nTesting connection...');
    await session.run('RETURN 1 as test');
    console.log('Connection: OK');

    // Server info
    const serverInfo = await session.run(
      'CALL dbms.components() YIELD name, versions, edition RETURN name, versions[0] as version, edition'
    );
    if (serverInfo.records.length > 0) {
      const r = serverInfo.records[0];
      console.log(`Server: ${r.get('name')} ${r.get('version')} (${r.get('edition')})`);
    }

    if (quickMode) {
      console.log('\nQuick test complete');
      return;
    }

    // Database info (may not be available in all versions)
    try {
      const dbInfo = await session.run(
        'CALL db.info() YIELD id, name, currentStatus RETURN id, name, currentStatus'
      );
      if (dbInfo.records.length > 0) {
        const r = dbInfo.records[0];
        console.log(`\nDatabase: ${r.get('name')} (${r.get('currentStatus')})`);
        console.log(`  ID: ${r.get('id')}`);
      }
    } catch (err) {
      // Ignore - not available in all versions
    }

    // Data stats
    console.log('\nData Statistics:');

    const userCount = await session.run('MATCH (u:User) RETURN count(u) as count');
    console.log(`  Users: ${userCount.records[0].get('count')}`);

    const relCount = await session.run('MATCH ()-[r:CO_PARENT]->() RETURN count(r) as count');
    console.log(`  Co-Parent relationships: ${relCount.records[0].get('count')}`);

    const threadCount = await session.run('MATCH (t:Thread) RETURN count(t) as count');
    console.log(`  Threads: ${threadCount.records[0].get('count')}`);

    console.log('\nTest complete');
  } catch (error) {
    console.error(`\nConnection failed: ${error.message}`);

    if (error.message.includes('authentication')) {
      console.error('\nAuthentication failed. Check:');
      console.error('  1. NEO4J_PASSWORD in .env');
      console.error('  2. No extra spaces in password');
      console.error('  3. Correct username (default: neo4j)');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\nConnection refused. Check:');
      console.error('  1. Neo4j server is running');
      console.error('  2. Correct port in NEO4J_URI');
    } else if (error.message.includes('timeout')) {
      console.error('\nConnection timeout. Check:');
      console.error('  1. Network connectivity');
      console.error('  2. Server availability');
    }

    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

runTest();
