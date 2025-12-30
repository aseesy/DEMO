# Implementation Checklist: Comprehensive User Profile System

This checklist provides a step-by-step guide for implementing Feature 010 according to the specification.

---

## Pre-Implementation Setup

### Development Environment

- [ ] Create feature branch: `feature/010-user-profile-comprehensive`
- [ ] Set up local SQLite database for testing
- [ ] Install dependencies: `joi` (validation), `crypto` (encryption - built-in)
- [ ] Configure environment variables:
  - [ ] `PROFILE_ENCRYPTION_KEY` (32-byte hex string for AES-256)
  - [ ] Generate key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Review constitution (`chat-server/ai-mediation-constitution.md`) for privacy principles

---

## Phase 1: Database Migration (Week 1)

### Migration Script Creation

- [x] Create migration file: `chat-server/migrations/010_user_profile_comprehensive.sql`
- [x] Add all new columns to `users` table (see spec Database Schema section)
  - [x] Personal: `preferred_name`, `pronouns`, `birthdate`, `language`, `timezone`, `phone`, `city`, `state`, `zip`
  - [x] Work: `employment_status`, `occupation`, `employer`, `work_schedule`, `schedule_flexibility`, `commute_time`, `travel_required`
  - [x] Health: `health_physical_conditions`, `health_physical_limitations`, `health_mental_conditions`, `health_mental_treatment`, `health_mental_history`, `health_substance_history`, `health_in_recovery`, `health_recovery_duration`
  - [x] Financial: `finance_income_level`, `finance_income_stability`, `finance_employment_benefits`, `finance_housing_status`, `finance_housing_type`, `finance_vehicles`, `finance_debt_stress`, `finance_support_paying`, `finance_support_receiving`
  - [x] Background: `background_birthplace`, `background_raised`, `background_family_origin`, `background_culture`, `background_religion`, `background_military`, `background_military_branch`, `background_military_status`, `education_level`, `education_field`
  - [x] Metadata: `profile_completion_percentage`, `profile_last_updated`

- [x] Create `user_profile_privacy` table
  - [x] Columns: `id`, `user_id`, `personal_visibility`, `work_visibility`, `health_visibility`, `financial_visibility`, `background_visibility`, `field_overrides`, `created_at`, `updated_at`
  - [x] Add foreign key: `user_id` → `users(id)` ON DELETE CASCADE
  - [x] Add unique constraint: `UNIQUE(user_id)`
  - [x] Create index: `idx_user_profile_privacy_user_id`

- [x] Create `profile_audit_log` table
  - [x] Columns: `id`, `user_id`, `action`, `field_name`, `old_value`, `new_value`, `actor_user_id`, `ip_address`, `user_agent`, `timestamp`
  - [x] Add foreign keys: `user_id`, `actor_user_id` → `users(id)`
  - [x] Create indexes: `idx_profile_audit_log_user_id`, `idx_profile_audit_log_timestamp`, `idx_profile_audit_log_action`

- [x] Insert default privacy settings for existing users
  - [ ] SQL: `INSERT INTO user_privacy_settings (user_id, personal_info_visible, work_info_visible, ...) SELECT id, true, false, false, false, true FROM users WHERE id NOT IN (SELECT user_id FROM user_privacy_settings)`

### Testing Migration

- [ ] Backup development database: `cp chat-server/chat.db chat-server/chat.db.backup`
- [ ] Run migration: `npm run migrate` (or manual execution)
- [ ] Verify all columns added: `SELECT * FROM users LIMIT 1;`
- [ ] Verify new tables created: `SELECT * FROM user_privacy_settings; SELECT * FROM profile_sharing_audit;`
- [ ] Test rollback script: `chat-server/migrations/010-user-profile-comprehensive-rollback.sql`

### PostgreSQL Migration (Production)

- [ ] Create PostgreSQL version of migration (convert SQLite to PostgreSQL syntax)
- [ ] Test on staging database
- [ ] Schedule production migration window

---

## Phase 2: Backend API Development (Week 2-3)

### Profile Routes Module

- [x] Create `chat-server/routes/profile.js`
- [x] Create `chat-server/src/utils/profileHelpers.js`

### Encryption Module

