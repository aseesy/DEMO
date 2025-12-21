/**
 * Count Users in Development and Production Databases
 *
 * This script counts users in both development and production databases.
 * Run with: node count-users.js
 */

const { Pool } = require('pg');

// Get database URLs from environment
const devDatabaseUrl = process.env.DATABASE_URL || process.env.DEV_DATABASE_URL;
const prodDatabaseUrl = process.env.PROD_DATABASE_URL || process.env.RAILWAY_DATABASE_URL;

async function countUsers(databaseUrl, label) {
  if (!databaseUrl) {
    console.log(`\n⚠️  ${label}: No database URL configured`);
    return null;
  }

  try {
    const pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5000,
    });

    // Count total users
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(totalResult.rows[0].count, 10);

    // Count users by authentication method
    const emailResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE password_hash IS NOT NULL AND password_hash != ''
    `);
    const emailUsers = parseInt(emailResult.rows[0].count, 10);

    const oauthResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE google_id IS NOT NULL AND google_id != ''
    `);
    const oauthUsers = parseInt(oauthResult.rows[0].count, 10);

    // Count users created in last 7 days
    const recentResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);
    const recentUsers = parseInt(recentResult.rows[0].count, 10);

    // Count active users (logged in within last 30 days)
    const activeResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE last_login > NOW() - INTERVAL '30 days'
    `);
    const activeUsers = parseInt(activeResult.rows[0].count, 10);

    await pool.end();

    return {
      total: totalUsers,
      email: emailUsers,
      oauth: oauthUsers,
      recent: recentUsers,
      active: activeUsers,
    };
  } catch (error) {
    console.error(`❌ Error querying ${label}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('📊 User Count Report\n');
  console.log('='.repeat(60));

  // Get current database URL (development)
  const currentDbUrl = process.env.DATABASE_URL;

  if (currentDbUrl) {
    console.log('\n🔍 Current Database (Development):');
    console.log(`   URL: ${currentDbUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password
    const devStats = await countUsers(currentDbUrl, 'Development');
    if (devStats) {
      console.log(`   ✅ Total Users: ${devStats.total}`);
      console.log(`   📧 Email/Password Users: ${devStats.email}`);
      console.log(`   🔐 OAuth Users: ${devStats.oauth}`);
      console.log(`   🆕 New Users (last 7 days): ${devStats.recent}`);
      console.log(`   🟢 Active Users (last 30 days): ${devStats.active}`);
    }
  } else {
    console.log('\n⚠️  Development: DATABASE_URL not set');
  }

  // Try to get production database URL
  if (prodDatabaseUrl) {
    console.log('\n🔍 Production Database:');
    console.log(`   URL: ${prodDatabaseUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password
    const prodStats = await countUsers(prodDatabaseUrl, 'Production');
    if (prodStats) {
      console.log(`   ✅ Total Users: ${prodStats.total}`);
      console.log(`   📧 Email/Password Users: ${prodStats.email}`);
      console.log(`   🔐 OAuth Users: ${prodStats.oauth}`);
      console.log(`   🆕 New Users (last 7 days): ${prodStats.recent}`);
      console.log(`   🟢 Active Users (last 30 days): ${prodStats.active}`);
    }
  } else {
    console.log('\n⚠️  Production: PROD_DATABASE_URL or RAILWAY_DATABASE_URL not set');
    console.log('   💡 To check production, set PROD_DATABASE_URL environment variable');
  }

  console.log('\n' + '='.repeat(60));
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
