#!/usr/bin/env node
/**
 * Diagnostic script to check why Vira is not appearing as a contact for Athena
 * 
 * Usage: node scripts/check-vira-contact.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkViraContact() {
  try {
    console.log('🔍 Checking for Vira contact...\n');

    // Find Athena user
    const athenaResult = await pool.query(
      "SELECT id, username, email FROM users WHERE email = 'athenasees@gmail.com' OR username = 'athenasees'"
    );

    if (athenaResult.rows.length === 0) {
      console.log('❌ Athena user not found in database');
      console.log('   Expected: athenasees@gmail.com or username: athenasees');
      await pool.end();
      return;
    }

    const athena = athenaResult.rows[0];
    console.log(`✅ Found Athena user:`);
    console.log(`   ID: ${athena.id}`);
    console.log(`   Username: ${athena.username}`);
    console.log(`   Email: ${athena.email}\n`);

    // Get all contacts for Athena
    const contactsResult = await pool.query(
      'SELECT * FROM contacts WHERE user_id = $1 ORDER BY created_at DESC',
      [athena.id]
    );

    console.log(`📋 All contacts for Athena (${contactsResult.rows.length} total):`);
    contactsResult.rows.forEach((c, i) => {
      console.log(`\n   Contact ${i + 1}:`);
      console.log(`     ID: ${c.id}`);
      console.log(`     Name: ${c.contact_name || 'N/A'}`);
      console.log(`     Email: ${c.contact_email || 'NULL'}`);
      console.log(`     Relationship: ${c.relationship || 'NULL'}`);
      console.log(`     Created: ${c.created_at}`);
    });

    // Specifically check for Vira
    const viraContacts = contactsResult.rows.filter(
      c => c.contact_name && c.contact_name.toLowerCase().includes('vira')
    );

    console.log(`\n🔎 Vira contacts found: ${viraContacts.length}`);
    if (viraContacts.length > 0) {
      viraContacts.forEach((c, i) => {
        console.log(`\n   Vira Contact ${i + 1}:`);
        console.log(`     ID: ${c.id}`);
        console.log(`     Name: ${c.contact_name}`);
        console.log(`     Email: ${c.contact_email || 'NULL'}`);
        console.log(`     Relationship: ${c.relationship || 'NULL'}`);
        console.log(`     Relationship (lowercase): ${(c.relationship || '').toLowerCase()}`);
        console.log(`     Created: ${c.created_at}`);
        console.log(`     Updated: ${c.updated_at || 'N/A'}`);
      });
    } else {
      console.log('   ❌ No contacts named "Vira" found');
    }

    // Check child contacts
    const childContacts = contactsResult.rows.filter(c => {
      const rel = (c.relationship || '').toLowerCase();
      return rel === 'my child' || rel === 'child' || rel.includes('child');
    });

    console.log(`\n👶 Child contacts found: ${childContacts.length}`);
    if (childContacts.length > 0) {
      childContacts.forEach((c, i) => {
        console.log(`\n   Child Contact ${i + 1}:`);
        console.log(`     Name: ${c.contact_name}`);
        console.log(`     Relationship: ${c.relationship}`);
        console.log(`     Email: ${c.contact_email || 'NULL'}`);
      });
    }

    // Check for contacts with NULL email (which might be affected by unique constraint)
    const nullEmailContacts = contactsResult.rows.filter(c => !c.contact_email);
    console.log(`\n📧 Contacts with NULL email: ${nullEmailContacts.length}`);
    if (nullEmailContacts.length > 0) {
      nullEmailContacts.forEach(c => {
        console.log(`   - ${c.contact_name} (${c.relationship || 'N/A'})`);
      });
    }

    // Check for duplicate emails (which would violate unique constraint)
    const emailGroups = {};
    contactsResult.rows.forEach(c => {
      if (c.contact_email) {
        const key = c.contact_email.toLowerCase();
        if (!emailGroups[key]) emailGroups[key] = [];
        emailGroups[key].push(c);
      }
    });

    const duplicates = Object.entries(emailGroups).filter(([_, contacts]) => contacts.length > 1);
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Duplicate emails found (would violate unique constraint):`);
      duplicates.forEach(([email, contacts]) => {
        console.log(`   Email: ${email} (${contacts.length} contacts)`);
        contacts.forEach(c => {
          console.log(`     - ${c.contact_name} (ID: ${c.id}, Relationship: ${c.relationship})`);
        });
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

checkViraContact();

