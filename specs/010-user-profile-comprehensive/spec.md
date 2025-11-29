# Feature Specification: Comprehensive User Profile System

**Feature ID:** 010
**Feature Name:** Comprehensive User Profile System
**Status:** Draft
**Created:** 2025-11-28
**Priority:** High
**Category:** Core Platform

---

## Overview

### Business Objective
Create a comprehensive user profile system that captures detailed information about co-parents to enable:
- **Better AI mediation** - Context-aware interventions based on work schedules, stress factors, and communication history
- **Personalized support** - Tailored coaching based on individual circumstances
- **Context-aware communication** - AI understands users' limitations, flexibility, and life situations
- **Privacy-controlled sharing** - Users control what information is shared with their co-parent

### Success Metrics
- **Profile completion rate**: >70% of users complete at least 50% of profile fields within 30 days
- **AI mediation improvement**: 15% reduction in conflict escalation for users with complete profiles
- **User satisfaction**: Profile data contributes to 20% improvement in "AI understands my situation" ratings
- **Privacy compliance**: Zero incidents of unauthorized profile data sharing

### User Impact
- Co-parents receive more contextual, empathetic AI coaching
- AI mediator can reference work schedules, health limitations, and communication preferences
- Better matching of co-parent expectations and capabilities
- Reduced conflict through improved mutual understanding

---

## User Stories

### Epic: Profile Data Capture

#### Story 1: Personal Information Collection
**As a** co-parent user
**I want to** provide my personal information in a structured way
**So that** LiaiZen can address me correctly and understand my basic demographics

**Acceptance Criteria:**
- [ ] User can enter first name, last name, preferred name, and pronouns
- [ ] Birthdate field with date picker (validates age 18+)
- [ ] Language preference dropdown (English, Spanish, French - expandable)
- [ ] Timezone auto-detection with manual override option
- [ ] All fields optional except username (already exists)
- [ ] Data saves progressively (no "save" button required for each field)
- [ ] Mobile-friendly form with proper keyboard types (text, date, select)

#### Story 2: Work & Schedule Context
**As a** co-parent user
**I want to** share my work situation and schedule
**So that** the AI can understand my availability constraints and flexibility

**Acceptance Criteria:**
- [ ] Employment status selection: employed, self-employed, unemployed, student, retired, disability
- [ ] Occupation text field (optional)
- [ ] Employer name (optional, for emergency contact context)
- [ ] Schedule description textarea (e.g., "Monday-Friday 9-5, on-call weekends")
- [ ] Flexibility level: high, medium, low (with tooltip explanations)
- [ ] Commute time/distance (helps AI understand pickup/dropoff constraints)
- [ ] Travel requirement: yes/no + frequency dropdown
- [ ] All fields clearly marked as "Private - Not shared with co-parent" with lock icon

#### Story 3: Health & Wellbeing Information
**As a** co-parent user
**I want to** confidentially share health information with the AI
**So that** LiaiZen can understand my limitations and stress factors

**Acceptance Criteria:**
- [ ] Section clearly labeled "Confidential - Only used by AI for better support"
- [ ] Physical health: Multi-select conditions (chronic pain, mobility limitations, other)
- [ ] Physical limitations: Textarea for describing how conditions affect parenting
- [ ] Medications: Optional textarea (clearly marked as "Not required - only if it affects communication energy")
- [ ] Mental health: Multi-select (anxiety, depression, PTSD, other)
- [ ] Mental health treatment: therapy, medication, both, none, prefer not to say
- [ ] Mental health history: Textarea for relevant background affecting co-parenting
- [ ] Substance use: none, past, current + optional details
- [ ] Recovery status: yes/no + duration if applicable
- [ ] All health data encrypted at rest (separate encryption key)
- [ ] "Why we ask" tooltip for each field explaining how it helps AI support

#### Story 4: Financial Context
**As a** co-parent user
**I want to** provide general financial context
**So that** expense discussions can be more realistic and AI can understand financial stress

**Acceptance Criteria:**
- [ ] Income level: Range selection (Under $25k, $25k-$50k, $50k-$75k, $75k-$100k, $100k+, prefer not to say)
- [ ] Income stability: stable, variable, unstable
- [ ] Employment benefits: yes/no (helps understand healthcare coverage context)
- [ ] Housing status: own, rent, living with family, unstable
- [ ] Housing type: house, apartment, condo, other
- [ ] Vehicles: Number and type (for custody logistics)
- [ ] Debt stress level: none, manageable, significant, overwhelming
- [ ] Child support paying: yes/no + amount (optional)
- [ ] Child support receiving: yes/no + amount (optional)
- [ ] Clearly marked as "Private - Used only for AI expense context"
- [ ] Option to hide entire section

#### Story 5: Background & Context
**As a** co-parent user
**I want to** share relevant cultural and personal background
**So that** the AI can understand my communication style and values

**Acceptance Criteria:**
- [ ] Birthplace (city/country)
- [ ] Where raised (if different)
- [ ] Family of origin context: Textarea (optional - for understanding family dynamics)
- [ ] Cultural background: Text field (optional)
- [ ] Religion: Text field (optional - "if it affects parenting decisions")
- [ ] Military service: yes/no + branch + status (veteran/active/reserve)
- [ ] Education level: high school, some college, associates, bachelors, masters, doctorate, trade
- [ ] Field of study (optional)
- [ ] All fields optional with clear "skip" option

### Epic: Privacy & Sharing Controls

#### Story 6: Granular Privacy Settings
**As a** co-parent user
**I want to** control exactly what profile information is shared with my co-parent
**So that** I can maintain appropriate boundaries while still benefiting from AI support

**Acceptance Criteria:**
- [ ] Privacy settings page accessible from profile
- [ ] Each profile section has visibility toggle: "Private (AI only)" / "Shared with co-parent"
- [ ] Default visibility: Work=Private, Health=Private, Financial=Private, Background=Shared (with user confirmation)
- [ ] Visual indicators throughout profile showing what's shared (green check) vs private (lock icon)
- [ ] "Preview co-parent view" button showing exactly what they can see
- [ ] Audit log of what information was shared and when
- [ ] Ability to revoke sharing at any time
- [ ] Confirmation modal before sharing sensitive categories

#### Story 7: Progressive Disclosure
**As a** co-parent user
**I want to** be guided through profile completion gradually
**So that** I don't feel overwhelmed by extensive forms

**Acceptance Criteria:**
- [ ] Profile completion wizard with 5 steps (Personal, Work, Health, Financial, Background)
- [ ] "Skip for now" option on every step
- [ ] Progress indicator showing completion percentage
- [ ] Smart nudges: "Adding work schedule helps AI understand your availability constraints"
- [ ] Re-entry points: Can return to any section later
- [ ] Mobile-optimized multi-step form (one section per screen)
- [ ] Auto-save on every field change
- [ ] "Why this matters" explanation for each section

### Epic: AI Integration

#### Story 8: Profile Data in AI Context
**As a** co-parent user
**I want** the AI mediator to reference my profile data when coaching
**So that** interventions are personalized to my situation

**Acceptance Criteria:**
- [ ] AI mediator receives user profile context with each message analysis
- [ ] Work schedule considered in AI suggestions (e.g., "I know you work evenings, could you respond in the morning?")
- [ ] Health limitations acknowledged (e.g., "Given your mobility constraints, could co-parent handle pickup?")
- [ ] Financial stress considered in expense discussions
- [ ] Cultural background informs communication style interpretation
- [ ] AI never explicitly reveals private info to co-parent (indirect references only)
- [ ] Profile context limited to 500 tokens maximum (prioritize most relevant)

#### Story 9: Communication Profile Learning
**As a** LiaiZen system
**I want to** build a communication profile based on user interactions and explicit profile data
**So that** AI coaching becomes increasingly personalized over time

**Acceptance Criteria:**
- [ ] System tracks intervention acceptance rates per user
- [ ] Preferred communication style inferred from rewrite selections
- [ ] Stress triggers identified from escalation patterns + health data
- [ ] Work schedule constraints factored into "best time to respond" suggestions
- [ ] Profile data enriches existing communication profile system (Feature 002)
- [ ] Monthly "Profile insights" summary showing how data improved mediation

