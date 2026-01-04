# Script Refactoring Proposal

## A) Current Inventory

### Root package.json - Dev/Start/Stop Commands

- `start`: `./scripts/start-dev.sh` ❌ (should be production)
- `dev`: `./scripts/start-dev.sh` ✅ (same as start, redundant)
- `dev:safe`: `./scripts/start-dev-safe.sh` ⚠️ (adds watchdog)
- `dev:stack`: `node chat-server/scripts/dev-stack.js` ❌ (duplicate)
- `stop`: `./scripts/stop-dev.sh` ✅ (fixed port bug)
- `restart`: `./scripts/restart-servers.sh` ✅
- `restart:backend`: `./scripts/restart-servers.sh backend` ✅
- `restart:frontend`: `./scripts/restart-servers.sh frontend` ✅

### Issues Identified

1. **Port Mismatch**: `stop-dev.sh` was checking port 3001 instead of 3000 (FIXED)
2. **Redundancy**: `npm start` and `npm run dev` call same script
3. **Production Confusion**: `npm start` should be for production, not dev
4. **Platform Dependency**: All scripts use bash (not Windows compatible)
5. **Duplicate Implementation**: `dev` vs `dev:stack` do the same thing

### Railway/Vercel Production

- Railway: Uses `node server.js` directly (in railway.toml)
- chat-server/package.json: `"start": "node server.js"` ✅
- Root package.json: `"start"` points to dev script ❌

---

## B) Proposed Canonical Command Map

### New Canonical Commands (Public API)

#### Development

- `npm run dev` - Start all dev servers (frontend + backend)
- `npm run dev:all` - Alias for `dev` (explicit)
- `npm run dev:backend` - Start backend only
- `npm run dev:frontend` - Start frontend only
- `npm run dev:safe` - Start with CPU watchdog (optional safety)

#### Production

- `npm start` - Start production server (Railway/Vercel compatible)
  - Root: calls `npm start -w chat-server` (delegates to workspace)
  - chat-server: runs `node server.js`

#### Stop/Restart

- `npm stop` - Stop all dev servers (cross-platform)
- `npm run restart` - Restart all dev servers
- `npm run restart:backend` - Restart backend only
- `npm run restart:frontend` - Restart frontend only

#### Discovery & Validation

- `npm run help` - Show all canonical commands
- `npm run doctor` - Validate env vars, ports, node version

### Aliases Kept (for compatibility)

- `npm run dev:all` → same as `npm run dev`

### Commands Removed

- `npm start` (root) - **REMOVED** (was dev, now conflicts with production)
  - Use `npm run dev` instead
- `npm run dev:stack` - **REMOVED** (duplicate)

### Deprecation Period

- Old commands will print warning and call new command for 1 version cycle

---

## C) Implementation Strategy

### Cross-Platform Approach

1. **Replace bash scripts with Node.js scripts** (.mjs files)
2. Use Node.js built-in modules (no external deps for port management)
3. Use `child_process.spawn` for cross-platform process management
4. Port detection using native Node.js solutions

### New Script Files

- `scripts/dev.mjs` - Cross-platform dev server starter
- `scripts/stop.mjs` - Cross-platform server stopper
- `scripts/restart.mjs` - Cross-platform server restarter
- `scripts/help.mjs` - Command discovery
- `scripts/doctor.mjs` - Validation and health checks

### Dependencies

- No new dependencies needed (use Node.js native modules)

---

## D) Migration Notes

### For Users

**Old → New:**

```bash
# OLD (deprecated, shows warning)
npm start           → npm run dev
npm run dev:stack   → npm run dev

# NEW (canonical)
npm run dev         # Start all servers
npm run dev:backend # Start backend only
npm run dev:frontend # Start frontend only
npm stop            # Stop servers (cross-platform)
npm run help        # Show commands
npm run doctor      # Validate setup
```

### For Production Deployment

**Railway:**

- Already uses `node server.js` (no change needed)
- `npm start -w chat-server` would also work

**Vercel:**

- Frontend deployment (no change needed)
- Uses build command from vercel.json

---

## E) Acceptance Criteria

✅ **Running `npm run help` shows only canonical commands**  
✅ **`npm run dev` works from repo root**  
✅ **Railway "Start Command" can use `npm start` and runs production server**  
✅ **No script names imply production when they're dev, or vice versa**  
✅ **All scripts work on Mac, Linux, and Windows (via Node.js)**  
✅ **`npm run doctor` validates required setup**

---

## Implementation Checklist

- [ ] Create `scripts/dev.mjs` (cross-platform)
- [ ] Create `scripts/stop.mjs` (cross-platform)
- [ ] Create `scripts/restart.mjs` (cross-platform)
- [ ] Create `scripts/help.mjs`
- [ ] Create `scripts/doctor.mjs`
- [ ] Update root `package.json` with new commands
- [ ] Add deprecation warnings to old commands
- [ ] Update README.md
- [ ] Update COMMANDS.md
- [ ] Test on Mac/Linux
- [ ] Verify Railway production still works
