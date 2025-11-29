# Feature Specification: Data Persistence Fix for Profiles, Contacts & Google Places

## Overview

**Feature ID**: 012-data-persistence-fix
**Feature Name**: Data Persistence Fix - Profiles, Contacts & Google Places
**Business Objective**: Fix critical data persistence issues preventing profile saves, contacts storage, and Google Places integration from working reliably
**Priority**: Critical
**Created**: 2025-11-28

## Problem Statement

Users are experiencing issues saving profile data. Investigation revealed multiple critical bugs in the data persistence layer:

### Critical Issues Identified

1. **Duplicate API Routes with Different Auth Methods**
   - `/api/profile/me` (routes/profile.js) - Uses `authenticate` middleware with `req.user.userId`
   - `/api/user/profile` (server.js) - Uses manual JWT extraction from `currentUsername`
   - Frontend calls both endpoints inconsistently

2. **JWT Token Payload Inconsistency**
   - Login endpoint creates: `{ id: user.id, username: user.username }`
   - All other endpoints create: `{ userId: user.id, username: user.username }`
   - This causes auth failures when tokens created during login are used with authenticated routes

3. **Missing Database Migration for Activities**
   - `child_activities` table referenced in code but has NO migration
   - Activities management silently fails on fresh deployments

4. **Missing `useActivities` Hook**
   - `ContactsPanel.jsx` imports `useActivities()` but hook doesn't exist
   - Child activity management is completely broken

5. **Relationship Normalization Issues**
   - Frontend sends: "My Co-Parent", "My Child"
   - Backend stores/expects: "co-parent", "my child" (lowercase)
   - Causes validation failures in activity endpoints

6. **Google Places API Key Not Required**
   - No clear error when API key is missing
   - Users may not realize address/school autocomplete is non-functional

## User Stories

### US-1: Profile Persistence
**As a** co-parent using LiaiZen
**I want to** save my profile information including personal details, work schedule, and background
**So that** my co-parent can understand my availability and the system can provide better mediation

**Acceptance Criteria**:
- [ ] Profile data saves successfully to database
- [ ] All 40+ profile fields persist correctly
- [ ] Profile completion percentage updates after save
- [ ] Privacy settings save and apply correctly
- [ ] No duplicate API calls during save
- [ ] Clear error messages on save failure

### US-2: Contacts Persistence
**As a** co-parent
**I want to** add and manage contacts (children, co-parent, professionals)
**So that** I can track important people and their information

**Acceptance Criteria**:
- [ ] Create new contacts successfully
- [ ] Edit existing contacts
- [ ] Delete contacts with confirmation
- [ ] Child-specific fields (school, birthdate) save correctly
- [ ] Co-parent specific fields (separation date, friction situations) save correctly
- [ ] Linked contacts (parent-child relationships) persist

### US-3: School Selection with Google Places
**As a** co-parent adding a child contact
**I want to** search and select my child's school using autocomplete
**So that** the school information is accurate and includes location data

**Acceptance Criteria**:
- [ ] School autocomplete appears when typing
- [ ] Selected school name, address, and coordinates save to contact
- [ ] Clear error message when Google Places API key is missing
- [ ] Graceful fallback to manual entry when API unavailable

### US-4: Child Activities
**As a** co-parent
**I want to** track my children's activities (sports, lessons, etc.)
**So that** we can coordinate schedules and split costs

**Acceptance Criteria**:
- [ ] Add activities to child contacts
- [ ] Edit and delete activities
- [ ] View activities for each child
- [ ] Track activity costs and payment responsibility

## Technical Requirements

### TR-1: Consolidate Profile API Routes

**Current State**:
```
/api/profile/me (routes/profile.js) - authenticate middleware
/api/user/profile (server.js) - manual JWT extraction
```

**Target State**:
- Use ONLY `/api/profile/me` routes for profile operations
- Remove duplicate `/api/user/profile` routes OR redirect to `/api/profile/me`
- Ensure frontend uses consistent endpoint

**Implementation**:
1. Update `useProfile.js` to use ONLY `/api/profile/me` endpoints
2. Mark `/api/user/profile` as deprecated with redirect
3. Use `authenticate` middleware consistently

