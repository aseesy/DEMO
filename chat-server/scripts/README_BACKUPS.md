# Database Backup & Monitoring

## Overview

This directory contains scripts for backing up and monitoring the PostgreSQL database.

## Backup Scripts

### `backup-database.js`

Creates a timestamped backup of the PostgreSQL database using `pg_dump`.

**Usage:**

```bash
# Basic backup to ./backups directory
npm run db:backup

# Custom output directory
node scripts/backup-database.js --output-dir=./my-backups

# Backup with S3 upload (requires AWS credentials)
node scripts/backup-database.js --upload-s3
```

**Features:**

- ✅ Creates compressed custom-format backups (faster restore)
- ✅ Automatic cleanup of old backups (keeps last 30 days or 10 most recent)
- ✅ Optional S3 upload for off-site storage
- ✅ Timestamped filenames for easy identification

**Environment Variables:**

- `DATABASE_URL` - PostgreSQL connection string (required)
- `BACKUP_S3_BUCKET` - S3 bucket name (optional, for S3 upload)
- `AWS_ACCESS_KEY_ID` - AWS access key (optional)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key (optional)

**Example Output:**

```
🔄 Starting database backup...

   Database: liaizen
   Output: ./backups/backup-liaizen-2025-01-28T10-30-00.sql

📦 Creating backup file...
✅ Backup created successfully!
   File: backup-liaizen-2025-01-28T10-30-00.sql
   Size: 12.45 MB
   Path: ./backups/backup-liaizen-2025-01-28T10-30-00.sql
```

### `verify-backup.js`

Verifies that a backup file is valid and can be restored.

**Usage:**

```bash
node scripts/verify-backup.js ./backups/backup-liaizen-2025-01-28T10-30-00.sql
```

**What it checks:**

- ✅ File exists and is not empty
- ✅ Backup format is valid (custom format or SQL)
- ✅ Backup contains expected tables and data
- ✅ File is not corrupted

## Monitoring Scripts

### `monitor-database.js`

Monitors database health, performance, and connection pool status.

**Usage:**

```bash
# Monitor with 60-second intervals (default)
npm run db:monitor

# Custom interval (30 seconds)
node scripts/monitor-database.js --interval=30

# JSON output (for logging/monitoring tools)
node scripts/monitor-database.js --json
```

**What it monitors:**

- ✅ Database connection status and latency
- ✅ Database size
- ✅ Active/idle connections
- ✅ Table row counts
- ✅ Slow queries (>1 second average)
- ✅ Connection pool statistics

**Example Output:**

```
📊 Database Monitoring Report
==================================================
Timestamp: 2025-01-28T10:30:00.000Z

✅ Connection: connected (5ms)
💾 Database Size: 125 MB

🔌 Active Connections:
   Total: 3
   Active: 1
   Idle: 2

📋 Top Tables by Row Count:
   messages: 15,234 rows (45 MB)
   users: 1,234 rows (2 MB)
   contacts: 567 rows (1 MB)

✅ No slow queries detected
```

## Automated Backups

### Using Cron (Linux/macOS)

Add to crontab for daily backups at 2 AM:

```bash
# Edit crontab
crontab -e

# Add this line (adjust path as needed)
0 2 * * * cd /path/to/chat-server && npm run db:backup >> /var/log/db-backup.log 2>&1
```

### Using Railway Scheduled Tasks

If deploying on Railway, you can use Railway's cron jobs feature:

1. Go to Railway project settings
2. Add a new service
3. Configure as a cron job
4. Set schedule: `0 2 * * *` (daily at 2 AM)
5. Command: `cd chat-server && npm run db:backup`

### Using GitHub Actions

Create `.github/workflows/backup-database.yml`:

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
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd chat-server && npm install
      - name: Create backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: cd chat-server && npm run db:backup
      - name: Upload backup artifact
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: chat-server/backups/*.sql
          retention-days: 30
```

## Restoring from Backup

### Custom Format Backup

```bash
# Restore from custom format backup
pg_restore -d <target-database> --clean --if-exists ./backups/backup-liaizen-2025-01-28T10-30-00.sql
```

### SQL Format Backup

```bash
# Restore from SQL backup
psql -d <target-database> < ./backups/backup-liaizen-2025-01-28T10-30-00.sql
```

**⚠️ Warning**: Restoring will overwrite existing data. Always verify backups before restoring!

## Best Practices

1. **Regular Backups**: Run daily backups, keep at least 30 days
2. **Off-Site Storage**: Upload backups to S3 or similar for disaster recovery
3. **Verify Backups**: Regularly verify backup integrity with `verify-backup.js`
4. **Test Restores**: Periodically test restore procedures
5. **Monitor Database**: Use `monitor-database.js` to track database health
6. **Alert on Issues**: Set up alerts for backup failures or database issues

## Troubleshooting

### Backup Fails: "pg_dump: command not found"

**Solution**: Install PostgreSQL client tools:

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Or use Docker
docker run --rm -v $(pwd):/backups postgres:15 pg_dump ...
```

### Backup Fails: "Connection refused"

**Solution**:

- Verify `DATABASE_URL` is correct
- Check database is accessible
- Verify network/firewall settings

### S3 Upload Fails

**Solution**:

- Ensure AWS CLI is installed: `brew install awscli` or `pip install awscli`
- Configure AWS credentials: `aws configure`
- Verify S3 bucket exists and has write permissions

### Monitoring Shows High Connection Count

**Solution**:

- Check for connection leaks in application code
- Review connection pool settings in `dbPostgres.js`
- Consider increasing pool size if legitimate high usage

---

_Last Updated: 2025-01-28_