---

## Database Schema

### New Columns for `users` Table (SQLite/PostgreSQL)

```sql
-- Personal Information
ALTER TABLE users ADD COLUMN preferred_name TEXT;
ALTER TABLE users ADD COLUMN pronouns TEXT;  -- he/him, she/her, they/them, custom
ALTER TABLE users ADD COLUMN birthdate TEXT;  -- ISO 8601 format
ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en';  -- ISO 639-1 code
ALTER TABLE users ADD COLUMN timezone TEXT;  -- IANA timezone identifier

-- Work & Schedule
ALTER TABLE users ADD COLUMN employment_status TEXT;  -- employed, self_employed, unemployed, student, retired, disability
ALTER TABLE users ADD COLUMN occupation TEXT;
ALTER TABLE users ADD COLUMN employer TEXT;
ALTER TABLE users ADD COLUMN work_schedule TEXT;  -- Free-form description
ALTER TABLE users ADD COLUMN schedule_flexibility TEXT;  -- high, medium, low
ALTER TABLE users ADD COLUMN commute_info TEXT;  -- e.g., "45 min each way"
ALTER TABLE users ADD COLUMN travel_required BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN travel_frequency TEXT;  -- weekly, monthly, occasional, frequent

-- Health & Wellbeing (Encrypted)
ALTER TABLE users ADD COLUMN health_physical_conditions TEXT;  -- JSON array
ALTER TABLE users ADD COLUMN health_physical_limitations TEXT;
ALTER TABLE users ADD COLUMN health_medications TEXT;  -- Optional, encrypted
ALTER TABLE users ADD COLUMN health_mental_conditions TEXT;  -- JSON array
ALTER TABLE users ADD COLUMN health_mental_treatment TEXT;  -- therapy, medication, both, none
ALTER TABLE users ADD COLUMN health_mental_history TEXT;
ALTER TABLE users ADD COLUMN substance_history TEXT;  -- none, past, current
ALTER TABLE users ADD COLUMN substance_in_recovery BOOLEAN;
ALTER TABLE users ADD COLUMN substance_recovery_duration TEXT;

-- Financial Context
ALTER TABLE users ADD COLUMN income_level TEXT;  -- Range categories
ALTER TABLE users ADD COLUMN income_stability TEXT;  -- stable, variable, unstable
ALTER TABLE users ADD COLUMN employment_benefits BOOLEAN;
ALTER TABLE users ADD COLUMN housing_status TEXT;  -- own, rent, living_with_family, unstable
ALTER TABLE users ADD COLUMN housing_type TEXT;  -- house, apartment, condo, other
ALTER TABLE users ADD COLUMN vehicles TEXT;  -- JSON array: [{"type": "car", "description": "2015 Honda Civic"}]
ALTER TABLE users ADD COLUMN debt_stress TEXT;  -- none, manageable, significant, overwhelming
ALTER TABLE users ADD COLUMN support_paying BOOLEAN;
ALTER TABLE users ADD COLUMN support_paying_amount DECIMAL(10,2);
ALTER TABLE users ADD COLUMN support_receiving BOOLEAN;
ALTER TABLE users ADD COLUMN support_receiving_amount DECIMAL(10,2);

-- Background & Context
ALTER TABLE users ADD COLUMN birthplace TEXT;
ALTER TABLE users ADD COLUMN raised_location TEXT;
ALTER TABLE users ADD COLUMN family_of_origin TEXT;
ALTER TABLE users ADD COLUMN cultural_background TEXT;
ALTER TABLE users ADD COLUMN religion TEXT;
ALTER TABLE users ADD COLUMN military_service BOOLEAN;
ALTER TABLE users ADD COLUMN military_branch TEXT;
ALTER TABLE users ADD COLUMN military_status TEXT;  -- veteran, active, reserve
ALTER TABLE users ADD COLUMN education_level TEXT;
ALTER TABLE users ADD COLUMN education_field TEXT;

-- Metadata
ALTER TABLE users ADD COLUMN profile_completed_at TEXT;  -- When user finished initial profile
ALTER TABLE users ADD COLUMN profile_completion_percentage INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN profile_updated_at TEXT;
```

### New Table: `user_privacy_settings`

```sql
CREATE TABLE user_privacy_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,

  -- Visibility toggles (private = AI only, shared = co-parent can see)
  personal_info_visible BOOLEAN DEFAULT true,
  work_info_visible BOOLEAN DEFAULT false,
  health_info_visible BOOLEAN DEFAULT false,
  financial_info_visible BOOLEAN DEFAULT false,
  background_info_visible BOOLEAN DEFAULT true,

  -- Granular field-level controls (JSON)
  custom_visibility_rules TEXT,  -- JSON: {"occupation": "shared", "employer": "private"}

  -- Audit trail
  last_updated TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by INTEGER,  -- user_id who made the change

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id)
);

CREATE INDEX idx_privacy_settings_user ON user_privacy_settings(user_id);
```

### New Table: `profile_sharing_audit`

```sql
CREATE TABLE profile_sharing_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  field_name TEXT NOT NULL,
  action TEXT NOT NULL,  -- shared, unshared, viewed
  shared_with_user_id INTEGER,  -- NULL if unshared
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  ip_address TEXT,
  user_agent TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_profile_audit_user ON profile_sharing_audit(user_id);
CREATE INDEX idx_profile_audit_timestamp ON profile_sharing_audit(timestamp DESC);
```

---

## API Endpoints

### Profile Management

#### `GET /api/profile`
**Description:** Get current user's profile data
**Authentication:** Required (JWT)
**Authorization:** User can only access their own profile

**Request:**
```http
GET /api/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": 123,
    "username": "alex_parent",
    "email": "alex@example.com",
    "personal": {
      "first_name": "Alex",
      "last_name": "Johnson",
      "preferred_name": "Lex",
      "pronouns": "they/them",
      "birthdate": "1985-03-15",
      "language": "en",
      "timezone": "America/New_York"
    },
    "work": {
      "employment_status": "employed",
      "occupation": "Software Engineer",
      "employer": "Tech Corp",
      "work_schedule": "Monday-Friday 9-5, flexible",
      "schedule_flexibility": "high",
      "commute_info": "20 min drive",
      "travel_required": true,
      "travel_frequency": "monthly"
    },
    "health": {
      "physical_conditions": ["chronic_pain"],
      "physical_limitations": "Difficulty with heavy lifting",
      "medications": null,  // Only included if user entered
      "mental_conditions": ["anxiety"],
      "mental_treatment": "therapy",
      "mental_history": "Relevant background...",
      "substance_history": "none",
      "in_recovery": false,
      "recovery_duration": null
    },
    "financial": {
      "income_level": "$75k-$100k",
      "income_stability": "stable",
      "employment_benefits": true,
      "housing_status": "rent",
      "housing_type": "apartment",
      "vehicles": [{"type": "car", "description": "2015 Honda Civic"}],
      "debt_stress": "manageable",
      "support_paying": true,
      "support_paying_amount": 500.00,
      "support_receiving": false,
      "support_receiving_amount": null
    },
    "background": {
      "birthplace": "Boston, MA",
      "raised_location": "Boston, MA",
      "family_of_origin": "Traditional nuclear family",
      "cultural_background": "Irish-American",
      "religion": "Catholic (non-practicing)",
      "military_service": false,
      "military_branch": null,
      "military_status": null,
      "education_level": "bachelors",
      "education_field": "Computer Science"
    },
    "metadata": {
      "profile_completion_percentage": 85,
      "profile_completed_at": "2025-11-15T14:30:00Z",
      "profile_updated_at": "2025-11-28T10:15:00Z"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Unauthorized - Invalid or missing token"
}
```

---

#### `PUT /api/profile`
**Description:** Update user's profile data (partial updates allowed)
**Authentication:** Required (JWT)
**Authorization:** User can only update their own profile

**Request:**
```http
PUT /api/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "personal": {
    "preferred_name": "Lex",
    "pronouns": "they/them"
  },
  "work": {
    "employment_status": "employed",
    "occupation": "Software Engineer",
    "schedule_flexibility": "high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile_completion_percentage": 67,
  "updated_fields": ["personal.preferred_name", "personal.pronouns", "work.employment_status", "work.occupation", "work.schedule_flexibility"]
}
```

