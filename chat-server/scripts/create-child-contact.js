#!/usr/bin/env node
/**
 * Create Child Contact Manually
 * 
 * Manually creates a child contact for a user (useful for fixing production issues).
 * 
 * Usage:
 *   node scripts/create-child-contact.js <username> <childName> [relationship]
 * 
 * Example:
 *   node scripts/create-child-contact.js mom1@test.com "Vira" "my child"
 */

require('dotenv').config();
const dbPostgres = require('../dbPostgres');
const dbSafe = require('../dbSafe');

async function createChildContact(username, childName, relationship = 'my child') {
  console.log(`\n➕ Creating child contact for user: ${username}`);
  console.log(`   Child name: "${childName}"`);
  console.log(`   Relationship: "${relationship}"\n`);

  try {
    // 1. Get user ID
    const userResult = await dbPostgres.query(
      'SELECT id, username, email FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [username]
    );

    if (userResult.rows.length === 0) {
      console.error(`❌ User not found: ${username}`);
      console.log(`\nAvailable users:`);
      const allUsers = await dbPostgres.query(
        'SELECT id, username, email FROM users ORDER BY created_at DESC LIMIT 10'
      );
      allUsers.rows.forEach(u => {
        console.log(`  - ${u.username} (${u.email})`);
      });
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.username} (ID: ${user.id}, Email: ${user.email})`);

    // 2. Check if contact already exists
    const existing = await dbPostgres.query(
      `SELECT id, contact_name, relationship FROM contacts 
       WHERE user_id = $1 
       AND LOWER(contact_name) = LOWER($2)`,
      [user.id, childName]
    );

    if (existing.rows.length > 0) {
      console.log(`\n⚠️  Contact already exists:`);
      existing.rows.forEach(c => {
        console.log(`   ID: ${c.id}, Name: "${c.contact_name}", Relationship: "${c.relationship}"`);
      });
      console.log(`\n💡 Use the fix script instead: node scripts/fix-missing-child-contact.js`);
      return;
    }

    // 3. Create the contact
    const now = new Date().toISOString();
    console.log(`\n📝 Creating contact...`);

    const contactId = await dbSafe.safeInsert('contacts', {
      user_id: user.id,
      contact_name: childName.trim(),
      contact_email: null, // Children typically don't have emails
      relationship: relationship.toLowerCase(),
      created_at: now,
      updated_at: now,
    });

    console.log(`\n✅ Contact created successfully!`);
    console.log(`   Contact ID: ${contactId}`);
    console.log(`   Name: "${childName}"`);
    console.log(`   Relationship: "${relationship}"`);
    console.log(`   User: ${user.username} (ID: ${user.id})`);

    // 4. Verify it was created
    const verify = await dbPostgres.query(
      'SELECT id, contact_name, relationship, user_id FROM contacts WHERE id = $1',
      [contactId]
    );

    if (verify.rows.length > 0) {
      const contact = verify.rows[0];
      console.log(`\n✅ Verification: Contact exists in database`);
      console.log(`   ID: ${contact.id}`);
      console.log(`   Name: "${contact.contact_name}"`);
      console.log(`   Relationship: "${contact.relationship}"`);
      console.log(`   User ID: ${contact.user_id}`);
    }

    // 5. Show all child contacts for this user
    const allChildren = await dbPostgres.query(
      `SELECT id, contact_name, relationship FROM contacts 
       WHERE user_id = $1 
       AND (LOWER(relationship) = 'my child' OR LOWER(relationship) = 'child' OR LOWER(relationship) LIKE '%child%')
       ORDER BY created_at DESC`,
      [user.id]
    );

    console.log(`\n👶 All child contacts for ${user.username} (${allChildren.rows.length}):`);
    allChildren.rows.forEach((c, i) => {
      console.log(`   ${i + 1}. "${c.contact_name}" (relationship: "${c.relationship}", id: ${c.id})`);
    });

    console.log(`\n💡 Next steps:`);
    console.log(`   1. Have the user refresh their browser`);
    console.log(`   2. Check if the contact now appears`);
    console.log(`   3. If still missing, check browser console for errors`);

  } catch (error) {
    console.error('❌ Error creating contact:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
    });
    
    if (error.code === '23505') {
      console.error('\n💡 This is a unique constraint violation.');
      console.error('   The contact might already exist with a different name or email.');
    }
  } finally {
    await dbPostgres.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/create-child-contact.js <username> <childName> [relationship]');
  console.error('Example: node scripts/create-child-contact.js mom1@test.com "Vira" "my child"');
  process.exit(1);
}

const [username, childName, relationship = 'my child'] = args;
createChildContact(username, childName, relationship)
  .then(() => {
    console.log('\n✅ Complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

