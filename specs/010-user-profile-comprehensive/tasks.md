# Tasks: Comprehensive User Profile System

**Feature ID:** 010
**Created:** 2025-11-28
**Status:** Ready for Implementation
**Plan Reference:** `specs/010-user-profile-comprehensive/plan.md`

---

## Task Organization

Tasks are organized by phase and dependency order. Each task includes:

- **Priority**: critical | high | medium | low
- **Complexity**: small (1-2h) | medium (2-4h) | large (4-8h) | x-large (8h+)
- **Dependencies**: Task IDs that must be completed first
- **Type**: infrastructure | feature | test | docs

---

## Phase 1: Database Schema Extension (Foundation)

### Task 1.1: Create Database Migration File

**Type:** infrastructure
**Priority:** critical
**Complexity:** medium (2-3h)
**Dependencies:** None
**Files to Create:**

- `/Users/athenasees/Desktop/chat/chat-server/migrations/010_user_profile_comprehensive.js`

**Description:**
Create migration file to add 40+ new columns to the `users` table, create `user_profile_privacy` table, and create `profile_audit_log` table.

**Deliverables:**

- Migration file with up() and down() functions
- All 40+ new columns added to users table
- Privacy settings table created
- Audit log table created

**Acceptance Criteria:**

- [ ] Migration file exists at correct path
- [ ] All personal info columns added (preferred_name, pronouns, birthdate, language, timezone, phone, city, state, zip)
- [ ] All work columns added (employment_status, employer, work_schedule, schedule_flexibility, commute_time, travel_required)
- [ ] All health columns added (8 health-related fields)
- [ ] All financial columns added (9 finance-related fields)
- [ ] All background columns added (9 background/education fields)
- [ ] Profile metadata columns added (profile_completion_percentage, profile_last_updated)
- [ ] user_profile_privacy table created with section visibility fields
- [ ] profile_audit_log table created with action tracking
- [ ] Foreign key constraints properly defined
- [ ] Indexes created for performance
- [ ] Rollback function (down) properly reverses all changes

**Technical Notes:**

```javascript
// Migration structure
module.exports = {
  up: async db => {
    // Add columns in batches to avoid timeout
    // Create privacy table
    // Create audit log table
  },
  down: async db => {
    // Rollback all changes
  },
};
```

**Code Snippet - Column Additions:**

```sql
-- Personal Information
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pronouns TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthdate TEXT;
-- (continues for all 40+ columns)
```

---

### Task 1.2: Update SQLite Database Schema (db.js)

**Type:** infrastructure
**Priority:** critical
**Complexity:** medium (2-3h)
**Dependencies:** Task 1.1
**Files to Modify:**

- `/Users/athenasees/Desktop/chat/chat-server/db.js`

**Description:**
Add new columns to the SQLite initialization script in db.js with proper migration checks (similar to existing profile column migrations starting at line 158).

**Deliverables:**

- All new columns added with migration safety checks
- Privacy table initialization added
- Audit log table initialization added

**Acceptance Criteria:**

- [ ] Personal info columns added to users table with try/catch migration pattern
- [ ] Work columns added with migration safety
- [ ] Health columns added (marked for encryption)
- [ ] Financial columns added (marked for encryption)
- [ ] Background columns added
- [ ] Profile metadata columns added
- [ ] user_profile_privacy table created in initDatabase()
- [ ] profile_audit_log table created in initDatabase()
- [ ] Indexes created for new tables
- [ ] Foreign key constraints enabled (PRAGMA foreign_keys = ON already exists)
- [ ] Migration code follows existing pattern (lines 158-183)
- [ ] Console logs added for successful migrations

**Technical Notes:**
Follow the existing migration pattern:

```javascript
const profileColumns = [
  'preferred_name',
  'pronouns',
  // ... all new columns
];

for (const column of profileColumns) {
  try {
    const testResult = db.exec(`SELECT ${column} FROM users LIMIT 1`);
  } catch (err) {
    try {
      db.run(`ALTER TABLE users ADD COLUMN ${column} TEXT`);
      console.log(`✅ Added profile column: ${column}`);
    } catch (alterErr) {
      console.warn(`Could not add ${column} column:`, alterErr.message);
    }
  }
}
```

---

### Task 1.3: Create Profile Helper Utilities Module

**Type:** infrastructure
**Priority:** critical
**Complexity:** large (4-6h)
**Dependencies:** Task 1.1, Task 1.2
**Files to Create:**

- `/Users/athenasees/Desktop/chat/chat-server/src/utils/profileHelpers.js`

**Description:**
Create comprehensive helper functions for encryption, privacy filtering, completion calculation, and default settings.

**Deliverables:**

- Encryption/decryption functions for sensitive fields
- Privacy filtering logic
- Profile completion calculator
- Default privacy settings generator
- Audit logging helpers

**Acceptance Criteria:**

- [ ] encryptSensitiveFields() function encrypts health and financial data
- [ ] decryptSensitiveFields() function decrypts on read
- [ ] filterProfileByPrivacy() respects user privacy settings
- [ ] filterProfileByPrivacy() always hides health/financial from others
- [ ] filterProfileByPrivacy() returns decrypted data for own profile
- [ ] calculateProfileCompletion() returns percentage (0-100)
- [ ] calculateProfileCompletion() weighs sections equally (20% each)
- [ ] getDefaultPrivacySettings() returns appropriate defaults
- [ ] logProfileView() records when co-parent views profile
- [ ] logProfileChanges() records field updates to audit log
- [ ] logPrivacyChange() records visibility changes
- [ ] SENSITIVE_FIELDS array exported with all 12 sensitive fields
- [ ] All functions handle null/undefined gracefully
- [ ] Error handling for encryption failures

**Technical Notes:**

```javascript
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.PROFILE_ENCRYPTION_KEY;
const SENSITIVE_FIELDS = [
  'health_physical_conditions',
  'health_physical_limitations',
  'health_mental_conditions',
  'health_mental_treatment',
  'health_mental_history',
  'health_substance_history',
  'health_in_recovery',
  'health_recovery_duration',
  'finance_income_level',
  'finance_debt_stress',
  'finance_support_paying',
  'finance_support_receiving',
];

function encryptSensitiveFields(data) {
  // AES-256-GCM encryption
}

function filterProfileByPrivacy(profile, privacySettings, isOwnProfile) {
  if (isOwnProfile) {
    return decryptSensitiveFields(profile);
  }
  // Filter based on section visibility
  // ALWAYS block health/financial regardless of settings
}

function calculateProfileCompletion(profile) {
  // 20% personal, 20% work, 20% health, 20% financial, 20% background
  // Return 0-100
}
```

---

## Phase 2: Backend API Implementation

### Task 2.1: Update GET /api/user/profile Endpoint

**Type:** feature
**Priority:** critical
**Complexity:** medium (3-4h)
**Dependencies:** Task 1.3
**Files to Modify:**

- `/Users/athenasees/Desktop/chat/chat-server/server.js` (around line 6010)

**Description:**
Extend the existing profile GET endpoint to include privacy filtering, new fields, and audit logging.

**Deliverables:**

- Privacy-aware profile retrieval
- Support for viewing own vs. co-parent profiles
- Audit logging for profile views
- All 40+ new fields returned

**Acceptance Criteria:**