**Validation Errors (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "birthdate": "Must be 18 years or older",
    "employment_status": "Invalid value. Must be one of: employed, self_employed, unemployed, student, retired, disability"
  }
}
```

---

#### `GET /api/profile/privacy`
**Description:** Get privacy settings for current user
**Authentication:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "privacy_settings": {
    "personal_info_visible": true,
    "work_info_visible": false,
    "health_info_visible": false,
    "financial_info_visible": false,
    "background_info_visible": true,
    "custom_visibility_rules": {
      "occupation": "shared",
      "employer": "private",
      "education_level": "shared"
    },
    "last_updated": "2025-11-28T10:00:00Z"
  }
}
```

---

#### `PUT /api/profile/privacy`
**Description:** Update privacy settings
**Authentication:** Required (JWT)

**Request:**
```json
{
  "work_info_visible": true,
  "custom_visibility_rules": {
    "occupation": "shared",
    "employer": "private"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Privacy settings updated",
  "audit_entry_created": true
}
```

---

#### `GET /api/profile/shared/:userId`
**Description:** Get co-parent's shared profile information
**Authentication:** Required (JWT)
**Authorization:** Only accessible if users are connected co-parents

**Response:**
```json
{
  "success": true,
  "profile": {
    "username": "jordan_parent",
    "personal": {
      "first_name": "Jordan",
      "preferred_name": "Jo",
      "pronouns": "she/her"
    },
    "background": {
      "education_level": "masters",
      "education_field": "Psychology"
    }
    // Only includes fields marked as "shared" in privacy settings
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": "Access denied - Not connected as co-parents"
}
```

---

#### `GET /api/profile/completion-status`
**Description:** Get profile completion status and suggestions
**Authentication:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "completion_percentage": 45,
  "completed_sections": ["personal", "background"],
  "incomplete_sections": ["work", "health", "financial"],
  "next_suggested_section": "work",
  "suggestions": [
    {
      "section": "work",
      "field": "work_schedule",
      "reason": "Helps AI understand your availability for pickups/dropoffs",
      "priority": "high"
    },
    {
      "section": "financial",
      "field": "income_level",
      "reason": "Provides context for expense discussions",
      "priority": "medium"
    }
  ]
}
```

---

## Frontend Components

### Component Structure

```
/src/components/profile/
├── ProfileWizard.jsx              # Multi-step onboarding wizard
├── ProfileDashboard.jsx           # Main profile overview
├── sections/
│   ├── PersonalInfoSection.jsx    # Personal information form
│   ├── WorkScheduleSection.jsx    # Work & schedule form
│   ├── HealthWellbeingSection.jsx # Health information form
│   ├── FinancialContextSection.jsx # Financial context form
│   └── BackgroundSection.jsx      # Background & education form
├── PrivacySettings.jsx            # Privacy controls page
├── ProfileCompletionWidget.jsx    # Progress indicator widget
└── CoParentProfileView.jsx        # View co-parent's shared info
```

### ProfileWizard.jsx (New)

**Purpose:** Guide new users through initial profile setup

**Features:**
- 5-step wizard (Personal → Work → Health → Financial → Background)
- Progress indicator (1/5, 2/5, etc.)
- "Skip for now" on every step
- "Why this matters" explanations
- Auto-save on field change
- Mobile-optimized (one section per screen)
- Final step: Privacy review

**Props:**
```jsx
<ProfileWizard
  onComplete={(completionPercentage) => void}
  onSkip={() => void}
  initialStep={1}
/>
```

---

### PersonalInfoSection.jsx (Enhancement to existing ProfilePanel)

**Current State:** ProfilePanel.jsx has basic fields (first_name, last_name, address)
**Enhancements Needed:**
- Add pronouns dropdown
- Add birthdate picker (with age validation)
- Add language selector
- Add timezone dropdown (with auto-detection)
- Add preferred_name field

**Example:**
```jsx
<PersonalInfoSection
  data={profileData.personal}
  onChange={(updatedPersonal) => void}
  autoSave={true}
  showHelp={true}
/>
```

---

### WorkScheduleSection.jsx (New)

**Fields:**
- Employment status dropdown
- Occupation text input
- Employer text input (with privacy tooltip)
- Work schedule textarea (with helpful examples)
- Flexibility level selector (high/medium/low with definitions)
- Commute info text input
- Travel required checkbox + frequency dropdown

**Privacy Indicators:**
- Lock icon next to each field
- "Private - Not shared with co-parent" badge
- Tooltip: "This helps AI understand your constraints"

---

### HealthWellbeingSection.jsx (New)

**Security:**
- Encrypted data indicator
- "Confidential - AI support only" header
- "Why we ask" tooltips for every field

**Fields:**
- Physical conditions multi-select (with "Other" text input)
- Physical limitations textarea
- Medications textarea (clearly optional)
- Mental health conditions multi-select
- Mental health treatment checkboxes
- Mental health history textarea
- Substance use dropdown
- Recovery status (conditional fields)

**UX Considerations:**
- Warm, non-judgmental language
- "Prefer not to say" option on every field
- Hide entire section toggle
- Reassurance about data privacy and encryption

---

### FinancialContextSection.jsx (New)

**Fields:**
- Income level range selector (with "prefer not to say")
- Income stability dropdown
- Employment benefits yes/no
- Housing status dropdown
- Housing type dropdown
- Vehicles (add/remove dynamic list)
- Debt stress level selector
- Child support paying (yes/no + amount)
- Child support receiving (yes/no + amount)

**Privacy:**
- "Private - Used only for AI expense context" banner
- Option to hide entire section
- Lock icons on sensitive fields

---

### PrivacySettings.jsx (New)

**Features:**
- Section-level visibility toggles (Personal, Work, Health, Financial, Background)
- Field-level custom rules (advanced mode)
- "Preview co-parent view" button (opens modal showing exactly what they see)
- Audit log viewer (last 30 days of sharing changes)
- Revoke all sharing button (emergency privacy control)
- Confirmation modals before enabling sharing

**Layout:**
```
[Section: Personal Information] [Toggle: Private/Shared]
  ↳ Fields included: First name, Last name, Pronouns, Language
  ↳ [Advanced: Customize field visibility]

[Section: Work & Schedule] [Toggle: Private/Shared]
  ↳ [Why share this?] tooltip
  ↳ [Advanced: Customize field visibility]

[Preview Co-Parent View Button]
[Audit Log Link]
```

---

### ProfileCompletionWidget.jsx (New)

**Purpose:** Encourage profile completion with gentle nudges

**Display:**
- Circular progress indicator (0-100%)
- "Your profile is X% complete"
- "Next step: Add work schedule" (smart suggestion)
- "Why it matters" tooltip
- "Complete profile" button → Opens ProfileWizard

**Placement:**
- Dashboard sidebar
- Profile page header
- Optional: Dismissible notification after 7 days of inactivity

---

## AI Integration Points

### 1. Profile Context Injection

**Location:** `chat-server/src/liaizen/core/mediator.js`

**Modification:** Enhance `analyzeMessage()` function to include profile context

**Before:**
```javascript
const userContextString = userContexts.length > 0
  ? `\n\nUser Context Information:\n${userContexts.join('\n')}`
  : '';
```

**After:**
```javascript
// Load user profile data
const senderProfile = await loadUserProfile(roleContext.senderId);
const receiverProfile = await loadUserProfile(roleContext.receiverId);

// Build profile context (respecting privacy settings)
const profileContext = buildProfileContextForAI(senderProfile, receiverProfile);

const userContextString = userContexts.length > 0
  ? `\n\nUser Context Information:\n${userContexts.join('\n')}\n\n${profileContext}`
  : `\n\n${profileContext}`;
```

**New Function: `buildProfileContextForAI()`**

```javascript
/**
 * Build AI-ready profile context string (max 500 tokens)
 * Prioritizes most relevant information for current conversation
 */
