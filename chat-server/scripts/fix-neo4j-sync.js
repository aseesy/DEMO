#!/usr/bin/env node
/**
 * Fix Neo4j Sync Script
 *
 * Validates and fixes discrepancies between PostgreSQL and Neo4j databases.
 * Run with: node scripts/fix-neo4j-sync.js
 *
 * Or on Railway: railway run node scripts/fix-neo4j-sync.js
 */

require('dotenv').config();

const { runFullValidation } = require('../src/services/sync/dbSyncValidator');

async function main() {
  console.log('='.repeat(60));
  console.log('Neo4j Sync Fixer');
  console.log('='.repeat(60));
  console.log('');
  console.log('This script will:');
  console.log('1. Validate PostgreSQL <-> Neo4j sync');
  console.log('2. Automatically fix missing relationships');
  console.log('3. Re-validate to confirm fixes');
  console.log('');

  try {
    // Run validation with auto-fix enabled
    const results = await runFullValidation(true);

    console.log('');
    console.log('='.repeat(60));
    console.log('Results Summary');
    console.log('='.repeat(60));
    console.log('');
    console.log(`Timestamp: ${results.timestamp}`);
    console.log(`Overall Valid: ${results.overall.valid ? '✅ Yes' : '❌ No'}`);
    console.log('');

    console.log('Relationships:');
    console.log(`  - Checked: ${results.relationships.checked || 0}`);
    console.log(`  - Valid: ${results.relationships.valid ? '✅ Yes' : '❌ No'}`);
    console.log(`  - Discrepancies: ${results.relationships.discrepancies?.length || 0}`);

    if (results.relationships.discrepancies?.length > 0) {
      console.log('  - Details:');
      for (const d of results.relationships.discrepancies) {
        console.log(`    • ${d.type}: Room ${d.roomId} (Users: ${d.userId1} <-> ${d.userId2})`);
      }
    }
    console.log('');

    console.log('Users:');
    console.log(`  - Checked: ${results.users.checked || 0}`);
    console.log(`  - Valid: ${results.users.valid ? '✅ Yes' : '❌ No'}`);
    console.log(`  - Missing in Neo4j: ${results.users.missingUsers?.length || 0}`);

    if (results.users.missingUsers?.length > 0) {
      console.log('  - Missing Users:');
      for (const u of results.users.missingUsers.slice(0, 10)) {
        console.log(`    • User ID ${u.id}: ${u.username || u.email}`);
      }
      if (results.users.missingUsers.length > 10) {
        console.log(`    ... and ${results.users.missingUsers.length - 10} more`);
      }
    }
    console.log('');

    if (results.fixResults) {
      console.log('Fix Results:');
      console.log(`  - Total: ${results.fixResults.total}`);
      console.log(`  - Fixed: ${results.fixResults.fixed}`);
      console.log(`  - Errors: ${results.fixResults.errors}`);
      console.log('');
    }

    console.log('='.repeat(60));

    if (results.overall.valid) {
      console.log('✅ All databases are now in sync!');
    } else {
      console.log('⚠️  Some issues remain - manual intervention may be needed');
    }

    process.exit(results.overall.valid ? 0 : 1);
  } catch (error) {
    console.error('');
    console.error('❌ Script failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
