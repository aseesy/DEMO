#!/usr/bin/env node
/**
 * PostgreSQL Database Backup Script
 *
 * Creates a timestamped backup of the PostgreSQL database.
 * Supports both local backups and optional S3 upload.
 *
 * Usage:
 *   node scripts/backup-database.js [--output-dir=./backups] [--upload-s3]
 *
 * Environment Variables:
 *   DATABASE_URL - PostgreSQL connection string (required)
 *   BACKUP_S3_BUCKET - S3 bucket name (optional, for S3 upload)
 *   AWS_ACCESS_KEY_ID - AWS access key (optional, for S3 upload)
 *   AWS_SECRET_ACCESS_KEY - AWS secret key (optional, for S3 upload)
 *
 * Example:
 *   node scripts/backup-database.js --output-dir=./backups
 */

require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Parse command line arguments
const args = process.argv.slice(2);
const outputDir = args.find(arg => arg.startsWith('--output-dir='))?.split('=')[1] || './backups';
const uploadS3 = args.includes('--upload-s3');

async function ensureBackupDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created backup directory: ${dir}`);
  }
}

async function createBackup() {
  const { DATABASE_URL } = process.env;

  if (!DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  // Parse DATABASE_URL to extract database name
  const dbUrl = new URL(DATABASE_URL);
  const dbName = dbUrl.pathname.slice(1); // Remove leading '/'
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFilename = `backup-${dbName}-${timestamp}.sql`;
  const backupPath = path.join(outputDir, backupFilename);

  console.log('🔄 Starting database backup...\n');
  console.log(`   Database: ${dbName}`);
  console.log(`   Output: ${backupPath}\n`);

  try {
    // Ensure backup directory exists
    await ensureBackupDirectory(outputDir);

    // Use pg_dump to create backup
    // Format: custom format (compressed, can be restored with pg_restore)
    const dumpCommand = `pg_dump "${DATABASE_URL}" --format=custom --file="${backupPath}" --verbose`;

    console.log('📦 Creating backup file...');
    const { stdout, stderr } = await execAsync(dumpCommand);

    if (stderr && !stderr.includes('pg_dump: warning')) {
      console.warn('⚠️  pg_dump warnings:', stderr);
    }

    // Check if backup file was created
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file was not created');
    }

    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup created successfully!`);
    console.log(`   File: ${backupFilename}`);
    console.log(`   Size: ${fileSizeMB} MB`);
    console.log(`   Path: ${backupPath}\n`);

    // Optional: Upload to S3
    if (uploadS3) {
      await uploadToS3(backupPath, backupFilename);
    }

    // Clean up old backups (keep last 30 days)
    await cleanupOldBackups(outputDir, 30);

    return backupPath;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);

    if (error.message.includes('pg_dump')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Ensure pg_dump is installed: brew install postgresql (macOS)');
      console.error('   2. Verify DATABASE_URL is correct');
      console.error('   3. Check database connection permissions');
    }

    process.exit(1);
  }
}

async function uploadToS3(backupPath, filename) {
  const { BACKUP_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

  if (!BACKUP_S3_BUCKET) {
    console.warn('⚠️  S3 upload requested but BACKUP_S3_BUCKET not set, skipping...');
    return;
  }

  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.warn('⚠️  AWS credentials not set, skipping S3 upload...');
    return;
  }

  console.log('☁️  Uploading to S3...');

  try {
    // Note: This requires AWS CLI to be installed
    // Alternative: Use AWS SDK for Node.js
    const s3Command = `aws s3 cp "${backupPath}" "s3://${BACKUP_S3_BUCKET}/backups/${filename}"`;
    const { stdout } = await execAsync(s3Command);
    console.log(`✅ Uploaded to S3: s3://${BACKUP_S3_BUCKET}/backups/${filename}`);
  } catch (error) {
    console.error('❌ S3 upload failed:', error.message);
    console.error('💡 Ensure AWS CLI is installed and configured');
  }
}

async function cleanupOldBackups(backupDir, keepDays = 30) {
  try {
    const files = fs
      .readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        mtime: fs.statSync(path.join(backupDir, file)).mtime,
      }))
      .sort((a, b) => b.mtime - a.mtime); // Newest first

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    const oldBackups = files.filter(file => file.mtime < cutoffDate);

    if (oldBackups.length > 0) {
      console.log(`🧹 Cleaning up ${oldBackups.length} old backup(s)...`);
      for (const backup of oldBackups) {
        fs.unlinkSync(backup.path);
        console.log(`   Deleted: ${backup.name}`);
      }
    }

    // Keep at least the 10 most recent backups regardless of age
    const keepCount = 10;
    if (files.length > keepCount) {
      const toDelete = files.slice(keepCount);
      console.log(`🧹 Keeping only ${keepCount} most recent backups...`);
      for (const backup of toDelete) {
        fs.unlinkSync(backup.path);
        console.log(`   Deleted: ${backup.name}`);
      }
    }
  } catch (error) {
    console.warn('⚠️  Error during cleanup:', error.message);
  }
}

// Run backup
if (require.main === module) {
  createBackup()
    .then(() => {
      console.log('\n✅ Backup process completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Backup process failed:', error);
      process.exit(1);
    });
}

module.exports = { createBackup };