function buildProfileContextForAI(senderProfile, receiverProfile) {
  const context = [];

  // Sender context (private data, not shared with receiver)
  if (senderProfile) {
    if (senderProfile.work_schedule) {
      context.push(`SENDER SCHEDULE: ${senderProfile.work_schedule}`);
    }
    if (senderProfile.schedule_flexibility) {
      context.push(`SENDER FLEXIBILITY: ${senderProfile.schedule_flexibility}`);
    }
    if (senderProfile.health_physical_limitations) {
      context.push(`SENDER LIMITATIONS: ${senderProfile.health_physical_limitations}`);
    }
    if (senderProfile.debt_stress && senderProfile.debt_stress !== 'none') {
      context.push(`SENDER FINANCIAL STRESS: ${senderProfile.debt_stress}`);
    }
  }

  // Receiver context (only shared data)
  if (receiverProfile && receiverProfile.privacy_settings) {
    const shared = getSharedProfileData(receiverProfile);
    if (shared.work_schedule) {
      context.push(`RECEIVER SCHEDULE: ${shared.work_schedule}`);
    }
    if (shared.schedule_flexibility) {
      context.push(`RECEIVER FLEXIBILITY: ${shared.schedule_flexibility}`);
    }
  }

  return context.length > 0
    ? `\n\nPROFILE CONTEXT:\n${context.join('\n')}\n(Use this context to make suggestions more realistic and empathetic)`
    : '';
}
```

---

### 2. AI Prompt Enhancement

**Location:** `chat-server/src/liaizen/core/mediator.js`

**Enhancement:** Update AI system prompt to leverage profile data

**Addition to prompt:**
```javascript
=== PROFILE-AWARE COACHING ===

You have access to SENDER's profile context (private, never share specifics with receiver):
${profileContext}

Use this context to:
1. Acknowledge constraints: "I know you work evenings, could you respond in the morning?"
2. Suggest realistic solutions: "Given your schedule flexibility, could you handle Tuesday pickup?"
3. Show empathy: "Managing this with your current workload must be challenging."
4. Avoid unrealistic expectations: Don't suggest solutions incompatible with their situation

CRITICAL: Never explicitly reveal private profile data to the receiver. Use indirect references only.
✅ GOOD: "Given your schedule, mornings might work better"
❌ BAD: "Since you work 9-5 at Tech Corp and have anxiety..."
```

---

### 3. Communication Profile Integration

**Location:** `chat-server/src/liaizen/context/communication-profile/`

**Enhancement:** Enrich existing communication profiles with explicit profile data

**New Function in `index.js`:**
```javascript
/**
 * Merge explicit profile data with learned communication profile
 * @param {string} userId - User ID
 * @param {Object} explicitProfile - From user_profile table
 * @returns {Object} Enriched communication profile
 */
async function enrichCommunicationProfile(userId, explicitProfile) {
  const learnedProfile = await loadProfile(userId, db);

  return {
    ...learnedProfile,
    explicit_context: {
      work_constraints: {
        schedule: explicitProfile.work_schedule,
        flexibility: explicitProfile.schedule_flexibility,
        travel: explicitProfile.travel_required
      },
      stress_factors: {
        health: extractHealthStressors(explicitProfile.health),
        financial: explicitProfile.debt_stress,
        commute: explicitProfile.commute_info
      },
      cultural_context: {
        language: explicitProfile.language,
        background: explicitProfile.cultural_background,
        values: inferValues(explicitProfile.religion, explicitProfile.background)
      }
    },
    profile_completion: explicitProfile.profile_completion_percentage,
    last_updated: explicitProfile.profile_updated_at
  };
}
```

---

## Migration Strategy

### Phase 1: Schema Migration (Week 1)

**Steps:**
1. Create migration script: `chat-server/migrations/010-user-profile-comprehensive.sql`
2. Add all new columns to `users` table (with NULL defaults for backwards compatibility)
3. Create `user_privacy_settings` table (with default privacy settings for existing users)
4. Create `profile_sharing_audit` table
5. Test migration on development SQLite database
6. Prepare PostgreSQL migration script (for production)

**Migration Script:**
```sql
-- Migration: 010-user-profile-comprehensive
-- Description: Add comprehensive profile fields to users table
-- Date: 2025-11-28

BEGIN TRANSACTION;

-- Add columns (see Database Schema section above)
-- ... (all ALTER TABLE statements)

-- Create default privacy settings for existing users
INSERT INTO user_privacy_settings (user_id, personal_info_visible, work_info_visible, health_info_visible, financial_info_visible, background_info_visible)
SELECT id, true, false, false, false, true
FROM users
WHERE id NOT IN (SELECT user_id FROM user_privacy_settings);

