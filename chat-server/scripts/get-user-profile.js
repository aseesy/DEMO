/**
 * Script to retrieve user profile information
 * Usage: node scripts/get-user-profile.js <email>
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getUserProfile(email) {
  try {
    // Get user from users table
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    const user = userResult.rows[0];
    console.log('\n=== USER BASIC INFO ===');
    console.log(`ID: ${user.id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`First Name: ${user.first_name || 'N/A'}`);
    console.log(`Last Name: ${user.last_name || 'N/A'}`);
    console.log(`Display Name: ${user.display_name || 'N/A'}`);
    console.log(`Phone: ${user.phone || 'N/A'}`);
    console.log(`Address: ${user.address || 'N/A'}`);
    console.log(`City: ${user.city || 'N/A'}`);
    console.log(`State: ${user.state || 'N/A'}`);
    console.log(`Zip: ${user.zip || 'N/A'}`);
    console.log(`Created At: ${user.created_at}`);

    // Get user context
    const contextResult = await pool.query(
      'SELECT * FROM user_context WHERE user_id = $1',
      [user.username.toLowerCase()]
    );

    if (contextResult.rows.length > 0) {
      const context = contextResult.rows[0];
      console.log('\n=== USER CONTEXT ===');
      console.log(`Co-Parent: ${context.co_parent || 'N/A'}`);
      
      const children = typeof context.children === 'string' 
        ? JSON.parse(context.children) 
        : context.children || [];
      console.log(`Children: ${JSON.stringify(children, null, 2)}`);
      
      const contacts = typeof context.contacts === 'string'
        ? JSON.parse(context.contacts)
        : context.contacts || [];
      console.log(`Contacts: ${JSON.stringify(contacts, null, 2)}`);
    } else {
      console.log('\n=== USER CONTEXT ===');
      console.log('No context data found');
    }

    // Get user values profile
    const valuesResult = await pool.query(
      'SELECT * FROM user_values_profile WHERE user_id = $1',
      [user.id]
    );

    if (valuesResult.rows.length > 0) {
      const values = valuesResult.rows[0];
      console.log('\n=== VALUES PROFILE ===');
      console.log(`Values Scores: ${JSON.stringify(
        typeof values.values_scores === 'string' 
          ? JSON.parse(values.values_scores) 
          : values.values_scores || {},
        null,
        2
      )}`);
      console.log(`Stances: ${JSON.stringify(
        typeof values.stances === 'string'
          ? JSON.parse(values.stances)
          : values.stances || [],
        null,
        2
      )}`);
      console.log(`Self Image: ${JSON.stringify(
        typeof values.self_image === 'string'
          ? JSON.parse(values.self_image)
          : values.self_image || [],
        null,
        2
      )}`);
      console.log(`Non-Negotiables: ${JSON.stringify(
        typeof values.non_negotiables === 'string'
          ? JSON.parse(values.non_negotiables)
          : values.non_negotiables || [],
        null,
        2
      )}`);
      console.log(`Motivations: ${JSON.stringify(
        typeof values.motivations === 'string'
          ? JSON.parse(values.motivations)
          : values.motivations || [],
        null,
        2
      )}`);
      console.log(`Messages Analyzed: ${values.messages_analyzed || 0}`);
    } else {
      console.log('\n=== VALUES PROFILE ===');
      console.log('No values profile found');
    }

    // Get contacts
    const contactsResult = await pool.query(
      'SELECT * FROM contacts WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );

    if (contactsResult.rows.length > 0) {
      console.log('\n=== CONTACTS ===');
      contactsResult.rows.forEach((contact, index) => {
        console.log(`\nContact ${index + 1}:`);
        console.log(`  Name: ${contact.contact_name}`);
        console.log(`  Email: ${contact.contact_email || 'N/A'}`);
        console.log(`  Relationship: ${contact.relationship || 'N/A'}`);
        console.log(`  Phone: ${contact.phone || 'N/A'}`);
        console.log(`  Address: ${contact.address || 'N/A'}`);
        if (contact.child_age) console.log(`  Child Age: ${contact.child_age}`);
        if (contact.child_birthdate) console.log(`  Child Birthdate: ${contact.child_birthdate}`);
        if (contact.school) console.log(`  School: ${contact.school}`);
        console.log(`  Created: ${contact.created_at}`);
      });
    } else {
      console.log('\n=== CONTACTS ===');
      console.log('No contacts found');
    }

    // Get profile fields from users table
    console.log('\n=== PROFILE FIELDS ===');
    console.log(`Employer: ${user.employer || 'N/A'}`);
    console.log(`Work Schedule: ${user.work_schedule || 'N/A'}`);
    console.log(`Employment Status: ${user.employment_status || 'N/A'}`);
    console.log(`Communication Style: ${user.communication_style || 'N/A'}`);
    console.log(`Communication Triggers: ${user.communication_triggers || 'N/A'}`);
    console.log(`Communication Goals: ${user.communication_goals || 'N/A'}`);
    console.log(`Additional Context: ${user.additional_context || 'N/A'}`);
    console.log(`Household Members: ${user.household_members || 'N/A'}`);
    console.log(`Timezone: ${user.timezone || 'N/A'}`);
    console.log(`Language: ${user.language || 'N/A'}`);
    console.log(`Birthdate: ${user.birthdate || 'N/A'}`);
    console.log(`Pronouns: ${user.pronouns || 'N/A'}`);
    console.log(`Education Level: ${user.education_level || 'N/A'}`);
    console.log(`Education Field: ${user.education_field || 'N/A'}`);

    // Get rooms
    const roomsResult = await pool.query(
      `SELECT r.*, rm.role 
       FROM rooms r 
       JOIN room_members rm ON r.id = rm.room_id 
       WHERE rm.user_id = $1 
       ORDER BY r.created_at DESC`,
      [user.id]
    );

    if (roomsResult.rows.length > 0) {
      console.log('\n=== ROOMS ===');
      roomsResult.rows.forEach((room, index) => {
        console.log(`\nRoom ${index + 1}:`);
        console.log(`  ID: ${room.id}`);
        console.log(`  Name: ${room.name}`);
        console.log(`  Role: ${room.role}`);
        console.log(`  Private: ${room.is_private ? 'Yes' : 'No'}`);
        console.log(`  Created: ${room.created_at}`);
      });
    } else {
      console.log('\n=== ROOMS ===');
      console.log('No rooms found');
    }

  } catch (error) {
    console.error('❌ Error retrieving user profile:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/get-user-profile.js <email>');
  console.error('Example: node scripts/get-user-profile.js mom1@test.com');
  process.exit(1);
}

getUserProfile(email);

