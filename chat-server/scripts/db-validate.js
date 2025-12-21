#!/usr/bin/env node
/**
 * Database Schema Validation Script
 *
 * Validates that PostgreSQL schema matches expected structure.
 * Catches schema drift before it causes production issues.
 *
 * Usage: npm run db:validate
 */

const db = require('../dbPostgres');
const fs = require('fs');
const path = require('path');

// Expected tables and their required columns
const EXPECTED_SCHEMA = {
  users: ['id', 'username', 'email', 'password_hash', 'created_at'],
  messages: ['id', 'room_id', 'username', 'text', 'timestamp', 'created_at'],
  rooms: ['id', 'name', 'created_at'],
  user_context: ['user_id', 'co_parent', 'children', 'contacts', 'updated_at'],
  invitations: ['id', 'inviter_id', 'invitee_email', 'code', 'status', 'created_at'],
  notifications: ['id', 'user_id', 'type', 'message', 'read', 'created_at'],
};

async function validateSchema() {
  console.log('🔍 Validating database schema...\n');

  try {
    // Test connection
    await db.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Get all tables
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log(`📊 Found ${existingTables.length} tables in database\n`);

    // Check each expected table
    const missingTables = [];
    const invalidTables = [];
    const validTables = [];

    for (const [tableName, requiredColumns] of Object.entries(EXPECTED_SCHEMA)) {
      if (!existingTables.includes(tableName)) {
        missingTables.push(tableName);
        continue;
      }

      // Get columns for this table
      const columnsResult = await db.query(
        `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position
      `,
        [tableName]
      );

      const existingColumns = columnsResult.rows.map(row => row.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        invalidTables.push({
          table: tableName,
          missingColumns,
          existingColumns,
        });
      } else {
        validTables.push(tableName);
      }
    }

    // Report results
    console.log('📋 Validation Results:\n');

    if (validTables.length > 0) {
      console.log('✅ Valid tables:');
      validTables.forEach(table => console.log(`   - ${table}`));
      console.log('');
    }

    if (missingTables.length > 0) {
      console.log('❌ Missing tables:');
      missingTables.forEach(table => console.log(`   - ${table}`));
      console.log('');
    }

    if (invalidTables.length > 0) {
      console.log('⚠️  Tables with missing columns:');
      invalidTables.forEach(({ table, missingColumns }) => {
        console.log(`   - ${table}:`);
        missingColumns.forEach(col => console.log(`     Missing: ${col}`));
      });
      console.log('');
    }

    // Check for unexpected tables (warn only)
    const unexpectedTables = existingTables.filter(
      table => !Object.keys(EXPECTED_SCHEMA).includes(table)
    );
    if (unexpectedTables.length > 0) {
      console.log('ℹ️  Additional tables (not validated):');
      unexpectedTables.forEach(table => console.log(`   - ${table}`));
      console.log('');
    }

    // Final status
    const hasErrors = missingTables.length > 0 || invalidTables.length > 0;

    if (hasErrors) {
      console.log('❌ Schema validation FAILED');
      console.log('\n💡 Run migrations to fix schema issues:');
      console.log('   npm run migrate');
      process.exit(1);
    } else {
      console.log('✅ Schema validation PASSED');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Schema validation error:', error.message);
    console.error('\n💡 Check your DATABASE_URL environment variable');
    process.exit(1);
  }
}

// Run validation
validateSchema();
