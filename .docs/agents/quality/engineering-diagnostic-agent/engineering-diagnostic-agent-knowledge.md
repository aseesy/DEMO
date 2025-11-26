# Engineering Diagnostic Agent - Knowledge Base

**Agent**: engineering-diagnostic-agent
**Department**: quality
**Created**: 2025-11-26

---

## LiaiZen System Architecture

### Frontend (chat-client-vite/)
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io-client
- **State**: React hooks and context
- **Deployment**: Vercel

### Backend (chat-server/)
- **Framework**: Node.js 18+ with Express.js
- **Real-time**: Socket.io
- **Database**: SQLite (migrating to PostgreSQL)
- **AI Services**: OpenAI API
- **Email**: Nodemailer (Gmail)
- **Deployment**: Railway

---

## Common Error Patterns

### 1. CORS Errors

**Pattern**: `Access to XMLHttpRequest at 'X' from origin 'Y' has been blocked by CORS policy`

**Common Causes**:
- Missing CORS headers in server response
- Incorrect origin whitelist
- Preflight request failing

**Diagnostic Steps**:
1. Check `chat-server/server.js` for CORS configuration
2. Verify allowed origins match frontend URL
3. Check preflight OPTIONS handling

**Resolution Path**: backend-architect

---

### 2. WebSocket Disconnection

**Pattern**: `WebSocket connection closed` or `Socket.io disconnect`

**Common Causes**:
- Server restart during connection
- Network instability
- Heartbeat timeout
- Room cleanup issues

**Diagnostic Steps**:
1. Check `chat-server/roomManager.js` for room management
2. Verify Socket.io ping/pong configuration
3. Review server logs for restart events

**Resolution Path**: backend-architect or devops-engineer

---

### 3. Authentication Failures

**Pattern**: `401 Unauthorized` or `Invalid token`

**Common Causes**:
- Expired JWT token
- Invalid credentials
- Missing Authorization header
- Token not refreshed

**Diagnostic Steps**:
1. Check `chat-server/auth.js` for token validation
2. Verify JWT secret configuration
3. Check token expiration settings

**Resolution Path**: backend-architect or security-specialist

---

### 4. Database Connection Issues

**Pattern**: `SQLITE_ERROR` or `Connection refused`

**Common Causes**:
- Database file not found
- Permission issues
- Connection pool exhausted
- Migration not run

**Diagnostic Steps**:
1. Check `chat-server/db.js` for connection setup
2. Verify database file exists
3. Check `chat-server/migrations/` for pending migrations

**Resolution Path**: database-specialist

---

### 5. AI Mediation Failures

**Pattern**: `OpenAI API error` or message rewriting failures

**Common Causes**:
- Invalid API key
- Rate limiting
- Prompt issues
- Network timeout

**Diagnostic Steps**:
1. Check `chat-server/aiMediator.js` for API configuration
2. Verify OPENAI_API_KEY environment variable
3. Check API rate limits and quotas

**Resolution Path**: backend-architect

---

## Key Files Reference

| Purpose | File Path |
|---------|-----------|
| Main server | `chat-server/server.js` |
| Authentication | `chat-server/auth.js` |
| Database | `chat-server/db.js`, `chat-server/dbSafe.js` |
| Room management | `chat-server/roomManager.js` |
| AI mediation | `chat-server/aiMediator.js` |
| User context | `chat-server/userContext.js` |
| Email service | `chat-server/emailService.js` |
| Frontend app | `chat-client-vite/src/App.jsx` |
| Chat room UI | `chat-client-vite/src/ChatRoom.jsx` |
| API client | `chat-client-vite/src/apiClient.js` |
| Auth hooks | `chat-client-vite/src/hooks/useAuth.js` |
| Chat hooks | `chat-client-vite/src/hooks/useChat.js` |

---

## Environment Configuration

### Local Development
- Backend: `http://localhost:8080`
- Frontend: `http://localhost:5173`
- Database: SQLite local file

### Production (Railway/Vercel)
- Backend: `https://demo-production-6dcd.up.railway.app`
- Frontend: `https://coparentliaizen.com`
- Database: PostgreSQL (Railway)

---

## Diagnostic Commands

```bash
# Check server health
curl -v http://localhost:8080/api/health

# Test database connection
node chat-server/test-postgres-connection.js

# View recent logs
tail -100 chat-server/logs/app.log

# Check environment variables
printenv | grep -E "(DATABASE|JWT|OPENAI|API)"

# Test WebSocket connection
wscat -c ws://localhost:8080
```

---

## Issue History

Track recurring issues here for pattern recognition.

| Date | Issue | Root Cause | Fix Applied | Recurred? |
|------|-------|------------|-------------|-----------|
| - | - | - | - | - |

---

*Last Updated: 2025-11-26*
