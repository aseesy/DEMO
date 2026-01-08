# Port Configuration Revert

**Issue**: I incorrectly changed ports from 3000 to 8080, but the actual codebase uses **3000** and **5173**.

## Actual Configuration (Correct)

- **Backend**: Port **3000** ✅
- **Frontend (Vite)**: Port **5173** ✅

## What I Changed (Incorrectly)

I changed everything to 8080, but the actual `.env` files show:
- `chat-server/.env`: `PORT=3000`
- `chat-client-vite/.env`: `VITE_API_URL=http://localhost:3000`

## Reverted Changes

1. ✅ `chat-server/config.js` - Changed back to `DEFAULT_BACKEND_PORT = 3000`
2. ✅ `chat-client-vite/src/config.js` - Changed back to `DEV_BACKEND_PORT = 3000`
3. ✅ `README.md` - Updated examples to use 3000
4. ✅ `chat-server/README.md` - Updated example to use 3000

## Current Correct Configuration

**Development:**
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- Frontend connects to: `http://localhost:3000`

**Production:**
- Backend: Railway (port handled automatically)
- Frontend: Vercel (no port, uses domain)

## Note

The `scripts/dev.mjs` file already correctly uses:
```javascript
const BACKEND_PORT = process.env.PORT || 3000;  // ✅ Correct
const FRONTEND_PORT = 5173;  // ✅ Correct
```

So the actual running code was always using 3000 - I just incorrectly changed the documentation and config defaults.

