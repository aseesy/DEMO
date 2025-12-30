# Feature 010: Comprehensive User Profile System

## Quick Reference

**Status:** Draft - Ready for Review
**Priority:** High
**Estimated Effort:** 7 weeks (1 engineer, 1 designer)
**Dependencies:** Feature 002 (Communication Profiles)

---

## Executive Summary

Create a comprehensive user profile system that captures detailed information about co-parents (work schedules, health context, financial situation, background) to enable:

- **Better AI mediation** through context-aware interventions
- **Personalized support** tailored to individual circumstances
- **Privacy-controlled sharing** between co-parents

---

## Key Features

### 1. Multi-Section Profile Data Collection

- **Personal:** Name, pronouns, birthdate, language, timezone
- **Work & Schedule:** Employment status, occupation, schedule flexibility, commute
- **Health & Wellbeing:** Physical/mental health conditions, limitations (encrypted, AI-only)
- **Financial Context:** Income level, housing status, child support (private, AI-only)
- **Background:** Education, culture, military service, family context

### 2. Progressive Disclosure UX

- 5-step ProfileWizard for onboarding
- "Skip for now" option on every step
- Auto-save on field changes
- Completion percentage tracker with smart nudges

### 3. Granular Privacy Controls

- Section-level visibility toggles (Personal, Work, Health, Financial, Background)
- Field-level custom rules (advanced mode)
- "Preview co-parent view" to see exactly what's shared
- Audit log of all sharing changes
- Health & Financial data ALWAYS private (AI-only)

### 4. AI Integration

- Profile context injected into AI mediator prompts
- Sender's private data informs coaching (work schedule, health limitations, financial stress)
- Receiver's shared data provides mutual understanding
- AI never explicitly reveals private details to co-parent

---

## Success Metrics

| Metric                   | Target                                            | Measurement                              |
| ------------------------ | ------------------------------------------------- | ---------------------------------------- |
| Profile Completion Rate  | 70% complete ≥50% within 30 days                  | `profile_completion_percentage` tracking |
| AI Mediation Improvement | 15% reduction in escalation for complete profiles | Compare escalation rates                 |
| User Satisfaction        | +0.6 improvement in "AI understands my situation" | In-app survey (1-5 scale)                |
| Privacy Incidents        | 0 unauthorized access events                      | Audit log monitoring                     |

---

## Database Schema Changes

### New Columns for `users` Table

- **Personal:** `preferred_name`, `pronouns`, `birthdate`, `language`, `timezone`
- **Work:** `employment_status`, `occupation`, `work_schedule`, `schedule_flexibility`, `commute_info`, `travel_required`
- **Health (Encrypted):** `health_physical_conditions`, `health_physical_limitations`, `health_mental_conditions`, `health_mental_treatment`, `substance_history`
- **Financial:** `income_level`, `income_stability`, `housing_status`, `debt_stress`, `support_paying_amount`
- **Background:** `birthplace`, `cultural_background`, `education_level`, `military_service`
- **Metadata:** `profile_completion_percentage`, `profile_completed_at`, `profile_updated_at`

### New Tables

- `user_privacy_settings` - Visibility controls for each profile section
- `profile_sharing_audit` - Audit trail of sharing changes

---

## API Endpoints

| Endpoint                         | Method | Description                      | Auth                      |
| -------------------------------- | ------ | -------------------------------- | ------------------------- |
| `/api/profile`                   | GET    | Get current user's full profile  | Required                  |
| `/api/profile`                   | PUT    | Update profile (partial updates) | Required                  |
| `/api/profile/privacy`           | GET    | Get privacy settings             | Required                  |
| `/api/profile/privacy`           | PUT    | Update privacy settings          | Required                  |
| `/api/profile/shared/:userId`    | GET    | Get co-parent's shared profile   | Required (co-parent only) |
| `/api/profile/completion-status` | GET    | Get completion % and suggestions | Required                  |

---

## Frontend Components

### New Components

- `ProfileWizard.jsx` - Multi-step onboarding wizard
- `WorkScheduleSection.jsx` - Work & schedule form
- `HealthWellbeingSection.jsx` - Health information form (encrypted, confidential)
- `FinancialContextSection.jsx` - Financial context form (private)
- `BackgroundSection.jsx` - Background & education form
- `PrivacySettings.jsx` - Privacy controls page with preview mode
- `ProfileCompletionWidget.jsx` - Dashboard progress indicator