COMMIT;
```

**Rollback Plan:**
- Create `010-user-profile-comprehensive-rollback.sql`
- Store backup of database before migration
- Test rollback in staging environment

---

### Phase 2: Backend API Development (Week 2-3)

**Tasks:**
1. **Create profile utility module:** `chat-server/profileUtils.js`
   - `loadUserProfile(userId)` - Fetch full profile
   - `updateUserProfile(userId, updates)` - Partial update with validation
   - `calculateCompletionPercentage(profile)` - Completion logic
   - `buildProfileContextForAI(sender, receiver)` - AI context builder
   - `getSharedProfileData(profile, receiverId)` - Privacy-filtered data

2. **Add API endpoints to `chat-server/server.js`:**
   - `GET /api/profile` (line ~500, near existing profile endpoint)
   - `PUT /api/profile` (validation, partial updates)
   - `GET /api/profile/privacy`
   - `PUT /api/profile/privacy` (with audit logging)
   - `GET /api/profile/shared/:userId` (authorization check)
   - `GET /api/profile/completion-status`

3. **Input Validation:**
   - Age validation (18+ for birthdate)
   - Enum validation (employment_status, schedule_flexibility, etc.)
   - Length limits (textarea fields max 1000 chars)
   - Sanitization (strip HTML, prevent XSS)

4. **Encryption Layer:**
   - Create `chat-server/encryption.js` utility
   - Encrypt health_medications field before storage
   - Decrypt on retrieval (only for profile owner)
   - Use separate encryption key stored in environment variable

---

### Phase 3: Frontend UI Development (Week 4-5)

**Tasks:**
1. **Create new components** (see Frontend Components section)
   - ProfileWizard.jsx
   - WorkScheduleSection.jsx
   - HealthWellbeingSection.jsx
   - FinancialContextSection.jsx
   - BackgroundSection.jsx
   - PrivacySettings.jsx
   - ProfileCompletionWidget.jsx

2. **Enhance existing ProfilePanel.jsx:**
   - Add pronouns, birthdate, language, timezone fields
   - Integrate new sections as collapsible panels
   - Add "Privacy Settings" link in header

3. **Create custom hooks:**
   - `useProfileCompletion()` - Track completion status
   - `usePrivacySettings()` - Manage privacy state
   - `useProfileWizard()` - Multi-step form state

4. **Design System Enhancements:**
   - Privacy indicator components (lock icon, "Private" badge)
   - Progress indicator (circular percentage)
   - Tooltip component for "Why we ask" explanations
   - Multi-select component (for conditions, vehicles)

---

### Phase 4: AI Integration (Week 6)

**Tasks:**
1. **Modify mediator.js:**
   - Import profileUtils
   - Load sender/receiver profiles in `analyzeMessage()`
   - Build profile context string
   - Inject into AI prompt

2. **Update AI prompt template:**
   - Add "PROFILE-AWARE COACHING" section
   - Add privacy protection rules
   - Add examples of profile-aware suggestions

3. **Test AI responses:**
   - Verify profile context improves relevance
   - Ensure no privacy leaks (explicit profile data revealed)
   - Measure token usage (ensure under 500 tokens)

4. **Integrate with communication profiles:**
   - Call `enrichCommunicationProfile()` when building AI context
   - Store profile completion percentage in communication profile
   - Use explicit + learned data together

---

### Phase 5: Testing & Privacy Validation (Week 7)

**Tasks:**
1. **Unit Tests:**
   - Profile CRUD operations
   - Privacy settings enforcement
   - Completion percentage calculation
   - Profile context building

2. **Integration Tests:**
   - Profile wizard flow (new user onboarding)
   - Privacy settings changes + audit logging
   - Co-parent profile view (authorization)
   - AI mediation with profile context

3. **Privacy Tests:**
   - Verify private data never exposed via API
   - Test co-parent can only see shared fields
   - Validate encryption of health_medications
   - Audit log captures all sharing changes

4. **Performance Tests:**
   - Profile load time (< 200ms)
   - AI context building (< 50ms)
   - Database query optimization (indexes)

5. **Accessibility Audit:**
   - Screen reader compatibility (form labels, ARIA)
   - Keyboard navigation (wizard, form fields)
   - Color contrast (privacy indicators)
   - Mobile responsiveness (all sections)

---

## Privacy & Security Requirements

### Data Protection

#### 1. Encryption at Rest
- **Field:** `health_medications` (most sensitive)
- **Method:** AES-256-GCM encryption
- **Key Storage:** Environment variable `PROFILE_ENCRYPTION_KEY` (32-byte random key)
- **Implementation:**
  ```javascript
  // chat-server/encryption.js
  const crypto = require('crypto');
  const ENCRYPTION_KEY = Buffer.from(process.env.PROFILE_ENCRYPTION_KEY, 'hex');
  const ALGORITHM = 'aes-256-gcm';

  function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  function decrypt(encryptedText) {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  ```

#### 2. Access Control
- **Rule:** Users can only access their own full profile
- **Exception:** Co-parents can access shared fields only
- **Enforcement:** Middleware checks JWT user_id matches profile owner
- **Authorization Check:**
  ```javascript
  // Verify co-parent relationship before allowing shared profile access
  async function authorizeCoParentAccess(requesterId, targetUserId) {
    const room = await findSharedRoom(requesterId, targetUserId);
    if (!room) {
      throw new Error('Not authorized - not connected as co-parents');
    }
    return true;
  }
  ```

#### 3. Privacy-Filtered Data Retrieval
```javascript
/**
 * Get profile data filtered by privacy settings
 * @param {Object} profile - Full profile object
 * @param {number} viewerId - ID of user requesting data
 * @returns {Object} Filtered profile (only shared fields)
 */
async function getSharedProfileData(profile, viewerId) {
  const privacySettings = await loadPrivacySettings(profile.id);

  const shared = {
    username: profile.username,
    personal: {},
    work: {},
    health: {},
    financial: {},
    background: {}
  };

  // Personal info
  if (privacySettings.personal_info_visible) {
    shared.personal = {
      first_name: profile.first_name,
      preferred_name: profile.preferred_name,
      pronouns: profile.pronouns
    };
  }

  // Work info
  if (privacySettings.work_info_visible) {
    shared.work = {
      occupation: profile.occupation,
      schedule_flexibility: profile.schedule_flexibility
    };

    // Apply custom rules
    if (privacySettings.custom_visibility_rules?.employer === 'private') {
      delete shared.work.employer;
    }
  }

  // Health info - NEVER shared (always private for AI only)
  // Financial info - NEVER shared (always private for AI only)

  // Background info
  if (privacySettings.background_info_visible) {
    shared.background = {
      education_level: profile.education_level,
      education_field: profile.education_field,
      cultural_background: profile.cultural_background
    };
  }

  return shared;
}
```

#### 4. Audit Logging
- **Event:** Every privacy setting change
- **Event:** Every shared profile view by co-parent
- **Event:** Every profile field update
- **Data Captured:** timestamp, user_id, action, field_name, ip_address, user_agent
- **Retention:** 90 days (configurable)
- **Access:** User can view their own audit log via UI

#### 5. Data Retention
- **Profile Data:** Retained until account deletion
- **Audit Logs:** 90 days
- **Soft Delete:** Profile marked as deleted but retained for 30 days (recovery period)
- **Hard Delete:** After 30 days, irreversible deletion of all profile data

---

### Input Validation

#### Server-Side Validation (Required)

```javascript
// chat-server/validators/profileValidator.js

const Joi = require('joi');

const profileSchema = Joi.object({
  personal: Joi.object({
    first_name: Joi.string().max(50).allow(''),
    last_name: Joi.string().max(50).allow(''),
    preferred_name: Joi.string().max(50).allow(''),
    pronouns: Joi.string().valid('he/him', 'she/her', 'they/them', 'other').allow(''),
    birthdate: Joi.date().max('now').custom((value, helpers) => {
      const age = (new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 18) {
        return helpers.error('any.invalid', { message: 'Must be 18 years or older' });
      }
      return value;
    }),
    language: Joi.string().valid('en', 'es', 'fr').default('en'),
    timezone: Joi.string().allow('')
  }),

  work: Joi.object({
    employment_status: Joi.string().valid('employed', 'self_employed', 'unemployed', 'student', 'retired', 'disability').allow(''),
    occupation: Joi.string().max(100).allow(''),
    employer: Joi.string().max(100).allow(''),
    work_schedule: Joi.string().max(500).allow(''),
    schedule_flexibility: Joi.string().valid('high', 'medium', 'low').allow(''),
    commute_info: Joi.string().max(100).allow(''),
    travel_required: Joi.boolean().default(false),
    travel_frequency: Joi.string().valid('weekly', 'monthly', 'occasional', 'frequent').allow('')
  }),

  health: Joi.object({
    physical_conditions: Joi.array().items(Joi.string().max(50)).max(10),
    physical_limitations: Joi.string().max(1000).allow(''),
    medications: Joi.string().max(500).allow(''),  // Will be encrypted
    mental_conditions: Joi.array().items(Joi.string().max(50)).max(10),
    mental_treatment: Joi.string().valid('therapy', 'medication', 'both', 'none', 'prefer_not_to_say').allow(''),
    mental_history: Joi.string().max(1000).allow(''),
    substance_history: Joi.string().valid('none', 'past', 'current').allow(''),
    in_recovery: Joi.boolean().default(false),
    recovery_duration: Joi.string().max(50).allow('')
  }),

  financial: Joi.object({
    income_level: Joi.string().valid('under_25k', '25k_50k', '50k_75k', '75k_100k', 'over_100k', 'prefer_not_to_say').allow(''),
    income_stability: Joi.string().valid('stable', 'variable', 'unstable').allow(''),
    employment_benefits: Joi.boolean().default(false),
    housing_status: Joi.string().valid('own', 'rent', 'living_with_family', 'unstable').allow(''),
    housing_type: Joi.string().valid('house', 'apartment', 'condo', 'other').allow(''),
    vehicles: Joi.array().items(Joi.object({
      type: Joi.string().max(50),
      description: Joi.string().max(100)
    })).max(5),
    debt_stress: Joi.string().valid('none', 'manageable', 'significant', 'overwhelming').allow(''),
    support_paying: Joi.boolean().default(false),
    support_paying_amount: Joi.number().min(0).max(999999.99).allow(null),
    support_receiving: Joi.boolean().default(false),
    support_receiving_amount: Joi.number().min(0).max(999999.99).allow(null)
  }),

  background: Joi.object({
    birthplace: Joi.string().max(100).allow(''),
    raised_location: Joi.string().max(100).allow(''),
    family_of_origin: Joi.string().max(500).allow(''),
    cultural_background: Joi.string().max(200).allow(''),
    religion: Joi.string().max(100).allow(''),
    military_service: Joi.boolean().default(false),
    military_branch: Joi.string().max(50).allow(''),
    military_status: Joi.string().valid('veteran', 'active', 'reserve').allow(''),
    education_level: Joi.string().valid('high_school', 'some_college', 'associates', 'bachelors', 'masters', 'doctorate', 'trade').allow(''),
    education_field: Joi.string().max(100).allow('')
  })
});

async function validateProfileUpdate(updates) {
  try {
    const validated = await profileSchema.validateAsync(updates, { abortEarly: false });
    return { valid: true, data: validated };
  } catch (err) {
    return {
      valid: false,
      errors: err.details.map(d => ({ field: d.path.join('.'), message: d.message }))
    };
  }
}

module.exports = { validateProfileUpdate };
```

---

### XSS Prevention
- **Sanitize all text inputs** using DOMPurify on frontend and validator.escape() on backend
- **No HTML rendering** in profile fields (plain text only)
- **CSP headers** to prevent inline script execution

---

## UX/UI Wireframes

### ProfileWizard - Step 1: Personal Information

```
┌─────────────────────────────────────────────────────────┐
│  LiaiZen Logo              [Exit Wizard] ×              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [●────────────────────────] 20% Complete                │
│  Step 1 of 5: Personal Information                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ First Name                                        │  │
│  │ [________________________]                        │  │
│  │                                                   │  │
│  │ Last Name                                         │  │
│  │ [________________________]                        │  │
│  │                                                   │  │
│  │ Preferred Name (optional)                         │  │
│  │ [________________________]                        │  │
│  │ ℹ️  How you'd like to be addressed                │  │
│  │                                                   │  │
│  │ Pronouns (optional)                               │  │
│  │ [▼ Select pronouns       ]                        │  │
│  │                                                   │  │
│  │ Birthdate                                         │  │
│  │ [MM/DD/YYYY] 📅                                   │  │
│  │                                                   │  │
│  │ Language                                          │  │
│  │ [▼ English              ]                         │  │
│  │                                                   │  │
│  │ Timezone                                          │  │
│  │ [▼ America/New_York     ] 🌍 Auto-detected       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [ Skip for now ]            [Next: Work & Schedule →] │
│                                                          │
│  💡 Why this matters: Helps LiaiZen address you         │
│     correctly and understand your context               │
└─────────────────────────────────────────────────────────┘
```

---

### ProfileWizard - Step 3: Health & Wellbeing

```
┌─────────────────────────────────────────────────────────┐
│  🔒 Confidential - Only used by AI for better support   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [●●●●●●●●●●────────────────] 60% Complete               │
│  Step 3 of 5: Health & Wellbeing                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Physical Health                                   │  │
│  │                                                   │  │
│  │ Do you have any physical conditions that affect  │  │
│  │ your parenting? (optional)                        │  │
│  │ ℹ️  Why we ask: Helps AI suggest realistic       │  │
│  │    solutions (e.g., "Given your mobility, could   │  │
│  │    co-parent handle pickup?")                     │  │
│  │                                                   │  │
│  │ ☐ Chronic pain                                    │  │
│  │ ☐ Mobility limitations                            │  │
│  │ ☐ Other: [_______________]                        │  │
│  │                                                   │  │
│  │ Describe any limitations (optional)               │  │
│  │ [_________________________________]               │  │
│  │ [_________________________________]               │  │
│  │                                                   │  │
│  │ ─────────────────────────────────────────────    │  │
│  │                                                   │  │
│  │ Mental Health                                     │  │
│  │                                                   │  │
│  │ Are you managing any mental health conditions?   │  │
│  │ (optional - all responses kept confidential)      │  │
│  │                                                   │  │
│  │ ☐ Anxiety                                         │  │
│  │ ☐ Depression                                      │  │
│  │ ☐ PTSD                                            │  │
│  │ ☐ Other: [_______________]                        │  │
│  │ ☐ Prefer not to say                               │  │
│  │                                                   │  │
│  │ Are you receiving treatment? (optional)           │  │
│  │ [▼ Select...            ]                         │  │
│  │                                                   │  │
│  │ [🗑️ Hide this entire section]                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [ ← Back ]  [ Skip for now ]  [Next: Financial →]     │
│                                                          │
│  🔐 Your health information is encrypted and never      │
│     shared with your co-parent. It helps the AI provide │
│     more empathetic, realistic support.                  │
└─────────────────────────────────────────────────────────┘
```

---

### PrivacySettings Page

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Profile                     Privacy Settings  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Control what information is shared with your co-parent │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🧑 Personal Information                           │  │
│  │    First name, last name, pronouns, language     │  │
│  │                                                   │  │
│  │    Visibility: [✓ Shared] [ Private (AI only)]   │  │
│  │    [Advanced: Customize fields ▼]                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 💼 Work & Schedule                                │  │
│  │    Occupation, work schedule, flexibility        │  │
│  │                                                   │  │
│  │    Visibility: [ Shared] [✓ Private (AI only)]   │  │
│  │    ℹ️  Sharing helps co-parent understand your   │  │
│  │       availability constraints                    │  │
│  │    [Advanced: Customize fields ▼]                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🏥 Health & Wellbeing                             │  │
│  │    Physical/mental health, medications           │  │
│  │                                                   │  │
│  │    Visibility: 🔒 Always Private (AI only)        │  │
│  │    Cannot be changed for your safety             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 💰 Financial Information                          │  │
│  │    Income, housing, child support                │  │
│  │                                                   │  │
│  │    Visibility: 🔒 Always Private (AI only)        │  │
│  │    Cannot be changed for your safety             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🎓 Background & Education                         │  │
│  │    Education, culture, military service          │  │
│  │                                                   │  │
│  │    Visibility: [✓ Shared] [ Private (AI only)]   │  │
│  │    [Advanced: Customize fields ▼]                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [Preview Co-Parent View]  [View Audit Log]             │
│                                                          │
│  [Save Privacy Settings]                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

### ProfileCompletionWidget (Dashboard Sidebar)

```
┌─────────────────────────────┐
│  Your Profile               │
│                             │
│      ┌────────┐             │
│      │   65%  │  Complete   │
│      │ ●●●●●○ │             │
│      └────────┘             │
│                             │
│  Next step:                 │
│  → Add work schedule        │
│                             │
│  💡 Helps AI understand     │
│     your availability       │
│                             │
│  [Complete Profile]         │
│                             │
└─────────────────────────────┘
```

---

## Testing Strategy

### Unit Tests

**Backend (`chat-server/__tests__/profile.test.js`):**
```javascript
describe('Profile Management', () => {
  test('GET /api/profile returns user profile', async () => {
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.profile).toHaveProperty('personal');
    expect(response.body.profile).toHaveProperty('work');
  });

  test('PUT /api/profile validates input', async () => {
    const invalidUpdate = {
      personal: { birthdate: '2010-01-01' }  // Under 18
    };

    const response = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send(invalidUpdate);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('18 years or older');
  });

  test('Profile completion percentage calculated correctly', () => {
    const profile = {
      first_name: 'Alex',
      last_name: 'Johnson',
      email: 'alex@example.com',
      address: '123 Main St',
      occupation: 'Engineer'
    };

    const percentage = calculateCompletionPercentage(profile);
    expect(percentage).toBeGreaterThan(0);
    expect(percentage).toBeLessThanOrEqual(100);
  });

  test('Encryption/decryption works correctly', () => {
    const originalText = 'Sensitive medication info';
    const encrypted = encrypt(originalText);
    const decrypted = decrypt(encrypted);

    expect(encrypted).not.toBe(originalText);
    expect(decrypted).toBe(originalText);
  });
});

describe('Privacy Settings', () => {
  test('Shared profile data respects privacy settings', async () => {
    // User A has work_info_visible = false
    const userA = await createTestUser({ work_info_visible: false });
    const userB = await createTestUser();

    const sharedData = await getSharedProfileData(userA.profile, userB.id);

    expect(sharedData.work).toEqual({});  // No work info shared
  });

  test('Audit log captures privacy changes', async () => {
    const response = await request(app)
      .put('/api/profile/privacy')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ work_info_visible: true });

    const auditLog = await getAuditLog(userId);
    expect(auditLog).toContainEqual(expect.objectContaining({
      action: 'shared',
      field_name: 'work_info'
    }));
  });
});
```

**Frontend (`chat-client-vite/src/__tests__/ProfileWizard.test.jsx`):**
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileWizard from '../components/profile/ProfileWizard';

describe('ProfileWizard', () => {
  test('renders step 1 (Personal Info)', () => {
    render(<ProfileWizard />);
    expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
  });

  test('validates birthdate (must be 18+)', async () => {
    render(<ProfileWizard />);
    const birthdateInput = screen.getByLabelText(/Birthdate/i);

    fireEvent.change(birthdateInput, { target: { value: '2010-01-01' } });
    fireEvent.click(screen.getByText(/Next/i));

    expect(await screen.findByText(/18 years or older/i)).toBeInTheDocument();
  });

  test('allows skipping steps', () => {
    const onSkip = jest.fn();
    render(<ProfileWizard onSkip={onSkip} />);

    fireEvent.click(screen.getByText(/Skip for now/i));
    expect(onSkip).toHaveBeenCalled();
  });

  test('displays completion percentage', () => {
    render(<ProfileCompletionWidget percentage={65} />);
    expect(screen.getByText(/65%/i)).toBeInTheDocument();
  });
});
```