- [ ] Endpoint accepts optional `username` query parameter
- [ ] Returns full profile data for own profile (decrypted)
- [ ] Returns filtered profile for co-parent view (respects privacy settings)
- [ ] Health and financial fields NEVER exposed to co-parent
- [ ] Privacy settings included in response for own profile only
- [ ] isOwnProfile flag included in response
- [ ] Profile view logged to audit_log when viewing co-parent
- [ ] All new personal fields included in response
- [ ] All new work fields included in response
- [ ] All new health fields included (own profile only)
- [ ] All new financial fields included (own profile only)
- [ ] All new background fields included in response
- [ ] profile_completion_percentage returned
- [ ] profile_last_updated timestamp returned
- [ ] 404 error if user not found
- [ ] Proper error handling and logging

**Code Changes:**

```javascript
// Around line 6010 in server.js
app.get('/api/user/profile', async (req, res) => {
  try {
    const username = req.query.username || req.user?.username;
    const requestingUser = req.user?.username;

    // Fetch user
    const userResult = await dbSafe.safeSelect(
      'users',
      { username: username.toLowerCase() },
      { limit: 1 }
    );
    const users = dbSafe.parseResult(userResult);

    if (!users.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch privacy settings
    const privacyResult = await dbSafe.safeSelect(
      'user_profile_privacy',
      { user_id: users[0].id },
      { limit: 1 }
    );
    const privacy = dbSafe.parseResult(privacyResult);
    const privacySettings = privacy[0] || getDefaultPrivacySettings();

    // Determine if own profile
    const isOwnProfile = requestingUser?.toLowerCase() === username.toLowerCase();

    // Filter by privacy
    const profile = filterProfileByPrivacy(users[0], privacySettings, isOwnProfile);

    // Log view if viewing co-parent
    if (!isOwnProfile) {
      await logProfileView(users[0].id, req.user.id);
    }

    res.json({
      ...profile,
      privacySettings: isOwnProfile ? privacySettings : null,
      isOwnProfile,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});
```

---

### Task 2.2: Update PUT /api/user/profile Endpoint

**Type:** feature
**Priority:** critical
**Complexity:** large (4-6h)
**Dependencies:** Task 1.3, Task 2.1
**Files to Modify:**

- `/Users/athenasees/Desktop/chat/chat-server/server.js` (around line 6049)

**Description:**
Extend the existing profile PUT endpoint to handle all new fields, encryption, validation, completion tracking, and audit logging.

**Deliverables:**

- Accept and validate all new profile fields
- Encrypt sensitive fields before storage
- Calculate and update completion percentage
- Log all changes to audit log
- Auto-complete onboarding tasks at 50% threshold

**Acceptance Criteria:**

- [ ] Accepts all 40+ new profile fields in request body
- [ ] Validates field lengths (max 500 chars for text, max 2000 for textareas)
- [ ] Validates email format if provided
- [ ] Validates birthdate format if provided
- [ ] Validates enum values (employment_status, pronouns, etc.)
- [ ] Encrypts health fields before storage using encryptSensitiveFields()
- [ ] Encrypts financial fields before storage
- [ ] Calculates profile completion percentage after update
- [ ] Updates profile_last_updated timestamp
- [ ] Logs all changed fields to profile_audit_log
- [ ] Auto-completes "Complete your profile" onboarding task at 50%
- [ ] Returns success response with completion percentage
- [ ] Handles partial updates (only updates provided fields)
- [ ] Preserves existing fields not in request
- [ ] Proper error messages for validation failures
- [ ] Transaction safety (rollback on error)

**Code Changes:**

```javascript
// Around line 6049 in server.js
app.put('/api/user/profile', async (req, res) => {
  try {
    const { currentUsername, ...profileData } = req.body;

    // Validate fields
    const validation = validateProfileFields(profileData);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Get user
    const userResult = await dbSafe.safeSelect(
      'users',
      { username: currentUsername.toLowerCase() },
      { limit: 1 }
    );
    const users = dbSafe.parseResult(userResult);

    if (!users.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Encrypt sensitive fields
    const encryptedData = encryptSensitiveFields(profileData);

    // Update profile
    await dbSafe.safeUpdate('users', encryptedData, { id: user.id });

    // Log changes
    await logProfileChanges(user.id, user, profileData);

    // Calculate completion
    const completionPct = calculateProfileCompletion({
      ...user,
      ...profileData,
    });

    await dbSafe.safeUpdate(
      'users',
      {
        profile_completion_percentage: completionPct,
        profile_last_updated: new Date().toISOString(),
      },
      { id: user.id }
    );

    // Auto-complete onboarding task
    if (completionPct >= 50) {
      await autoCompleteOnboardingTasks(user.id);
    }

    require('./db').saveDatabase();

    res.json({
      success: true,
      completionPercentage: completionPct,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});
```

**Validation Function:**

```javascript
function validateProfileFields(data) {
  // Email validation
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Birthdate validation (ISO format)
  if (data.birthdate && !/^\d{4}-\d{2}-\d{2}$/.test(data.birthdate)) {
    return { valid: false, error: 'Invalid birthdate format (use YYYY-MM-DD)' };
  }

  // Field length validations
  const textFields = ['preferred_name', 'occupation', 'employer', 'city', 'state', 'zip'];
  for (const field of textFields) {
    if (data[field] && data[field].length > 500) {
      return { valid: false, error: `${field} must be less than 500 characters` };
    }
  }

  // Enum validations
  const validPronouns = ['he/him', 'she/her', 'they/them', 'other', ''];
  if (data.pronouns && !validPronouns.includes(data.pronouns)) {
    return { valid: false, error: 'Invalid pronouns value' };
  }

  return { valid: true };
}
```

---

### Task 2.3: Create Privacy Settings Endpoints

**Type:** feature
**Priority:** high
**Complexity:** medium (3-4h)
**Dependencies:** Task 1.3, Task 2.1
**Files to Modify:**

- `/Users/athenasees/Desktop/chat/chat-server/server.js` (add new endpoints after profile endpoints)

**Description:**
Create three new endpoints for managing profile privacy settings.

**Deliverables:**

- GET /api/user/profile/privacy - Fetch privacy settings
- PUT /api/user/profile/privacy - Update privacy settings
- GET /api/user/profile/preview-coparent-view - Preview filtered profile

**Acceptance Criteria:**

- [ ] GET /api/user/profile/privacy returns current settings or defaults
- [ ] PUT /api/user/profile/privacy accepts section visibility fields
- [ ] PUT /api/user/profile/privacy accepts field_overrides JSON
- [ ] PUT /api/user/profile/privacy upserts (creates or updates)
- [ ] PUT /api/user/profile/privacy logs changes to audit log
- [ ] PUT /api/user/profile/privacy prevents changing health/financial visibility
- [ ] GET /api/user/profile/preview-coparent-view returns filtered profile
- [ ] Preview shows exactly what co-parent would see
- [ ] Preview never includes health or financial data
- [ ] All endpoints require authentication
- [ ] Proper error handling for all endpoints

**Code Snippet:**

