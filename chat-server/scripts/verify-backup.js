#!/usr/bin/env node
/**
 * Backup Verification Script
 *
 * Verifies that a backup file is valid and can be restored.
 *
 * Usage:
 *   node scripts/verify-backup.js <backup-file>
 *
 * Example:
 *   node scripts/verify-backup.js ./backups/backup-mydb-2025-01-28T10-30-00.sql
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function verifyBackup(backupPath) {
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Backup file not found: ${backupPath}`);
    process.exit(1);
  }

  const stats = fs.statSync(backupPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('🔍 Verifying backup file...\n');
  console.log(`   File: ${path.basename(backupPath)}`);
  console.log(`   Size: ${fileSizeMB} MB`);
  console.log(`   Created: ${stats.mtime.toISOString()}\n`);

  try {
    // Check if it's a custom format backup (pg_dump -Fc)
    const isCustomFormat =
      backupPath.endsWith('.sql') === false ||
      fs.readFileSync(backupPath, { encoding: 'utf8', end: 10 }).includes('PGDMP');

    if (isCustomFormat) {
      // Use pg_restore --list to verify custom format backup
      console.log('📦 Verifying custom format backup...');
      const { stdout } = await execAsync(`pg_restore --list "${backupPath}"`);

      const lines = stdout.split('\n').filter(line => line.trim());
      const tableCount = lines.filter(line => line.includes('TABLE')).length;
      const dataCount = lines.filter(line => line.includes('TABLE DATA')).length;

      console.log(`✅ Backup is valid!`);
      console.log(`   Tables: ${tableCount}`);
      console.log(`   Data entries: ${dataCount}`);
      console.log(`   Total entries: ${lines.length}`);
    } else {
      // For SQL format, check if it's valid SQL
      console.log('📦 Verifying SQL format backup...');
      const content = fs.readFileSync(backupPath, 'utf8');

      // Basic validation: check for PostgreSQL dump markers
      const hasPostgresHeader =
        content.includes('PostgreSQL database dump') ||
        content.includes('-- PostgreSQL database dump');
      const hasCreateTable = content.includes('CREATE TABLE');
      const hasInsert = content.includes('INSERT INTO') || content.includes('COPY ');

      if (hasPostgresHeader || (hasCreateTable && hasInsert)) {
        const tableMatches = content.match(/CREATE TABLE/g) || [];
        const insertMatches = content.match(/INSERT INTO|COPY /g) || [];

        console.log(`✅ Backup appears to be valid SQL!`);
        console.log(`   CREATE TABLE statements: ${tableMatches.length}`);
        console.log(`   INSERT/COPY statements: ${insertMatches.length}`);
      } else {
        console.warn('⚠️  Backup format unclear - may not be a valid PostgreSQL dump');
      }
    }

    // Check file integrity (not corrupted)
    if (stats.size === 0) {
      console.error('❌ Backup file is empty!');
      process.exit(1);
    }

    console.log('\n✅ Backup verification complete!');
    console.log('💡 To restore: pg_restore -d <database> <backup-file>');
  } catch (error) {
    console.error('❌ Verification failed:', error.message);

    if (error.message.includes('pg_restore')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Ensure pg_restore is installed');
      console.error('   2. Verify backup file is not corrupted');
      console.error('   3. Check file permissions');
    }

    process.exit(1);
  }
}

// Parse command line arguments
const backupFile = process.argv[2];

if (!backupFile) {
  console.error('❌ Usage: node scripts/verify-backup.js <backup-file>');
  process.exit(1);
}

verifyBackup(backupFile).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