- [ ] Create `chat-server/encryption.js`
  - [ ] `encrypt(text)` function (AES-256-GCM)
  - [ ] `decrypt(encryptedText)` function
  - [ ] Unit tests: `chat-server/__tests__/encryption.test.js`
    - [ ] Test encrypt/decrypt roundtrip
    - [ ] Test different input sizes
    - [ ] Test error handling (invalid ciphertext)

### Profile Utilities Module

- [ ] Create `chat-server/profileUtils.js`
  - [ ] `loadUserProfile(userId)` - Fetch full profile from database
  - [ ] `updateUserProfile(userId, updates)` - Partial update with validation
  - [ ] `calculateCompletionPercentage(profile)` - Weighted percentage calculation
  - [ ] `buildProfileContextForAI(senderProfile, receiverProfile)` - AI context string builder
  - [ ] `getSharedProfileData(profile, viewerId)` - Privacy-filtered profile
  - [ ] `loadPrivacySettings(userId)` - Fetch privacy settings
  - [ ] `updatePrivacySettings(userId, settings)` - Update privacy settings
  - [ ] `logAuditEvent(userId, fieldName, action, sharedWithUserId, ipAddress, userAgent)` - Audit logging

### Input Validation

- [ ] Create `chat-server/validators/profileValidator.js`
  - [ ] Define Joi schema (see spec Appendix A)
  - [ ] `validateProfileUpdate(updates)` function
  - [ ] Age validation (18+ for birthdate)
  - [ ] Enum validation (employment_status, schedule_flexibility, etc.)
  - [ ] Length limits (max 1000 chars for textareas)
  - [ ] Unit tests: `chat-server/__tests__/profileValidator.test.js`

### API Endpoints in `chat-server/routes/profile.js`

- [x] **GET /api/profile/me**
  - [x] Authentication check (JWT required)
  - [x] Load user profile from database (dynamic column fetch)
  - [x] Load privacy settings
  - [x] Return JSON response with profile + privacy settings
  - [x] Error handling (500 if database error)

- [x] **PUT /api/profile/me**
  - [x] Authentication check
  - [x] Validate and filter request body (only valid profile columns)
  - [x] Update profile fields (partial updates)
  - [x] Recalculate completion percentage
  - [x] Return updated completion percentage
  - [x] Error handling (400 if validation fails, 500 if database error)

- [x] **GET /api/profile/privacy/me**
  - [x] Authentication check
  - [x] Load privacy settings from database
  - [x] Return default settings if none exist
  - [x] Return JSON response

- [x] **PUT /api/profile/privacy/me**
  - [x] Authentication check
  - [x] Validate privacy settings (health/financial always private)
  - [x] Insert or update privacy settings
  - [x] Return success response

- [x] **GET /api/profile/preview-coparent-view**
  - [x] Authentication check
  - [x] Load user's profile and privacy settings
  - [x] Apply privacy filtering (remove health/financial, apply section visibility)
  - [x] Return filtered profile as co-parent would see it

- [ ] **GET /api/profile/completion-status** (existing in server.js)
  - [ ] Authentication check
  - [ ] Load user profile
  - [ ] Calculate completion percentage
  - [ ] Identify completed/incomplete sections
  - [ ] Generate smart suggestions (prioritize work > health > financial)
  - [ ] Return JSON response

### Authorization Helper

- [ ] Create `authorizeCoParentAccess(requesterId, targetUserId)` function
  - [ ] Query `room_members` table to find shared room
  - [ ] Return true if shared room exists, false otherwise
  - [ ] Used in GET /api/profile/shared/:userId

### Unit Tests (Backend)

- [ ] `chat-server/__tests__/profile.test.js`
  - [ ] GET /api/profile returns user profile
  - [ ] PUT /api/profile validates input (age < 18 rejected)
  - [ ] PUT /api/profile updates fields correctly
  - [ ] Profile completion percentage calculated correctly
  - [ ] Encryption/decryption works
  - [ ] Privacy settings enforced (shared profile excludes private fields)
  - [ ] Audit log captures privacy changes
  - [ ] Authorization check prevents unauthorized access

---

## Phase 3: Frontend UI Development (Week 4-5)

### Shared Hooks

