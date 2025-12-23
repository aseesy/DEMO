#!/usr/bin/env node
/**
 * Diagnostic Script for Missing Contacts
 * 
 * Helps diagnose why a contact isn't showing up in the contacts list.
 * 
 * Usage:
 *   node scripts/diagnose-missing-contact.js <username> <contactName>
 * 
 * Example:
 *   node scripts/diagnose-missing-contact.js mom1@test.com "Child Name"
 */

require('dotenv').config();
const dbPostgres = require('../dbPostgres');
const dbSafe = require('../dbSafe');

async function diagnoseMissingContact(username, contactName) {
  console.log(`\n🔍 Diagnosing missing contact for user: ${username}`);
  console.log(`   Looking for contact: "${contactName}"\n`);

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
    console.log(`✅ Found user: ${user.username} (ID: ${user.id}, Email: ${user.email})`);

    // 2. Get ALL contacts for this user
    const allContacts = await dbSafe.safeSelect(
      'contacts',
      { user_id: user.id },
      { orderBy: 'created_at', orderDirection: 'DESC' }
    );

    console.log(`\n📊 Total contacts for user: ${allContacts.length}`);

    // 3. Find matching contacts (case-insensitive partial match)
    const matchingContacts = allContacts.filter(
      c => c.contact_name && c.contact_name.toLowerCase().includes(contactName.toLowerCase())
    );

    console.log(`\n🔎 Contacts matching "${contactName}": ${matchingContacts.length}`);

    if (matchingContacts.length === 0) {
      console.log(`\n❌ No contacts found matching "${contactName}"`);
      
      // Show all child contacts
      const childContacts = allContacts.filter(c => {
        const rel = (c.relationship || '').toLowerCase();
        return rel === 'my child' || rel === 'child' || rel.includes('child');
      });

      console.log(`\n👶 All child contacts for this user (${childContacts.length}):`);
      childContacts.forEach((c, i) => {
        console.log(`   ${i + 1}. "${c.contact_name}" (relationship: "${c.relationship}", id: ${c.id})`);
      });

      // Show recent contacts
      console.log(`\n📋 Recent contacts (last 10):`);
      allContacts.slice(0, 10).forEach((c, i) => {
        console.log(`   ${i + 1}. "${c.contact_name}" (relationship: "${c.relationship}", id: ${c.id}, created: ${c.created_at})`);
      });

      return;
    }

    // 4. Display matching contacts with details
    console.log(`\n✅ Found ${matchingContacts.length} matching contact(s):\n`);
    matchingContacts.forEach((contact, i) => {
      console.log(`Contact ${i + 1}:`);
      console.log(`   ID: ${contact.id}`);
      console.log(`   Name: "${contact.contact_name}"`);
      console.log(`   Email: ${contact.contact_email || 'NULL'}`);
      console.log(`   Relationship: "${contact.relationship || 'NULL'}"`);
      console.log(`   User ID: ${contact.user_id}`);
      console.log(`   Created: ${contact.created_at}`);
      console.log(`   Updated: ${contact.updated_at}`);
      
      // Check for potential issues
      const issues = [];
      if (!contact.contact_name) {
        issues.push('❌ Missing contact_name');
      }
      if (!contact.relationship) {
        issues.push('⚠️  Missing relationship');
      }
      if (contact.user_id !== user.id) {
        issues.push(`❌ Wrong user_id (expected ${user.id}, got ${contact.user_id})`);
      }
      
      // Check relationship format
      const rel = (contact.relationship || '').toLowerCase();
      if (rel.includes('child') && rel !== 'my child' && rel !== 'child') {
        issues.push(`⚠️  Unusual relationship format: "${contact.relationship}"`);
      }

      if (issues.length > 0) {
        console.log(`   Issues:`);
        issues.forEach(issue => console.log(`      ${issue}`));
      } else {
        console.log(`   ✅ No obvious issues found`);
      }
      console.log('');
    });

    // 5. Check if contact would be transformed correctly
    console.log(`\n🔄 Relationship Transformation Check:`);
    matchingContacts.forEach((contact, i) => {
      const toDisplayRelationship = (storedValue) => {
        if (!storedValue) return '';
        const lowerValue = storedValue.toLowerCase();
        const STORAGE_TO_DISPLAY = {
          'co-parent': 'My Co-Parent',
          'my child': 'My Child',
          'my partner': 'My Partner',
          'my family': 'My Family',
          'my friend': 'My Friend',
          other: 'Other',
        };
        const STORAGE_VARIATIONS = {
          'co-parent': 'My Co-Parent',
          coparent: 'My Co-Parent',
          'my co-parent': 'My Co-Parent',
          'my child': 'My Child',
          child: 'My Child',
          'my partner': 'My Partner',
          partner: 'My Partner',
          'my family': 'My Family',
          family: 'My Family',
          'my friend': 'My Friend',
          friend: 'My Friend',
          other: 'Other',
        };
        return STORAGE_TO_DISPLAY[lowerValue] || STORAGE_VARIATIONS[lowerValue] || storedValue;
      };

      const transformed = toDisplayRelationship(contact.relationship);
      console.log(`   Contact ${i + 1}: "${contact.relationship}" → "${transformed}"`);
    });

    // 6. Check database directly
    console.log(`\n💾 Direct Database Query:`);
    const directQuery = await dbPostgres.query(
      `SELECT * FROM contacts 
       WHERE user_id = $1 
       AND LOWER(contact_name) LIKE LOWER($2)
       ORDER BY created_at DESC`,
      [user.id, `%${contactName}%`]
    );
    console.log(`   Found ${directQuery.rows.length} row(s) in database`);
    if (directQuery.rows.length > 0) {
      directQuery.rows.forEach((row, i) => {
        console.log(`   Row ${i + 1}: id=${row.id}, name="${row.contact_name}", relationship="${row.relationship}"`);
      });
    }

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    console.error(error.stack);
  } finally {
    await dbPostgres.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/diagnose-missing-contact.js <username> <contactName>');
  console.error('Example: node scripts/diagnose-missing-contact.js mom1@test.com "Child Name"');
  process.exit(1);
}

const [username, contactName] = args;
diagnoseMissingContact(username, contactName)
  .then(() => {
    console.log('\n✅ Diagnosis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
