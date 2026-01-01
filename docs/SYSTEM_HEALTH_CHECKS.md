# System Health Checks

Based on performance issues and problems encountered, here's a comprehensive checklist for maintaining system health.

## Quick Health Check

Run the automated health check script:

```bash
# Full system check
node chat-server/scripts/system-health-check.js --all

# Specific checks
node chat-server/scripts/system-health-check.js --db
node chat-server/scripts/system-health-check.js --performance
node chat-server/scripts/system-health-check.js --sockets
```

## Manual Health Checks

### 1. Database Integrity (Weekly)

```bash
# Run integrity validation
node chat-server/scripts/validate-database-integrity.js
```

**What to check:**
- ✅ No orphaned records (messages without room_id, threads without room_id)
- ✅ Foreign key integrity (all references are valid)
- ✅ Constraint violations (is_archived values, depth values)
- ✅ Email format validation
- ✅ Thread message_count matches actual message count

**Known Issues:**
- Messages without room_id can cause query failures
- Threads with incorrect message_count can cause UI inconsistencies

### 2. Query Performance (Daily)

```bash
# Check slow queries
node chat-server/scripts/monitor-query-performance.js

# Collect metrics
node chat-server/scripts/monitor-query-performance.js --collect-metrics

# Analyze index usage
node chat-server/scripts/monitor-query-performance.js --analyze-indexes
```

**What to check:**
- ✅ Average query time < 100ms
- ✅ No queries > 5 seconds
- ✅ Indexes are being used (not unused)
- ✅ Table sizes are reasonable

**Known Issues:**
- Missing indexes on `messages.room_id` causes slow queries
- Unused indexes waste space and slow writes

### 3. Socket.IO Connection Health (Daily)

**What to check:**
- ✅ No excessive reconnection attempts
- ✅ Connection errors in logs < 10/hour
- ✅ pingTimeout and pingInterval are configured appropriately

**Configuration to verify:**
```javascript
// chat-server/config.js
SOCKET_CONFIG = {
  pingTimeout: 60000,    // Should be >= 30000
  pingInterval: 25000,   // Should be < pingTimeout
  transports: ['websocket', 'polling'],
}
```

**Known Issues:**
- Low pingTimeout causes premature disconnections
- WebSocket connection failures create console spam
- Reconnection loops can overwhelm the server

**Monitoring:**
- Check server logs for "WebSocket connection failed" errors
- Monitor reconnection attempts in client logs
- Check for connection spikes during high traffic

### 4. AutoAssignMessageUseCase Health (Weekly)

**What to check:**
- ✅ No infinite loops (check for messages assigned to same thread repeatedly)
- ✅ Rate limiting is working (max 10 assignments per second per room)
- ✅ Message assignment rate is reasonable (< 1000/hour per room)

**Query to check:**
```sql
-- Check for potential loops (many messages to few threads)
SELECT room_id, thread_id, COUNT(*) as message_count
FROM messages
WHERE thread_id IS NOT NULL
  AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
GROUP BY room_id, thread_id
HAVING COUNT(*) > 100
ORDER BY message_count DESC;
```

**Known Issues:**
- High-traffic bursts can trigger infinite loops
- Concurrent execution can cause duplicate assignments
- Rate limiting prevents system overload

### 5. Authentication Health (Daily)

**What to check:**
- ✅ No excessive logout loops
- ✅ Token expiration is handled correctly
- ✅ Optimistic auth state doesn't cause issues

**Known Issues:**
- Offline users get logged out unnecessarily (fixed with token expiration check)
- Network timeouts trigger auth failures (fixed with optimistic state)

**Monitoring:**
- Check for repeated login/logout cycles in logs
- Monitor 401 error rates
- Check token expiration handling

### 6. Memory and Resource Usage (Daily)

**What to check:**
- ✅ Database size < 10GB (or archiving is enabled)
- ✅ No memory leaks (check Node.js heap size)
- ✅ Connection pool isn't exhausted

**Database size check:**
```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
```

**Archiving:**
```sql
-- Archive messages older than 1 year
SELECT * FROM archive_old_messages(CURRENT_TIMESTAMP - INTERVAL '1 year');
```

**Known Issues:**
- Large message tables slow down queries
- Unarchived old data increases database size
- Connection pool exhaustion causes timeouts

### 7. Error Rate Monitoring (Continuous)

**What to check:**
- ✅ Error rate < 1% of requests
- ✅ No spike in error rates
- ✅ Critical errors are logged and tracked

**Key errors to monitor:**
- Database connection errors
- Socket.IO connection failures
- 401 authentication errors
- 500 server errors

**Known Issues:**
- Socket.IO errors flood console (suppressed in errorMonitor.js)
- Database query errors can cascade
- Authentication errors cause user frustration

## Automated Monitoring Setup

### 1. Schedule Health Checks

Add to cron (runs daily at 2 AM):

```bash
0 2 * * * cd /path/to/chat && node chat-server/scripts/system-health-check.js --all >> logs/health-check.log 2>&1
```

### 2. Enable Query Performance Logging

After running migration 037, integrate slow query logging:

```javascript
// In your query code
const startTime = Date.now();
const result = await db.query('SELECT ...');
const duration = Date.now() - startTime;

if (duration > 100) {
  await db.query('SELECT log_slow_query($1, $2, $3)', [
    'SELECT ...',
    JSON.stringify(params),
    duration
  ]);
}
```

### 3. Set Up Alerts

Configure alerts for:
- Database size > 10GB
- Error rate > 5%
- Average query time > 1 second
- Socket connection failures > 100/hour

## Troubleshooting Guide

### High Error Rate
1. Check database connection pool
2. Review recent migrations
3. Check for constraint violations
4. Review application logs

### Slow Queries
1. Run `EXPLAIN ANALYZE` on slow queries
2. Check index usage
3. Review query patterns
4. Consider adding indexes (migration 034)

### Socket.IO Issues
1. Check pingTimeout/pingInterval settings
2. Review CORS configuration
3. Check for network issues
4. Monitor reconnection attempts

### Database Integrity Issues
1. Run `validate-database-integrity.js`
2. Fix orphaned records
3. Update foreign key constraints
4. Recalculate message counts

## Prevention Checklist

- [ ] Run health checks daily
- [ ] Monitor error rates continuously
- [ ] Review slow queries weekly
- [ ] Archive old data monthly
- [ ] Update indexes as needed
- [ ] Review socket configuration quarterly
- [ ] Test disaster recovery procedures

## Emergency Procedures

### Database Corruption
1. Stop application
2. Run integrity checks
3. Restore from backup if needed
4. Fix data issues
5. Restart application

### Performance Degradation
1. Check for slow queries
2. Review index usage
3. Check connection pool
4. Consider archiving old data
5. Scale resources if needed

### Socket.IO Outage
1. Check server status
2. Review CORS settings
3. Check network connectivity
4. Restart Socket.IO server
5. Monitor reconnection attempts

