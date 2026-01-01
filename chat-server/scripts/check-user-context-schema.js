#!/usr/bin/env node
/**
 * Check user_context table schema to verify migration 032 completed successfully
 */

require('dotenv').config();
const db = require('../dbPostgres');

async function checkSchema() {
  try {
    console.log('🔍 Checking user_context table schema...\n');

    // Get all columns
    const columnsResult = await db.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_context' 
      ORDER BY ordinal_position
    `);

    console.log('=== COLUMNS ===');
    columnsResult.rows.forEach(col => {
      const nullable = col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
    });

    // Get constraints (primary key, foreign keys, etc.)
    const constraintsResult = await db.query(`
      SELECT 
        conname,
        contype,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'user_context'::regclass
      ORDER BY contype, conname
    `);

    console.log('\n=== CONSTRAINTS ===');
    if (constraintsResult.rows.length === 0) {
      console.log('  (no constraints found)');
    } else {
      constraintsResult.rows.forEach(con => {
        const type = con.contype === 'p' ? 'PRIMARY KEY' : 
                     con.contype === 'f' ? 'FOREIGN KEY' :
                     con.contype === 'u' ? 'UNIQUE' : con.contype;
        console.log(`  ${con.conname.padEnd(40)} ${type}`);
        console.log(`    ${con.definition}`);
      });
    }

    // Check specifically for user_email and user_id
    console.log('\n=== MIGRATION VERIFICATION ===');
    const hasUserEmail = columnsResult.rows.some(c => c.column_name === 'user_email');
    const hasUserId = columnsResult.rows.some(c => c.column_name === 'user_id');
    const hasEmailPK = constraintsResult.rows.some(c => 
      c.contype === 'p' && c.definition.includes('user_email')
    );

    console.log(`  user_email column exists: ${hasUserEmail ? '✅ YES' : '❌ NO'}`);
    console.log(`  user_id column exists: ${hasUserId ? '❌ YES (should be dropped)' : '✅ NO (correctly dropped)'}`);
    console.log(`  user_email is PRIMARY KEY: ${hasEmailPK ? '✅ YES' : '❌ NO'}`);

    if (hasUserEmail && !hasUserId && hasEmailPK) {
      console.log('\n✅ Migration 032 completed successfully!');
    } else {
      console.log('\n⚠️  Migration 032 may not have completed correctly.');
      if (!hasUserEmail) console.log('   - Missing user_email column');
      if (hasUserId) console.log('   - user_id column still exists (should be dropped)');
      if (!hasEmailPK) console.log('   - user_email is not the primary key');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    process.exit(1);
  }
}

checkSchema();