### TR-2: Fix JWT Token Inconsistency

**Problem**: Login creates `{ id }`, others create `{ userId }`

**Solution**: Standardize ALL token creation to include BOTH:
```javascript
const token = jwt.sign(
  {
    id: user.id,
    userId: user.id,  // Add for backwards compatibility
    username: user.username,
    email: user.email
  },
  JWT_SECRET,
  { expiresIn: '30d' }
);
```

**Files to Update**:
- `chat-server/server.js` line 4626-4630 (login endpoint)
- Verify all other jwt.sign calls match this pattern

### TR-3: Create Activities Migration

**New Migration**: `012_child_activities_table.sql`

```sql
CREATE TABLE IF NOT EXISTS child_activities (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  activity_name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  instructor_contact TEXT,
  days_of_week TEXT,  -- JSON array ["Monday", "Wednesday"]
  start_time TEXT,
  end_time TEXT,
  recurrence TEXT,  -- weekly, biweekly, monthly
  start_date TEXT,
  end_date TEXT,
  cost DECIMAL(10,2),
  cost_frequency TEXT,  -- per_session, weekly, monthly, annual
  split_type TEXT DEFAULT 'equal',  -- equal, percentage, alternate
  split_percentage DECIMAL(5,2),
  paid_by TEXT,  -- user, coparent, alternate
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_child_activities_contact_id ON child_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_child_activities_user_id ON child_activities(user_id);
```

### TR-4: Create useActivities Hook

**New File**: `chat-client-vite/src/hooks/useActivities.js`

```javascript
// Hook for managing child activities
export function useActivities(contactId) {
  // State: activities, isLoading, error
  // Methods: loadActivities, saveActivity, deleteActivity
  // API: GET/POST/PUT /api/activities
}
```

### TR-5: Standardize Relationship Values

**Create mapping utility**:
```javascript
// Frontend → Backend
const toBackendRelationship = (display) => {
  const map = {
    'My Co-Parent': 'co-parent',
    'My Child': 'my child',
    // ... all mappings
  };
  return map[display] || display.toLowerCase();
};

// Backend → Frontend
const toDisplayRelationship = (stored) => {
  const map = {
    'co-parent': 'My Co-Parent',
    'my child': 'My Child',
    // ... all mappings
  };
  return map[stored] || stored;
};
```

### TR-6: Google Places Error Handling

**Add clear error state**:
```javascript
// In useGooglePlacesSchool.js
if (!apiKey || apiKey.trim() === '') {
  setError('GOOGLE_PLACES_NOT_CONFIGURED');
  return;
}
```

**Show user-friendly message in UI**:
```jsx
{googlePlacesError === 'GOOGLE_PLACES_NOT_CONFIGURED' && (
  <p className="text-amber-600 text-sm">
    School autocomplete unavailable. Enter school name manually.
  </p>
)}
```

## Database Schema

### Profile Tables (Existing - Migration 010)

| Table | Purpose |
|-------|---------|
| `users` | 40+ profile columns (personal, work, health, financial, background) |
| `user_profile_privacy` | Section/field visibility settings |
| `profile_audit_log` | Track profile views and changes |

### Contacts Tables (Existing - Migrations 001, 011)

| Table | Purpose |
|-------|---------|
| `contacts` | All contact types with extended fields |
| `child_activities` | Activities linked to child contacts (NEEDS MIGRATION) |

### Indexes Required

```sql
-- Already exist:
CREATE INDEX idx_user_profile_privacy_user_id ON user_profile_privacy(user_id);
CREATE INDEX idx_profile_audit_log_user_id ON profile_audit_log(user_id);
CREATE INDEX idx_contacts_user ON contacts(user_id);

-- Need to add:
CREATE INDEX idx_child_activities_contact_id ON child_activities(contact_id);
CREATE INDEX idx_child_activities_user_id ON child_activities(user_id);
```

## API Endpoints

### Profile Endpoints (Consolidated to /api/profile/*)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/profile/me` | JWT | Get current user's full profile |
| PUT | `/api/profile/me` | JWT | Update current user's profile |
| GET | `/api/profile/privacy/me` | JWT | Get privacy settings |
| PUT | `/api/profile/privacy/me` | JWT | Update privacy settings |
| GET | `/api/profile/preview-coparent-view` | JWT | Preview as co-parent sees it |

