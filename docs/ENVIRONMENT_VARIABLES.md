# Environment Variables Guide

## Quick Validation

### Local Environment

Run the validation script to check all local environment variables:

```bash
npm run validate:env
# or
node scripts/validate-env.js
```

### Railway (Production)

Validate Railway environment variables:

```bash
npm run validate:railway
# or
node scripts/validate-railway-env.js
```

**Prerequisites:**

- Railway CLI installed: `npm i -g @railway/cli`
- Authenticated: `railway login`

## Required Variables

### Server (`chat-server/.env`)

#### Critical (Required)

- **`DATABASE_URL`** - PostgreSQL connection string
  - Example: `postgresql://user:password@localhost:5432/dbname`
  - **Status**: ✅ Set

- **`JWT_SECRET`** - Secret key for JWT token signing
  - Example: `your-secret-key-change-in-production`
  - **Status**: ✅ Set

#### Optional (Recommended)

- **`PORT`** - Server port (defaults to 3000)
  - Example: `3000`
  - **Status**: ✅ Set to `3000`

- **`NODE_ENV`** - Node environment
  - Values: `development` | `production`
  - **Status**: ✅ Set to `development`

- **`FRONTEND_URL`** - Comma-separated allowed frontend URLs for CORS
  - Example: `http://localhost:5173,http://localhost:5174`
  - **Status**: ✅ Set

### Client (`chat-client-vite/.env` or `.env.local`)

#### Optional (Recommended)

- **`VITE_API_URL`** - Backend API URL
  - Example: `http://localhost:3000`
  - **Status**: ✅ Set (but has trailing `\n` - see issues below)
  - **Default**: `http://localhost:3000` (from `config.js`)

- **`VITE_WS_URL`** - WebSocket URL (defaults to `VITE_API_URL`)
  - Example: `ws://localhost:3000`
  - **Status**: ✅ Set (but has trailing `\n` - see issues below)

## Current Status

### ✅ All Required Variables Set

**Server:**

- ✅ `DATABASE_URL` - Set
- ✅ `JWT_SECRET` - Set
- ✅ `PORT` - Set to `3000`
- ✅ `NODE_ENV` - Set to `development`
- ✅ `FRONTEND_URL` - Set

**Client:**

- ✅ `VITE_API_URL` - Set to `http://localhost:3000`

## Known Issues

### ⚠️ Trailing Newlines in Client .env

The client `.env` file has trailing `\n` characters in some values:

- `VITE_API_URL="http://localhost:3000\n"`
- `VITE_WS_URL="ws://localhost:3000\n"`

**Impact**: Vite should handle this correctly, but it's not ideal.

**Fix**: Remove the trailing `\n` from the `.env` file values.

## Optional Variables

### Server

- `OPENAI_API_KEY` - ✅ Set (if using OpenAI features)
- `ANTHROPIC_API_KEY` - ○ Not set (if using Anthropic features)
- `EMAIL_SERVICE` - ✅ Set to `gmail`
- `GMAIL_USER` - ✅ Set
- `GMAIL_APP_PASSWORD` - ✅ Set
- `NEO4J_URI` - ✅ Set
- `NEO4J_USER` - ✅ Set
- `NEO4J_PASSWORD` - ✅ Set

### Client

- `VITE_GOOGLE_TAG` - ✅ Set
- `VITE_GA_MEASUREMENT_ID` - ✅ Set
- `VITE_GOOGLE_PLACES_API_KEY` - ✅ Set
- `VITE_VAPID_PUBLIC_KEY` - ○ Not set (for push notifications)
- `VITE_DEBUG_AUTH` - ○ Not set (for auth debugging)

## How to Check Variables

### Local Environment

#### Manual Check

```bash
# Server
cd chat-server && cat .env | grep -v "^#" | grep -v "^$"

# Client
cd chat-client-vite && cat .env .env.local 2>/dev/null | grep -v "^#" | grep -v "^$"
```

#### Automated Validation

```bash
# Run validation script
npm run validate:env
```

### Railway (Production)

#### Manual Check

```bash
# List all Railway variables
railway variables

# Check specific variable
railway variables | grep DATABASE_URL
```

#### Automated Validation

```bash
# Run Railway validation script
npm run validate:railway
```

**Note**: Requires Railway CLI and authentication.

## Configuration Flow

1. **Server** reads from `chat-server/.env`
   - Loaded via `dotenv` in `config.js`
   - Used in `server.js` and throughout server code

2. **Client** reads from `chat-client-vite/.env` or `.env.local`
   - Loaded by Vite at build/dev time
   - Accessed via `import.meta.env.VITE_*`
   - Processed in `config.js` for application use

## Port Configuration

- **Server Port**: `PORT` env var (default: 3000)
- **Client Dev Port**: Vite default (5173)
- **Client API URL**: `VITE_API_URL` (default: `http://localhost:3000`)

**Important**: 
- Backend runs on port **3000** (default)
- Frontend (Vite) runs on port **5173** (Vite default)
- Frontend connects to backend at `http://localhost:3000`
