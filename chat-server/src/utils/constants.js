/**
 * Application Constants
 * 
 * Centralized constants to replace magic numbers and strings throughout the codebase.
 * This improves maintainability, readability, and makes configuration changes easier.
 * 
 * @module src/utils/constants
 */

// ============================================================================
// TIME CONSTANTS (milliseconds)
// ============================================================================

const TIME = {
  // Cache TTLs
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
  ESCALATION_DECAY_MS: 5 * 60 * 1000, // 5 minutes
  
  // Timeouts
  OPENAI_TIMEOUT_MS: 30000, // 30 seconds
  REQUEST_TIMEOUT_MS: 30000, // 30 seconds
  RETRY_DELAY_MS: 2000, // 2 seconds
  
  // Rate limiting windows
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  
  // Date calculations
  DAYS_TO_MS: (days) => days * 24 * 60 * 60 * 1000,
  MINUTES_TO_MS: (minutes) => minutes * 60 * 1000,
  SECONDS_TO_MS: (seconds) => seconds * 1000,
};

// ============================================================================
// VALIDATION LIMITS
// ============================================================================

const VALIDATION = {
  // Username
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  
  // Message
  MIN_MESSAGE_LENGTH: 1,
  MAX_MESSAGE_LENGTH: 1000,
  MESSAGE_PREVIEW_LENGTH: 50,
  
  // Profile fields
  SHORT_TEXT_MAX_LENGTH: 500,
  LONG_TEXT_MAX_LENGTH: 2000,
  
  // Age
  MIN_USER_AGE: 18,
  
  // Feedback
  FEEDBACK_LOOKBACK_DAYS: 30,
  MAX_FEEDBACK_RECORDS: 50,
  MAX_RECENT_NEGATIVE: 10,
  MAX_RECENT_POSITIVE: 10,
  
  // Database queries
  DEFAULT_QUERY_LIMIT: 1,
  MAX_QUERY_LIMIT: 100,
};

// ============================================================================
// CACHE & STORAGE LIMITS
// ============================================================================

const CACHE = {
  MAX_SIZE: 100,
  MAX_AGE_MS: TIME.CACHE_TTL_MS,
  
  // Message cache
  MESSAGE_CACHE_MAX_SIZE: 100,
  MESSAGE_CACHE_TTL_MS: TIME.CACHE_TTL_MS,
};

// ============================================================================
// RATE LIMITING
// ============================================================================

const RATE_LIMIT = {
  WINDOW_MS: TIME.RATE_LIMIT_WINDOW_MS,
  MAX_REQUESTS_PER_WINDOW: 60,
  MAX_RETRIES: 2,
};

// ============================================================================
// AI/OPENAI CONFIGURATION
// ============================================================================

const AI = {
  // Models
  DEFAULT_MODEL: 'gpt-4o-mini',
  NAME_DETECTION_MODEL: 'gpt-4o-mini',
  
  // Token limits
  DEFAULT_MAX_TOKENS: 1000,
  NAME_DETECTION_MAX_TOKENS: 30,
  
  // Temperature
  DEFAULT_TEMPERATURE: 0.3,
  NAME_DETECTION_TEMPERATURE: 0.1,
  LOW_TEMPERATURE: 0.1,
  MEDIUM_TEMPERATURE: 0.3,
  
  // Timeouts
  TIMEOUT_MS: TIME.OPENAI_TIMEOUT_MS,
};

// ============================================================================
// MESSAGE & CONTEXT LIMITS
// ============================================================================

const MESSAGE = {
  // Context windows
  RECENT_MESSAGES_COUNT: 25, // Increased from 15 for better conversation context
  MIN_MESSAGES_FOR_INSIGHTS: 3,
  INSIGHTS_EXTRACTION_INTERVAL: 5, // Every 5th message
  
  // History limits
  MAX_EMOTION_HISTORY: 20,
  MAX_RECENT_TRIGGERS: 10,
  MAX_INTERVENTION_HISTORY: 20,
  MAX_RECENT_MESSAGES: 30, // Increased to support deeper conversation context
  
  // Preview lengths
  PREVIEW_LENGTH: 50,
  SHORT_PREVIEW_LENGTH: 30,
};

// ============================================================================
// ESCALATION & SCORING
// ============================================================================

const ESCALATION = {
  SCORE_INCREMENT: 10,
  SCORE_DECAY: 1,
  DECAY_INTERVAL_MS: TIME.ESCALATION_DECAY_MS,
  CONSERVATIVE_THRESHOLD: 0.5, // 50% negative ratio
  INTERVENTION_THRESHOLD_MIN: 30,
  INTERVENTION_THRESHOLD_MAX: 100,
  INTERVENTION_THRESHOLD_INCREMENT: 5,
  INTERVENTION_THRESHOLD_DECREMENT: 2,
};

// ============================================================================
// CONFIDENCE & RATIOS
// ============================================================================

const CONFIDENCE = {
  MAX_CONFIDENCE: 100,
  MIN_CONFIDENCE: 0,
  FEEDBACK_MULTIPLIER: 10, // Each feedback point = 10 confidence
  HIGH_CONFIDENCE_THRESHOLD: 80,
  MEDIUM_CONFIDENCE_THRESHOLD: 60,
};

// ============================================================================
// DATABASE QUERY LIMITS
// ============================================================================

const DATABASE = {
  DEFAULT_LIMIT: 1,
  FEEDBACK_QUERY_LIMIT: 50,
  MAX_QUERY_LIMIT: 100,
};

// ============================================================================
// ARRAY SLICE LIMITS
// ============================================================================

const ARRAY_LIMITS = {
  RECENT_NEGATIVE_FEEDBACK: 10,
  RECENT_POSITIVE_FEEDBACK: 10,
  RECENT_TRIGGERS: 10,
  EMOTION_HISTORY: 20,
  INTERVENTION_HISTORY: 20,
};

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ============================================================================
// ERROR CODES
// ============================================================================

const ERROR_CODES = {
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 429,
  
  // Authentication
  INVALID_API_KEY: 401,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  
  // Server errors
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  TIME,
  VALIDATION,
  CACHE,
  RATE_LIMIT,
  AI,
  MESSAGE,
  ESCALATION,
  CONFIDENCE,
  DATABASE,
  ARRAY_LIMITS,
  HTTP_STATUS,
  ERROR_CODES,
};

