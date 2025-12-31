# 🍎 Safari ITP Token Recovery Strategy

**Date**: 2025-12-30  
**Status**: ⚠️ **CRITICAL ISSUE IDENTIFIED**

## 🐛 Problem

Safari's Intelligent Tracking Prevention (ITP) can clear `localStorage` without warning, especially for:
- PWAs on iOS Safari
- Cross-site tracking scenarios
- After 7 days of inactivity (ITP 2.0+)

**Current Implementation Issues**:
1. Token only stored in `localStorage` (`auth_token_backup`)
2. No backup storage mechanism
3. Race condition: If ITP clears storage between token set and app initialization, session dies
4. No detection/recovery mechanism

---

## 🔍 Current State Analysis

### Token Storage
- **Primary**: `localStorage.getItem('auth_token_backup')`
- **Backup**: None ❌
- **Recovery**: None ❌

### Race Condition Scenarios

**Scenario 1: ITP Clears During Login**
```
1. User logs in → token set to localStorage
2. ITP clears localStorage (immediate)
3. App initializes → tokenManager.initialize() finds no token
4. Session dies → user forced to login again
```

**Scenario 2: ITP Clears After Login**
```
1. User logs in → token set to localStorage
2. User closes app
3. ITP clears localStorage (after 7 days or cross-site)
4. User reopens app → no token found
5. Session dies → user forced to login again
```

**Scenario 3: Race Condition on App Start**
```
1. App starts → tokenManager.initialize() runs
2. ITP clears localStorage (during initialization)
3. TokenManager finds no token
4. AuthContext loads → no token → clears auth state
5. User appears logged out even though token was valid
```

---

## ✅ Solution: Multi-Storage Strategy

### Strategy Overview

1. **Primary Storage**: `localStorage` (fast, synchronous)
2. **Backup Storage**: `sessionStorage` (survives ITP clearing localStorage)
3. **Recovery Storage**: `IndexedDB` (persistent, survives ITP)
4. **In-Memory Cache**: `tokenManager` cache (instant access)

### Implementation Plan

#### 1. **Enhanced TokenManager** (`tokenManager.js`)

**Add Multi-Storage Support**:
```javascript
// Storage priority:
// 1. In-memory cache (fastest)
// 2. localStorage (primary)
// 3. sessionStorage (backup)
// 4. IndexedDB (recovery)
```

**Features**:
- Write to all storage types synchronously
- Read from all storage types (fallback chain)
- Detect ITP clearing (storage event listener)
- Auto-recover from backup storage

#### 2. **ITP Detection** (`AuthContext.jsx`)

**Add Storage Event Listener**:
```javascript
// Listen for storage clearing events
window.addEventListener('storage', (e) => {
  if (e.key === 'auth_token_backup' && e.newValue === null) {
    // ITP cleared localStorage - recover from backup
    recoverTokenFromBackup();
  }
});
```

#### 3. **Periodic Token Sync**

**Background Sync**:
- Every 30 seconds: Sync token to all storage types
- On visibility change: Verify token exists in all storages
- On focus: Recover from backup if primary missing

#### 4. **PWA-Specific Handling**

**iOS Safari PWA**:
- Use `sessionStorage` as primary (more reliable)
- Use `IndexedDB` for long-term persistence
- Detect standalone mode and adjust strategy

---

## 🔧 Implementation Details

### Storage Priority Order

1. **In-Memory Cache** (`tokenCache`)
   - Fastest access
   - Cleared on page reload

2. **localStorage** (`auth_token_backup`)
   - Primary storage
   - Survives page reload
   - ❌ Cleared by ITP

3. **sessionStorage** (`auth_token_backup`)
   - Backup storage
   - Survives page reload
   - ✅ Survives ITP clearing localStorage

4. **IndexedDB** (`auth_tokens` table)
   - Recovery storage
   - Most persistent
   - ✅ Survives ITP clearing localStorage

### Recovery Flow

```
1. TokenManager.getToken() called
2. Check in-memory cache → if found, return
3. Check localStorage → if found, return and cache
4. Check sessionStorage → if found, return and sync to localStorage
5. Check IndexedDB → if found, return and sync to all storages
6. Return null (no token found)
```

### Sync Flow

```
1. Token set → write to all storages synchronously
2. Background sync → every 30s, verify all storages have token
3. Storage event → if localStorage cleared, recover from backup
4. Visibility change → verify token exists, recover if missing
```

---

## 📋 Implementation Checklist

### Phase 1: Multi-Storage Support
- [ ] Update `tokenManager.js` to support multiple storage types
- [ ] Add `sessionStorage` backup
- [ ] Add `IndexedDB` recovery storage
- [ ] Implement fallback chain (localStorage → sessionStorage → IndexedDB)

### Phase 2: ITP Detection
- [ ] Add storage event listener in `AuthContext.jsx`
- [ ] Detect localStorage clearing
- [ ] Auto-recover from backup storage
- [ ] Log ITP events for monitoring

### Phase 3: Periodic Sync
- [ ] Add background sync (30s interval)
- [ ] Sync token to all storage types
- [ ] Verify token exists in all storages
- [ ] Recover from backup if primary missing

### Phase 4: PWA-Specific Handling
- [ ] Detect iOS Safari PWA mode
- [ ] Use sessionStorage as primary for PWA
- [ ] Add IndexedDB persistence for PWA
- [ ] Test on iOS Safari PWA

### Phase 5: Testing
- [ ] Test ITP clearing localStorage
- [ ] Test recovery from sessionStorage
- [ ] Test recovery from IndexedDB
- [ ] Test race conditions
- [ ] Test PWA on iOS Safari

---

## 🎯 Expected Behavior After Fix

1. ✅ Token survives ITP clearing localStorage
2. ✅ Auto-recovery from backup storage
3. ✅ No forced logouts due to ITP
4. ✅ Race conditions handled gracefully
5. ✅ PWA users on iOS Safari maintain sessions

---

## 🔄 Migration Strategy

**Backward Compatibility**:
- Keep `localStorage` as primary (existing code works)
- Add backup storage silently (no breaking changes)
- Migrate existing tokens to backup storage on first load

**Rollout**:
1. Deploy multi-storage support
2. Monitor ITP events in production
3. Verify recovery success rate
4. Optimize based on real-world usage

