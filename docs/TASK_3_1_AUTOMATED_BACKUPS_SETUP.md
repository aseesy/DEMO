# Task 3.1: Automated Backups Setup

**Date**: 2025-01-28  
**Status**: ✅ **SETUP GUIDE CREATED**

## Summary

Automated backup system is implemented. This document provides setup instructions for Railway and other platforms.

## Backup Script Overview

### Features ✅

- ✅ Timestamped backups (custom format, compressed)
- ✅ Automatic cleanup (keeps last 30 days or 10 most recent)
- ✅ Optional S3 upload for off-site storage
- ✅ Backup verification script available
- ✅ Error handling and logging

### Script Location

- **Backup Script**: `chat-server/scripts/backup-database.js`
- **Verification Script**: `chat-server/scripts/verify-backup.js`
- **Documentation**: `chat-server/scripts/README_BACKUPS.md`

## Setup Options

### Option 1: Railway Scheduled Tasks (Recommended)

Railway supports cron jobs through scheduled tasks. However, Railway's cron support may be limited. Alternative approaches:

#### Approach A: Railway Cron Service

1. **Create a new service in Railway**:
   - Go to Railway Dashboard → Your Project
   - Click "+ New" → "Empty Service"
   - Name it: `backup-service`

2. **Configure as Cron Job**:
   - In service settings, enable "Cron Job"
   - Set schedule: `0 2 * * *` (daily at 2 AM UTC)
   - Set command: `cd chat-server && npm run db:backup`

3. **Set Environment Variables**:
   - `DATABASE_URL` - Should be automatically available
   - `BACKUP_S3_BUCKET` (optional) - For S3 upload
   - `AWS_ACCESS_KEY_ID` (optional)
   - `AWS_SECRET_ACCESS_KEY` (optional)

#### Approach B: GitHub Actions (Recommended for Railway)

Since Railway may not have native cron support, use GitHub Actions:

1. **Create GitHub Actions Workflow**:

Create `.github/workflows/database-backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: chat-server/package-lock.json

      - name: Install PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client

      - name: Install dependencies
        working-directory: chat-server
        run: npm ci

      - name: Create backup
        working-directory: chat-server
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          BACKUP_S3_BUCKET: ${{ secrets.BACKUP_S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: npm run db:backup

      - name: Upload backup artifact
        uses: actions/upload-artifact@v4
        with:
          name: database-backup-${{ github.run_number }}
          path: chat-server/backups/*.sql
          retention-days: 30
          if-no-files-found: warn

      - name: Upload to S3 (if configured)
        if: env.BACKUP_S3_BUCKET != ''
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          cd chat-server/backups
          for file in *.sql; do
            aws s3 cp "$file" "s3://${{ secrets.BACKUP_S3_BUCKET }}/backups/$file"
          done
```

2. **Set GitHub Secrets**:
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Add secrets:
     - `DATABASE_URL` - PostgreSQL connection string from Railway
     - `BACKUP_S3_BUCKET` (optional) - S3 bucket name
     - `AWS_ACCESS_KEY_ID` (optional)
     - `AWS_SECRET_ACCESS_KEY` (optional)

#### Approach C: Railway One-Off Service

Create a lightweight service that runs backups on a schedule:

1. **Create backup service**:
   - New service in Railway
   - Use minimal Dockerfile or Node.js runtime
   - Set start command: `node -e "setInterval(() => require('./chat-server/scripts/backup-database.js'), 86400000)"`

**Note**: This approach keeps a service running 24/7 just for backups, which may not be cost-effective.

### Option 2: Local Cron (Development/Testing)

For local development or testing:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/chat-server && npm run db:backup >> /var/log/db-backup.log 2>&1
```

### Option 3: External Cron Service

Use external services like:

- **Cron-job.org** - Free cron service
- **EasyCron** - Reliable cron service
- **Set up webhook** that triggers Railway deployment with backup command

## Testing the Backup Script

### Manual Test (Local)

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Run backup
cd chat-server
npm run db:backup

# Verify backup
node scripts/verify-backup.js ./backups/backup-*.sql
```

### Manual Test (Railway)

```bash
# Run backup in Railway
railway run cd chat-server && npm run db:backup

# Check backup files
railway run ls -lh chat-server/backups/
```

## Backup Verification

### Verify Backup Integrity

```bash
# Verify a backup file
node scripts/verify-backup.js ./backups/backup-liaizen-2025-01-28T10-30-00.sql
```

### Test Restore (Staging)

```bash
# Restore to staging database
pg_restore -d staging_db --clean --if-exists ./backups/backup-liaizen-2025-01-28T10-30-00.sql
```

## S3 Setup (Optional)

### Create S3 Bucket

1. Go to AWS S3 Console
2. Create bucket: `your-app-database-backups`
3. Enable versioning
4. Set lifecycle policy (delete after 90 days)

### Configure AWS Credentials

```bash
# Install AWS CLI
brew install awscli  # macOS
# or
pip install awscli   # Linux

# Configure credentials
aws configure
```

### Test S3 Upload

```bash
# Test upload
node scripts/backup-database.js --upload-s3
```

## Monitoring Backup Success

### Check Backup Logs

```bash
# Railway logs
railway logs --service backup-service

# GitHub Actions logs
# Check Actions tab in GitHub repository
```

### Set Up Alerts

1. **GitHub Actions**: Configure notifications for workflow failures
2. **Railway**: Set up alerts for service failures
3. **S3**: Monitor bucket for new backups

## Backup Retention Policy

Current settings:

- **Keep**: Last 30 days OR 10 most recent backups (whichever is more)
- **Location**: Local `./backups` directory
- **S3**: Manual lifecycle policy (recommend 90 days)

## Recommended Schedule

- **Daily Backups**: 2 AM UTC (low traffic time)
- **Weekly Full Backup**: Sunday 2 AM UTC
- **Monthly Archive**: First of month, keep for 1 year

## Troubleshooting

### Backup Fails: "pg_dump: command not found"

**Solution**: Install PostgreSQL client tools

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# In Railway/GitHub Actions
# Add installation step in workflow
```

### Backup Fails: "Connection refused"

**Solution**:

- Verify `DATABASE_URL` is correct
- Check database is accessible
- Verify network/firewall settings

### S3 Upload Fails

**Solution**:

- Ensure AWS CLI is installed
- Verify AWS credentials are correct
- Check S3 bucket permissions
- Verify bucket exists

## Next Steps

1. ✅ **Script Created**: Backup script is ready
2. ⏳ **Setup Automation**: Choose setup method (GitHub Actions recommended)
3. ⏳ **Test Backup**: Run manual backup to verify
4. ⏳ **Configure S3** (optional): Set up off-site storage
5. ⏳ **Monitor**: Set up alerts for backup failures

---

**Conclusion**: Backup system is ready. Choose automation method (GitHub Actions recommended for Railway) and configure accordingly.
