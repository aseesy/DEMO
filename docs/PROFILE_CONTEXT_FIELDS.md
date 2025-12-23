# Profile Context Fields Used by LiaiZen AI

This document lists all profile fields currently referenced in the context building code for AI mediation.

## Fields Used in `profileContext.js`

### Work Context
- `employment_status` ✓
- `schedule_flexibility` ✓
- `travel_required` ✓
- `commute_time` ✓

### Health Context
- `health_physical_conditions` ✓
- `health_mental_conditions` ✓
- `health_mental_treatment` ✓
- `health_in_recovery` ✓
- `health_substance_history` ✓

### Financial Context
- `finance_debt_stress` ✓
- `finance_support_paying` ✓
- `finance_support_receiving` ✓
- `finance_income_stability` ✓

### Background Context
- `background_military` ✓
- `background_military_status` ✓
- `background_culture` ✓
- `background_religion` ✓

### Personal Context
- `preferred_name` ✓
- `first_name` ✓
- `pronouns` ✓

## Fields Used in `userContext.js`

### Basic Info
- `first_name` ✓
- `last_name` ✓

### Communication
- `communication_style` ✓
- `communication_triggers` ✓
- `communication_goals` ✓

### Additional
- `additional_context` ✓
- `address` ✓
- `household_members` ✓
- `timezone` ✓

## Removed Fields (No Longer Used)
- `occupation` - Removed from profile, not referenced in context code ✓

## Notes
- All fields are checked with optional chaining (`?.`) or conditional checks
- Missing fields are handled gracefully
- No references to removed fields found