---

### Integration Tests

**Scenario 1: New User Onboarding**
```javascript
test('New user completes profile wizard', async () => {
  // 1. User signs up
  const user = await signUp('newuser@example.com', 'password');

  // 2. ProfileWizard appears
  render(<App />);
  expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();

  // 3. User fills personal info
  fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Alex' } });
  fireEvent.click(screen.getByText(/Next/i));

  // 4. User skips work section
  fireEvent.click(screen.getByText(/Skip for now/i));

  // 5. Profile completion = 20%
  const response = await apiClient.get('/api/profile/completion-status');
  expect(response.data.completion_percentage).toBe(20);
});
```

**Scenario 2: Privacy Settings Enforcement**
```javascript
test('Co-parent cannot see private work info', async () => {
  // 1. User A sets work_info to private
  await apiClient.put('/api/profile/privacy', {
    work_info_visible: false
  });

  // 2. User B (co-parent) requests User A's profile
  const response = await apiClientB.get('/api/profile/shared/userA_id');

  // 3. Work info should be empty
  expect(response.data.profile.work).toEqual({});
});
```

**Scenario 3: AI Mediation with Profile Context**
```javascript
test('AI mediator references work schedule in suggestion', async () => {
  // 1. User has work_schedule = "Monday-Friday 9-5"
  await apiClient.put('/api/profile', {
    work: { work_schedule: 'Monday-Friday 9-5' }
  });

  // 2. User sends message requiring response
  const message = { text: 'Can you pick up the kids tomorrow at 3pm?' };

  // 3. AI mediator should reference schedule
  const mediation = await analyzeMessage(message, []);

  expect(mediation.intervention?.personalMessage).toContain('schedule');
});
```