### Contacts Endpoints (Existing)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/contacts` | JWT | Get all user contacts |
| POST | `/api/contacts` | JWT | Create new contact |
| PUT | `/api/contacts/:id` | JWT | Update contact |
| DELETE | `/api/contacts/:id` | JWT | Delete contact |

### Activities Endpoints (Need Implementation)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/activities/:contactId` | JWT | Get activities for child |
| POST | `/api/activities` | JWT | Create activity |
| PUT | `/api/activities/:id` | JWT | Update activity |
| DELETE | `/api/activities/:id` | JWT | Delete activity |

## Implementation Plan

### Phase 1: Fix Critical Auth Issues (High Priority)
1. Fix JWT token payload inconsistency (TR-2)
2. Test all auth flows work correctly

### Phase 2: Consolidate Profile APIs (High Priority)
1. Update frontend to use only `/api/profile/me` (TR-1)
2. Mark duplicate routes as deprecated
3. Add redirects for backwards compatibility

### Phase 3: Create Activities System (Medium Priority)
1. Create database migration (TR-3)
2. Implement useActivities hook (TR-4)
3. Add activities UI to child contacts

### Phase 4: Standardize & Polish (Medium Priority)
1. Implement relationship value mapping (TR-5)
2. Improve Google Places error handling (TR-6)
3. Add user-friendly error messages throughout

## Testing Requirements

### Unit Tests
- [ ] JWT token creation includes both `id` and `userId`
- [ ] Profile save/load round-trips correctly
- [ ] Contact relationship mapping works in both directions
- [ ] Activities CRUD operations work

### Integration Tests
- [ ] Login flow creates valid token for all endpoints
- [ ] Profile endpoints accept tokens from login
- [ ] Contact creation persists all fields
- [ ] Activity creation linked to correct child contact

### Manual Testing Checklist
- [ ] Create new account, verify token works
- [ ] Fill out full profile, save, reload page, verify data persists
- [ ] Add co-parent contact with all fields, verify saves
- [ ] Add child contact with school (Google Places), verify saves with coordinates
- [ ] Add activity to child, verify saves
- [ ] Change privacy settings, verify co-parent preview reflects changes

## Success Metrics

1. **Profile Save Success Rate**: 100% (currently failing)
2. **Contact Save Success Rate**: 100%
3. **Activity Creation Works**: True (currently false - table missing)
4. **Google Places Integration**: Clear error message when unavailable
5. **No Console Errors**: During normal profile/contact operations

## Rollback Plan

If issues arise:
1. Revert frontend to use `/api/user/profile` endpoints
2. Revert JWT changes (may require re-login for affected users)
3. Migration is additive (creates new table) - safe

## Security Considerations

1. **JWT Token Security**: No change to token structure, just payload consistency
2. **Privacy Settings**: Health/financial always private (existing enforcement maintained)
3. **Data Validation**: All inputs validated before database operations
4. **Audit Logging**: Profile changes logged to `profile_audit_log` (existing)

## Dependencies

- **External**: Google Places API (optional - graceful degradation)
- **Internal**:
  - PostgreSQL database with migrations applied
  - JWT authentication middleware
  - Frontend apiClient.js

## Appendix: File Changes Summary

| File | Changes |
|------|---------|
| `chat-server/server.js` | Fix JWT payload in login (line 4626-4630) |
| `chat-server/routes/profile.js` | No changes needed (already correct) |
| `chat-server/migrations/012_child_activities_table.sql` | NEW - Create activities table |
| `chat-client-vite/src/hooks/useProfile.js` | Verify uses `/api/profile/me` consistently |
| `chat-client-vite/src/hooks/useActivities.js` | NEW - Activities hook |
| `chat-client-vite/src/hooks/useContacts.js` | Add relationship mapping |
| `chat-client-vite/src/hooks/useGooglePlacesSchool.js` | Better error handling |
| `chat-client-vite/src/components/ContactsPanel.jsx` | Integrate useActivities |

---

*This specification addresses the root causes of profile save failures and establishes a solid foundation for reliable data persistence across the LiaiZen platform.*
