# LiaiZen Invite System Audit

## Date: December 18, 2025

## Summary

Fixed two critical bugs in the invite acceptance flow:

1. **Wrong function called** - The `/api/auth/register-with-invite` endpoint was calling `registerWithInvitation()` (which CREATES invites) instead of functions that ACCEPT invites.

2. **Duplicate room creation** - When accepting an invite, a private room was being created BEFORE the shared room, causing users to land in their private room instead of the shared co-parent room.

---

## System Architecture

### Two Parallel Invite Systems

| System          | Table              | Routes               | Library                    | Purpose         |
| --------------- | ------------------ | -------------------- | -------------------------- | --------------- |
| **Invitations** | `invitations`      | `/api/invitations/*` | `libs/invitation-manager/` | Original system |
| **Pairing**     | `pairing_sessions` | `/api/pairing/*`     | `libs/pairing-manager/`    | Newer system    |

Both systems support tokens (long URLs) and codes (short like LZ-XXXX).

---

## Bug #1: Wrong Registration Function (FIXED)

**Location:** `routes/auth/verification.js`  
**Endpoint:** `POST /api/auth/register-with-invite`

### Before (Broken)

```javascript
// Called registerWithInvitation which CREATES invites, not accepts them
const result = await auth.registerWithInvitation(
  {
    email,
    password,
    displayName,
    inviteToken,
    inviteCode,
  },
  db
);
```

### After (Fixed)

The endpoint now:

1. Validates input (email format, password strength)
2. Checks which system the token/code belongs to
3. Routes to the correct registration function

---

## Bug #2: Duplicate Room Creation (FIXED)

**Problem:** Users were ending up in a private room instead of the shared co-parent room.

**Root Cause:**

1. `registerFromPairingCode()` called `createUserWithEmail()`
2. `createUserWithEmail()` → `createUser()` → `setupUserContextAndRoom()`
3. `setupUserContextAndRoom()` created a **private room**
4. THEN `pairingManager.acceptByCode()` created the **shared room**
5. User had TWO rooms; `getUser()` returned the first (private) one

### Solution

Created `createUserWithEmailNoRoom()` that:

- Creates the user account
- Creates user_context record
- Does NOT create any room

The pairing functions now use `createUserWithEmailNoRoom()` so only the shared room is created.

---

## Registration Functions Reference

| Function                    | Purpose                     | Creates Room?     |
| --------------------------- | --------------------------- | ----------------- |
| `createUserWithEmail`       | Standalone signup           | YES (private)     |
| `createUserWithEmailNoRoom` | Invite acceptance           | NO                |
| `registerWithInvitation`    | Create user AND send invite | YES (private)     |
| `registerFromInvitation`    | Accept invite token         | YES (shared only) |
| `registerFromShortCode`     | Accept short code (LZ-XXX)  | YES (shared only) |
| `registerFromPairing`       | Accept pairing token        | YES (shared only) |
| `registerFromPairingCode`   | Accept pairing code         | YES (shared only) |

---

## Files Modified

| File                          | Change                                               |
| ----------------------------- | ---------------------------------------------------- |
| `routes/auth/verification.js` | Complete rewrite of `/register-with-invite` endpoint |
| `auth/registration.js`        | Added `createUserWithEmailNoRoom()` function         |
| `auth/pairing.js`             | Updated to use `createUserWithEmailNoRoom()`         |
| `auth.js`                     | Exported new functions                               |
| `docs/INVITE_SYSTEM_AUDIT.md` | This document                                        |

---

## Flow Diagram

```
POST /api/auth/register-with-invite
          │
          ├── inviteCode provided?
          │   │
          │   ├── invitationManager.validateByShortCode() valid?
          │   │   └── YES → auth.registerFromShortCode()
          │   │              └── createUserWithEmailNoRoom() (no private room)
          │   │              └── invitationManager.acceptByShortCode() (creates shared room)
          │   │
          │   └── pairingManager.validateCode() valid?
          │       └── YES → auth.registerFromPairingCode()
          │                  └── createUserWithEmailNoRoom() (no private room)
          │                  └── pairingManager.acceptByCode() (creates shared room)
          │
          └── inviteToken provided?
              │
              ├── invitationManager.validateToken() valid?
              │   └── YES → auth.registerFromInvitation() (creates shared room in transaction)
              │
              └── pairingManager.validateToken() valid?
                  └── YES → auth.registerFromPairing()
                             └── createUserWithEmailNoRoom() (no private room)
                             └── pairingManager.acceptByToken() (creates shared room)
```

---

## Testing Checklist

- [x] Register via invitation code
- [ ] Register via invitation token (email link)
- [ ] Register via pairing token
- [ ] Register via pairing code
- [ ] Verify user lands in SHARED room (not private room)
- [ ] Verify both co-parents see each other in room
- [ ] Expired token returns proper error
- [ ] Already-used code returns proper error
- [ ] Invalid code returns proper error
- [ ] Email already exists returns 409
- [ ] Weak password returns validation error

---

## Future Recommendations

### Short-term

- Add integration tests for all registration paths
- Monitor for any remaining room-related issues

### Long-term

- Consider consolidating invitation + pairing systems
- Rename `registerWithInvitation` → `registerAndInviteCoParent` for clarity
