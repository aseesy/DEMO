#!/usr/bin/env node
/**
 * Production Diagnostic Script: Diagnose Missing Contact
 * 
 * This script helps diagnose why a contact (like Vira) might not be appearing
 * in the contacts list. It checks:
 * - If the contact exists in the database
 * - Relationship value and transformation
 * - Any filtering that might exclude it
 * 
 * Usage: 
 *   node scripts/diagnose-missing-contact.js <user_email> <contact_name>
 * 
 * Example:
 *   node scripts/diagnose-missing-contact.js athenasees@gmail.com Vira
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Relationship transformation (matches frontend logic)
function toDisplayRelationship(storedValue) {
  if (!storedValue) return '';

  const STORAGE_TO_DISPLAY = {
    'co-parent': 'My Co-Parent',
    'my child': 'My Child',
    'my partner': 'My Partner',
    'my family': 'My Family',
    'my friend': 'My Friend',
    'other': 'Other',
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

  const lowerValue = storedValue.toLowerCase();

  if (STORAGE_TO_DISPLAY[lowerValue]) {
    return STORAGE_TO_DISPLAY[lowerValue];
  }

  if (STORAGE_VARIATIONS[lowerValue]) {
    return STORAGE_VARIATIONS[lowerValue];
  }

  return storedValue;
}

async function diagnoseMissingContact(userEmail, contactName) {
  try {
    console.log(`🔍 Diagnosing missing contact: "${contactName}" for user: ${userEmail}\n`);

    // Find user
    const userResult = await pool.query(
      'SELECT id, username, email FROM users WHERE email = $1 OR username = $1',
      [userEmail]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      await pool.end();
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.username} (ID: ${user.id})\n`);

    // Get ALL contacts for this user
    const allContactsResult = await pool.query(
      'SELECT * FROM contacts WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );

    console.log(`📋 Total contacts in database: ${allContactsResult.rows.length}\n`);

    // Check for the specific contact
    const matchingContacts = allContactsResult.rows.filter(c => 
      c.contact_name && c.contact_name.toLowerCase().includes(contactName.toLowerCase())
    );

    if (matchingContacts.length === 0) {
      console.log(`❌ No contact found with name containing "${contactName}"`);
      console.log('\n📝 All contact names:');
      allContactsResult.rows.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.contact_name || '(no name)'} (${c.relationship || 'no relationship'})`);
      });
      await pool.end();
      return;
    }

    console.log(`✅ Found ${matchingContacts.length} contact(s) matching "${contactName}":\n`);

    matchingContacts.forEach((contact, i) => {
      console.log(`   Contact ${i + 1}:`);
      console.log(`     ID: ${contact.id}`);
      console.log(`     Name: ${contact.contact_name}`);
      console.log(`     Email: ${contact.contact_email || 'NULL'}`);
      console.log(`     Relationship (raw): "${contact.relationship || 'NULL'}"`);
      
      const transformed = contact.relationship ? toDisplayRelationship(contact.relationship) : '';
      console.log(`     Relationship (transformed): "${transformed}"`);
      
      console.log(`     Created: ${contact.created_at}`);
      console.log(`     Updated: ${contact.updated_at || 'N/A'}`);
      
      // Check if it would be filtered out
      const wouldBeFiltered = [];
      if (!contact.contact_name) wouldBeFiltered.push('Missing contact_name');
      if (contact.contact_email === null && contact.relationship === 'co-parent') {
        wouldBeFiltered.push('Co-parent with NULL email (might violate unique constraint)');
      }
      
      if (wouldBeFiltered.length > 0) {
        console.log(`     ⚠️  Potential issues: ${wouldBeFiltered.join(', ')}`);
      } else {
        console.log(`     ✅ Should appear in contacts list`);
      }
      console.log('');
    });

    // Check child contacts specifically
    const childContacts = allContactsResult.rows.filter(c => {
      const rel = (c.relationship || '').toLowerCase();
      return rel === 'my child' || rel === 'child' || rel.includes('child');
    });

    console.log(`👶 Total child contacts: ${childContacts.length}`);
    if (childContacts.length > 0) {
      childContacts.forEach(c => {
        const transformed = toDisplayRelationship(c.relationship);
        console.log(`   - ${c.contact_name}: "${c.relationship}" → "${transformed}"`);
      });
    }

    // Check for contacts with NULL email
    const nullEmailContacts = allContactsResult.rows.filter(c => !c.contact_email);
    console.log(`\n📧 Contacts with NULL email: ${nullEmailContacts.length}`);
    if (nullEmailContacts.length > 0) {
      nullEmailContacts.forEach(c => {
        console.log(`   - ${c.contact_name} (${c.relationship || 'N/A'})`);
      });
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

const userEmail = process.argv[2];
const contactName = process.argv[3];

if (!userEmail || !contactName) {
  console.error('Usage: node scripts/diagnose-missing-contact.js <user_email> <contact_name>');
  console.error('Example: node scripts/diagnose-missing-contact.js athenasees@gmail.com Vira');
  process.exit(1);
}

diagnoseMissingContact(userEmail, contactName);

