#!/usr/bin/env node
/**
 * Check for athena-yashir relationship in production
 * 
 * This script checks both PostgreSQL (if production DATABASE_URL is available)
 * and Neo4j for the relationship between athenasees@gmail.com and yashir91lora@gmail.com
 */

require('dotenv').config();
const { Pool } = require('pg');
const neo4j = require('neo4j-driver');

// Check if we have production database access
const PROD_DATABASE_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USER;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

console.log('\n🔍 Checking for athena-yashir relationship...\n');

async function checkPostgreSQL() {
  if (!PROD_DATABASE_URL) {
    console.log('⚠️  No DATABASE_URL found - cannot check PostgreSQL');
    return null;
  }

  const pool = new Pool({
    connectionString: PROD_DATABASE_URL,
  });

  try {
    console.log('📊 Checking PostgreSQL...');
    
    // Find athena user
    const athenaResult = await pool.query(
      "SELECT id, username, email FROM users WHERE email = 'athenasees@gmail.com'"
    );
    
    // Find yashir user
    const yashirResult = await pool.query(
      "SELECT id, username, email FROM users WHERE email = 'yashir91lora@gmail.com'"
    );
    
    if (athenaResult.rows.length === 0) {
      console.log('   ❌ athenasees@gmail.com not found in PostgreSQL');
      await pool.end();
      return null;
    }
    
    if (yashirResult.rows.length === 0) {
      console.log('   ❌ yashir91lora@gmail.com not found in PostgreSQL');
      await pool.end();
      return null;
    }
    
    const athena = athenaResult.rows[0];
    const yashir = yashirResult.rows[0];
    
    console.log(`   ✅ Found athena: ID ${athena.id}, username: ${athena.username}`);
    console.log(`   ✅ Found yashir: ID ${yashir.id}, username: ${yashir.username}`);
    
    // Check for co-parent room
    const roomResult = await pool.query(
      `SELECT r.*, 
              array_agg(DISTINCT rm.user_id) as member_ids,
              array_agg(DISTINCT u.username) as usernames
       FROM rooms r
       JOIN room_members rm ON r.id = rm.room_id
       JOIN users u ON rm.user_id = u.id
       WHERE rm.user_id IN ($1, $2)
       GROUP BY r.id
       HAVING COUNT(DISTINCT rm.user_id) = 2`,
      [athena.id, yashir.id]
    );
    
    if (roomResult.rows.length === 0) {
      console.log('   ❌ No co-parent room found in PostgreSQL');
      await pool.end();
      return { athena, yashir, room: null };
    }
    
    const room = roomResult.rows[0];
    console.log(`   ✅ Co-parent room found: ${room.name || room.id}`);
    console.log(`      Room ID: ${room.id}`);
    console.log(`      Created: ${room.created_at}`);
    
    await pool.end();
    return { athena, yashir, room };
    
  } catch (error) {
    console.error('   ❌ Error checking PostgreSQL:', error.message);
    await pool.end();
    return null;
  }
}

async function checkNeo4j() {
  if (!NEO4J_URI || !NEO4J_PASSWORD) {
    console.log('⚠️  Neo4j not configured - cannot check Neo4j');
    return null;
  }

  const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
    { disableLosslessIntegers: true }
  );

  const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' });

  try {
    console.log('\n📊 Checking Neo4j...');
    
    // Get all users to find athena and yashir by username
    const allUsers = await session.run(`
      MATCH (u:User)
      RETURN u.userId as userId, u.username as username
      ORDER BY u.userId
    `);
    
    const athenaUser = allUsers.records.find(r => {
      const username = r.get('username')?.toLowerCase() || '';
      return username.includes('athena') || username.includes('athenasees');
    });
    
    const yashirUser = allUsers.records.find(r => {
      const username = r.get('username')?.toLowerCase() || '';
      return username.includes('yashir') || username.includes('yashir91');
    });
    
    if (!athenaUser) {
      console.log('   ❌ Athena user not found in Neo4j');
    } else {
      console.log(`   ✅ Found athena in Neo4j: User ID ${athenaUser.get('userId')}, username: ${athenaUser.get('username')}`);
    }
    
    if (!yashirUser) {
      console.log('   ❌ Yashir user not found in Neo4j');
    } else {
      console.log(`   ✅ Found yashir in Neo4j: User ID ${yashirUser.get('userId')}, username: ${yashirUser.get('username')}`);
    }
    
    if (!athenaUser || !yashirUser) {
      await session.close();
      await driver.close();
      return null;
    }
    
    // Check for relationship
    const relResult = await session.run(`
      MATCH (u1:User)-[r:CO_PARENT]-(u2:User)
      WHERE (u1.userId = $userId1 AND u2.userId = $userId2)
         OR (u1.userId = $userId2 AND u2.userId = $userId1)
      RETURN u1.userId as userId1, u1.username as username1,
             u2.userId as userId2, u2.username as username2,
             r.roomId as roomId, r.createdAt as createdAt
    `, {
      userId1: neo4j.int(athenaUser.get('userId')),
      userId2: neo4j.int(yashirUser.get('userId'))
    });
    
    if (relResult.records.length === 0) {
      console.log('   ❌ No co-parent relationship found in Neo4j');
      await session.close();
      await driver.close();
      return { athena: athenaUser, yashir: yashirUser, relationship: null };
    }
    
    const rel = relResult.records[0];
    console.log(`   ✅ Co-parent relationship found in Neo4j:`);
    console.log(`      ${rel.get('username1')} <-> ${rel.get('username2')}`);
    console.log(`      Room ID: ${rel.get('roomId')}`);
    
    await session.close();
    await driver.close();
    return { athena: athenaUser, yashir: yashirUser, relationship: rel };
    
  } catch (error) {
    console.error('   ❌ Error checking Neo4j:', error.message);
    await session.close();
    await driver.close();
    return null;
  }
}

async function main() {
  const pgResult = await checkPostgreSQL();
  const neo4jResult = await checkNeo4j();
  
  console.log('\n📋 Summary:');
  console.log('================================');
  
  if (pgResult) {
    if (pgResult.room) {
      console.log('✅ PostgreSQL: Co-parent room EXISTS');
    } else {
      console.log('❌ PostgreSQL: Co-parent room NOT FOUND');
      console.log(`   Athena ID: ${pgResult.athena.id}, Yashir ID: ${pgResult.yashir.id}`);
    }
  } else {
    console.log('⚠️  PostgreSQL: Could not check (users not found or connection failed)');
  }
  
  if (neo4jResult) {
    if (neo4jResult.relationship) {
      console.log('✅ Neo4j: Co-parent relationship EXISTS');
    } else {
      console.log('❌ Neo4j: Co-parent relationship NOT FOUND');
      console.log(`   Athena User ID: ${neo4jResult.athena.get('userId')}, Yashir User ID: ${neo4jResult.yashir.get('userId')}`);
    }
  } else {
    console.log('⚠️  Neo4j: Could not check (users not found or connection failed)');
  }
  
  console.log('\n');
}

main().catch(console.error);