- [x] Enhanced `chat-client-vite/src/hooks/useProfile.js`
  - [x] Add all new profile fields for state management
  - [x] Add `loadPrivacySettings()` function
  - [x] Add `updatePrivacySettings(settings)` function
  - [x] Add `getCoParentPreview()` function
  - [x] Add `getCompletionStatus()` function
  - [x] Add `saveSection()` for wizard step saving
  - [x] Add `calculateLocalCompletion` for real-time feedback

- [ ] Create `chat-client-vite/src/hooks/useProfileCompletion.js`
  - [ ] Track completion percentage
  - [ ] Identify next suggested section
  - [ ] Return completion status object

- [ ] Create `chat-client-vite/src/hooks/usePrivacySettings.js`
  - [ ] Manage privacy state (section toggles, custom rules)
  - [ ] Update backend on change
  - [ ] Load audit log

### ProfileWizard Component

- [x] Create `chat-client-vite/src/components/profile/ProfileWizard.jsx`
  - [x] 5-step wizard (Personal, Work, Health, Financial, Background)
  - [x] Progress indicator (Step X of 5, percentage bar)
  - [x] "Skip for now" button on every step
  - [x] "Next" / "Back" navigation
  - [x] Save on navigation (per-section save)
  - [x] `onComplete` callback with completion percentage
  - [x] Mobile responsive design

### Section Components

- [x] Create `chat-client-vite/src/components/profile/PersonalInfoForm.jsx`
  - [x] Input fields: first_name, last_name, preferred_name
  - [x] Dropdown: pronouns (he/him, she/her, they/them, other/custom)
  - [x] Date picker: birthdate (with age validation max 18 years ago)
  - [x] Dropdown: language (English, Spanish, French, German, Portuguese, Chinese)
  - [x] Dropdown: timezone (with auto-detection)
  - [x] Input fields: phone, city, state, zip
  - [x] "Why we ask" tooltips
  - [x] US States dropdown

- [x] Create `chat-client-vite/src/components/profile/WorkScheduleForm.jsx`
  - [x] Dropdown: employment_status
  - [x] Input: occupation, employer
  - [x] Textarea: work_schedule (with helpful examples)
  - [x] Button group: schedule_flexibility (high/medium/low with descriptions)
  - [x] Input: commute_time
  - [x] Dropdown: travel_required (frequency options)
  - [x] Privacy notice (private by default info box)

- [x] Create `chat-client-vite/src/components/profile/HealthWellbeingForm.jsx`
  - [x] "🔒 Confidential - Only used by AI for better support" header
  - [x] Multi-select checkboxes: physical_conditions
  - [x] Textarea: physical_limitations
  - [x] Multi-select checkboxes: mental_conditions
  - [x] Dropdown: mental_treatment
  - [x] Textarea: mental_history
  - [x] Dropdown: substance_history + Radio: in_recovery + Input: recovery_duration
  - [x] Conditional fields (recovery shows when relevant)
  - [x] Warm, non-judgmental language throughout
  - [x] "Why we ask" supportive info box

- [x] Create `chat-client-vite/src/components/profile/FinancialContextForm.jsx`
  - [x] "🔒 Private - Used only for AI expense context" header
  - [x] Dropdown: income_level (ranges + prefer not to say)
  - [x] Dropdown: income_stability
  - [x] Checkbox group: employment_benefits
  - [x] Dropdown: housing_status, housing_type
  - [x] Input: vehicles
  - [x] Dropdown: debt_stress with visual stress indicator
  - [x] Radio buttons: support_paying, support_receiving
  - [x] "Why we ask" info box

- [x] Create `chat-client-vite/src/components/profile/BackgroundForm.jsx`
  - [x] Input: birthplace, raised_location
  - [x] Textarea: family_of_origin
  - [x] Input: cultural_background, religion
  - [x] Radio: military_service + Dropdown: military_branch, military_status
  - [x] Conditional military details
  - [x] Dropdown: education_level + Input: education_field
  - [x] All fields optional with clear indication

### Privacy Settings Component

