/**
 * PostgreSQL Profile Repository
 *
 * Aggregates profile data from normalized tables:
 * - user_demographics (personal info)
 * - user_employment (work info)
 * - user_health_context (health info - ALWAYS PRIVATE)
 * - user_financials (financial info - ALWAYS PRIVATE)
 * - user_background (background info)
 *
 * Actor: Product/UX (profile data access)
 * Responsibility: CRUD for normalized profile tables
 *
 * @module repositories/postgres/PostgresProfileRepository
 */

const { PostgresGenericRepository } = require('./PostgresGenericRepository');
const { withTransaction } = require('../../../dbSafe');

/**
 * Maps old users table columns to new normalized tables
 */
const TABLE_FIELD_MAPPING = {
  user_demographics: {
    preferred_name: 'preferred_name',
    pronouns: 'pronouns',
    birthdate: 'birthdate',
    language: 'language',
    timezone: 'timezone',
    city: 'city',
    state: 'state',
    zip: 'zip',
  },
  user_employment: {
    employment_status: 'employment_status',
    occupation: 'occupation',
    employer: 'employer',
    work_schedule: 'work_schedule',
    schedule_flexibility: 'schedule_flexibility',
    commute_time: 'commute_time',
    travel_required: 'travel_required',
  },
  user_health_context: {
    health_physical_conditions: 'physical_conditions',
    health_physical_limitations: 'physical_limitations',
    health_mental_conditions: 'mental_conditions',
    health_mental_treatment: 'mental_treatment',
    health_mental_history: 'mental_history',
    health_substance_history: 'substance_history',
    health_in_recovery: 'in_recovery',
    health_recovery_duration: 'recovery_duration',
  },
  user_financials: {
    finance_income_level: 'income_level',
    finance_income_stability: 'income_stability',
    finance_employment_benefits: 'employment_benefits',
    finance_housing_status: 'housing_status',
    finance_housing_type: 'housing_type',
    finance_vehicles: 'vehicles',
    finance_debt_stress: 'debt_stress',
    finance_support_paying: 'support_paying',
    finance_support_receiving: 'support_receiving',
  },
  user_background: {
    background_birthplace: 'birthplace',
    background_raised: 'raised_location',
    background_family_origin: 'family_origin',
    background_culture: 'culture',
    background_religion: 'religion',
    background_military: 'military_service',
    background_military_branch: 'military_branch',
    background_military_status: 'military_status',
    education_level: 'education_level',
    education_field: 'education_field',
  },
};

/**
 * Reverse mapping: new column name -> { table, oldColumnName }
 */
function buildReverseMapping() {
  const reverse = {};
  for (const [table, fields] of Object.entries(TABLE_FIELD_MAPPING)) {
    for (const [oldName, newName] of Object.entries(fields)) {
      reverse[oldName] = { table, column: newName };
    }
  }
  return reverse;
}

const FIELD_TO_TABLE = buildReverseMapping();

/**
 * PostgreSQL Profile Repository
 * Provides unified access to normalized profile tables
 */
class PostgresProfileRepository {
  constructor() {
    this.demographics = new PostgresGenericRepository('user_demographics');
    this.employment = new PostgresGenericRepository('user_employment');
    this.healthContext = new PostgresGenericRepository('user_health_context');
    this.financials = new PostgresGenericRepository('user_financials');
    this.background = new PostgresGenericRepository('user_background');
  }

  /**
   * Get complete profile for a user
   * Aggregates data from all normalized tables
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Complete profile or null
   */
  async getCompleteProfile(userId) {
    const [demographics, employment, healthContext, financials, background] = await Promise.all([
      this.demographics.findOne({ user_id: userId }),
      this.employment.findOne({ user_id: userId }),
      this.healthContext.findOne({ user_id: userId }),
      this.financials.findOne({ user_id: userId }),
      this.background.findOne({ user_id: userId }),
    ]);

    // If no profile data exists at all, return null
    if (!demographics && !employment && !healthContext && !financials && !background) {
      return null;
    }

    // Map back to the old column names for backward compatibility
    const profile = {};

    if (demographics) {
      profile.preferred_name = demographics.preferred_name;
      profile.pronouns = demographics.pronouns;
      profile.birthdate = demographics.birthdate;
      profile.language = demographics.language;
      profile.timezone = demographics.timezone;
      profile.city = demographics.city;
      profile.state = demographics.state;
      profile.zip = demographics.zip;
    }

    if (employment) {
      profile.employment_status = employment.employment_status;
      profile.occupation = employment.occupation;
      profile.employer = employment.employer;
      profile.work_schedule = employment.work_schedule;
      profile.schedule_flexibility = employment.schedule_flexibility;
      profile.commute_time = employment.commute_time;
      profile.travel_required = employment.travel_required;
    }

    if (healthContext) {
      profile.health_physical_conditions = healthContext.physical_conditions;
      profile.health_physical_limitations = healthContext.physical_limitations;
      profile.health_mental_conditions = healthContext.mental_conditions;
      profile.health_mental_treatment = healthContext.mental_treatment;
      profile.health_mental_history = healthContext.mental_history;
      profile.health_substance_history = healthContext.substance_history;
      profile.health_in_recovery = healthContext.in_recovery;
      profile.health_recovery_duration = healthContext.recovery_duration;
    }

    if (financials) {
      profile.finance_income_level = financials.income_level;
      profile.finance_income_stability = financials.income_stability;
      profile.finance_employment_benefits = financials.employment_benefits;
      profile.finance_housing_status = financials.housing_status;
      profile.finance_housing_type = financials.housing_type;
      profile.finance_vehicles = financials.vehicles;
      profile.finance_debt_stress = financials.debt_stress;
      profile.finance_support_paying = financials.support_paying;
      profile.finance_support_receiving = financials.support_receiving;
    }

    if (background) {
      profile.background_birthplace = background.birthplace;
      profile.background_raised = background.raised_location;
      profile.background_family_origin = background.family_origin;
      profile.background_culture = background.culture;
      profile.background_religion = background.religion;
      profile.background_military = background.military_service;
      profile.background_military_branch = background.military_branch;
      profile.background_military_status = background.military_status;
      profile.education_level = background.education_level;
      profile.education_field = background.education_field;
    }

    return profile;
  }