---

### Accessibility Tests

**WCAG 2.1 AA Compliance:**
```javascript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('ProfileWizard is accessible', async () => {
  const { container } = render(<ProfileWizard />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('Form labels are properly associated', () => {
  render(<PersonalInfoSection />);
  const firstNameInput = screen.getByLabelText(/First Name/i);
  expect(firstNameInput).toHaveAttribute('id');
});

test('Privacy indicators have ARIA labels', () => {
  render(<WorkScheduleSection />);
  const lockIcon = screen.getByRole('img', { name: /private/i });
  expect(lockIcon).toBeInTheDocument();
});
```

---

## Success Criteria & Metrics

### Launch Criteria (MVP)

**Must Have:**
- [ ] Database migration completed (all new columns added)
- [ ] API endpoints implemented and tested
- [ ] ProfileWizard guides new users through onboarding
- [ ] Privacy settings page functional with preview mode
- [ ] Health data encrypted at rest
- [ ] AI mediator receives profile context (sender only)
- [ ] No privacy leaks (co-parent cannot access private fields)
- [ ] Mobile responsive (all sections work on 375px width)
- [ ] Accessibility audit passed (WCAG 2.1 AA)

**Nice to Have (Post-MVP):**
- [ ] Profile completion nudges (email reminders)
- [ ] Profile insights dashboard (monthly summary)
- [ ] Bulk privacy settings (change all sections at once)
- [ ] Export profile data (GDPR compliance)

---

### Key Performance Indicators (KPIs)

**Adoption Metrics:**
- **Profile Completion Rate:** % of users who complete ≥50% of profile within 30 days
  - **Target:** 70%
  - **Measurement:** Track `profile_completion_percentage` field over time

- **Section Completion Rates:**
  - Personal: 90%+ (required for good UX)
  - Work: 60%+
  - Health: 40%+ (sensitive, expect lower)
  - Financial: 35%+ (very sensitive)
  - Background: 55%+

**Quality Metrics:**
- **AI Mediation Improvement:** Reduction in conflict escalation for users with complete profiles
  - **Target:** 15% reduction in escalation score
  - **Measurement:** Compare escalation rates for users with >70% profile completion vs <30%

- **Intervention Relevance:** % of AI interventions that reference profile context appropriately
  - **Target:** 40% of interventions include profile-aware suggestions
  - **Measurement:** Manual review of 100 random interventions per week

**Privacy Metrics:**
- **Privacy Incidents:** Unauthorized access to private profile data
  - **Target:** 0 incidents
  - **Measurement:** Audit log monitoring + automated alerts

- **Privacy Settings Usage:** % of users who customize privacy settings
  - **Target:** 25% within 60 days
  - **Measurement:** Track `user_privacy_settings.last_updated`

**User Satisfaction:**
- **"AI Understands My Situation" Rating:** Survey question on 1-5 scale
  - **Baseline:** 3.2 (current average)
  - **Target:** 3.8 (+0.6 improvement)
  - **Measurement:** In-app survey after 30 days of profile completion

---

## Open Questions & Decisions Needed

### 1. Multi-Language Support
**Question:** Should health condition dropdowns be localized for Spanish/French users?
**Options:**
- A. Start with English-only, add localization later
- B. Include Spanish translations from day 1 (50% of user base)
- C. Use free-text fields instead of dropdowns for health conditions

**Recommendation:** Option B - Include Spanish translations for health fields given user base

---

### 2. Profile Data Portability
**Question:** Should users be able to export their profile data (GDPR/CCPA compliance)?
**Options:**
- A. Add "Download My Data" button (JSON export)
- B. Email user data on request (manual process)
- C. Defer until explicit legal requirement

**Recommendation:** Option A - Proactive compliance, builds trust

---

### 3. Co-Parent Profile Matching
**Question:** Should the system suggest filling profile sections based on co-parent's completed sections?
**Example:** If co-parent shared work schedule, prompt user to share theirs for mutual understanding

**Options:**
- A. Yes - "Your co-parent shared their work schedule. Would you like to share yours?"
- B. No - Avoid creating pressure or comparison
- C. Make it opt-in preference

**Recommendation:** Option C - Opt-in to avoid coercion

---

### 4. Profile Verification
**Question:** Should sensitive fields (e.g., child support payments) be verified?
**Options:**
- A. Self-reported only (honor system)
- B. Optional upload of court documents
- C. Not applicable - AI context only, not legal record

**Recommendation:** Option A - Keep profile informal, not legal documentation

---

### 5. Historical Profile Changes
**Question:** Should the system track profile changes over time?
**Use Case:** User's work schedule changes from "9-5 weekdays" to "shift work weekends"

**Options:**
- A. Overwrite previous values (current approach)
- B. Keep history table (`profile_changes` with timestamps)
- C. Track changes but don't expose in UI

**Recommendation:** Option C - Track for analytics, not user-facing

---

## Risks & Mitigations

### Risk 1: Low Completion Rates (Health/Financial)
**Risk Level:** High
**Impact:** AI lacks critical context, mediation quality suffers
**Likelihood:** 70% (sensitive data, users may skip)

**Mitigation:**
- Provide clear "Why we ask" explanations for every field
- Show example scenarios where health/financial context improved mediation
- Offer "hide entire section" option to reduce anxiety
- Never require sensitive fields (all optional)
- Testimonials from users: "Sharing my work schedule reduced scheduling conflicts by 80%"

---

### Risk 2: Privacy Breach (Accidental Exposure)
**Risk Level:** Critical
**Impact:** Loss of user trust, potential legal liability
**Likelihood:** 15% (coding error, API misconfiguration)

**Mitigation:**
- Comprehensive unit tests for privacy filtering
- Penetration testing before launch
- Automated privacy checks in CI/CD pipeline
- Audit log monitoring with real-time alerts
- Bug bounty program for security researchers
- Privacy-first code reviews (second pair of eyes on all profile code)

---

### Risk 3: Performance Degradation (Large Profile Context)
**Risk Level:** Medium
**Impact:** Slower AI responses, increased API costs
**Likelihood:** 40% (profile context adds 300-500 tokens per request)

