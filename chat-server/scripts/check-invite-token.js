#!/usr/bin/env node

/**
 * Check Invite Token Utility
 * 
 * Diagnostic script to check the status of an invitation token
 * Usage: node scripts/check-invite-token.js <token>
 * 
 * Example: node scripts/check-invite-token.js 0f9e6e285123f2d8fde4bd608b135bfc5d5822ac8f0371379b8f28f6514d5e8a
 */

require('dotenv').config();
const crypto = require('crypto');
const db = require('../dbPostgres');

async function checkToken(token) {
  if (!token) {
    console.error('❌ Error: Token is required');
    console.log('\nUsage: node scripts/check-invite-token.js <token>');
    process.exit(1);
  }

  console.log('🔍 Checking invitation token...\n');
  console.log(`Token length: ${token.length} characters`);
  
  // Hash the token
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  console.log(`Token hash: ${tokenHash.substring(0, 16)}...${tokenHash.substring(tokenHash.length - 8)}\n`);

  try {
    // Query database
    const result = await db.query(
      `SELECT 
        ps.id,
        ps.status,
        ps.invite_type,
        ps.pairing_code,
        ps.parent_a_id,
        ps.parent_b_id,
        ps.parent_b_email,
        ps.created_at,
        ps.expires_at,
        ps.accepted_at,
        u.username as initiator_username,
        u.email as initiator_email,
        u.first_name as initiator_first_name,
        u.display_name as initiator_display_name,
        NOW() > ps.expires_at as is_expired,
        EXTRACT(EPOCH FROM (ps.expires_at - NOW())) / 3600 as hours_until_expiry
      FROM pairing_sessions ps
      JOIN users u ON ps.parent_a_id = u.id
      WHERE ps.invite_token = $1
      LIMIT 1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      console.log('❌ Token not found in database');
      console.log('\nPossible reasons:');
      console.log('  - Token was never created');
      console.log('  - Token was deleted');
      console.log('  - Token hash mismatch (check if token was copied correctly)');
      process.exit(1);
    }

    const pairing = result.rows[0];
    const now = new Date();
    const expiresAt = new Date(pairing.expires_at);
    const timeUntilExpiry = expiresAt - now;

    console.log('✅ Token found!\n');
    console.log('📋 Pairing Session Details:');
    console.log(`   ID: ${pairing.id}`);
    console.log(`   Status: ${pairing.status}`);
    console.log(`   Type: ${pairing.invite_type}`);
    console.log(`   Pairing Code: ${pairing.pairing_code || 'N/A'}`);
    console.log(`   Created: ${pairing.created_at}`);
    console.log(`   Expires: ${pairing.expires_at}`);
    console.log(`   Accepted: ${pairing.accepted_at || 'Not accepted'}`);
    console.log(`   Is Expired: ${pairing.is_expired ? 'Yes ❌' : 'No ✅'}`);
    
    if (timeUntilExpiry > 0) {
      const hours = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
      const minutes = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));
      console.log(`   Time Until Expiry: ${hours}h ${minutes}m`);
    } else {
      const hoursAgo = Math.floor(Math.abs(timeUntilExpiry) / (1000 * 60 * 60));
      console.log(`   Expired: ${hoursAgo} hours ago`);
    }

    console.log('\n👤 Initiator Details:');
    console.log(`   Username: ${pairing.initiator_username}`);
    console.log(`   Email: ${pairing.initiator_email}`);
    console.log(`   Name: ${pairing.initiator_first_name || pairing.initiator_display_name || 'N/A'}`);
    console.log(`   User ID: ${pairing.parent_a_id}`);

    if (pairing.parent_b_id) {
      console.log('\n👤 Acceptor Details:');
      console.log(`   User ID: ${pairing.parent_b_id}`);
    } else if (pairing.parent_b_email) {
      console.log('\n📧 Invitee Email:');
      console.log(`   ${pairing.parent_b_email}`);
    }

    console.log('\n🔍 Validation Result:');
    const isValid = pairing.status === 'pending' && !pairing.is_expired;
    if (isValid) {
      console.log('   ✅ Token is VALID and can be used');
    } else {
      console.log('   ❌ Token is INVALID');
      if (pairing.status !== 'pending') {
        console.log(`   Reason: Status is "${pairing.status}" (expected "pending")`);
      }
      if (pairing.is_expired) {
        console.log('   Reason: Token has expired');
      }
    }

    // Provide recommendations
    console.log('\n💡 Recommendations:');
    if (pairing.status === 'active') {
      console.log('   - This invitation has already been accepted');
      console.log('   - User should sign in to their account');
    } else if (pairing.status === 'expired' || pairing.is_expired) {
      console.log('   - Generate a new invitation');
      console.log('   - Check expiration settings');
    } else if (pairing.status === 'canceled') {
      console.log('   - This invitation was cancelled');
      console.log('   - Generate a new invitation if needed');
    } else if (isValid) {
      console.log('   - Token is ready to use');
      console.log('   - Check frontend routing and API endpoint');
    }

  } catch (error) {
    console.error('❌ Error checking token:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Get token from command line
const token = process.argv[2];

checkToken(token)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

