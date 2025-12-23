#!/usr/bin/env node
/**
 * Check which Neo4j instance we're connecting to
 * 
 * This script helps identify the Neo4j instance ID and connection details
 */

require('dotenv').config();
const neo4j = require('neo4j-driver');

const NEO4J_URI = process.env.NEO4J_URI || 'neo4j://127.0.0.1:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

console.log('\n🔍 Checking Neo4j Instance Connection...\n');
console.log('Configuration:');
console.log(`  URI: ${NEO4J_URI}`);
console.log(`  User: ${NEO4J_USER}`);
console.log(`  Database: ${NEO4J_DATABASE}`);
console.log(`  Password: ${NEO4J_PASSWORD ? NEO4J_PASSWORD.length + ' characters' : 'NOT SET'}\n`);

if (!NEO4J_PASSWORD) {
  console.error('❌ NEO4J_PASSWORD not set in .env');
  process.exit(1);
}

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  {
    disableLosslessIntegers: true,
  }
);

const session = driver.session({ database: NEO4J_DATABASE });

async function checkInstance() {
  try {
    // Get server info
    const serverInfo = await session.run('CALL dbms.components() YIELD name, versions, edition RETURN name, versions[0] as version, edition');
    
    if (serverInfo.records.length > 0) {
      const record = serverInfo.records[0];
      console.log('✅ Connected to Neo4j:');
      console.log(`   Name: ${record.get('name')}`);
      console.log(`   Version: ${record.get('version')}`);
      console.log(`   Edition: ${record.get('edition')}`);
    }

    // Try to get database ID (if available)
    try {
      const dbInfo = await session.run('CALL db.info() YIELD id, name, currentStatus RETURN id, name, currentStatus');
      if (dbInfo.records.length > 0) {
        const record = dbInfo.records[0];
        console.log(`\n📊 Database Info:`);
        console.log(`   ID: ${record.get('id')}`);
        console.log(`   Name: ${record.get('name')}`);
        console.log(`   Status: ${record.get('currentStatus')}`);
      }
    } catch (err) {
      // db.info() might not be available in all versions
      console.log('\n📊 Database Info: Not available (version limitation)');
    }

    // Get connection details
    const connectionInfo = await session.run('RETURN 1 as test');
    console.log(`\n🔗 Connection Status: Active`);
    console.log(`   URI: ${NEO4J_URI}`);
    console.log(`   Database: ${NEO4J_DATABASE}`);

    // Check for user nodes
    const userCount = await session.run('MATCH (u:User) RETURN count(u) as count');
    if (userCount.records.length > 0) {
      console.log(`\n👥 User Nodes: ${userCount.records[0].get('count')}`);
    }

    // Check for relationships
    const relCount = await session.run('MATCH ()-[r:CO_PARENT]->() RETURN count(r) as count');
    if (relCount.records.length > 0) {
      console.log(`   Co-Parent Relationships: ${relCount.records[0].get('count')}`);
    }

    console.log('\n✅ Instance check complete\n');

  } catch (error) {
    console.error('\n❌ Failed to check instance:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication failed. The password might be incorrect.');
    }
  } finally {
    await session.close();
    await driver.close();
  }
}

checkInstance();