**Mitigation:**
- Limit profile context to 500 tokens maximum
- Prioritize most relevant fields (work schedule > birthplace)
- Cache profile context in memory (Redis) for active users
- Monitor API latency and costs weekly
- Implement context pruning algorithm (remove least relevant data)

---

### Risk 4: User Overwhelm (Too Many Fields)
**Risk Level:** Medium
**Impact:** Form abandonment, incomplete profiles
**Likelihood:** 50% (60+ fields is extensive)

**Mitigation:**
- Progressive disclosure via wizard (5 steps, not single page)
- "Skip for now" on every step
- Show completion percentage as motivation
- Smart nudges: "Just 2 more fields to reach 50%"
- Autosave on every field change (no "save" button stress)
- Mobile-first design (one section per screen)

---

## Appendix

### A. Profile Completion Percentage Algorithm

```javascript
/**
 * Calculate profile completion percentage
 * Weighted by importance for AI mediation
 */
function calculateCompletionPercentage(profile) {
  const weights = {
    // Personal (20% total)
    first_name: 5,
    last_name: 5,
    pronouns: 3,
    birthdate: 3,
    language: 2,
    timezone: 2,

    // Work (30% total) - Most valuable for AI
    employment_status: 5,
    occupation: 4,
    work_schedule: 10,
    schedule_flexibility: 8,
    commute_info: 3,

    // Health (20% total)
    health_physical_conditions: 5,
    health_physical_limitations: 5,
    health_mental_conditions: 5,
    health_mental_treatment: 5,

    // Financial (15% total)
    income_level: 5,
    debt_stress: 5,
    support_paying: 2.5,
    support_receiving: 2.5,

    // Background (15% total)
    education_level: 5,
    cultural_background: 5,
    family_of_origin: 5
  };

  let totalWeight = 0;
  let completedWeight = 0;

  for (const [field, weight] of Object.entries(weights)) {
    totalWeight += weight;
    if (profile[field] && profile[field].toString().trim().length > 0) {
      completedWeight += weight;
    }
  }

  return Math.round((completedWeight / totalWeight) * 100);
}
```

---

### B. Privacy Filter SQL Query

```sql
-- Efficient query to get shared profile data for co-parent
SELECT
  u.id,
  u.username,

  -- Personal (if visible)
  CASE WHEN ups.personal_info_visible THEN u.first_name ELSE NULL END AS first_name,
  CASE WHEN ups.personal_info_visible THEN u.last_name ELSE NULL END AS last_name,
  CASE WHEN ups.personal_info_visible THEN u.preferred_name ELSE NULL END AS preferred_name,
  CASE WHEN ups.personal_info_visible THEN u.pronouns ELSE NULL END AS pronouns,

  -- Work (if visible, custom rules applied in application layer)
  CASE WHEN ups.work_info_visible THEN u.occupation ELSE NULL END AS occupation,
  CASE WHEN ups.work_info_visible THEN u.work_schedule ELSE NULL END AS work_schedule,
  CASE WHEN ups.work_info_visible THEN u.schedule_flexibility ELSE NULL END AS schedule_flexibility,

  -- Health (NEVER shared)
  NULL AS health_physical_conditions,
  NULL AS health_mental_conditions,

  -- Financial (NEVER shared)
  NULL AS income_level,
  NULL AS debt_stress,

  -- Background (if visible)
  CASE WHEN ups.background_info_visible THEN u.education_level ELSE NULL END AS education_level,
  CASE WHEN ups.background_info_visible THEN u.education_field ELSE NULL END AS education_field,
  CASE WHEN ups.background_info_visible THEN u.cultural_background ELSE NULL END AS cultural_background

FROM users u
LEFT JOIN user_privacy_settings ups ON u.id = ups.user_id
WHERE u.id = ?;
```

---

### C. AI Prompt Template (Profile Context)

```javascript
const profileAwarePromptTemplate = `
=== PROFILE-AWARE COACHING ===

SENDER CONTEXT (private, confidential to AI):
${senderProfile.work_schedule ? `- Work schedule: ${senderProfile.work_schedule}` : ''}
${senderProfile.schedule_flexibility ? `- Schedule flexibility: ${senderProfile.schedule_flexibility}` : ''}
${senderProfile.commute_info ? `- Commute: ${senderProfile.commute_info}` : ''}
${senderProfile.health_physical_limitations ? `- Physical limitations: ${senderProfile.health_physical_limitations}` : ''}
${senderProfile.debt_stress && senderProfile.debt_stress !== 'none' ? `- Financial stress: ${senderProfile.debt_stress}` : ''}

RECEIVER CONTEXT (only shared data):
${receiverSharedProfile.work_schedule ? `- Work schedule: ${receiverSharedProfile.work_schedule}` : ''}
${receiverSharedProfile.schedule_flexibility ? `- Schedule flexibility: ${receiverSharedProfile.schedule_flexibility}` : ''}

USE THIS CONTEXT TO:
1. Acknowledge constraints: "I know you work evenings, could you respond in the morning instead?"
2. Suggest realistic solutions: "Given your limited schedule flexibility, could co-parent handle Tuesday pickup?"
3. Show empathy: "Managing this with your current workload and commute must be challenging."
4. Avoid unrealistic expectations: Don't suggest solutions incompatible with sender's situation.

CRITICAL PRIVACY RULES:
- NEVER explicitly reveal private profile details to receiver
- Use indirect references only: "Given your schedule..." NOT "Since you work 9-5 at Tech Corp..."
- If receiver doesn't have shared work info, don't reference their schedule
- Health and financial data inform YOUR coaching tone, but NEVER mention explicitly
`;
```

---

### D. Sample User Flows

**Flow 1: New User Onboarding**
1. User signs up → ProfileWizard appears
2. Step 1: Personal info (name, pronouns) → Auto-saves → Next
3. Step 2: Work schedule → "Skip for now" → Next
4. Step 3: Health → Reads "Confidential" notice → Shares anxiety → Next
5. Step 4: Financial → "Hide this section" → Next
6. Step 5: Background → Fills education → Complete
7. Dashboard shows "Profile 45% complete" widget
8. Week later: Nudge notification "Add work schedule for better AI support"

**Flow 2: Privacy Settings Adjustment**
1. User completes profile (60% done)
2. Co-parent requests shared room
3. User wonders "What can they see about me?"
4. Opens Profile → Privacy Settings
5. Sees work_info = Private (AI only)
6. Clicks "Why share this?" tooltip → Understands benefit
7. Toggles work_info to Shared
8. Clicks "Preview Co-Parent View" → Sees only occupation/flexibility (not employer/salary)
9. Confirms → Audit log records sharing event
10. Co-parent now sees user's work flexibility in shared profile view

**Flow 3: AI Mediation with Profile Context**
1. User (Alex) has profile: work_schedule="Shift work, weekends", schedule_flexibility="low"
2. Co-parent (Jordan) sends message: "Can you pick up kids Saturday 10am?"
3. Alex replies: "You NEVER consider my schedule!"
4. AI mediator analyzes message with Alex's profile context
5. AI suggests: "I know you work weekends with limited flexibility. Could you ask Jordan to do Saturday pickup and you handle a weekday instead?"
6. Alex uses rewrite → Conflict avoided

---

## Review & Approval

**Specification Author:** Claude (Specification Agent)
**Review Required From:**
- Product Manager (co-parenting domain expert)
- Engineering Lead (technical feasibility)
- Privacy/Security Officer (HIPAA/GDPR compliance)
- UX Designer (wireframe validation)

**Estimated Effort:** 7 weeks (1 engineer, 1 designer)
**Dependencies:**
- Feature 002 (Communication Profiles) - Integration point
- Database migration tooling
- OpenAI API quota (increased usage expected)

**Next Steps:**
1. Review this specification with stakeholders
2. Approve/revise database schema
3. Create detailed task breakdown in project management tool
4. Assign engineering resources
5. Schedule design review for wireframes
6. Plan privacy audit before launch

---

**Document Version:** 1.0
**Last Updated:** 2025-11-28
**Status:** Ready for Review
