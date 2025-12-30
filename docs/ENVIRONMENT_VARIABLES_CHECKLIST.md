# ✅ Environment Variables Checklist

**Date**: 2025-12-30  
**Status**: 📋 **CHECKLIST**

## ⚠️ Important Distinction

**Config Files** (`vercel.json`, `railway.toml`) = Build/Deploy configuration  
**Environment Variables** = Set separately in Dashboard or via CLI

## ✅ Vercel Environment Variables

### Required Variables

| Variable       | Production  | Preview     | Development | Purpose         |
| -------------- | ----------- | ----------- | ----------- | --------------- |
| `VITE_API_URL` | ✅ Required | ✅ Required | ✅ Required | Backend API URL |

### Optional Variables

| Variable                     | Production | Preview  | Development | Purpose                             |
| ---------------------------- | ---------- | -------- | ----------- | ----------------------------------- |
| `VITE_WS_URL`                | Optional   | Optional | Optional    | WebSocket URL (defaults to API_URL) |
| `VITE_GOOGLE_PLACES_API_KEY` | Optional   | Optional | N/A         | Google Places API                   |

### Current Status

**Check via CLI**:

```bash
cd chat-client-vite
vercel env ls
```

**Set via CLI**:

```bash
cd chat-client-vite
echo "https://demo-production-6dcd.up.railway.app" | vercel env add VITE_API_URL production
echo "https://demo-production-6dcd.up.railway.app" | vercel env add VITE_API_URL preview
echo "http://localhost:3000" | vercel env add VITE_API_URL development
```

**Or use script**:

```bash
./scripts/set-vercel-vars.sh
```

### Expected Values

- **Production**: `VITE_API_URL=https://demo-production-6dcd.up.railway.app`
- **Preview**: `VITE_API_URL=https://demo-production-6dcd.up.railway.app`
- **Development**: `VITE_API_URL=http://localhost:3000`

---

## ✅ Railway Environment Variables

### Required Variables

| Variable       | Value                                                                              | Purpose                                        |
| -------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| `NODE_ENV`     | `production`                                                                       | Environment mode                               |
| `PORT`         | `3000`                                                                             | Server port                                    |
| `FRONTEND_URL` | `https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app` | CORS allowed origins (NO SPACES after commas!) |
| `JWT_SECRET`   | `[32+ characters]`                                                                 | JWT signing secret                             |

### Auto-Provided by Railway

| Variable       | Source                     | Purpose                    |
| -------------- | -------------------------- | -------------------------- |
| `DATABASE_URL` | Railway PostgreSQL service | Database connection string |

### Optional Variables

| Variable               | Purpose              |
| ---------------------- | -------------------- |
| `OPENAI_API_KEY`       | AI features          |
| `EMAIL_SERVICE`        | Email service type   |
| `GMAIL_USER`           | Gmail account        |
| `GMAIL_APP_PASSWORD`   | Gmail app password   |
| `EMAIL_FROM`           | Email sender address |
| `GOOGLE_CLIENT_ID`     | Google OAuth         |
| `GOOGLE_CLIENT_SECRET` | Google OAuth         |
| `NEO4J_URI`            | Neo4j database       |
| `NEO4J_USER`           | Neo4j username       |
| `NEO4J_PASSWORD`       | Neo4j password       |
| `NEO4J_DATABASE`       | Neo4j database name  |

### Current Status

**Check via CLI**:

```bash
railway variables --kv
```

**Set via CLI**:

```bash
railway variables --set "NODE_ENV=production"
railway variables --set "PORT=3000"
railway variables --set "FRONTEND_URL=https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app"
# ... etc
```

**Or use script**:

```bash
./scripts/set-railway-vars.sh
```

### Critical: FRONTEND_URL Format

**✅ Correct**:

```
FRONTEND_URL=https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app
```

**❌ Wrong** (spaces after commas):

```
FRONTEND_URL=https://coparentliaizen.com, https://www.coparentliaizen.com, https://*.vercel.app
```

---

## 📋 Verification Checklist

### Vercel

- [ ] `VITE_API_URL` set for Production
- [ ] `VITE_API_URL` set for Preview
- [ ] `VITE_API_URL` set for Development (optional)
- [ ] `VITE_WS_URL` set (optional)
- [ ] `VITE_GOOGLE_PLACES_API_KEY` set (optional)

### Railway

- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `FRONTEND_URL` includes all Vercel domains (no spaces!)
- [ ] `JWT_SECRET` set (32+ characters)
- [ ] `DATABASE_URL` auto-provided by Railway
- [ ] `OPENAI_API_KEY` set (if using AI features)
- [ ] Email variables set (if using email)
- [ ] Neo4j variables set (if using Neo4j)

---

## 🔍 How to Verify

### Vercel

```bash
cd chat-client-vite
vercel env ls
```

### Railway

```bash
railway variables --kv
```

---

## ⚠️ Important Notes

1. **Config files don't contain env vars**: `vercel.json` and `railway.toml` are build/deploy configs, not env var files
2. **Env vars set separately**: Must be set in Dashboard or via CLI
3. **Vite prefix required**: Frontend env vars must start with `VITE_` to be available in build
4. **No spaces in FRONTEND_URL**: Critical for Railway CORS to work
5. **Railway auto-provides**: `DATABASE_URL` is automatically set when PostgreSQL service is linked

---

## 🚀 Quick Setup

### Vercel

```bash
./scripts/set-vercel-vars.sh
```

### Railway

```bash
./scripts/set-railway-vars.sh
```

Both scripts will set all required variables automatically!
