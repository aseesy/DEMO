# Dev Routes - Quick Summary

## ✅ Created

**File**: `chat-server/routes/dev.js`

**Routes**:
- `POST /__dev/login` - Impersonate/create user session
- `POST /__dev/logout` - Clear session
- `GET /__dev/me` - Get current user (requires auth)
- `GET /__dev/status` - Check if dev routes are enabled

## 🔒 Security

- ✅ Only enabled in `NODE_ENV !== 'production'`
- ✅ Only accessible from localhost/internal IPs
- ✅ All usage is logged
- ✅ Returns 403 in production

## 🚀 Quick Start

### 1. Restart Backend Server

The dev routes are registered in `routeManager.js` but the server needs to be restarted:

```bash
# Stop current server (Ctrl+C)
# Then restart:
cd chat-server
npm start
```

### 2. Test Dev Routes

```bash
# Check status
curl http://localhost:3000/__dev/status

# Create session
curl -X POST http://localhost:3000/__dev/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}' \
  -c cookies.txt

# Test protected API
curl http://localhost:3000/api/user/me -b cookies.txt
```

### 3. Or Use Test Script

```bash
./test-dev-auth.sh
```

## 📚 Full Documentation

See `DEV_TESTING_GUIDE.md` for complete documentation.

## 🎯 Use Cases

1. **Test Auth Guards** - Quickly login without UI
2. **Test Protected Routes** - Verify redirects work
3. **Test Invite System** - Login as different users
4. **Test Session Persistence** - Verify cookies work
5. **Test API Auth** - Verify 401/200 responses

## ⚠️ Important

**Restart the backend server** to load the new dev routes!