```javascript
// GET /api/user/profile/privacy
app.get('/api/user/profile/privacy', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const privacyResult = await dbSafe.safeSelect(
      'user_profile_privacy',
      { user_id: userId },
      { limit: 1 }
    );
    const privacy = dbSafe.parseResult(privacyResult);

    res.json(privacy[0] || getDefaultPrivacySettings());
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    res.status(500).json({ error: 'Failed to fetch privacy settings' });
  }
});

// PUT /api/user/profile/privacy
app.put('/api/user/profile/privacy', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      personal_visibility,
      work_visibility,
      health_visibility,
      financial_visibility,
      background_visibility,
      field_overrides,
    } = req.body;

    // Prevent changing health/financial visibility (always private)
    if (health_visibility === 'shared' || financial_visibility === 'shared') {
      return res.status(400).json({
        error: 'Health and financial information must remain private',
      });
    }

    // Upsert privacy settings
    const existing = await dbSafe.safeSelect(
      'user_profile_privacy',
      { user_id: userId },
      { limit: 1 }
    );

    const settingsData = {
      personal_visibility: personal_visibility || 'shared',
      work_visibility: work_visibility || 'private',
      health_visibility: 'private', // Force private
      financial_visibility: 'private', // Force private
      background_visibility: background_visibility || 'shared',
      field_overrides: JSON.stringify(field_overrides || {}),
      updated_at: new Date().toISOString(),
    };

    if (existing.length > 0) {
      await dbSafe.safeUpdate('user_profile_privacy', settingsData, { user_id: userId });
    } else {
      await dbSafe.safeInsert('user_profile_privacy', {
        user_id: userId,
        ...settingsData,
        created_at: new Date().toISOString(),
      });
    }

    // Log privacy change
    await logPrivacyChange(userId, settingsData);

    require('./db').saveDatabase();

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

// GET /api/user/profile/preview-coparent-view
app.get('/api/user/profile/preview-coparent-view', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    const privacyResult = await dbSafe.safeSelect(
      'user_profile_privacy',
      { user_id: userId },
      { limit: 1 }
    );
    const privacy = dbSafe.parseResult(privacyResult);

    // Return profile as co-parent would see it (isOwnProfile = false)
    const filteredProfile = filterProfileByPrivacy(
      users[0],
      privacy[0] || getDefaultPrivacySettings(),
      false // Not own profile
    );

    res.json(filteredProfile);
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});
```

---

## Phase 3: Frontend Profile Wizard

### Task 3.1: Create ProfileWizard Component

**Type:** feature
**Priority:** critical
**Complexity:** large (5-6h)
**Dependencies:** Task 2.2
**Files to Create:**

- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/ProfileWizard.jsx`

**Description:**
Create multi-step wizard component with 5 steps: Personal, Work, Health, Financial, Background.

**Deliverables:**

- Wizard navigation with progress bar
- Step validation and auto-save
- Skip functionality for each step
- Integration with useProfile hook

**Acceptance Criteria:**

- [ ] Component renders 5-step progress indicator
- [ ] Progress bar shows completion percentage visually
- [ ] Each step has icon and title
- [ ] Current step highlighted in teal
- [ ] Completed steps show checkmark
- [ ] Back button disabled on step 1
- [ ] Continue button advances to next step
- [ ] Continue button shows "Complete" on final step
- [ ] Skip button available on all steps
- [ ] Auto-saves progress on Continue
- [ ] Calls onComplete callback after final step
- [ ] Shows loading state during save
- [ ] Responsive design (mobile-first)
- [ ] Follows design system (teal colors, rounded-lg, 44px buttons)
- [ ] Touch-friendly (44px minimum touch targets)

**Code Snippet:**

```jsx
import React from 'react';
import { useProfile } from '../hooks/useProfile';

const STEPS = [
  { id: 'personal', title: 'Personal Information', icon: '👤' },
  { id: 'work', title: 'Work & Schedule', icon: '💼' },
  { id: 'health', title: 'Health & Wellbeing', icon: '❤️' },
  { id: 'financial', title: 'Financial Context', icon: '💰' },
  { id: 'background', title: 'Background', icon: '🏠' },
];

