# CLAUDE.md Update Needed

**Date**: 2025-12-30  
**Status**: ⚠️ **OUTDATED - Needs Updates**

## 🔍 Issues Found

### 1. ❌ **Backend Port is Wrong**

**Current in CLAUDE.md**:
- Line 152: `# Backend only (port 8080)`
- Line 230: `PORT=8080`
- Line 244: `VITE_API_URL=http://localhost:8080`
- Line 245: `VITE_WS_URL=ws://localhost:8080`

**Actual in code**:
- `chat-server/config.js`: `DEFAULT_BACKEND_PORT = 3000`
- Backend runs on port **3000**, not 8080

**Fix needed**: Update all references from `8080` to `3000`

### 2. ⚠️ **Frontend .env.example Also Wrong**

**Current in `.env.example`**:
```
VITE_API_URL=http://localhost:3001
```

**Should be**:
```
VITE_API_URL=http://localhost:3000
```

**Fix needed**: Update `.env.example` to match actual backend port

### 3. ✅ **Deployment Info is Correct**

- Frontend: Vercel → coparentliaizen.com ✅
- Backend: Railway → demo-production-6dcd.up.railway.app ✅
- Auto-deploy on push ✅

### 4. ✅ **Folder Structure is Mostly Correct**

- Frontend folders exist: `components/`, `context/`, `hooks/` ✅
- Backend folders exist: `routes/`, `socketHandlers/`, `src/`, `libs/` ✅
- SDD Framework exists ✅
- Views folder exists ✅

### 5. ✅ **Commands are Correct**

- `npm run dev` → `./scripts/start-dev.sh` ✅
- `npm run restart` → `./scripts/restart-servers.sh` ✅
- Testing commands ✅

## 📋 Required Updates

### Update CLAUDE.md

**Line 152**:
```diff
- # Backend only (port 8080)
+ # Backend only (port 3000)
```

**Line 230**:
```diff
- PORT=8080
+ PORT=3000
```

**Line 244**:
```diff
- VITE_API_URL=http://localhost:8080
+ VITE_API_URL=http://localhost:3000
```

**Line 245**:
```diff
- VITE_WS_URL=ws://localhost:8080
+ VITE_WS_URL=ws://localhost:3000
```

### Update .env.example

**chat-client-vite/.env.example**:
```diff
- VITE_API_URL=http://localhost:3001
+ VITE_API_URL=http://localhost:3000
```

## ✅ What's Already Correct

- Project overview ✅
- Security rules ✅
- Architecture description ✅
- Folder structure ✅
- Commands ✅
- Deployment info ✅
- Design system ✅
- Code patterns ✅
- SDD Framework info ✅

## 🎯 Priority

**High Priority**:
1. Port numbers (affects development setup)
2. Environment variable examples (affects new developers)

**Low Priority**:
- Everything else is accurate

## 📝 Summary

**CLAUDE.md is mostly up to date** except for port numbers. The backend port changed from 8080 to 3000, but CLAUDE.md still references the old port. This could confuse developers setting up the project.

**Recommendation**: Update port references immediately to prevent confusion.

