# Port Configuration Clarification

## Current Port Usage

### Development (Local)

**Frontend (Vite Dev Server):**
- **Port: 5173** ✅
- This is Vite's default port
- Serves the React app during development
- URL: `http://localhost:5173`

**Backend (Node.js/Express):**
- **Port: 8080** ✅ (default, can be overridden with `PORT` env var)
- Serves the API and WebSocket server
- URL: `http://localhost:8080`

**Marketing Site (if running locally):**
- **Port: 5174** (Vite default for second instance)
- URL: `http://localhost:5174`

### Production

**Vercel (Frontend):**
- **No specific port** - Vercel is a hosting platform
- Vercel automatically handles routing and ports
- Your app is built as static files and served via CDN
- URLs: `https://app.coparentliaizen.com` (main app)
- URLs: `https://www.coparentliaizen.com` (marketing site)

**Railway (Backend):**
- **Port: 8080** (or whatever `PORT` env var is set to)
- Railway automatically handles SSL/HTTPS
- URL: `https://demo-production-6dcd.up.railway.app`

## What About Port 3000?

**Port 3000 was the OLD default** for the backend, but we changed it to **8080** for consistency.

**Nothing uses port 3000 anymore** - it's been replaced with 8080.

## Summary

| Service | Development Port | Production |
|---------|-----------------|------------|
| **Frontend (Vite)** | **5173** | Vercel (no port, uses domain) |
| **Backend (Express)** | **8080** | Railway (8080, but behind HTTPS) |
| **Marketing Site** | **5174** | Vercel (no port, uses domain) |
| **Port 3000** | ❌ **Not used** | ❌ **Not used** |

## Why the Confusion?

1. **Old code** had port 3000 hardcoded in `server.js` (now fixed)
2. **Vercel** doesn't use ports - it's a hosting platform, not a server
3. **Vite** uses 5173, not 8080

## Current Configuration

**Backend (`chat-server/config.js`):**
```javascript
const DEFAULT_BACKEND_PORT = 8080;  // ✅ Default is 8080
```

**Frontend (`chat-client-vite/src/config.js`):**
```javascript
const DEV_BACKEND_PORT = 8080;      // ✅ Connects to backend on 8080
const DEV_FRONTEND_PORT = 5173;    // ✅ Vite dev server on 5173
```

**Frontend connects to backend:**
- Development: `http://localhost:8080` (backend)
- Production: `https://demo-production-6dcd.up.railway.app` (backend)

---

**TL;DR:**
- ✅ **Vite uses 5173** (frontend dev server)
- ✅ **Backend uses 8080** (API/WebSocket server)
- ✅ **Vercel uses no port** (it's a hosting platform)
- ❌ **Port 3000 is not used** (old default, removed)

