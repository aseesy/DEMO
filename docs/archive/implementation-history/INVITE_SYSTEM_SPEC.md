# Production-Grade Invite System Specification

## 1. Invite URL Format

**Format**: `/accept-invite?token=<TOKEN>`

**Example**: `/accept-invite?token=0f9e6e285123f2d8fde4bd608b135bfc5d5822ac8f0371379b8f28f6514d5e8a`

**Alternative**: `/accept-invite?code=<CODE>` (for short codes like `LZ-842396`)

**Note**: The token is a 64-character hex string (32 bytes). It is hashed with SHA-256 before storage.

---

## 2. State Machine: What Happens in Each State

### State 1: Not Logged In + No Account

**Scenario**: User clicks invite link, has no account, not authenticated

**Flow**:
1. User lands on `/accept-invite?token=...`
2. System validates token (checks existence, expiration, revocation, usage)
3. If valid: Show signup form with invitation context
   - Display: "You've been invited to join [Inviter Name] on LiaiZen"
   - Pre-fill email if `parent_b_email` is set in pairing session
   - Show "Sign up to accept" button
4. User fills form and submits
5. System creates account AND accepts invitation in single transaction
6. **Redirect**: `/` (dashboard) - NOT home page

**Error Cases**:
- Invalid token → Show error page with "Invalid invitation link"
- Expired token → Show error page with "This invitation has expired"
- Revoked token → Show error page with "This invitation has been cancelled"
- Already used → Show error page with "This invitation has already been used"

---

### State 2: Not Logged In + Already Has Account

**Scenario**: User clicks invite link, has account but not logged in

**Flow**:
1. User lands on `/accept-invite?token=...`
2. System validates token
3. If valid: Show login prompt with invitation context
   - Display: "You've been invited to join [Inviter Name] on LiaiZen"
   - Show "Log in to accept" button
   - Store `returnUrl=/accept-invite?token=...` in sessionStorage
4. User clicks "Log in"
5. Redirect to `/signin?returnUrl=/accept-invite?token=...`
6. After login, redirect back to `/accept-invite?token=...`
7. System auto-accepts invitation (user is now authenticated)
8. **Redirect**: `/` (dashboard)

**Email Enforcement**:
- If `parent_b_email` is set in pairing session:
  - After login, check if logged-in user's email matches `parent_b_email` (case-insensitive)
  - If match: Proceed with acceptance
  - If no match: Show "Wrong account" error (State 3)

**Error Cases**: Same as State 1

---

### State 3: Logged In + Wrong Account

**Scenario**: User is logged in, but their email doesn't match the invitation

**Flow**:
1. User lands on `/accept-invite?token=...` (already authenticated)
2. System validates token
3. System checks if `parent_b_email` is set
4. If set: Compare logged-in user's email with `parent_b_email` (case-insensitive)
5. If no match:
   - Show error page: "This invitation was sent to [email]. You're logged in as [current_email]"
   - Show buttons:
     - "Switch Account" → Logout and redirect to `/accept-invite?token=...`
     - "Cancel" → Redirect to `/` (dashboard)

**Note**: If `parent_b_email` is NOT set (link invitation), allow any user to accept.

---

### State 4: Logged In + Correct Account

**Scenario**: User is logged in and email matches (or no email restriction)

**Flow**:
1. User lands on `/accept-invite?token=...` (already authenticated)
2. System validates token
3. System checks email match (if `parent_b_email` is set)
4. If match (or no restriction):
   - Auto-accept invitation
   - Show success message: "You've been connected with [Inviter Name]"
   - **Redirect**: `/` (dashboard) - NOT home page

**Error Cases**: Same as State 1

---

### State 5: Expired/Invalid Token

**Scenario**: Token doesn't exist, expired, or malformed

**Flow**:
1. User lands on `/accept-invite?token=...`
2. System validates token
3. If invalid/expired:
   - Show error page with specific message:
     - "Invalid invitation link" (token not found)
     - "This invitation has expired" (expired)
     - "This invitation has been cancelled" (revoked)
   - Show buttons:
     - "Sign In" → Redirect to `/signin`
     - "Go Home" → Redirect to `/` (only if authenticated)

**Note**: Never redirect to home automatically. Always show error page first.

---

### State 6: Already Accepted Invite

**Scenario**: Invitation was already accepted (status = 'active')

**Flow**:
1. User lands on `/accept-invite?token=...`
2. System validates token
3. If status = 'active':
   - Show message: "You've already accepted this invitation"
   - Show button: "Go to Dashboard" → Redirect to `/`
   - If not logged in: Show "Sign In" button