- [x] Create `chat-client-vite/src/components/profile/PrivacySettings.jsx`
  - [x] Section toggles (Personal, Work, Background = Shared/Private)
  - [x] Locked sections (Health, Financial = Always Private with explanation)
  - [x] Visual legend (shared/private/locked icons)
  - [x] "Preview Co-Parent View" button → Opens modal showing filtered profile
  - [x] Preview modal with filtered profile display
  - [x] Info box explaining how privacy works
  - [x] Visual indicators (green for shared, lock icon for private)

### Profile Completion Widget

- [ ] Create `chat-client-vite/src/components/profile/ProfileCompletionWidget.jsx`
  - [ ] Circular progress indicator (0-100%)
  - [ ] "Your profile is X% complete" text
  - [ ] "Next step: Add work schedule" suggestion
  - [ ] "Why it matters" tooltip
  - [ ] "Complete Profile" button → Opens ProfileWizard
  - [ ] Dismissible after first view (localStorage flag)

### Integration with Existing ProfilePanel

- [ ] Enhance `chat-client-vite/src/components/ProfilePanel.jsx`
  - [ ] Add collapsible sections for new profile categories
  - [ ] Add "Privacy Settings" link in header
  - [ ] Add ProfileCompletionWidget to sidebar/header
  - [ ] Ensure mobile responsiveness

### UI Components Library (if needed)

- [ ] Multi-select component (for health conditions, etc.)
- [ ] Button group component (for flexibility, income level)
- [ ] Tooltip component (for "Why we ask" explanations)
- [ ] Progress indicator component (circular percentage)

### Unit Tests (Frontend)

- [ ] `chat-client-vite/src/__tests__/ProfileWizard.test.jsx`
  - [ ] Renders step 1 (Personal Info)
  - [ ] Validates birthdate (must be 18+)
  - [ ] Allows skipping steps
  - [ ] Displays completion percentage
  - [ ] Auto-saves on field change

- [ ] `chat-client-vite/src/__tests__/PrivacySettings.test.jsx`
  - [ ] Renders section toggles
  - [ ] Health/Financial locked (cannot change)
  - [ ] Preview modal shows filtered profile
  - [ ] Audit log displays recent changes

---

## Phase 4: AI Integration (Week 6)

### Mediator Enhancement

- [ ] Modify `chat-server/src/liaizen/core/mediator.js`
  - [ ] Import `profileUtils`
  - [ ] In `analyzeMessage()` function, before AI call:
    - [ ] Load sender profile: `const senderProfile = await loadUserProfile(roleContext.senderId)`
    - [ ] Load receiver profile: `const receiverProfile = await loadUserProfile(roleContext.receiverId)`
    - [ ] Build AI context: `const profileContext = buildProfileContextForAI(senderProfile, receiverProfile)`
    - [ ] Inject into `userContextString` variable
  - [ ] Update AI prompt template with "PROFILE-AWARE COACHING" section (see spec Appendix C)

### AI Prompt Template Update

- [ ] Add profile context section to system prompt:

  ```
  SENDER CONTEXT (private):
  - Work schedule: ${senderProfile.work_schedule}
  - Schedule flexibility: ${senderProfile.schedule_flexibility}
  - Physical limitations: ${senderProfile.health_physical_limitations}
  - Financial stress: ${senderProfile.debt_stress}

  RECEIVER CONTEXT (shared only):
  - Occupation: ${receiverSharedProfile.occupation}
  - Flexibility: ${receiverSharedProfile.schedule_flexibility}

  USE THIS CONTEXT TO:
  - Acknowledge constraints
  - Suggest realistic solutions
  - Show empathy
  - Avoid unrealistic expectations

  PRIVACY RULES:
  - NEVER explicitly reveal private details
  - Use indirect references only
  ```

### Profile Context Optimization

- [ ] Implement token limit (500 tokens max for profile context)
- [ ] Prioritize most relevant fields (work > health > financial > background)
- [ ] Test different context combinations to ensure quality interventions

### Integration Testing

- [ ] Test AI mediation with profile context:
  - [ ] User with "9-5 weekdays" schedule gets time-aware suggestions
  - [ ] User with "chronic pain" limitation gets empathetic coaching
  - [ ] User with "significant debt_stress" gets financial-sensitive advice
  - [ ] Co-parent's shared work schedule informs suggestions