### Enhanced Components

- `ProfilePanel.jsx` - Add pronouns, birthdate, language, timezone fields
- Integration with existing profile UI

---

## Privacy & Security

### Encryption

- Health medications field encrypted at rest (AES-256-GCM)
- Separate encryption key in environment variable
- Decrypt only for profile owner, never transmitted to co-parent

### Access Control

- Users can only access their own full profile
- Co-parents can only access shared fields (privacy settings enforced)
- Authorization checks on every endpoint

### Audit Logging

- Every privacy setting change logged
- Every shared profile view recorded
- Timestamp, IP address, user agent captured
- 90-day retention

### Input Validation

- Age validation (18+ required for birthdate)
- Enum validation for dropdowns
- Length limits and sanitization
- XSS prevention (DOMPurify + validator.escape)

---

## AI Integration Example

**Before (no profile context):**

```
User: "You NEVER pick up on time!"
AI: "Using 'never' can feel accusatory. Try: 'I've noticed pickups running late recently.'"
```

**After (with profile context - user works shift work, low flexibility):**

```
User: "You NEVER pick up on time!"
AI: "I know you work shifts with limited flexibility, so timing is critical for you.
     Instead of 'never,' try: 'Pickups running late creates problems with my shift schedule.
     Could we set a firm 15-minute window?'"
```

---

## Implementation Phases

### Phase 1: Schema Migration (Week 1)

- Create migration scripts (SQLite + PostgreSQL)
- Add all new columns to `users` table
- Create `user_privacy_settings` and `profile_sharing_audit` tables
- Test migration + rollback plan

### Phase 2: Backend API (Week 2-3)

- Create `profileUtils.js` with core logic
- Add 6 API endpoints to `server.js`
- Implement input validation (Joi schemas)
- Add encryption module for health data
- Write unit tests

### Phase 3: Frontend UI (Week 4-5)

- Create ProfileWizard component (5-step onboarding)
- Build section components (Work, Health, Financial, Background)
- Create PrivacySettings page with preview mode
- Add ProfileCompletionWidget to dashboard
- Mobile optimization

### Phase 4: AI Integration (Week 6)

- Modify `mediator.js` to load profile context
- Build `buildProfileContextForAI()` function
- Update AI prompt template
- Test profile-aware mediation
- Measure token usage

### Phase 5: Testing & Launch (Week 7)

- Unit tests (profile CRUD, privacy enforcement)
- Integration tests (wizard flow, co-parent access)
- Privacy audit (penetration testing)
- Accessibility audit (WCAG 2.1 AA)
- Performance testing (API latency)
- Soft launch to 10% of users

---

## Risks & Mitigations

| Risk                                    | Level    | Mitigation                                                             |
| --------------------------------------- | -------- | ---------------------------------------------------------------------- |
| Low completion rates (health/financial) | High     | Clear "why we ask" explanations, hide section option, testimonials     |
| Privacy breach (accidental exposure)    | Critical | Comprehensive privacy tests, penetration testing, audit log monitoring |
| Performance degradation (large context) | Medium   | 500 token limit, context pruning, Redis caching                        |
| User overwhelm (60+ fields)             | Medium   | Progressive disclosure, skip options, autosave, mobile-first           |

---

## Open Questions

1. **Multi-Language Support:** Include Spanish translations for health fields from day 1? ✅ Recommended
2. **Profile Data Portability:** Add "Download My Data" for GDPR compliance? ✅ Recommended
3. **Co-Parent Matching:** Suggest filling sections based on co-parent's shared sections? 🤔 Make opt-in
4. **Profile Verification:** Verify sensitive fields (child support)? ❌ Keep self-reported
5. **Historical Changes:** Track profile changes over time? ✅ Track for analytics, not user-facing

---

## Files Created

- `/specs/010-user-profile-comprehensive/spec.md` - Full specification (68KB)
- `/specs/010-user-profile-comprehensive/README.md` - This quick reference

---

## Next Steps

1. **Review with stakeholders** (Product, Engineering, Privacy, UX)
2. **Approve database schema** (verify all fields align with business needs)
3. **Create task breakdown** in project management tool (GitHub issues/Jira)
4. **Assign resources** (1 engineer, 1 designer)
5. **Schedule design review** for wireframes
6. **Plan privacy audit** before production launch

---

**Document Version:** 1.0
**Created:** 2025-11-28
**Author:** Specification Agent (Claude)
**Status:** Ready for Review