---

## 3. Redirect Rules Summary

| State | Redirect Destination | Why |
|-------|---------------------|-----|
| State 1 (New user signup) | `/` (dashboard) | User just created account and accepted invite |
| State 2 (Existing user login) | `/` (dashboard) | User logged in and accepted invite |
| State 3 (Wrong account) | Stay on error page | User needs to switch accounts |
| State 4 (Correct account) | `/` (dashboard) | User accepted invite successfully |
| State 5 (Invalid/expired) | Stay on error page | Show error, don't redirect |
| State 6 (Already accepted) | `/` (if logged in) or stay on page | User already accepted |

**Critical Rule**: Never redirect to home (`/`) automatically when there's an error. Always show error page first.

---

## 4. ReturnUrl/Next Handling

### Flow Through Auth

1. **User clicks invite link while logged out**:
   - Store `returnUrl=/accept-invite?token=...` in sessionStorage
   - Key: `RETURN_URL`
   - TTL: 1 hour

2. **User clicks "Log in to accept"**:
   - Navigate to `/signin?returnUrl=/accept-invite?token=...`
   - Store returnUrl in sessionStorage as backup

3. **After successful login**:
   - Check sessionStorage for `RETURN_URL`
   - If exists and starts with `/accept-invite`: Navigate there
   - Otherwise: Navigate to `/` (dashboard)

4. **After successful signup**:
   - Check sessionStorage for `RETURN_URL`
   - If exists and starts with `/accept-invite`: Navigate there
   - Otherwise: Navigate to `/` (dashboard)

5. **If returnUrl is missing**:
   - Show error: "We couldn't find your invitation. Please check your email for a new link."
   - Show button: "Go to Dashboard" (if authenticated) or "Sign In"

---

## 5. Data Model Requirements

### pairing_sessions Table (Enhanced)

```sql
CREATE TABLE pairing_sessions (
    id SERIAL PRIMARY KEY,
    pairing_code VARCHAR(10) UNIQUE NOT NULL,
    parent_a_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_b_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_b_email TEXT,  -- Email restriction (if set, must match)
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    invite_type VARCHAR(20) NOT NULL,
    invite_token VARCHAR(64) UNIQUE,  -- SHA-256 hash
    invited_by_username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    shared_room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,  -- NEW: For revocation
    max_uses INTEGER DEFAULT 1,  -- NEW: Single-use by default
    use_count INTEGER DEFAULT 0,  -- NEW: Track usage
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL  -- NEW: Track creator
);
```

### Security Requirements

1. **Token Generation**:
   - 32 random bytes (64 hex characters)
   - Cryptographically secure random generator
   - Never logged or exposed in error messages

2. **Token Storage**:
   - Stored as SHA-256 hash (64 hex characters)
   - Never store raw token in database
   - Index on `invite_token` for fast lookup

3. **Validation Rules**:
   - Token exists (hash found in DB)
   - Not expired (`expires_at > NOW()`)
   - Not revoked (`revoked_at IS NULL`)
   - Not already used (`use_count < max_uses` OR `status != 'active'`)
   - Status is 'pending' (not 'active', 'canceled', 'expired')

4. **Email Enforcement**:
   - If `parent_b_email` is set: Logged-in user's email must match (case-insensitive)
   - If `parent_b_email` is NULL: Any user can accept (link invitation)

---

## 6. API Endpoints

### GET /accept-invite (Frontend Route)

**Purpose**: Display invitation acceptance page

**Query Params**:
- `token`: Invitation token (64 hex characters)
- `code`: Short pairing code (optional, alternative to token)

**Behavior**:
- Validates token/code
- Shows appropriate UI based on auth state and validation result
- Never redirects automatically on error

---

### GET /api/pairing/validate-token/:token

**Purpose**: Validate invitation token (public endpoint)

**Response**:
```json
{
  "valid": true,
  "code": "VALID",
  "inviterName": "John Doe",
  "inviterUsername": "johndoe",
  "inviterEmailDomain": "example.com",
  "inviteType": "link",
  "expiresAt": "2026-01-13T12:00:00Z",
  "parentBEmail": "invitee@example.com"  // If set
}
```

**Error Response**:
```json
{
  "valid": false,
  "code": "EXPIRED",
  "error": "This invitation has expired"
}
```

**Error Codes**:
- `TOKEN_REQUIRED`: Token missing
- `INVALID_TOKEN`: Token not found
- `EXPIRED`: Token expired
- `REVOKED`: Token revoked
- `ALREADY_ACCEPTED`: Already used
- `ALREADY_PAIRED`: Users already paired
- `SELF_PAIRING`: Cannot pair with self