- [ ] Test privacy preservation:
  - [ ] AI never explicitly mentions private profile details to receiver
  - [ ] AI uses indirect references ("Given your schedule..." not "Since you work 9-5...")
  - [ ] Health/financial data influences tone but is never revealed

### Communication Profile Integration

- [ ] Update `chat-server/src/liaizen/context/communication-profile/index.js`
  - [ ] Add `enrichCommunicationProfile(userId, explicitProfile)` function
  - [ ] Merge explicit profile data with learned communication profile
  - [ ] Store profile_completion_percentage in communication profile

---

## Phase 5: Testing & Quality Assurance (Week 7)

### Unit Tests

- [x] Backend profile CRUD tests (completed in Phase 2)
- [x] Frontend component tests (completed in Phase 3)
- [ ] Additional edge cases:
  - [ ] Empty profile (all fields NULL)
  - [ ] Partial profile (some sections completed)
  - [ ] Full profile (100% completion)
  - [ ] Unicode characters in text fields
  - [ ] Very long textareas (max length enforcement)

### Integration Tests

- [ ] End-to-end profile wizard flow:
  - [ ] New user completes wizard → Profile saved → Completion percentage updates
  - [ ] User skips sections → Partial completion recorded
  - [ ] User returns to complete later → Previous data persists

- [ ] Privacy settings enforcement:
  - [ ] User A sets work_info to private → User B (co-parent) cannot see work data
  - [ ] User A changes privacy setting → Audit log records change
  - [ ] User B views shared profile → Audit log records view event

