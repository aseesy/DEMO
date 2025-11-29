#!/usr/bin/env node

/**
 * Test PostgreSQL Connection Script
 * Run this to verify your local PostgreSQL connection
 */

require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

console.log('🔍 Testing PostgreSQL Connection...\n');

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  console.error('\n💡 To set it up:');
  console.error('   1. Create a .env file in chat-server/ directory');
  console.error('   2. Add: DATABASE_URL=postgresql://user:password@localhost:5432/dbname');
  console.error('\n💡 PostgreSQL is required in all environments (development and production)');
  process.exit(1);
}

console.log('📋 Connection String:');
console.log(`   ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`); // Hide password
console.log('');

// Parse connection string
let parsed;
try {
  const url = new URL(DATABASE_URL);
  parsed = {
    host: url.hostname,
    port: url.port || 5432,
    database: url.pathname.slice(1), // Remove leading /
    user: url.username,
    password: url.password ? '***' : 'none'
  };
  console.log('📊 Parsed Connection Details:');
  console.log(`   Host: ${parsed.host}`);
  console.log(`   Port: ${parsed.port}`);
  console.log(`   Database: ${parsed.database}`);
  console.log(`   User: ${parsed.user}`);
  console.log(`   Password: ${parsed.password}`);
  console.log('');
} catch (err) {
  console.error('❌ Invalid DATABASE_URL format!');
  console.error('   Expected: postgresql://user:password@host:port/database');
  console.error(`   Error: ${err.message}`);
  process.exit(1);
}

// Test connection
const pool = new Pool({
  connectionString: DATABASE_URL,
  connectionTimeoutMillis: 5000
});

console.log('🔄 Attempting to connect...');

pool.query('SELECT NOW() as current_time, version() as pg_version')
  .then(result => {
    console.log('✅ Connection successful!');
    console.log('');
    console.log('📊 Database Info:');
    console.log(`   Current Time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL Version: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
    console.log('');
    
    // Test if tables exist
    return pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
  })
  .then(result => {
    if (result.rows.length > 0) {
      console.log('📋 Existing Tables:');
      result.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('📋 No tables found (database is empty)');
      console.log('💡 Run migration: node run-migration.js');
    }
    console.log('');
    console.log('✅ All tests passed!');
    pool.end();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed!');
    console.error('');
    console.error('🔍 Error Details:');
    console.error(`   Message: ${err.message}`);
    console.error(`   Code: ${err.code || 'N/A'}`);
    console.error('');
    
    // Provide helpful error messages
    if (err.code === 'ECONNREFUSED') {
      console.error('💡 Troubleshooting:');
      console.error('   1. Is PostgreSQL running?');
      console.error('      macOS: brew services start postgresql');
      console.error('      Linux: sudo systemctl start postgresql');
      console.error('      Docker: docker ps (check if container is running)');
      console.error('');
      console.error(`   2. Is PostgreSQL listening on ${parsed.host}:${parsed.port}?`);
      console.error('      Check: netstat -an | grep 5432');
      console.error('');
      console.error('   3. Check PostgreSQL logs for errors');
    } else if (err.code === '28P01') {
      console.error('💡 Authentication failed!');
      console.error('   1. Check username and password in DATABASE_URL');
      console.error('   2. Verify PostgreSQL user exists');
      console.error('   3. Check pg_hba.conf for authentication settings');
    } else if (err.code === '3D000') {
      console.error('💡 Database does not exist!');
      console.error(`   Create it: createdb ${parsed.database}`);
      console.error(`   Or use: psql -c "CREATE DATABASE ${parsed.database};"`);
    } else {
      console.error('💡 Common fixes:');
      console.error('   1. Verify DATABASE_URL format is correct');
      console.error('   2. Ensure PostgreSQL is running');
      console.error('   3. Check firewall/network settings');
      console.error('   4. Verify database exists');
    }
    
    pool.end();
    process.exit(1);
  });











