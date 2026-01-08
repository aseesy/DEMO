/**
 * Profile Schema Validation
 *
 * Uses Zod for type-safe validation of profile update requests.
 */

const { z } = require('zod');

/**
 * Update profile schema
 * All fields are optional since this is a partial update
 */
const updateProfileSchema = z
  .object({
    // Personal info
    first_name: z.string().trim().max(60).optional(),
    last_name: z.string().trim().max(60).optional(),
    pronouns: z.string().trim().max(20).optional(),
    birthdate: z.string().optional(), // ISO date string
    language: z.string().trim().max(50).optional(),
    timezone: z.string().trim().max(50).optional(),
    phone: z.string().trim().max(20).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(50).optional(),
    zip: z.string().trim().max(10).optional(),

    // Work info
    employment_status: z.string().trim().max(50).optional(),
    employer: z.string().trim().max(100).optional(),
    work_schedule: z.string().trim().max(50).optional(),
    schedule_flexibility: z.string().trim().max(50).optional(),
    commute_time: z.string().trim().max(50).optional(),
    travel_required: z.boolean().optional(),

    // Health info (optional, but validated if provided)
    health_physical_conditions: z.string().trim().max(500).optional(),
    health_physical_limitations: z.string().trim().max(500).optional(),
    health_mental_conditions: z.string().trim().max(500).optional(),
    health_mental_treatment: z.string().trim().max(500).optional(),
    health_mental_history: z.string().trim().max(500).optional(),
    health_substance_history: z.string().trim().max(500).optional(),
    health_in_recovery: z.boolean().optional(),
    health_recovery_duration: z.string().trim().max(50).optional(),

    // Financial info (optional, but validated if provided)
    finance_income_level: z.string().trim().max(50).optional(),
    finance_income_stability: z.string().trim().max(50).optional(),
    finance_employment_benefits: z.string().trim().max(200).optional(),
    finance_housing_status: z.string().trim().max(50).optional(),
    finance_housing_type: z.string().trim().max(50).optional(),
    finance_vehicles: z.string().trim().max(200).optional(),
    finance_debt_stress: z.string().trim().max(50).optional(),
    finance_support_paying: z.boolean().optional(),
    finance_support_receiving: z.boolean().optional(),

    // Background info
    background_birthplace: z.string().trim().max(100).optional(),
    background_raised: z.string().trim().max(100).optional(),
    background_family_origin: z.string().trim().max(100).optional(),
    background_culture: z.string().trim().max(100).optional(),
    background_religion: z.string().trim().max(100).optional(),
    background_military: z.boolean().optional(),
    background_military_branch: z.string().trim().max(50).optional(),
    background_military_status: z.string().trim().max(50).optional(),
    education_level: z.string().trim().max(50).optional(),
    education_field: z.string().trim().max(100).optional(),

    // Allow other fields for flexibility (but validate known ones)
  })
  .passthrough();

/**
 * Update privacy settings schema
 */
const updatePrivacySettingsSchema = z.object({
  personal_visibility: z.enum(['shared', 'private']).optional(),
  work_visibility: z.enum(['shared', 'private']).optional(),
  health_visibility: z.enum(['shared', 'private']).optional(),
  financial_visibility: z.enum(['shared', 'private']).optional(),
  background_visibility: z.enum(['shared', 'private']).optional(),
  field_overrides: z
    .union([
      z.string(), // JSON string
      z.record(z.enum(['shared', 'private'])), // Object
    ])
    .optional(),
});

/**
 * Query params schema for GET endpoints
 * GET /me and GET /privacy/me don't require query params, but validate if provided
 */
const profileQuerySchema = z
  .object({
    // No required query params for these endpoints
    // But validate any that might be added in future
  })
  .passthrough();

module.exports = {
  updateProfileSchema,
  updatePrivacySettingsSchema,
  profileQuerySchema,
};