---

### POST /api/invites/accept

**Purpose**: Accept invitation (requires authentication)

**Auth**: Required (JWT token in Authorization header)

**Request Body**:
```json
{
  "token": "0f9e6e285123f2d8fde4bd608b135bfc5d5822ac8f0371379b8f28f6514d5e8a"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Invitation accepted successfully",
  "pairingId": 123,
  "roomId": "room-abc-123"
}
```

**Error Responses**:
- `400`: Invalid request (missing token)
- `401`: Not authenticated
- `403`: Wrong account (email mismatch)
- `404`: Token not found
- `409`: Already accepted or already paired

**Validation**:
1. User must be authenticated
2. Token must be valid (not expired, not revoked, not used)
3. If `parent_b_email` is set: Must match logged-in user's email (case-insensitive)
4. User must not already be paired with inviter
5. User cannot pair with self

---

## 7. Frontend Pages/Components

### AcceptInvitationPage

**Route**: `/accept-invite`

**States**:
1. **Loading**: Validating token
2. **InvalidToken**: Token invalid/expired/revoked
3. **WrongAccount**: Logged in with wrong email
4. **SignupForm**: Not logged in, no account
5. **LoginPrompt**: Not logged in, has account
6. **AutoAccepting**: Logged in, correct account, accepting
7. **Success**: Invitation accepted

---

### Error Pages

#### InvalidTokenView
- Shows error message based on code
- Buttons: "Sign In" (if not logged in), "Go Home" (if logged in)

#### WrongAccountView
- Shows: "This invitation was sent to [email]. You're logged in as [current_email]"
- Buttons: "Switch Account", "Cancel"

---

## 8. Navigation Middleware Updates

**Current Issue**: `useNavigationManager` redirects unauthenticated users to `/signin`, losing invite token.

**Fix**:
1. Check if current path is `/accept-invite`
2. If yes: Store full URL (including token) in `RETURN_URL`
3. Redirect to `/signin?returnUrl=/accept-invite?token=...`
4. After auth: Restore from `RETURN_URL`

**Public Routes** (never redirect):
- `/accept-invite`
- `/signin`
- `/signup`
- `/invite-coparent`
- `/forgot-password`
- `/reset-password`

---

## 9. Testing Requirements

### Unit Tests
- Token validation logic
- Email matching (case-insensitive)
- Expiration checking
- Revocation checking
- Usage counting

### Integration Tests
- State 1: New user signup flow
- State 2: Existing user login flow
- State 3: Wrong account detection
- State 4: Correct account auto-accept
- State 5: Invalid/expired token handling
- State 6: Already accepted handling
- ReturnUrl preservation through auth flow

### Manual Testing Checklist
See `INVITE_SYSTEM_TESTING.md`

---

## 10. Logging Requirements

**Log Events**:
1. Token validation attempt (token hash prefix, result)
2. Redirect chosen (state, destination)
3. Acceptance success (pairing_id, user_id, inviter_id)
4. Acceptance failure (reason, error code)
5. Email mismatch (expected email, actual email)
6. ReturnUrl usage (restored, missing, invalid)

**Security**: Never log full tokens. Only log hash prefix (first 8 chars).

---

## 11. Assumptions & Decisions

1. **Email Enforcement**: Only enforced if `parent_b_email` is set. Link invitations (no email) allow any user.
2. **Single-Use Default**: Invitations are single-use by default (`max_uses = 1`).
3. **Expiration**: Link invitations expire in 7 days (configurable).
4. **Auto-Accept**: If user is logged in with correct email, auto-accept without confirmation.
5. **Dashboard Redirect**: After acceptance, always redirect to `/` (dashboard), not home page.
6. **Error Pages**: Never auto-redirect on error. Always show error page first.
7. **ReturnUrl TTL**: 1 hour (prevents stale URLs).

---

## 12. Migration Plan

1. Add `revoked_at`, `max_uses`, `use_count`, `created_by` columns to `pairing_sessions`
2. Backfill `created_by` with `parent_a_id` for existing records
3. Set `max_uses = 1` and `use_count = 0` for existing records
4. Update validation logic to check new fields
5. Update frontend to handle new states
6. Add tests
7. Deploy

---

## 13. Deliverables

1. ✅ This specification document
2. Database migration script
3. Updated validation logic
4. New API endpoint: `POST /api/invites/accept`
5. Updated frontend pages/components
6. Navigation middleware updates
7. Unit and integration tests
8. Manual testing checklist
9. Logging implementation