export function ProfileWizard({ onComplete, initialStep = 0 }) {
  const [currentStep, setCurrentStep] = React.useState(initialStep);
  const { profileData, updateField, saveProfile, isSaving } = useProfile();

  const handleNext = async () => {
    await saveProfile();
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handleSkip = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Progress Bar */}
      <div className="mb-8">
        {/* Step indicators */}
        {/* Progress percentage bar */}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        {/* Render appropriate form based on currentStep */}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}>Back</button>
        <button onClick={handleSkip}>Skip for now</button>
        <button onClick={handleNext} disabled={isSaving}>
          {isSaving ? 'Saving...' : currentStep === STEPS.length - 1 ? 'Complete' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
```

---

### Task 3.2: Create PersonalInfoForm Component

**Type:** feature
**Priority:** high
**Complexity:** medium (2-3h)
**Dependencies:** Task 3.1
**Files to Create:**

- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/profile/PersonalInfoForm.jsx`

**Description:**
Create form for personal information step (first/last name, preferred name, pronouns, birthdate, language, timezone, phone, location).

**Deliverables:**

- Form fields for all personal data
- Proper input types (date picker, select dropdowns)
- Real-time validation
- Character count for text inputs

**Acceptance Criteria:**

- [ ] First name input (required, 2-50 chars)
- [ ] Last name input (required, 2-50 chars)
- [ ] Preferred name input with hint text
- [ ] Pronouns dropdown (he/him, she/her, they/them, other)
- [ ] Birthdate date picker (ISO format)
- [ ] Language dropdown (English, Spanish, French)
- [ ] Timezone dropdown (US timezones)
- [ ] Phone input with formatting
- [ ] City, State, Zip inputs
- [ ] All inputs follow design system (border-2 border-gray-200, focus:border-[#4DA8B0])
- [ ] Labels use text-sm font-medium text-[#275559]
- [ ] Hint text uses text-sm text-gray-500
- [ ] Validation errors shown in red
- [ ] Touch-friendly on mobile

**Code Snippet:**

```jsx
export function PersonalInfoForm({ profileData, updateField }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#275559] mb-1.5">First Name</label>
          <input
            type="text"
            value={profileData.first_name || ''}
            onChange={e => updateField('first_name', e.target.value)}
            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] focus:ring-2 focus:ring-[#4DA8B0]/20 transition-all"
            placeholder="Your first name"
          />
        </div>
        {/* ... more fields */}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#275559] mb-1.5">Preferred Name</label>
        <input
          type="text"
          value={profileData.preferred_name || ''}
          onChange={e => updateField('preferred_name', e.target.value)}
          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0]"
          placeholder="What should we call you?"
        />
        <p className="text-sm text-gray-500 mt-1">This is how LiaiZen will address you</p>
      </div>

      {/* Pronouns, birthdate, language, timezone, location */}
    </div>
  );
}
```

---

### Task 3.3: Create WorkScheduleForm Component

**Type:** feature
**Priority:** high
**Complexity:** medium (2-3h)
**Dependencies:** Task 3.1
**Files to Create:**

- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/profile/WorkScheduleForm.jsx`

**Description:**
Create form for work and schedule information with privacy notice.

**Deliverables:**

- Employment status dropdown
- Occupation input
- Work schedule textarea
- Schedule flexibility selector
- Commute time input
- Travel required checkbox
- Privacy notice banner

**Acceptance Criteria:**

- [ ] Privacy notice displayed prominently (blue banner with lock icon)
- [ ] Notice states "private by default, AI-only"
- [ ] Employment status dropdown (employed, self-employed, unemployed, student, retired, disability)
- [ ] Occupation text input
- [ ] Work schedule textarea with example
- [ ] Schedule flexibility dropdown (high, medium, low)
- [ ] Commute time input with hint
- [ ] Travel required checkbox
- [ ] All fields optional
- [ ] Follows design system styling
- [ ] Mobile responsive

**Code Snippet:**

```jsx
export function WorkScheduleForm({ profileData, updateField }) {
  return (
    <div className="space-y-4">
      {/* Privacy Notice */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <span className="text-blue-600">🔒</span>
        <p className="text-sm text-blue-800">
          Work information is <strong>private by default</strong>. Only LiaiZen AI uses this to
          understand your availability constraints.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#275559] mb-1.5">Employment Status</label>
        <select
          value={profileData.employment_status || ''}
          onChange={e => updateField('employment_status', e.target.value)}
          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0]"
        >
          <option value="">Select status</option>
          <option value="employed">Employed</option>
          <option value="self_employed">Self-Employed</option>
          <option value="unemployed">Unemployed</option>
          <option value="student">Student</option>
          <option value="retired">Retired</option>
          <option value="disability">Disability</option>
        </select>
      </div>

      {/* Occupation, work schedule, flexibility, commute time */}
    </div>
  );
}
```

---

### Task 3.4: Create HealthWellbeingForm Component

**Type:** feature
**Priority:** high
**Complexity:** large (4-5h)
**Dependencies:** Task 3.1
**Files to Create:**

- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/profile/HealthWellbeingForm.jsx`

**Description:**
Create sensitive health information form with strong privacy emphasis and conditional fields.

**Deliverables:**

- Prominent privacy notice (never shared with co-parent)
- Physical health section
- Mental health section
- Substance use section
- Multi-select for conditions
- Conditional fields based on selections

**Acceptance Criteria:**

- [ ] Extra-prominent privacy notice (purple banner with lock icon)
- [ ] Notice states "strictly confidential, never shared"
- [ ] Physical health conditions multi-select
- [ ] Physical limitations textarea
- [ ] Mental health conditions multi-select
- [ ] Currently in treatment dropdown
- [ ] Substance use history dropdown
- [ ] In recovery dropdown (conditional on substance history)
- [ ] Recovery duration input (conditional on in recovery)
- [ ] All fields 100% optional
- [ ] Empathetic, non-judgmental tone in labels
- [ ] Clear section headers with cards
- [ ] Mobile-friendly layout

**Code Snippet:**

```jsx
export function HealthWellbeingForm({ profileData, updateField }) {
  return (
    <div className="space-y-4">
      {/* Extra Privacy Notice */}
      <div className="flex items-start gap-2 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <span className="text-purple-600 text-xl">🔐</span>
        <div>
          <p className="text-sm font-medium text-purple-900 mb-1">Strictly Confidential</p>
          <p className="text-sm text-purple-800">
            This information is <strong>never shared with your co-parent</strong>. It helps LiaiZen
            understand your situation and provide more empathetic support.
          </p>
        </div>
      </div>

      {/* Physical Health Section */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Physical Health</h4>
        {/* Multi-select for conditions */}
        {/* Textarea for limitations */}
      </div>

      {/* Mental Health Section */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Mental Health</h4>
        {/* Multi-select for conditions */}
        {/* Treatment dropdown */}
      </div>

      {/* Substance Use Section */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Substance Use</h4>
        {/* History dropdown */}
        {/* Conditional: In recovery dropdown */}
        {/* Conditional: Recovery duration */}
      </div>
    </div>
  );
}
```

---

### Task 3.5: Create FinancialContextForm Component

**Type:** feature
**Priority:** high
**Complexity:** medium (3-4h)
**Dependencies:** Task 3.1
**Files to Create:**

- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/profile/FinancialContextForm.jsx`

**Description:**
Create financial information form with privacy protections and range-based inputs.

**Deliverables:**

- Privacy notice
- Income level ranges (not exact amounts)
- Income stability selector
- Employment benefits checkboxes
- Housing status and type
- Vehicle ownership
- Debt stress level
- Child support fields

**Acceptance Criteria:**

- [ ] Privacy notice (private, AI-only)
- [ ] Income level dropdown (ranges: <25k, 25-50k, 50-75k, 75-100k, 100k+, prefer not to say)
- [ ] Income stability dropdown (very stable, stable, somewhat unstable, very unstable)
- [ ] Employment benefits multi-select (health insurance, dental, vision, retirement, none)
- [ ] Housing status dropdown (own, rent, living with family, other)
- [ ] Housing type dropdown (house, apartment, condo, other)
- [ ] Vehicle ownership input (number or description)
- [ ] Debt stress level selector (none, manageable, significant, overwhelming)
- [ ] Child support paying dropdown (yes, no, prefer not to say)
- [ ] Child support receiving dropdown (yes, no, prefer not to say)
- [ ] All fields optional
- [ ] Non-judgmental language

**Code Snippet:**

```jsx
export function FinancialContextForm({ profileData, updateField }) {
  return (
    <div className="space-y-4">
      {/* Privacy Notice */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <span className="text-blue-600">🔒</span>
        <p className="text-sm text-blue-800">
          Financial information is <strong>strictly private</strong>. Used only by AI to understand
          financial stress and constraints.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#275559] mb-1.5">
          Annual Income Range
        </label>
        <select
          value={profileData.finance_income_level || ''}
          onChange={e => updateField('finance_income_level', e.target.value)}
          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#4DA8B0]"
        >
          <option value="">Select range</option>
          <option value="under_25k">Under $25,000</option>
          <option value="25_50k">$25,000 - $50,000</option>
          <option value="50_75k">$50,000 - $75,000</option>
          <option value="75_100k">$75,000 - $100,000</option>
          <option value="over_100k">Over $100,000</option>
          <option value="prefer_not_say">Prefer not to say</option>
        </select>
      </div>

      {/* Income stability, benefits, housing, vehicles, debt stress, child support */}
    </div>
  );
}
```

---

### Task 3.6: Create BackgroundForm Component

**Type:** feature
**Priority:** medium
**Complexity:** medium (2-3h)
**Dependencies:** Task 3.1
**Files to Create:**

- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/profile/BackgroundForm.jsx`

**Description:**
Create background information form for cultural context and education.

**Deliverables:**

- Birthplace and upbringing inputs
- Family origin textarea
- Culture and religion inputs
- Military service section
- Education section

**Acceptance Criteria:**

- [ ] Birthplace input
- [ ] Where raised input (if different)
- [ ] Family origin textarea (cultural/ethnic background)
- [ ] Culture/heritage input
- [ ] Religion/spirituality input (optional)
- [ ] Military service dropdown (yes, no, prefer not to say)
- [ ] Military branch input (conditional on service)
- [ ] Military status dropdown (conditional: active, veteran, reserves)
- [ ] Education level dropdown (high school, some college, associate, bachelor, master, doctorate, other)
- [ ] Education field input
- [ ] All fields optional
- [ ] Respectful, inclusive language
- [ ] Cultural sensitivity in prompts

---

### Task 3.7: Create PrivacySettings Component

**Type:** feature
**Priority:** high
**Complexity:** large (4-5h)
**Dependencies:** Task 2.3
**Files to Create:**

- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/profile/PrivacySettings.jsx`

**Description:**
Create privacy settings panel with section visibility toggles and preview feature.

**Deliverables:**

- Section visibility toggles
- Locked indicators for health/financial
- Preview modal showing co-parent view
- Visual feedback for changes

**Acceptance Criteria:**

- [ ] Loads current privacy settings on mount
- [ ] Displays 5 sections (Personal, Work, Health, Financial, Background)
- [ ] Each section shows icon, name, fields included
- [ ] Toggle for Personal section (private/shared)
- [ ] Toggle for Work section (private/shared)
- [ ] Locked indicator for Health (always private, no toggle)
- [ ] Locked indicator for Financial (always private, no toggle)
- [ ] Toggle for Background section (private/shared)
- [ ] Preview button opens modal
- [ ] Preview modal shows filtered profile data
- [ ] Preview modal matches actual co-parent view
- [ ] Changes auto-save immediately
- [ ] Visual confirmation of save
- [ ] Mobile responsive layout

**Code Snippet:**

```jsx
import React from 'react';
import { apiGet, apiPut } from '../../apiClient';

export function PrivacySettings() {
  const [settings, setSettings] = React.useState(null);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [previewData, setPreviewData] = React.useState(null);

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const response = await apiGet('/api/user/profile/privacy');
    const data = await response.json();
    setSettings(data);
  };

  const updateVisibility = async (section, value) => {
    const newSettings = { ...settings, [`${section}_visibility`]: value };
    setSettings(newSettings);
    await apiPut('/api/user/profile/privacy', newSettings);
  };

  const loadPreview = async () => {
    const response = await apiGet('/api/user/profile/preview-coparent-view');
    const data = await response.json();
    setPreviewData(data);
    setPreviewMode(true);
  };

  const sections = [
    {
      id: 'personal',
      label: 'Personal Information',
      icon: '👤',
      fields: 'Name, pronouns, location',
    },
    { id: 'work', label: 'Work & Schedule', icon: '💼', fields: 'Employment, schedule' },
    {
      id: 'health',
      label: 'Health & Wellbeing',
      icon: '❤️',
      fields: 'Physical health, mental health',
      locked: true,
    },
    {
      id: 'financial',
      label: 'Financial Context',
      icon: '💰',
      fields: 'Income, housing',
      locked: true,
    },
    { id: 'background', label: 'Background', icon: '🏠', fields: 'Education, culture' },
  ];

  return (
    <div className="space-y-6">
      {/* Section toggles */}
      {/* Preview modal */}
    </div>
  );
}
```

---

### Task 3.8: Extend useProfile Hook

**Type:** feature
**Priority:** critical
**Complexity:** medium (2-3h)
**Dependencies:** Task 2.2
**Files to Modify:**

- `/Users/athenasees/Desktop/chat/chat-client-vite/src/hooks/useProfile.js`

**Description:**
Extend the existing useProfile hook to handle all 40+ new fields and provide helper methods.

**Deliverables:**

- Add all new fields to profileData state
- Add updateField helper function
- Add calculateCompletion helper
- Maintain backward compatibility

**Acceptance Criteria:**

- [ ] All 40+ new fields added to initial profileData state
- [ ] loadProfile fetches all new fields from API
- [ ] saveProfile sends all new fields to API
- [ ] updateField(fieldName, value) helper function
- [ ] profileCompletion calculated locally and from API
- [ ] Backward compatible with existing usage in ProfilePanel
- [ ] Proper TypeScript types (if using TypeScript)
- [ ] Error handling for missing fields

**Code Changes:**

```javascript
// In useProfile.js
export function useProfile(username) {
  const [profileData, setProfileData] = React.useState({
    // Existing fields
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    // ... existing fields ...

    // NEW: Personal info
    preferred_name: '',
    pronouns: '',
    birthdate: '',
    language: 'en',
    timezone: '',
    phone: '',
    city: '',
    state: '',
    zip: '',

    // NEW: Work
    employment_status: '',
    employer: '',
    work_schedule: '',
    schedule_flexibility: '',
    commute_time: '',
    travel_required: '',

    // NEW: Health
    health_physical_conditions: '',
    health_physical_limitations: '',
    health_mental_conditions: '',
    health_mental_treatment: '',
    health_mental_history: '',
    health_substance_history: '',
    health_in_recovery: '',
    health_recovery_duration: '',

    // NEW: Financial
    finance_income_level: '',
    finance_income_stability: '',
    finance_employment_benefits: '',
    finance_housing_status: '',
    finance_housing_type: '',
    finance_vehicles: '',
    finance_debt_stress: '',
    finance_support_paying: '',
    finance_support_receiving: '',

    // NEW: Background
    background_birthplace: '',
    background_raised: '',
    background_family_origin: '',
    background_culture: '',
    background_religion: '',
    background_military: '',
    background_military_branch: '',
    background_military_status: '',
    education_level: '',
    education_field: '',

    // NEW: Metadata
    profile_completion_percentage: 0,
    profile_last_updated: null,
  });

  // Helper to update a single field
  const updateField = (fieldName, value) => {
    setProfileData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Calculate local completion (for real-time feedback)
  const calculateCompletion = () => {
    const requiredFields = [
      'first_name',
      'last_name',
      'birthdate',
      'pronouns',
      'timezone',
      'occupation',
      'employment_status',
      'work_schedule',
      'health_physical_conditions',
      'health_mental_conditions',
      'finance_income_level',
      'finance_housing_status',
      'education_level',
      'background_culture',
    ];

    const filledCount = requiredFields.filter(
      field => profileData[field] && profileData[field].trim()
    ).length;

    return Math.round((filledCount / requiredFields.length) * 100);
  };

  return {
    profileData,
    setProfileData,
    updateField,
    profileCompletion: calculateCompletion(),
    // ... existing exports
  };
}
```

---

### Task 3.9: Integrate Wizard into ProfilePanel

**Type:** feature
**Priority:** medium
**Complexity:** small (1-2h)
**Dependencies:** Task 3.1, Task 3.8
**Files to Modify:**

- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/ProfilePanel.jsx`

**Description:**
Add a button to launch the ProfileWizard modal from the existing ProfilePanel.

**Deliverables:**

- "Complete Profile Wizard" button
- Modal wrapper for wizard
- Profile completion progress indicator

**Acceptance Criteria:**

- [ ] Button displayed in ProfilePanel header
- [ ] Button shows when profile is <100% complete
- [ ] Button opens modal with ProfileWizard
- [ ] Modal overlay with backdrop
- [ ] Close button on modal
- [ ] Wizard starts at appropriate step (first incomplete)
- [ ] Refreshes profile data after wizard completion
- [ ] Progress indicator shows percentage
- [ ] Mobile-friendly modal sizing

---

## Phase 4: AI Integration

### Task 4.1: Update AI Mediator Context Building

**Type:** feature
**Priority:** high
**Complexity:** large (4-6h)
**Dependencies:** Task 1.3, Task 2.2
**Files to Modify:**

- `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/mediator.js` (around line 395-410)

**Description:**
Extend the buildUserContext function to incorporate comprehensive profile data for personalized mediation.

**Deliverables:**

- Profile data loaded from database
- Sensitive fields decrypted for AI context
- Concise context generation (max 500 tokens)
- Privacy-preserving prompts (indirect references only)

**Acceptance Criteria:**

- [ ] Fetches user profile data with all new fields
- [ ] Decrypts health and financial data for AI use only
- [ ] Builds concise context string (<500 tokens)
- [ ] Work context: includes schedule, flexibility, employment status
- [ ] Health context: indirect references only (no raw mental health data in prompt)
- [ ] Financial context: stress level only, no specific amounts
- [ ] Culture context: includes background and values
- [ ] Never includes identifiable health conditions in prompts
- [ ] Uses "has health considerations" instead of specific diagnoses
- [ ] Uses "experiencing financial stress" instead of income/debt details
- [ ] Context injected into mediation system prompt
- [ ] Context improves coaching relevance
- [ ] No performance degradation (caching considered)

**Code Changes:**

```javascript
// In mediator.js, around line 395
async function buildUserContext(userId) {
  const db = await require('../../../db').getDb();
  const dbSafe = require('../../../dbSafe');

  const userResult = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
  const users = dbSafe.parseResult(userResult);

  if (!users.length) return null;

  // Decrypt sensitive fields
  const profile = decryptSensitiveFields(users[0]);

  // Build concise context (max 500 tokens)
  const contextParts = [];

  // Work context (helps with scheduling conflicts)
  if (profile.work_schedule || profile.schedule_flexibility) {
    contextParts.push(
      `Work: ${profile.employment_status || 'employed'}, ` +
        `schedule: ${profile.work_schedule || 'standard'}, ` +
        `flexibility: ${profile.schedule_flexibility || 'medium'}`
    );
  }

  // Health context (INDIRECT ONLY - no diagnoses)
  const hasPhysicalChallenges =
    profile.health_physical_conditions?.includes('chronic') ||
    profile.health_physical_conditions?.includes('mobility') ||
    profile.health_physical_limitations;

  const hasMentalHealthChallenges =
    profile.health_mental_conditions?.includes('anxiety') ||
    profile.health_mental_conditions?.includes('depression') ||
    profile.health_mental_conditions?.includes('PTSD');

  if (hasPhysicalChallenges) {
    contextParts.push('Has physical health considerations that may affect parenting capacity');
  }
  if (hasMentalHealthChallenges) {
    contextParts.push('Managing stress and mental health challenges');
  }

  // Financial stress (general level only)
  if (
    profile.finance_debt_stress === 'significant' ||
    profile.finance_debt_stress === 'overwhelming'
  ) {
    contextParts.push('Experiencing financial stress');
  }

  // Cultural context
  if (profile.background_culture || profile.background_religion) {
    contextParts.push(`Cultural background: ${profile.background_culture || 'not specified'}`);
  }

  // Communication preferences (if set)
  if (profile.communication_style) {
    contextParts.push(`Prefers ${profile.communication_style} communication`);
  }

  return contextParts.length > 0 ? contextParts.join('. ') : null;
}

// Inject into mediation (existing function, extend it)
async function mediateMessage(message, senderContext, receiverContext) {
  const senderProfile = await buildUserContext(message.senderId);
  const receiverProfile = await buildUserContext(message.receiverId);

  const systemPrompt = `
    ${CONSTITUTION}

    SENDER CONTEXT (for personalized coaching):
    ${senderProfile || 'No profile data available'}

    RECEIVER CONTEXT (for empathy, not disclosure):
    ${receiverProfile || 'No profile data available'}

    Use sender context to personalize coaching without revealing private details.
    Use receiver context to understand their situation for empathetic mediation.
    NEVER disclose health or financial information in any intervention.
  `;

  // ... rest of mediation logic
}
```

---

### Task 4.2: Create Profile-Aware Coaching Examples

**Type:** docs
**Priority:** medium
**Complexity:** small (1-2h)
**Dependencies:** Task 4.1
**Files to Create:**

- `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/policies/profile-coaching-examples.md`

**Description:**
Document examples of how profile data enhances AI coaching without violating privacy.

**Deliverables:**

- Example scenarios for work schedule context
- Example scenarios for health considerations
- Example scenarios for financial stress
- Example scenarios for cultural sensitivity

**Acceptance Criteria:**

- [ ] At least 3 work schedule examples
- [ ] At least 3 health context examples (indirect only)
- [ ] At least 3 financial stress examples (no amounts)
- [ ] At least 2 cultural context examples
- [ ] Shows before/after (generic vs. personalized coaching)
- [ ] Demonstrates privacy preservation
- [ ] Markdown formatting for readability

**Example Content:**

```markdown
# Profile-Aware Coaching Examples

## Work Schedule Context

### Scenario 1: Evening Worker

**USER PROFILE:** Works evenings (5pm-1am), low flexibility
**MESSAGE:** "Why can't you pick up tomorrow at 4pm?"
**GENERIC COACHING:** "Consider offering flexibility in timing."
**PROFILE-AWARE COACHING:** "I notice this timing may be challenging given your schedule.
Try: 'I have a work conflict at 4pm. Could we do 6pm, or would morning work better for you?'"

## Health Considerations

### Scenario 2: Anxiety Management

**USER PROFILE:** Has anxiety, in therapy
**MESSAGE:** "This is stressing me out and you don't even care!"
**PROFILE-AWARE COACHING:** "Take a breath. The phrasing 'you don't even care' may escalate.
Try: 'I'm feeling overwhelmed by this situation. Can we find a solution together?'"

## Financial Stress

### Scenario 3: Debt Stress

**USER PROFILE:** Significant debt stress, receiving support
**MESSAGE:** "You never pay your fair share!"
**PROFILE-AWARE COACHING:** "Financial discussions can be sensitive. Consider focusing on specifics:
'Can we review the expense breakdown? I want to make sure we're both clear on the split.'"
```

---

## Phase 5: Testing & Validation

### Task 5.1: Backend API Tests

**Type:** test
**Priority:** high
**Complexity:** large (5-6h)
**Dependencies:** Task 2.1, Task 2.2, Task 2.3
**Files to Create:**

- `/Users/athenasees/Desktop/chat/chat-server/tests/profile.test.js`

**Description:**
Create comprehensive test suite for all profile API endpoints.

**Deliverables:**

- Tests for GET /api/user/profile
- Tests for PUT /api/user/profile
- Tests for privacy endpoints
- Tests for encryption/decryption
- Tests for privacy filtering

**Acceptance Criteria:**

- [ ] Test: GET returns full profile for own user
- [ ] Test: GET filters by privacy settings for other users
- [ ] Test: GET never exposes health data to other users
- [ ] Test: GET never exposes financial data to other users
- [ ] Test: PUT updates all profile fields correctly
- [ ] Test: PUT encrypts sensitive fields before storage
- [ ] Test: PUT validates field lengths
- [ ] Test: PUT validates email format
- [ ] Test: PUT calculates completion percentage correctly
- [ ] Test: PUT logs changes to audit log
- [ ] Test: Privacy GET returns current settings
- [ ] Test: Privacy PUT updates visibility
- [ ] Test: Privacy PUT prevents health/financial sharing
- [ ] Test: Preview endpoint shows filtered view
- [ ] Test: Encryption/decryption round-trip works
- [ ] All tests pass with >90% coverage
- [ ] Uses Jest framework
- [ ] Uses Supertest for HTTP testing

**Code Structure:**

```javascript
const request = require('supertest');
const app = require('../server');
const { getDb } = require('../db');

describe('Profile API', () => {
  beforeEach(async () => {
    // Setup test database
  });

  afterEach(async () => {
    // Cleanup
  });

  describe('GET /api/user/profile', () => {
    test('returns full profile for own user', async () => {
      // Test implementation
    });

    test('filters by privacy settings for other users', async () => {
      // Test implementation
    });

    test('never exposes health data to other users', async () => {
      const response = await request(app)
        .get('/api/user/profile?username=testuser')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.body.health_physical_conditions).toBeUndefined();
      expect(response.body.health_mental_conditions).toBeUndefined();
      // ... all health fields
    });

    test('never exposes financial data to other users', async () => {
      // Test implementation
    });
  });

  describe('PUT /api/user/profile', () => {
    test('updates profile fields', async () => {
      // Test implementation
    });

    test('encrypts sensitive fields', async () => {
      const response = await request(app).put('/api/user/profile').send({
        currentUsername: 'testuser',
        health_mental_conditions: 'anxiety,depression',
      });

      // Verify database has encrypted value
      const db = await getDb();
      // Check that stored value is encrypted
    });

    test('validates field lengths', async () => {
      const response = await request(app)
        .put('/api/user/profile')
        .send({
          currentUsername: 'testuser',
          preferred_name: 'a'.repeat(600), // Exceeds max
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/must be less than/);
    });

    // More tests...
  });

  describe('Privacy Settings', () => {
    test('defaults to appropriate privacy levels', async () => {
      // Test implementation
    });

    test('allows toggling section visibility', async () => {
      // Test implementation
    });

    test('prevents toggling health/financial visibility', async () => {
      const response = await request(app).put('/api/user/profile/privacy').send({
        health_visibility: 'shared', // Attempt to share
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/must remain private/);
    });

    test('preview shows correct filtered view', async () => {
      // Test implementation
    });
  });
});
```

---

### Task 5.2: Frontend Component Tests

**Type:** test
**Priority:** medium
**Complexity:** medium (3-4h)
**Dependencies:** Task 3.1, Task 3.7
**Files to Create:**

- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/__tests__/ProfileWizard.test.jsx`

**Description:**
Create tests for ProfileWizard and PrivacySettings components.

**Deliverables:**

- ProfileWizard rendering tests
- Navigation tests
- Save/skip tests
- PrivacySettings tests

**Acceptance Criteria:**

- [ ] Test: ProfileWizard renders all 5 steps
- [ ] Test: Can navigate between steps
- [ ] Test: Skip button advances without saving
- [ ] Test: Continue button saves and advances
- [ ] Test: Shows completion progress
- [ ] Test: Calls onComplete after final step
- [ ] Test: PrivacySettings loads current settings
- [ ] Test: PrivacySettings updates visibility on change
- [ ] Test: Shows locked indicator for health/financial
- [ ] Test: Preview modal shows filtered data
- [ ] Uses React Testing Library
- [ ] Uses Jest for assertions
- [ ] All tests pass

**Code Structure:**

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileWizard } from '../ProfileWizard';

describe('ProfileWizard', () => {
  test('renders all 5 steps', () => {
    render(<ProfileWizard onComplete={() => {}} />);

    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Work & Schedule')).toBeInTheDocument();
    expect(screen.getByText('Health & Wellbeing')).toBeInTheDocument();
    expect(screen.getByText('Financial Context')).toBeInTheDocument();
    expect(screen.getByText('Background')).toBeInTheDocument();
  });

  test('allows navigation between steps', () => {
    render(<ProfileWizard onComplete={() => {}} />);

    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    // Should advance to step 2
    expect(screen.getByText('Work & Schedule')).toBeInTheDocument();

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    // Should return to step 1
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
  });

  // More tests...
});
```

---

### Task 5.3: Integration Tests

**Type:** test
**Priority:** medium
**Complexity:** medium (3-4h)
**Dependencies:** Task 5.1, Task 5.2
**Files to Create:**

- `/Users/athenasees/Desktop/chat/chat-server/tests/profile-integration.test.js`

**Description:**
Create end-to-end integration tests for complete profile workflows.

**Deliverables:**

- Full profile creation flow test
- Privacy settings flow test
- AI mediation with profile test
- Profile update flow test

**Acceptance Criteria:**

- [ ] Test: User creates account → fills profile wizard → profile saved with correct completion %
- [ ] Test: User updates privacy settings → co-parent views profile → sees filtered data only
- [ ] Test: User with work schedule → sends message about availability → AI uses context
- [ ] Test: User completes 50% of profile → onboarding task auto-completed
- [ ] Test: User encrypts health data → reads own profile → data decrypted correctly
- [ ] Test: Audit log records all profile views and changes
- [ ] All integration tests pass
- [ ] Tests use realistic data
- [ ] Tests clean up after themselves

---

## Phase 6: Deployment & Documentation

### Task 6.1: Environment Configuration

**Type:** infrastructure
**Priority:** critical
**Complexity:** small (1h)
**Dependencies:** Task 1.3
**Files to Modify:**

- Railway environment variables
- Vercel environment variables

**Description:**
Add encryption key and other required environment variables to production.

**Deliverables:**

- PROFILE_ENCRYPTION_KEY generated and added
- Environment variables documented

**Acceptance Criteria:**

- [ ] PROFILE_ENCRYPTION_KEY generated (32-byte random key)
- [ ] Key added to Railway (backend)
- [ ] Key added to Vercel (frontend, if needed)
- [ ] Key stored securely (password manager)
- [ ] Backup of key created
- [ ] .env.example updated with new variables
- [ ] Documentation updated with deployment steps

**Commands:**

```bash
# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to Railway
railway variables set PROFILE_ENCRYPTION_KEY=<generated-key>

# Verify
railway variables
```

---

### Task 6.2: Database Migration Execution

**Type:** infrastructure
**Priority:** critical
**Complexity:** medium (2-3h)
**Dependencies:** Task 1.1, Task 1.2, Task 6.1
**Files:** Database

**Description:**
Execute database migrations on staging and production.

**Deliverables:**

- Migration run on staging
- Migration verified on staging
- Migration run on production
- Rollback plan documented

**Acceptance Criteria:**

- [ ] Backup of production database created
- [ ] Migration tested on local database
- [ ] Migration run on staging environment
- [ ] Staging schema verified (all columns exist)
- [ ] Staging tested with sample data
- [ ] Migration run on production environment
- [ ] Production schema verified
- [ ] No data loss
- [ ] Rollback script tested
- [ ] Migration logged in deployment log

**Migration Steps:**

```bash
# 1. Backup production database
railway run pg_dump > backup-$(date +%Y%m%d).sql

# 2. Run migration on staging
railway run --environment staging npm run migrate

# 3. Verify schema on staging
railway run --environment staging npm run schema:check

# 4. Test on staging
# (Manual testing of profile features)

# 5. Run on production
railway run --environment production npm run migrate

# 6. Verify production
railway run --environment production npm run schema:check

# 7. Monitor logs
railway logs --tail
```

---

### Task 6.3: Frontend Deployment

**Type:** infrastructure
**Priority:** high
**Complexity:** small (1h)
**Dependencies:** Task 3.1, Task 3.7, Task 3.8
**Files:** None (deployment)

**Description:**
Deploy frontend changes to Vercel production.

**Deliverables:**

- Frontend deployed to production
- Smoke tests passed
- No console errors

**Acceptance Criteria:**

- [ ] Code merged to main branch
- [ ] Vercel build successful
- [ ] ProfileWizard accessible in UI
- [ ] Privacy settings accessible in UI
- [ ] No console errors in production
- [ ] Mobile responsive verified
- [ ] Cross-browser tested (Chrome, Safari, Firefox)
- [ ] Performance metrics acceptable (Lighthouse >90)

**Deployment:**

```bash
# Build locally first
cd chat-client-vite
npm run build

# Check for errors
npm run lint

# Deploy (automatic on push to main)
git push origin main

# Verify deployment
# Visit https://coparentliaizen.com
```

---

### Task 6.4: Backend Deployment

**Type:** infrastructure
**Priority:** high
**Complexity:** small (1h)
**Dependencies:** Task 2.1, Task 2.2, Task 2.3, Task 4.1
**Files:** None (deployment)

**Description:**
Deploy backend changes to Railway production.

**Deliverables:**

- Backend deployed to production
- API endpoints tested
- Health check passed

**Acceptance Criteria:**

- [ ] Code merged to main branch
- [ ] Railway build successful
- [ ] Migration run (Task 6.2)
- [ ] GET /api/user/profile endpoint works
- [ ] PUT /api/user/profile endpoint works
- [ ] Privacy endpoints work
- [ ] AI mediation uses profile context
- [ ] No server errors in logs
- [ ] Database connection stable
- [ ] Encryption/decryption working

**Deployment:**

```bash
# Deploy to Railway (automatic on push)
git push origin main

# Verify deployment
railway logs --tail

# Test endpoints
curl https://demo-production-6dcd.up.railway.app/api/user/profile?username=testuser
```

---

### Task 6.5: User Documentation

**Type:** docs
**Priority:** medium
**Complexity:** medium (2-3h)
**Dependencies:** Task 6.3
**Files to Create:**

- `/Users/athenasees/Desktop/chat/docs/user-guide-profile-wizard.md`

**Description:**
Create user-facing documentation for the profile wizard feature.

**Deliverables:**

- Profile wizard guide
- Privacy settings guide
- FAQ section
- Screenshots

**Acceptance Criteria:**

- [ ] Introduction to profile wizard
- [ ] Step-by-step guide for each wizard step
- [ ] Privacy settings explanation
- [ ] FAQ: Why share this information?
- [ ] FAQ: Is my data secure?
- [ ] FAQ: What does my co-parent see?
- [ ] FAQ: Can I change my answers later?
- [ ] Screenshots of key screens
- [ ] Mobile and desktop views shown
- [ ] Markdown formatting
- [ ] Accessible language (8th grade reading level)

---

### Task 6.6: Developer Documentation

**Type:** docs
**Priority:** medium
**Complexity:** small (1-2h)
**Dependencies:** All implementation tasks
**Files to Create:**

- `/Users/athenasees/Desktop/chat/docs/dev-guide-profile-system.md`

**Description:**
Create developer documentation for the profile system architecture.

**Deliverables:**

- Architecture overview
- API documentation
- Database schema
- Security notes

**Acceptance Criteria:**

- [ ] Architecture diagram (database, backend, frontend)
- [ ] API endpoint documentation (all routes)
- [ ] Request/response examples
- [ ] Database schema diagram
- [ ] Encryption implementation notes
- [ ] Privacy filtering logic explained
- [ ] AI integration notes
- [ ] Common issues and solutions
- [ ] Future enhancement ideas
- [ ] Code examples for extending system

---

## Task Summary

### Total Tasks: 32

- **Phase 1 (Database):** 3 tasks (8-11 hours)
- **Phase 2 (Backend API):** 3 tasks (10-14 hours)
- **Phase 3 (Frontend):** 9 tasks (25-32 hours)
- **Phase 4 (AI Integration):** 2 tasks (5-8 hours)
- **Phase 5 (Testing):** 3 tasks (11-14 hours)
- **Phase 6 (Deployment):** 6 tasks (8-11 hours)

### Estimated Total Time: 67-90 hours

### Critical Path:

1. Task 1.1 → Task 1.2 → Task 1.3 (Database foundation)
2. Task 2.1 → Task 2.2 (Backend API)
3. Task 3.8 → Task 3.1 (Frontend foundation)
4. Task 3.2-3.6 (Form components - can parallelize)
5. Task 4.1 (AI integration)
6. Task 5.1, 5.2 (Testing - can parallelize)
7. Task 6.1 → Task 6.2 → Task 6.3, 6.4 (Deployment)

### Parallelization Opportunities:

- Tasks 3.2-3.6 (form components) can be built simultaneously
- Tasks 5.1 and 5.2 (backend/frontend tests) can be done in parallel
- Tasks 6.3 and 6.4 (frontend/backend deployment) can be done together
- Documentation tasks (6.5, 6.6) can be done anytime after implementation

---

## Implementation Priority Recommendations

### Week 1 (Foundation):

- Task 1.1, 1.2, 1.3 (Database)
- Task 2.1, 2.2 (Backend API core)

### Week 2 (Frontend Core):

- Task 3.8 (Extend useProfile)
- Task 3.1 (ProfileWizard)
- Task 3.2, 3.3 (Personal & Work forms)

### Week 3 (Frontend Complete):

- Task 3.4, 3.5, 3.6 (Health, Financial, Background forms)
- Task 3.7 (Privacy Settings)
- Task 2.3 (Privacy API endpoints)

### Week 4 (Integration & Testing):

- Task 4.1, 4.2 (AI integration)
- Task 5.1, 5.2, 5.3 (All tests)

### Week 5 (Deployment):

- Task 6.1-6.6 (All deployment and docs)

---

## Risk Mitigation

### High-Risk Tasks:

1. **Task 1.2** (Database migration) - Risk: Data loss
   - Mitigation: Test on staging first, backup before production

2. **Task 2.2** (Profile update endpoint) - Risk: Breaking existing functionality
   - Mitigation: Maintain backward compatibility, comprehensive tests

3. **Task 4.1** (AI integration) - Risk: Privacy leaks
   - Mitigation: Extensive testing, code review, indirect references only

### Dependencies:

- All frontend tasks depend on backend API being deployed
- AI tasks depend on database schema being in place
- Deployment tasks depend on all tests passing

---

## Success Criteria

### Feature is Complete When:

- [ ] All 40+ profile fields can be edited
- [ ] Privacy settings prevent health/financial sharing
- [ ] AI mediation uses profile context appropriately
- [ ] Profile completion percentage calculates correctly
- [ ] Wizard UX is smooth on mobile and desktop
- [ ] All tests pass (90%+ coverage)
- [ ] Documentation complete (user + developer)
- [ ] Deployed to production without errors
- [ ] Zero privacy incidents after 1 week
- [ ] User feedback positive (>4/5 rating)

---

**End of Tasks Document**