  /**
   * Get a specific profile section
   *
   * @param {number} userId - User ID
   * @param {'demographics'|'employment'|'health'|'financials'|'background'} section - Section name
   * @returns {Promise<Object|null>} Section data or null
   */
  async getSection(userId, section) {
    const repoMap = {
      demographics: this.demographics,
      employment: this.employment,
      health: this.healthContext,
      financials: this.financials,
      background: this.background,
    };

    const repo = repoMap[section];
    if (!repo) {
      throw new Error(`Unknown profile section: ${section}`);
    }

    return repo.findOne({ user_id: userId });
  }

  /**
   * Update profile fields
   * Automatically routes updates to the correct normalized tables
   *
   * @param {number} userId - User ID
   * @param {Object} profileData - Profile data with old column names
   * @returns {Promise<void>}
   */
  async updateProfile(userId, profileData) {
    // Group updates by table
    const updates = {
      user_demographics: {},
      user_employment: {},
      user_health_context: {},
      user_financials: {},
      user_background: {},
    };

    for (const [field, value] of Object.entries(profileData)) {
      const mapping = FIELD_TO_TABLE[field];
      if (mapping) {
        updates[mapping.table][mapping.column] = value;
      }
    }

    // Execute updates for each table that has changes
    await withTransaction(async () => {
      const promises = [];

      for (const [table, data] of Object.entries(updates)) {
        if (Object.keys(data).length > 0) {
          data.updated_at = new Date().toISOString();
          promises.push(this._upsertSection(table, userId, data));
        }
      }

      await Promise.all(promises);
    });
  }

  /**
   * Update a specific section
   *
   * @param {number} userId - User ID
   * @param {'demographics'|'employment'|'health'|'financials'|'background'} section - Section name
   * @param {Object} data - Section data
   * @returns {Promise<Object>} Updated section
   */
  async updateSection(userId, section, data) {
    const tableMap = {
      demographics: 'user_demographics',
      employment: 'user_employment',
      health: 'user_health_context',
      financials: 'user_financials',
      background: 'user_background',
    };

    const tableName = tableMap[section];
    if (!tableName) {
      throw new Error(`Unknown profile section: ${section}`);
    }

    data.updated_at = new Date().toISOString();
    return this._upsertSection(tableName, userId, data);
  }

  /**
   * Initialize profile tables for a new user
   *
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async initializeProfile(userId) {
    const now = new Date().toISOString();
    const baseData = { user_id: userId, created_at: now, updated_at: now };

    await withTransaction(async () => {
      await Promise.all([
        this.demographics.create({ ...baseData }),
        this.employment.create({ ...baseData }),
        this.healthContext.create({ ...baseData }),
        this.financials.create({ ...baseData }),
        this.background.create({ ...baseData }),
      ]);
    });
  }

  /**
   * Delete all profile data for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteProfile(userId) {
    await withTransaction(async () => {
      await Promise.all([
        this.demographics.delete({ user_id: userId }),
        this.employment.delete({ user_id: userId }),
        this.healthContext.delete({ user_id: userId }),
        this.financials.delete({ user_id: userId }),
        this.background.delete({ user_id: userId }),
      ]);
    });
  }

  /**
   * Upsert (insert or update) a section
   * @private
   */
  async _upsertSection(tableName, userId, data) {
    const repo = new PostgresGenericRepository(tableName);
    const existing = await repo.findOne({ user_id: userId });

    if (existing) {
      return repo.update({ user_id: userId }, data);
    } else {
      return repo.create({
        user_id: userId,
        ...data,
        created_at: data.created_at || new Date().toISOString(),
      });
    }
  }
}

module.exports = { PostgresProfileRepository, TABLE_FIELD_MAPPING, FIELD_TO_TABLE };
