#!/usr/bin/env node
/**
 * Fix Missing Child Contact
 * 
 * Attempts to fix common issues that cause child contacts not to appear.
 * 
 * Usage:
 *   node scripts/fix-missing-child-contact.js <username> <childName>
 * 
 * Example:
 *   node scripts/fix-missing-child-contact.js mom1@test.com "Child Name"
 */

require('dotenv').config();
const dbPostgres = require('../dbPostgres');
const dbSafe = require('../dbSafe');

async function fixMissingChildContact(username, childName) {
  console.log(`\n🔧 Fixing missing child contact for user: ${username}`);
  console.log(`   Child name: "${childName}"\n`);

  try {
    // 1. Get user ID
    const userResult = await dbPostgres.query(
      'SELECT id, username, email FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [username]
    );

    if (userResult.rows.length === 0) {
      console.error(`❌ User not found: ${username}`);
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.username} (ID: ${user.id})`);

    // 2. Find contacts matching the child name
    const contacts = await dbPostgres.query(
      `SELECT * FROM contacts 
       WHERE user_id = $1 
       AND LOWER(contact_name) LIKE LOWER($2)
       ORDER BY created_at DESC`,
      [user.id, `%${childName}%`]
    );

    if (contacts.rows.length === 0) {
      console.log(`\n❌ No contacts found matching "${childName}"`);
      console.log(`\n💡 The contact may not have been created. Check:`);
      console.log(`   1. Server logs for errors during contact creation`);
      console.log(`   2. Browser console for API errors`);
      console.log(`   3. Network tab to see if POST /api/contacts succeeded`);
      return;
    }

    console.log(`\n📋 Found ${contacts.rows.length} contact(s) matching "${childName}":\n`);

    let fixedCount = 0;

    for (const contact of contacts.rows) {
      console.log(`Processing contact ID ${contact.id}: "${contact.contact_name}"`);
      
      const issues = [];
      const fixes = [];

      // Check user_id
      if (contact.user_id !== user.id) {
        issues.push(`Wrong user_id: ${contact.user_id} (should be ${user.id})`);
        fixes.push(`UPDATE contacts SET user_id = ${user.id} WHERE id = ${contact.id};`);
      }

      // Check relationship
      const rel = (contact.relationship || '').toLowerCase().trim();
      if (!contact.relationship || rel === '') {
        issues.push('Missing relationship');
        fixes.push(`UPDATE contacts SET relationship = 'my child' WHERE id = ${contact.id};`);
      } else if (rel !== 'my child' && rel !== 'child' && !rel.includes('child')) {
        issues.push(`Unexpected relationship: "${contact.relationship}"`);
        // Only fix if it's clearly a child contact
        if (contact.contact_name && contact.contact_name.toLowerCase().includes(childName.toLowerCase())) {
          fixes.push(`UPDATE contacts SET relationship = 'my child' WHERE id = ${contact.id};`);
        }
      }

      // Check contact_name
      if (!contact.contact_name || contact.contact_name.trim() === '') {
        issues.push('Missing or empty contact_name');
      }

      if (issues.length > 0) {
        console.log(`   Issues found:`);
        issues.forEach(issue => console.log(`      - ${issue}`));
        
        // Apply fixes
        if (fixes.length > 0) {
          console.log(`   Applying fixes...`);
          for (const fixQuery of fixes) {
            try {
              await dbPostgres.query(fixQuery);
              console.log(`      ✅ Applied: ${fixQuery}`);
              fixedCount++;
            } catch (error) {
              console.error(`      ❌ Failed: ${error.message}`);
            }
          }
        }
      } else {
        console.log(`   ✅ No issues found - contact looks correct`);
      }
      console.log('');
    }

    if (fixedCount > 0) {
      console.log(`\n✅ Fixed ${fixedCount} issue(s)`);
      console.log(`\n💡 Next steps:`);
      console.log(`   1. Have the user refresh their browser`);
      console.log(`   2. Check if the contact now appears`);
      console.log(`   3. If still missing, check frontend console for errors`);
    } else {
      console.log(`\n💡 No fixes were needed. The contact exists and looks correct.`);
      console.log(`\n   Possible causes:`);
      console.log(`   1. Frontend not refreshing - have user refresh the page`);
      console.log(`   2. Search filter active - check if search box has text`);
      console.log(`   3. Browser cache - try hard refresh (Cmd+Shift+R)`);
      console.log(`   4. API not returning contact - check browser Network tab`);
    }

    // Show all child contacts for verification
    const allChildContacts = await dbPostgres.query(
      `SELECT id, contact_name, relationship, created_at 
       FROM contacts 
       WHERE user_id = $1 
       AND (
         LOWER(relationship) = 'my child' 
         OR LOWER(relationship) = 'child'
         OR LOWER(relationship) LIKE '%child%'
       )
       ORDER BY created_at DESC`,
      [user.id]
    );

    console.log(`\n👶 All child contacts for this user (${allChildContacts.rows.length}):`);
    allChildContacts.rows.forEach((c, i) => {
      console.log(`   ${i + 1}. "${c.contact_name}" (relationship: "${c.relationship}", id: ${c.id})`);
    });

  } catch (error) {
    console.error('❌ Error during fix:', error);
    console.error(error.stack);
  } finally {
    await dbPostgres.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/fix-missing-child-contact.js <username> <childName>');
  console.error('Example: node scripts/fix-missing-child-contact.js mom1@test.com "Child Name"');
  process.exit(1);
}

const [username, childName] = args;
fixMissingChildContact(username, childName)
  .then(() => {
    console.log('\n✅ Fix complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

