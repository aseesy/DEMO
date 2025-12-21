# Testing Guide

Quick reference for testing the LiaiZen chat server.

---

## Quick Tests

### Health Check

```bash
curl https://demo-production-6dcd.up.railway.app/health
```

Expected response:

```json
{ "status": "ok", "timestamp": "2025-11-26T..." }
```

### API Info

```bash
curl https://demo-production-6dcd.up.railway.app/api/info
```

Expected response:

```json
{ "name": "Multi-User Chat Server", "version": "1.0.0", "activeUsers": 0 }
```

---

## Message Persistence Test

### Automated Test

```bash
cd chat-server
node test-message-persistence.js
```

This will verify:

- ✅ Server health
- ✅ API connectivity
- ✅ Database connection
- ✅ Messages table structure
- ✅ Message count and samples

### Manual Test Instructions

```bash
node test-message-persistence.js --manual
```

Displays step-by-step instructions for manually testing message persistence through the web interface.

---

## Database Tests

### PostgreSQL Connection Test

```bash
cd chat-server
node test-postgres-connection.js
```

This checks:

- Database connectivity
- PostgreSQL version
- Existing tables
- Connection configuration

### Check Database Tables

```bash
# Via test script (shows all tables)
node test-postgres-connection.js

# Or connect directly with psql
psql $DATABASE_URL
\dt  # List tables
\d messages  # Describe messages table
SELECT COUNT(*) FROM messages;  # Count messages
```

---

## Server Logs

### View Railway Logs

1. Go to https://railway.app
2. Select project: LiaiZen Chat Server
3. Click "Deployments" → Latest deployment
4. View logs in real-time

### Important Log Messages

**Success indicators:**

```
💾 Saved new message [id] to database
📜 Loading [N] messages for room [room-id]
✅ Loaded [N] messages from database
```

**Error indicators:**

```
❌ Error saving message to database
❌ Error loading messages from database
⚠️ Extended message columns not available
```

---

## Frontend Testing

### Local Development

```bash
cd chat-client-vite
npm run dev
# Open http://localhost:5173
```

### Production

Open: https://coparentliaizen.com

### Test Message Persistence

1. Login to app
2. Send test messages
3. Refresh browser (F5)
4. Verify messages reload
5. Close browser completely
6. Reopen and login
7. Verify messages still present

---

## Common Test Scenarios

### Test 1: Basic Message Persistence

1. Send message
2. Refresh page
3. Verify message is still there

**Expected:** ✅ Message persists

### Test 2: Multi-User Persistence

1. User A sends message
2. User B refreshes page
3. User B sees User A's message

**Expected:** ✅ Both users see same history

### Test 3: Session Persistence

1. Send messages
2. Logout
3. Close browser
4. Reopen, login again
5. Verify messages still there

**Expected:** ✅ Messages persist across sessions

### Test 4: AI Mediation Persistence

1. Send message that triggers AI mediation
2. View AI tips/rewrite suggestions
3. Refresh page
4. Verify AI data is preserved

**Expected:** ✅ AI mediation data persists

### Test 5: Room Isolation

1. User A in Room 1 sends message
2. User B in Room 2 sends message
3. Each user refreshes
4. Verify users only see their room's messages

**Expected:** ✅ Messages isolated by room

---

## API Testing

### Test Endpoints

```bash
# Health
curl https://demo-production-6dcd.up.railway.app/health

# API Info
curl https://demo-production-6dcd.up.railway.app/api/info

# Debug Rooms (development only)
curl https://demo-production-6dcd.up.railway.app/api/debug/rooms

# Debug Users (development only)
curl https://demo-production-6dcd.up.railway.app/api/debug/users
```

### Test with Authentication

For endpoints requiring authentication, you need a JWT token:

```bash
# Login and get token
TOKEN=$(curl -X POST https://demo-production-6dcd.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}' | jq -r '.token')

# Use token in request
curl https://demo-production-6dcd.up.railway.app/api/protected-endpoint \
  -H "Authorization: Bearer $TOKEN"
```

---

## Performance Testing

### Message Load Testing

```bash
# Run the persistence test multiple times
for i in {1..10}; do
  echo "Run $i"
  node test-message-persistence.js
  sleep 5
done
```

### Socket.io Load Testing

Use a tool like `socket.io-client` to simulate multiple concurrent users:

```javascript
const io = require('socket.io-client');

// Connect multiple clients
for (let i = 0; i < 10; i++) {
  const socket = io('https://demo-production-6dcd.up.railway.app');
  socket.emit('message', { text: `Test message ${i}` });
}
```

---

## Debugging Tips

### Messages Not Persisting?

1. **Check server logs** for error messages
2. **Verify DATABASE_URL** is set correctly
3. **Run database test** to check connection
4. **Check table structure** for missing columns
5. **Verify migrations** have run successfully

### Connection Issues?

1. **Check CORS settings** in server.js
2. **Verify allowed origins** include your frontend URL
3. **Check Socket.io configuration**
4. **Test with curl** to isolate frontend vs backend issues

### AI Mediation Not Working?

1. **Verify OPENAI_API_KEY** is set
2. **Check API quota/limits**
3. **Review server logs** for AI-related errors
4. **Test with simple message** first

---

## Test Checklist

Before deploying to production:

- [ ] Health check returns 200 OK
- [ ] API info endpoint responds
- [ ] Database connection works
- [ ] Messages table has all columns
- [ ] Can save messages to database
- [ ] Can load messages from database
- [ ] Messages persist across page refresh
- [ ] Messages persist across sessions
- [ ] Room isolation works correctly
- [ ] AI mediation data persists
- [ ] Multiple users see same history
- [ ] CORS allows frontend domain
- [ ] Authentication works
- [ ] Rate limiting is functional
- [ ] Server logs are accessible

---

## Continuous Monitoring

### Set Up Alerts

Monitor these metrics:

- Server uptime
- Database connection status
- Message save success rate
- API response times
- Error rates

### Regular Health Checks

Run automated tests daily:

```bash
# Add to cron or CI/CD
0 9 * * * cd /path/to/chat-server && node test-message-persistence.js
```

---

## Resources

- **Test Script:** `chat-server/test-message-persistence.js`
- **DB Test Script:** `chat-server/test-postgres-connection.js`
- **Full Test Report:** `/MESSAGE_PERSISTENCE_TEST_REPORT.md`
- **Server Code:** `chat-server/server.js`
- **Message Store:** `chat-server/messageStore.js`
- **Database Module:** `chat-server/dbPostgres.js`

---

**Last Updated:** 2025-11-26
**Maintained By:** Development Team