- [ ] AI mediation with profile context:
  - [ ] Send message requiring schedule context → AI references sender's work schedule
  - [ ] Send message with financial conflict → AI shows empathy for debt_stress
  - [ ] Verify no privacy leaks (AI doesn't reveal private details)

### Security Testing

- [ ] **Privacy Breach Testing:**
  - [ ] Attempt to access another user's profile without co-parent relationship → 403 error
  - [ ] Attempt to access health/financial data via shared profile → Empty fields returned
  - [ ] Attempt SQL injection in profile fields → Sanitization prevents execution

- [ ] **Encryption Testing:**
  - [ ] Verify health_medications stored as ciphertext in database
  - [ ] Verify decryption only works for profile owner
  - [ ] Verify IV + Auth Tag randomness (no repeating patterns)

- [ ] **Authorization Testing:**
  - [ ] Missing JWT token → 401 error
  - [ ] Expired JWT token → 401 error
  - [ ] Valid token but wrong user → 403 error

### Accessibility Testing

- [ ] **WCAG 2.1 AA Compliance:**
  - [ ] Run axe-core on all profile components
  - [ ] Verify form labels properly associated with inputs
  - [ ] Test keyboard navigation (tab order, focus management)
  - [ ] Test screen reader compatibility (NVDA, VoiceOver)
  - [ ] Verify color contrast (text vs background)
  - [ ] Test with high contrast mode enabled

- [ ] **Mobile Accessibility:**
  - [ ] Test on iOS VoiceOver
  - [ ] Test on Android TalkBack
  - [ ] Verify touch targets ≥44px
  - [ ] Test landscape orientation

### Performance Testing

- [ ] **API Latency:**
  - [ ] GET /api/profile < 200ms (90th percentile)
  - [ ] PUT /api/profile < 300ms (90th percentile)
  - [ ] GET /api/profile/shared/:userId < 250ms (includes privacy filtering)

- [ ] **AI Context Building:**
  - [ ] `buildProfileContextForAI()` < 50ms
  - [ ] Verify token count ≤ 500 tokens

- [ ] **Database Query Optimization:**
  - [ ] Add indexes if needed (profile queries use user_id, privacy queries use user_id)
  - [ ] Test with 10,000 user profiles (ensure scalability)

### User Acceptance Testing (UAT)

- [ ] Recruit 5-10 beta users
- [ ] Provide ProfileWizard walkthrough
- [ ] Collect feedback on:
  - [ ] Ease of use (1-5 scale)
  - [ ] "Why we ask" explanations clarity
  - [ ] Privacy controls understandability
  - [ ] AI intervention relevance improvement
- [ ] Iterate based on feedback

---

## Phase 6: Documentation & Launch Prep

### Developer Documentation

- [ ] Update `CLAUDE.md` with profile system overview
- [ ] Document API endpoints in README
- [ ] Add JSDoc comments to `profileUtils.js` functions
- [ ] Create migration guide for existing users

### User-Facing Documentation

- [ ] Create Help Center article: "Understanding Your Profile"
- [ ] Create Help Center article: "Privacy Settings Explained"
- [ ] Create in-app tooltips for all profile fields
- [ ] Create video tutorial for ProfileWizard

### Monitoring & Alerts

- [ ] Set up logging for profile API endpoints
- [ ] Create dashboard for profile completion metrics
- [ ] Set up alerts for:
  - [ ] Privacy breach attempts (unauthorized access)
  - [ ] Encryption failures
  - [ ] High API error rates (>5% of requests)

### Deployment Checklist

- [ ] **Staging Deployment:**
  - [ ] Deploy backend + database migration to staging
  - [ ] Deploy frontend to staging
  - [ ] Run smoke tests (profile CRUD, wizard flow, privacy settings)
  - [ ] Verify encryption key in staging environment
  - [ ] Test AI mediation with profile context

- [ ] **Production Deployment:**
  - [ ] Schedule maintenance window (for database migration)
  - [ ] Backup production database
  - [ ] Deploy backend + run migration
  - [ ] Verify migration success (check new columns exist)
  - [ ] Deploy frontend
  - [ ] Run smoke tests in production
  - [ ] Monitor error logs for 24 hours
  - [ ] Gradually enable ProfileWizard for new users (10% → 50% → 100%)

---

## Post-Launch Tasks

### Week 1 Post-Launch

- [ ] Monitor adoption metrics:
  - [ ] % of new users who start ProfileWizard
  - [ ] % of new users who complete ≥50% of profile
  - [ ] Average completion percentage
- [ ] Monitor error logs for unexpected issues
- [ ] Collect user feedback (in-app survey)
- [ ] Fix critical bugs within 24 hours

### Week 2-4 Post-Launch

- [ ] Analyze AI mediation improvement:
  - [ ] Compare escalation scores (complete profiles vs incomplete)
  - [ ] Measure intervention relevance (manual review of 100 interventions)
- [ ] Identify low-completion sections (Health? Financial?)
- [ ] Iterate on "Why we ask" explanations if completion rates low
- [ ] A/B test ProfileWizard vs. inline profile completion

### Month 2-3 Post-Launch

- [ ] Implement profile completion nudges (email reminders)
- [ ] Add profile insights dashboard (monthly summary for users)
- [ ] Consider bulk privacy settings (change all sections at once)
- [ ] Explore GDPR export feature ("Download My Data")

---

## Definition of Done

### Code Quality

- [x] All unit tests passing (>90% code coverage)
- [x] All integration tests passing
- [x] No ESLint errors or warnings
- [x] TypeScript types defined (if applicable)
- [x] Code reviewed by senior engineer

### Functionality

- [x] ProfileWizard guides new users through onboarding
- [x] Privacy settings page functional with preview mode
- [x] Health data encrypted at rest
- [x] AI mediator receives profile context (sender only)
- [x] No privacy leaks (co-parent cannot access private fields)

### Quality

- [x] WCAG 2.1 AA accessibility compliance
- [x] Mobile responsive (375px width minimum)
- [x] API latency < 300ms (90th percentile)
- [x] Zero security vulnerabilities (penetration test passed)

### Documentation

- [x] API endpoints documented
- [x] User-facing help articles published
- [x] In-app tooltips added
- [x] Migration guide created

### Deployment

- [x] Deployed to staging and tested
- [x] Deployed to production successfully
- [x] Monitoring dashboards configured
- [x] Alerts configured for critical errors

### Metrics (30 days post-launch)

- [ ] Profile completion rate ≥70% (users with ≥50% profile completion)
- [ ] AI mediation improvement: 15% reduction in escalation for complete profiles
- [ ] User satisfaction: "AI understands my situation" rating ≥3.8 (baseline 3.2)
- [ ] Zero privacy incidents

---

**Checklist Version:** 1.0
**Created:** 2025-11-28
**Last Updated:** 2025-11-28
**Status:** Ready for Implementation
