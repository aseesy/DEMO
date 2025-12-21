# Implementation Plan: Comprehensive User Profile System

**Feature ID:** 010
**Plan Created:** 2025-11-29
**Specification:** `specs/010-user-profile-comprehensive/spec.md`

---

## Technical Context (From Codebase Exploration)

### Architecture

- **Frontend:** React 18 + Vite, deployed to Vercel
- **Backend:** Node.js + Express.js + Socket.io, deployed to Railway
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **AI System:** LiaiZen mediator in `chat-server/src/liaizen/`

### Existing Profile Infrastructure

- **Database:** `users` table with 15+ profile columns already migrated
- **Frontend:** `ProfilePanel.jsx` with basic profile editing
- **Hook:** `useProfile.js` for state management
- **API:** `GET/PUT /api/user/profile` endpoints exist

### Design System

- **Primary Colors:** Teal (#275559, #00908B, #007470)
- **Focus Ring:** #4DA8B0 with 20% opacity
- **Buttons:** rounded-lg, min-height 44px
- **Forms:** border-2 border-gray-200, focus:border-[#4DA8B0]
- **Cards:** bg-white rounded-xl p-5 border border-gray-100 shadow-sm

---

## Phase 1: Database Schema Extension (Day 1-2)

### 1.1 Add New Columns to `users` Table

**File:** `chat-server/db.js` (SQLite) + `chat-server/dbPostgres.js` (PostgreSQL)

```sql
-- Personal Information (extend existing)
ALTER TABLE users ADD COLUMN preferred_name TEXT;
ALTER TABLE users ADD COLUMN pronouns TEXT;
ALTER TABLE users ADD COLUMN birthdate TEXT;
ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN timezone TEXT;
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN city TEXT;
ALTER TABLE users ADD COLUMN state TEXT;
ALTER TABLE users ADD COLUMN zip TEXT;

-- Work & Schedule
ALTER TABLE users ADD COLUMN employment_status TEXT;
ALTER TABLE users ADD COLUMN employer TEXT;
ALTER TABLE users ADD COLUMN work_schedule TEXT;
ALTER TABLE users ADD COLUMN schedule_flexibility TEXT;
ALTER TABLE users ADD COLUMN commute_time TEXT;
ALTER TABLE users ADD COLUMN travel_required TEXT;

-- Health (Encrypted at rest)
ALTER TABLE users ADD COLUMN health_physical_conditions TEXT;
ALTER TABLE users ADD COLUMN health_physical_limitations TEXT;
ALTER TABLE users ADD COLUMN health_mental_conditions TEXT;
ALTER TABLE users ADD COLUMN health_mental_treatment TEXT;
ALTER TABLE users ADD COLUMN health_mental_history TEXT;
ALTER TABLE users ADD COLUMN health_substance_history TEXT;
ALTER TABLE users ADD COLUMN health_in_recovery TEXT;
ALTER TABLE users ADD COLUMN health_recovery_duration TEXT;

-- Financial
ALTER TABLE users ADD COLUMN finance_income_level TEXT;
ALTER TABLE users ADD COLUMN finance_income_stability TEXT;
ALTER TABLE users ADD COLUMN finance_employment_benefits TEXT;
ALTER TABLE users ADD COLUMN finance_housing_status TEXT;
ALTER TABLE users ADD COLUMN finance_housing_type TEXT;
ALTER TABLE users ADD COLUMN finance_vehicles TEXT;
ALTER TABLE users ADD COLUMN finance_debt_stress TEXT;
ALTER TABLE users ADD COLUMN finance_support_paying TEXT;
ALTER TABLE users ADD COLUMN finance_support_receiving TEXT;

-- Background
ALTER TABLE users ADD COLUMN background_birthplace TEXT;
ALTER TABLE users ADD COLUMN background_raised TEXT;
ALTER TABLE users ADD COLUMN background_family_origin TEXT;
ALTER TABLE users ADD COLUMN background_culture TEXT;
ALTER TABLE users ADD COLUMN background_religion TEXT;
ALTER TABLE users ADD COLUMN background_military TEXT;
ALTER TABLE users ADD COLUMN background_military_branch TEXT;
ALTER TABLE users ADD COLUMN background_military_status TEXT;
ALTER TABLE users ADD COLUMN education_level TEXT;
ALTER TABLE users ADD COLUMN education_field TEXT;

-- Profile Metadata
ALTER TABLE users ADD COLUMN profile_completion_percentage INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN profile_last_updated TEXT;
```

### 1.2 Create Privacy Settings Table

**File:** `chat-server/db.js`

```sql
CREATE TABLE IF NOT EXISTS user_profile_privacy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,

  -- Section visibility: 'private' | 'shared'
  personal_visibility TEXT DEFAULT 'shared',
  work_visibility TEXT DEFAULT 'private',
  health_visibility TEXT DEFAULT 'private',
  financial_visibility TEXT DEFAULT 'private',
  background_visibility TEXT DEFAULT 'shared',

  -- Individual field overrides (JSON)
  field_overrides TEXT,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 1.3 Create Profile Audit Log Table

```sql
CREATE TABLE IF NOT EXISTS profile_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,  -- 'field_updated', 'visibility_changed', 'profile_viewed'
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  viewer_user_id INTEGER,  -- For 'profile_viewed' actions
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 1.4 Migration Script

**File:** `chat-server/migrations/010_user_profile_comprehensive.js`

```javascript
module.exports = {
  up: async db => {
    // Add columns in batches to avoid timeout
    const columns = [
      // Personal
      { name: 'preferred_name', type: 'TEXT' },
      { name: 'pronouns', type: 'TEXT' },
      // ... all columns from above
    ];

    for (const col of columns) {
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
    }

    // Create privacy table
    await db.query(`CREATE TABLE IF NOT EXISTS user_profile_privacy ...`);

    // Create audit log table
    await db.query(`CREATE TABLE IF NOT EXISTS profile_audit_log ...`);
  },

  down: async db => {
    // Rollback script
  },
};
```

---

## Phase 2: Backend API Extension (Day 3-5)

### 2.1 Update Profile GET Endpoint

**File:** `chat-server/server.js` (modify existing endpoint around line 6009)

```javascript
// GET /api/user/profile
app.get('/api/user/profile', verifyAuth, async (req, res) => {
  try {
    const { username, includePrivate } = req.query;
    const requestingUser = req.user.username;

    // Fetch user profile
    const user = await dbSafe.safeSelect('users', { username }, { limit: 1 });
    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch privacy settings
    const privacy = await dbSafe.safeSelect(
      'user_profile_privacy',
      { user_id: user[0].id },
      { limit: 1 }
    );

    const privacySettings = privacy[0] || getDefaultPrivacySettings();

    // Filter response based on who's requesting
    const isOwnProfile = requestingUser.toLowerCase() === username.toLowerCase();
    const profile = filterProfileByPrivacy(user[0], privacySettings, isOwnProfile);

    // Log view if viewing co-parent's profile
    if (!isOwnProfile) {
      await logProfileView(user[0].id, req.user.id);
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

### 2.2 Update Profile PUT Endpoint

**File:** `chat-server/server.js` (modify existing endpoint around line 6049)

```javascript
// PUT /api/user/profile
app.put('/api/user/profile', verifyAuth, async (req, res) => {
  try {
    const { currentUsername, ...profileData } = req.body;

    // Validate field lengths
    const validation = validateProfileFields(profileData);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Get user
    const user = await dbSafe.safeSelect(
      'users',
      { username: currentUsername.toLowerCase() },
      { limit: 1 }
    );
    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Encrypt sensitive health data before storage
    const encryptedData = encryptSensitiveFields(profileData);

    // Update profile
    await dbSafe.safeUpdate('users', encryptedData, { id: user[0].id });

    // Log field changes to audit log
    await logProfileChanges(user[0].id, user[0], profileData);

    // Calculate and update completion percentage
    const completionPct = calculateProfileCompletion(profileData);
    await dbSafe.safeUpdate(
      'users',
      {
        profile_completion_percentage: completionPct,
        profile_last_updated: new Date().toISOString(),
      },
      { id: user[0].id }
    );

    // Auto-complete onboarding task if threshold met
    if (completionPct >= 50) {
      await autoCompleteOnboardingTasks(user[0].id);
    }

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

### 2.3 Privacy Settings Endpoints

**File:** `chat-server/server.js` (new endpoints)

```javascript
// GET /api/user/profile/privacy
app.get('/api/user/profile/privacy', verifyAuth, async (req, res) => {
  const userId = req.user.id;
  const privacy = await dbSafe.safeSelect(
    'user_profile_privacy',
    { user_id: userId },
    { limit: 1 }
  );
  res.json(privacy[0] || getDefaultPrivacySettings());
});

// PUT /api/user/profile/privacy
app.put('/api/user/profile/privacy', verifyAuth, async (req, res) => {
  const userId = req.user.id;
  const {
    personal_visibility,
    work_visibility,
    health_visibility,
    financial_visibility,
    background_visibility,
    field_overrides,
  } = req.body;

  // Upsert privacy settings
  const existing = await dbSafe.safeSelect(
    'user_profile_privacy',
    { user_id: userId },
    { limit: 1 }
  );

  if (existing.length) {
    await dbSafe.safeUpdate(
      'user_profile_privacy',
      {
        personal_visibility,
        work_visibility,
        health_visibility,
        financial_visibility,
        background_visibility,
        field_overrides: JSON.stringify(field_overrides),
        updated_at: new Date().toISOString(),
      },
      { user_id: userId }
    );
  } else {
    await dbSafe.safeInsert('user_profile_privacy', {
      user_id: userId,
      personal_visibility,
      work_visibility,
      health_visibility,
      financial_visibility,
      background_visibility,
      field_overrides: JSON.stringify(field_overrides),
    });
  }

  // Log privacy change
  await logPrivacyChange(userId, req.body);

  res.json({ success: true });
});

// GET /api/user/profile/preview-coparent-view
app.get('/api/user/profile/preview-coparent-view', verifyAuth, async (req, res) => {
  const userId = req.user.id;

  const user = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
  const privacy = await dbSafe.safeSelect(
    'user_profile_privacy',
    { user_id: userId },
    { limit: 1 }
  );

  // Return profile as co-parent would see it
  const filteredProfile = filterProfileByPrivacy(user[0], privacy[0], false);
  res.json(filteredProfile);
});
```

### 2.4 Helper Functions

**File:** `chat-server/src/utils/profileHelpers.js` (new file)

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
  const encrypted = { ...data };
  for (const field of SENSITIVE_FIELDS) {
    if (encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }
  return encrypted;
}

function decryptSensitiveFields(data) {
  const decrypted = { ...data };
  for (const field of SENSITIVE_FIELDS) {
    if (decrypted[field]) {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch (e) {
        // Field wasn't encrypted (legacy data)
      }
    }
  }
  return decrypted;
}

function filterProfileByPrivacy(profile, privacySettings, isOwnProfile) {
  if (isOwnProfile) {
    return decryptSensitiveFields(profile);
  }

  const filtered = {};
  const sectionMap = {
    personal: [
      'first_name',
      'last_name',
      'preferred_name',
      'pronouns',
      'language',
      'timezone',
      'phone',
      'city',
      'state',
      'zip',
    ],
    work: [
      'occupation',
      'employer',
      'employment_status',
      'work_schedule',
      'schedule_flexibility',
      'commute_time',
      'travel_required',
    ],
    health: SENSITIVE_FIELDS.filter(f => f.startsWith('health_')),
    financial: SENSITIVE_FIELDS.filter(f => f.startsWith('finance_')),
    background: [
      'background_birthplace',
      'background_raised',
      'background_family_origin',
      'background_culture',
      'background_religion',
      'background_military',
      'education_level',
      'education_field',
    ],
  };

  // Always include basic identity fields
  filtered.username = profile.username;
  filtered.display_name = profile.display_name;
  filtered.profile_picture = profile.profile_picture;

  for (const [section, fields] of Object.entries(sectionMap)) {
    const visibility = privacySettings?.[`${section}_visibility`] || 'private';
    if (visibility === 'shared') {
      for (const field of fields) {
        if (profile[field]) {
          filtered[field] = profile[field];
        }
      }
    }
  }

  return filtered;
}

function calculateProfileCompletion(profile) {
  const fields = [
    // Personal (20%)
    'first_name',
    'last_name',
    'birthdate',
    'pronouns',
    'timezone',
    // Work (20%)
    'occupation',
    'employment_status',
    'work_schedule',
    // Health (20%)
    'health_physical_conditions',
    'health_mental_conditions',
    // Financial (20%)
    'finance_income_level',
    'finance_housing_status',
    // Background (20%)
    'education_level',
    'background_culture',
  ];

  let filledCount = 0;
  for (const field of fields) {
    if (profile[field] && profile[field].trim()) {
      filledCount++;
    }
  }

  return Math.round((filledCount / fields.length) * 100);
}

function getDefaultPrivacySettings() {
  return {
    personal_visibility: 'shared',
    work_visibility: 'private',
    health_visibility: 'private',
    financial_visibility: 'private',
    background_visibility: 'shared',
    field_overrides: {},
  };
}

module.exports = {
  encryptSensitiveFields,
  decryptSensitiveFields,
  filterProfileByPrivacy,
  calculateProfileCompletion,
  getDefaultPrivacySettings,
  SENSITIVE_FIELDS,
};
```

---

## Phase 3: Frontend Profile Wizard (Day 6-10)

### 3.1 Profile Wizard Component

**File:** `chat-client-vite/src/components/ProfileWizard.jsx` (new file)

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
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                idx <= currentStep ? 'text-teal-dark' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                ${
                  idx < currentStep
                    ? 'bg-teal-medium text-white'
                    : idx === currentStep
                      ? 'bg-teal-lightest border-2 border-teal-medium'
                      : 'bg-gray-100'
                }`}
              >
                {idx < currentStep ? '✓' : step.icon}
              </div>
              <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-full bg-teal-medium rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{STEPS[currentStep].title}</h2>
        <p className="text-gray-600 mb-6">{getStepDescription(STEPS[currentStep].id)}</p>

        {currentStep === 0 && (
          <PersonalInfoForm profileData={profileData} updateField={updateField} />
        )}
        {currentStep === 1 && (
          <WorkScheduleForm profileData={profileData} updateField={updateField} />
        )}
        {currentStep === 2 && (
          <HealthWellbeingForm profileData={profileData} updateField={updateField} />
        )}
        {currentStep === 3 && (
          <FinancialContextForm profileData={profileData} updateField={updateField} />
        )}
        {currentStep === 4 && (
          <BackgroundForm profileData={profileData} updateField={updateField} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          <button onClick={handleSkip} className="px-4 py-2 text-gray-500 hover:text-gray-700">
            Skip for now
          </button>
          <button
            onClick={handleNext}
            disabled={isSaving}
            className="px-6 py-2.5 bg-teal-dark text-white rounded-lg hover:bg-teal-darkest
                       disabled:opacity-50 min-h-[44px] flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : currentStep === STEPS.length - 1 ? (
              'Complete'
            ) : (
              'Continue →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3.2 Form Section Components

**File:** `chat-client-vite/src/components/profile/PersonalInfoForm.jsx`

```jsx
export function PersonalInfoForm({ profileData, updateField }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="First Name"
          value={profileData.first_name}
          onChange={v => updateField('first_name', v)}
          placeholder="Your first name"
        />
        <FormField
          label="Last Name"
          value={profileData.last_name}
          onChange={v => updateField('last_name', v)}
          placeholder="Your last name"
        />
      </div>

      <FormField
        label="Preferred Name"
        value={profileData.preferred_name}
        onChange={v => updateField('preferred_name', v)}
        placeholder="What should we call you?"
        hint="This is how LiaiZen will address you"
      />

      <FormSelect
        label="Pronouns"
        value={profileData.pronouns}
        onChange={v => updateField('pronouns', v)}
        options={[
          { value: '', label: 'Select pronouns' },
          { value: 'he/him', label: 'He/Him' },
          { value: 'she/her', label: 'She/Her' },
          { value: 'they/them', label: 'They/Them' },
          { value: 'other', label: 'Other / Prefer not to say' },
        ]}
      />

      <FormField
        label="Birthdate"
        type="date"
        value={profileData.birthdate}
        onChange={v => updateField('birthdate', v)}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          label="Language"
          value={profileData.language || 'en'}
          onChange={v => updateField('language', v)}
          options={[
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
          ]}
        />
        <FormSelect
          label="Timezone"
          value={profileData.timezone}
          onChange={v => updateField('timezone', v)}
          options={getTimezoneOptions()}
        />
      </div>
    </div>
  );
}
```

**File:** `chat-client-vite/src/components/profile/WorkScheduleForm.jsx`

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

      <FormSelect
        label="Employment Status"
        value={profileData.employment_status}
        onChange={v => updateField('employment_status', v)}
        options={[
          { value: '', label: 'Select status' },
          { value: 'employed', label: 'Employed' },
          { value: 'self_employed', label: 'Self-Employed' },
          { value: 'unemployed', label: 'Unemployed' },
          { value: 'student', label: 'Student' },
          { value: 'retired', label: 'Retired' },
          { value: 'disability', label: 'Disability' },
        ]}
      />

      <FormField
        label="Occupation"
        value={profileData.occupation}
        onChange={v => updateField('occupation', v)}
        placeholder="e.g., Teacher, Software Engineer"
      />

      <FormTextarea
        label="Work Schedule"
        value={profileData.work_schedule}
        onChange={v => updateField('work_schedule', v)}
        placeholder="e.g., Monday-Friday 9-5, rotating shifts, flexible hours"
        hint="Helps AI understand when you're available for pickups/communication"
      />

      <FormSelect
        label="Schedule Flexibility"
        value={profileData.schedule_flexibility}
        onChange={v => updateField('schedule_flexibility', v)}
        options={[
          { value: '', label: 'Select flexibility' },
          { value: 'high', label: 'High - I can adjust most times' },
          { value: 'medium', label: 'Medium - Some flexibility' },
          { value: 'low', label: 'Low - Very rigid schedule' },
        ]}
      />

      <FormField
        label="Commute Time"
        value={profileData.commute_time}
        onChange={v => updateField('commute_time', v)}
        placeholder="e.g., 30 minutes, 1 hour"
        hint="Helps with pickup/dropoff logistics"
      />
    </div>
  );
}
```

**File:** `chat-client-vite/src/components/profile/HealthWellbeingForm.jsx`

```jsx
export function HealthWellbeingForm({ profileData, updateField }) {
  return (
    <div className="space-y-4">
      {/* Privacy Notice - Extra Emphasis */}
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

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Physical Health</h4>

        <FormMultiSelect
          label="Physical Conditions (if any)"
          value={profileData.health_physical_conditions}
          onChange={v => updateField('health_physical_conditions', v)}
          options={[
            'Chronic pain',
            'Mobility limitations',
            'Fatigue/energy issues',
            'Autoimmune condition',
            'Other',
            'Prefer not to say',
          ]}
          hint="Select all that apply"
        />

        <FormTextarea
          label="How do these affect your parenting?"
          value={profileData.health_physical_limitations}
          onChange={v => updateField('health_physical_limitations', v)}
          placeholder="Optional - helps AI understand your constraints"
        />
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Mental Health</h4>

        <FormMultiSelect
          label="Mental Health Considerations"
          value={profileData.health_mental_conditions}
          onChange={v => updateField('health_mental_conditions', v)}
          options={['Anxiety', 'Depression', 'PTSD', 'ADHD', 'Other', 'None', 'Prefer not to say']}
        />

        <FormSelect
          label="Currently in treatment?"
          value={profileData.health_mental_treatment}
          onChange={v => updateField('health_mental_treatment', v)}
          options={[
            { value: '', label: 'Select option' },
            { value: 'therapy', label: 'Therapy' },
            { value: 'medication', label: 'Medication' },
            { value: 'both', label: 'Both therapy and medication' },
            { value: 'none', label: 'Not currently' },
            { value: 'prefer_not_say', label: 'Prefer not to say' },
          ]}
        />
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Substance Use</h4>

        <FormSelect
          label="Substance use history"
          value={profileData.health_substance_history}
          onChange={v => updateField('health_substance_history', v)}
          options={[
            { value: '', label: 'Select option' },
            { value: 'none', label: 'No history' },
            { value: 'past', label: 'Past use' },
            { value: 'current', label: 'Current use' },
            { value: 'prefer_not_say', label: 'Prefer not to say' },
          ]}
        />

        {(profileData.health_substance_history === 'past' ||
          profileData.health_substance_history === 'current') && (
          <FormSelect
            label="In recovery?"
            value={profileData.health_in_recovery}
            onChange={v => updateField('health_in_recovery', v)}
            options={[
              { value: '', label: 'Select option' },
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'prefer_not_say', label: 'Prefer not to say' },
            ]}
          />
        )}
      </div>
    </div>
  );
}
```

### 3.3 Privacy Settings Component

**File:** `chat-client-vite/src/components/profile/PrivacySettings.jsx`

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
    {
      id: 'work',
      label: 'Work & Schedule',
      icon: '💼',
      fields: 'Employment, schedule, flexibility',
    },
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
      fields: 'Income, housing, debt',
      locked: true,
    },
    { id: 'background', label: 'Background', icon: '🏠', fields: 'Education, culture, family' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Privacy Settings</h3>
        <button
          onClick={loadPreview}
          className="text-sm text-teal-dark hover:text-teal-darkest flex items-center gap-1"
        >
          <span>👁️</span> Preview co-parent view
        </button>
      </div>

      <p className="text-sm text-gray-600">
        Control what information is visible to your co-parent. Health and Financial data is always
        private (AI-only).
      </p>

      <div className="space-y-3">
        {sections.map(section => (
          <div
            key={section.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{section.icon}</span>
              <div>
                <p className="font-medium text-gray-900">{section.label}</p>
                <p className="text-sm text-gray-500">{section.fields}</p>
              </div>
            </div>

            {section.locked ? (
              <div className="flex items-center gap-2 text-gray-400">
                <span>🔒</span>
                <span className="text-sm">Always Private</span>
              </div>
            ) : (
              <select
                value={settings?.[`${section.id}_visibility`] || 'private'}
                onChange={e => updateVisibility(section.id, e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm
                           focus:outline-none focus:border-[#4DA8B0]"
              >
                <option value="private">🔒 Private (AI only)</option>
                <option value="shared">✓ Shared with co-parent</option>
              </select>
            )}
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Co-Parent's View of Your Profile</h3>
              <button
                onClick={() => setPreviewMode(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(previewData || {}).map(
                ([key, value]) =>
                  value && (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-gray-900">{value}</span>
                    </div>
                  )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3.4 Update useProfile Hook

**File:** `chat-client-vite/src/hooks/useProfile.js` (modify existing)

Add new fields to the profile state and update save/load methods to handle all new fields.

---

## Phase 4: AI Integration (Day 11-13)

### 4.1 Update AI Mediator Context

**File:** `chat-server/src/liaizen/core/mediator.js`

```javascript
// Add profile context to mediation
async function buildUserContext(userId) {
  const user = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
  if (!user.length) return null;

  const profile = decryptSensitiveFields(user[0]);

  // Build concise context (max 500 tokens)
  const contextParts = [];

  // Work context
  if (profile.work_schedule || profile.schedule_flexibility) {
    contextParts.push(
      `Work: ${profile.employment_status || 'employed'}, ` +
        `schedule: ${profile.work_schedule || 'standard'}, ` +
        `flexibility: ${profile.schedule_flexibility || 'medium'}`
    );
  }

  // Health context (indirect references only)
  if (profile.health_physical_conditions || profile.health_mental_conditions) {
    const hasPhysical =
      profile.health_physical_conditions?.includes('chronic') ||
      profile.health_physical_conditions?.includes('mobility');
    const hasMental =
      profile.health_mental_conditions?.includes('anxiety') ||
      profile.health_mental_conditions?.includes('depression');

    if (hasPhysical) contextParts.push('Has physical health considerations');
    if (hasMental) contextParts.push('Managing stress/mental health challenges');
  }

  // Financial stress (indirect)
  if (
    profile.finance_debt_stress === 'significant' ||
    profile.finance_debt_stress === 'overwhelming'
  ) {
    contextParts.push('Experiencing financial stress');
  }

  // Communication style
  if (profile.communication_style) {
    contextParts.push(`Communication preference: ${profile.communication_style}`);
  }

  return contextParts.join('. ') || null;
}

// Inject into mediation prompt
async function mediateMessage(message, senderContext, receiverContext) {
  const senderProfile = await buildUserContext(message.senderId);
  const receiverProfile = await buildUserContext(message.receiverId);

  const systemPrompt = `
    ${CONSTITUTION}

    SENDER CONTEXT:
    ${senderProfile || 'No profile data available'}

    RECEIVER CONTEXT (for empathy, not disclosure):
    ${receiverProfile || 'No profile data available'}

    Use this context to personalize coaching without revealing private details.
  `;

  // ... rest of mediation logic
}
```

### 4.2 Profile-Aware Coaching Examples

**File:** `chat-server/src/liaizen/policies/profile-coaching-examples.md`

```markdown
# Profile-Aware Coaching Examples

## Work Schedule Context

USER PROFILE: Works evenings, low flexibility
MESSAGE: "Why can't you pick up tomorrow at 4pm?"

COACHING: "I notice this timing may be challenging given your schedule.
Consider: 'I have a work conflict at 4pm. Could we do 6pm, or would morning work better for you?'"

## Health Considerations

USER PROFILE: Has anxiety, in therapy
MESSAGE: "This is stressing me out and you don't even care!"

COACHING: "Take a breath. The phrasing 'you don't even care' may escalate.
Try: 'I'm feeling overwhelmed by this situation. Can we find a solution together?'"

## Financial Stress

USER PROFILE: Significant debt stress, receiving support
MESSAGE: "You never pay your fair share!"

COACHING: "Financial discussions can be sensitive. Consider focusing on specifics:
'Can we review the expense breakdown? I want to make sure we're both clear on the split.'"
```

---

## Phase 5: Testing & Validation (Day 14-16)

### 5.1 Backend Tests

**File:** `chat-server/tests/profile.test.js`

```javascript
describe('Profile API', () => {
  describe('GET /api/user/profile', () => {
    test('returns full profile for own user');
    test('filters by privacy settings for other users');
    test('never exposes health data to other users');
    test('never exposes financial data to other users');
  });

  describe('PUT /api/user/profile', () => {
    test('updates profile fields');
    test('encrypts sensitive fields');
    test('validates field lengths');
    test('calculates completion percentage');
    test('logs changes to audit log');
  });

  describe('Privacy Settings', () => {
    test('defaults to appropriate privacy levels');
    test('allows toggling section visibility');
    test('prevents toggling health/financial visibility');
    test('preview shows correct filtered view');
  });
});
```

### 5.2 Frontend Tests

**File:** `chat-client-vite/src/components/__tests__/ProfileWizard.test.jsx`

```javascript
describe('ProfileWizard', () => {
  test('renders all 5 steps');
  test('allows navigation between steps');
  test('skip button advances without saving');
  test('save button persists data');
  test('shows completion progress');
  test('calls onComplete after final step');
});

describe('PrivacySettings', () => {
  test('loads current settings');
  test('updates visibility on change');
  test('shows locked indicator for health/financial');
  test('preview modal shows filtered data');
});
```

---

## Phase 6: Deployment & Migration (Day 17-18)

### 6.1 Database Migration

```bash
# Run migration on staging first
railway run npm run migrate -- --file=010_user_profile_comprehensive

# Verify schema
railway run npm run schema:check

# Run on production
railway run npm run migrate:prod -- --file=010_user_profile_comprehensive
```

### 6.2 Environment Variables

Add to Railway and Vercel:

```bash
PROFILE_ENCRYPTION_KEY=<generate-secure-key>
```

### 6.3 Deployment Steps

1. Deploy backend to Railway (includes migrations)
2. Verify API endpoints work on staging
3. Deploy frontend to Vercel
4. Smoke test profile wizard flow
5. Monitor error logs for 24 hours
6. Announce feature to users

---

## File Changes Summary

### New Files (12)

```
chat-server/
├── migrations/010_user_profile_comprehensive.js
├── src/utils/profileHelpers.js
└── tests/profile.test.js

chat-client-vite/src/
├── components/
│   ├── ProfileWizard.jsx
│   └── profile/
│       ├── PersonalInfoForm.jsx
│       ├── WorkScheduleForm.jsx
│       ├── HealthWellbeingForm.jsx
│       ├── FinancialContextForm.jsx
│       ├── BackgroundForm.jsx
│       └── PrivacySettings.jsx
└── components/__tests__/
    └── ProfileWizard.test.jsx
```

### Modified Files (6)

```
chat-server/
├── db.js                  # Add new columns, tables
├── server.js              # Add/modify API endpoints
└── src/liaizen/core/mediator.js  # Add profile context

chat-client-vite/src/
├── hooks/useProfile.js    # Extend for new fields
├── components/ProfilePanel.jsx  # Integrate wizard
└── App.jsx                # Add route for wizard
```

---

## Validation Checklist

- [ ] Follows existing architecture (React + Express + SQLite/PostgreSQL)
- [ ] Uses design tokens (teal colors, 44px buttons, rounded-lg)
- [ ] Mobile-first design (wizard works on phone)
- [ ] Privacy-first (health/financial always private)
- [ ] AI integration (profile context in mediation)
- [ ] Encryption for sensitive fields
- [ ] Audit logging for compliance
- [ ] Progressive disclosure UX
- [ ] Backward compatible (all new columns nullable)

---

## Success Metrics (30 days post-launch)

| Metric                  | Target                                  |
| ----------------------- | --------------------------------------- |
| Profile completion rate | >70% at 50%+ completion                 |
| AI escalation reduction | 15% for complete profiles               |
| User satisfaction       | +0.6 improvement on "AI understands me" |
| Privacy incidents       | Zero                                    |

---

## Risks & Mitigations

| Risk                             | Mitigation                                  |
| -------------------------------- | ------------------------------------------- |
| Users overwhelmed by form length | Progressive wizard with skip options        |
| Privacy concerns                 | Clear labeling, preview feature, encryption |
| Database migration failure       | Rollback script, staging testing            |
| AI reveals private info          | Strict prompt engineering, testing          |
| Performance with encryption      | Cache decrypted data in memory per session  |
