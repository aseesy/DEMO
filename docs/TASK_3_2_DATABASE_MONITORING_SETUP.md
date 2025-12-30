# Task 3.2: Database Monitoring Setup

**Date**: 2025-01-28  
**Status**: ✅ **SETUP GUIDE CREATED**

## Summary

Database monitoring script is implemented and ready to use. This document provides setup instructions for production monitoring.

## Monitoring Script Overview

### Features ✅

- ✅ Connection status and latency monitoring
- ✅ Database size tracking
- ✅ Active/idle connection counts
- ✅ Table row counts (top 20 tables)
- ✅ Slow query detection (>1 second average)
- ✅ Connection pool statistics
- ✅ JSON output option (for logging/monitoring tools)
- ✅ Configurable monitoring interval

### Script Location

- **Monitoring Script**: `chat-server/scripts/monitor-database.js`
- **Usage**: `npm run db:monitor`

## Usage

### Basic Monitoring

```bash
# Monitor with 60-second intervals (default)
cd chat-server
npm run db:monitor
```

### Custom Interval

```bash
# Monitor with 30-second intervals
node scripts/monitor-database.js --interval=30
```

### JSON Output (for Logging Tools)

```bash
# JSON output for integration with monitoring tools
node scripts/monitor-database.js --json
```

## What It Monitors

### 1. Connection Status ✅

- Connection health
- Connection latency (ms)
- Connection errors

### 2. Database Size ✅

- Total database size
- Human-readable format (MB, GB)
- Size in bytes

### 3. Connection Pool ✅

- Total connections
- Active connections
- Idle connections
- Idle in transaction (warning)

### 4. Table Statistics ✅

- Top 20 tables by row count
- Table sizes
- Row counts

### 5. Slow Queries ✅

- Queries with >1 second average execution time
- Query call counts
- Average and max execution times
- Query text (truncated)

## Production Setup Options

### Option 1: Railway Logs (Simple)

Monitor database health through Railway logs:

```bash
# Run monitoring script in Railway
railway run cd chat-server && npm run db:monitor
```

**Limitations**:

- Manual execution required
- Not continuous monitoring
- No alerts

### Option 2: Scheduled Monitoring (Recommended)

Set up periodic monitoring checks:

#### Using GitHub Actions

Create `.github/workflows/database-monitoring.yml`:

```yaml
name: Database Monitoring

on:
  schedule:
    - cron: '*/15 * * * *' # Every 15 minutes
  workflow_dispatch: # Allow manual trigger

jobs:
  monitor:
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: chat-server/package-lock.json

      - name: Install dependencies
        working-directory: chat-server
        run: npm ci --legacy-peer-deps

      - name: Run monitoring
        working-directory: chat-server
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          node scripts/monitor-database.js --json > monitoring-report.json

      - name: Check for issues
        run: |
          # Parse JSON and check for issues
          node -e "
            const report = require('./chat-server/monitoring-report.json');
            const issues = [];
            
            if (report.connection.status !== 'connected') {
              issues.push('Database connection failed');
            }
            
            if (report.connections && report.connections.idleInTransaction > 0) {
              issues.push('Idle transactions detected');
            }
            
            if (report.slowQueries && report.slowQueries.length > 0) {
              issues.push('Slow queries detected');
            }
            
            if (issues.length > 0) {
              console.error('Issues found:', issues);
              process.exit(1);
            }
          "

      - name: Upload monitoring report
        uses: actions/upload-artifact@v4
        with:
          name: database-monitoring-${{ github.run_number }}
          path: chat-server/monitoring-report.json
          retention-days: 7
```

#### Using Railway Scheduled Tasks

1. Create a monitoring service in Railway
2. Set schedule: `*/15 * * * *` (every 15 minutes)
3. Command: `cd chat-server && npm run db:monitor --json`

### Option 3: Continuous Monitoring Service

Run monitoring as a background service:

```bash
# In Railway, create a new service
# Start command: node scripts/monitor-database.js --interval=60 --json
```

**Note**: This keeps a service running 24/7, which may have cost implications.

## Monitoring Alerts

### Set Up Alerts

1. **GitHub Actions**: Configure notifications for workflow failures
2. **Railway**: Set up alerts for service failures
3. **External Monitoring**: Integrate with services like:
   - Datadog
   - New Relic
   - Sentry
   - Custom webhook

### Alert Conditions

Monitor for:

- ❌ Database connection failures
- ⚠️ High connection count (>80% of pool)
- ⚠️ Idle transactions detected
- ⚠️ Slow queries (>1 second)
- ⚠️ Database size growth (unusual spikes)
- ⚠️ Connection pool exhaustion

## Integration with Monitoring Tools

### JSON Output Format

```json
{
  "timestamp": "2025-01-28T10:30:00.000Z",
  "connection": {
    "status": "connected",
    "latencyMs": 5
  },
  "size": {
    "human": "125 MB",
    "bytes": 131072000
  },
  "connections": {
    "total": 3,
    "active": 1,
    "idle": 2,
    "idleInTransaction": 0
  },
  "tableCounts": [
    {
      "table": "messages",
      "rows": 15234,
      "size": "45 MB"
    }
  ],
  "slowQueries": [],
  "connectionPool": {
    "totalCount": 10,
    "idleCount": 7,
    "waitingCount": 0
  }
}
```

### Integration Examples

#### Datadog Integration

```javascript
// Send monitoring data to Datadog
const stats = await getDatabaseStats();
datadogClient.gauge('database.size.bytes', stats.size.bytes);
datadogClient.gauge('database.connections.active', stats.connections.active);
datadogClient.gauge('database.connections.idle', stats.connections.idle);
```

#### Custom Webhook

```bash
# Send monitoring data to webhook
node scripts/monitor-database.js --json | \
  curl -X POST https://your-webhook-url.com/monitoring \
  -H "Content-Type: application/json" \
  -d @-
```

## Best Practices

1. **Monitor Regularly**: Check database health every 15-30 minutes
2. **Set Alerts**: Configure alerts for critical issues
3. **Track Trends**: Monitor database size growth over time
4. **Review Slow Queries**: Investigate and optimize slow queries
5. **Connection Pool**: Monitor connection pool usage
6. **Document Issues**: Keep track of recurring issues

## Troubleshooting

### Monitoring Shows Connection Errors

**Solution**:

- Verify `DATABASE_URL` is correct
- Check database is accessible
- Verify network/firewall settings
- Check Railway service status

### High Connection Count

**Solution**:

- Check for connection leaks in application code
- Review connection pool settings
- Consider increasing pool size if legitimate high usage
- Investigate idle transactions

### Slow Queries Detected

**Solution**:

- Review query execution plans
- Add indexes for frequently queried columns
- Optimize query logic
- Consider query caching

## Next Steps

1. ✅ **Script Ready**: Monitoring script is implemented
2. ⏳ **Set Up Automation**: Choose monitoring method (GitHub Actions recommended)
3. ⏳ **Configure Alerts**: Set up alerts for critical issues
4. ⏳ **Integrate Tools**: Connect to monitoring tools if needed

---

**Conclusion**: Database monitoring system is ready. Set up automated monitoring (GitHub Actions recommended) and configure alerts for production.
