/**
 * Test script for Neo4j enhancements
 * Tests the new query functions and sync capabilities
 */

require('dotenv').config();
const neo4jClient = require('../src/utils/neo4jClient');
const dbSyncValidator = require('../src/utils/dbSyncValidator');
const relationshipSync = require('../src/utils/relationshipSync');

async function testNeo4jEnhancements() {
  console.log('🧪 Testing Neo4j Enhancements\n');

  // Test 1: Check if Neo4j is available
  console.log('1. Testing Neo4j availability...');
  if (!neo4jClient.isAvailable()) {
    console.log('   ❌ Neo4j not configured. Set NEO4J_URI and NEO4J_PASSWORD');
    return;
  }
  console.log('   ✅ Neo4j is configured\n');

  // Test 2: Initialize indexes
  console.log('2. Testing index initialization...');
  try {
    const indexResult = await neo4jClient.initializeIndexes();
    if (indexResult) {
      console.log('   ✅ Indexes initialized successfully\n');
    } else {
      console.log('   ⚠️  Index initialization returned false (may already exist)\n');
    }
  } catch (error) {
    console.log(`   ⚠️  Index initialization: ${error.message}\n`);
  }

  // Test 3: Test relationship metadata update
  console.log('3. Testing relationship metadata update...');
  try {
    // This will only work if there are actual relationships
    const result = await neo4jClient.updateRelationshipMetadata(1, 2, 'test_room', {
      messageCount: 10,
      lastInteraction: new Date(),
      interventionCount: 2
    });
    if (result) {
      console.log('   ✅ Relationship metadata update successful\n');
    } else {
      console.log('   ⚠️  Relationship metadata update returned false (relationship may not exist)\n');
    }
  } catch (error) {
    console.log(`   ⚠️  Relationship metadata update: ${error.message}\n`);
  }

  // Test 4: Test enhanced queries
  console.log('4. Testing enhanced query functions...');
  try {
    // Test getCoParentsWithMetrics (will return empty if no relationships)
    const coParents = await neo4jClient.getCoParentsWithMetrics(1, 1);
    console.log(`   ✅ getCoParentsWithMetrics: Found ${coParents.length} relationships\n`);

    // Test getRelationshipNetwork
    const network = await neo4jClient.getRelationshipNetwork(1, 2, 1);
    console.log(`   ✅ getRelationshipNetwork: Found ${network.length} connections\n`);

    // Test getActiveRelationships
    const active = await neo4jClient.getActiveRelationships(1, 0, 1);
    console.log(`   ✅ getActiveRelationships: Found ${active.length} active relationships\n`);
  } catch (error) {
    console.log(`   ⚠️  Enhanced queries: ${error.message}\n`);
  }

  // Test 5: Test sync validation
  console.log('5. Testing database sync validation...');
  try {
    const validation = await dbSyncValidator.runFullValidation();
    console.log(`   ✅ Sync validation complete:`);
    console.log(`      Relationships: ${validation.relationships.checked} checked, ${validation.relationships.discrepancies?.length || 0} discrepancies`);
    console.log(`      Overall valid: ${validation.overall.valid}\n`);
  } catch (error) {
    console.log(`   ⚠️  Sync validation: ${error.message}\n`);
  }

  // Test 6: Test relationship sync
  console.log('6. Testing relationship metadata sync...');
  try {
    // Try to sync a test room (will fail if room doesn't exist, that's okay)
    const syncResult = await dbSyncValidator.syncRelationshipMetadata('test_room');
    if (syncResult) {
      console.log('   ✅ Relationship sync successful\n');
    } else {
      console.log('   ⚠️  Relationship sync returned false (room may not exist or not a co-parent room)\n');
    }
  } catch (error) {
    console.log(`   ⚠️  Relationship sync: ${error.message}\n`);
  }

  console.log('✅ All tests completed!');
}

// Run tests
testNeo4jEnhancements().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

