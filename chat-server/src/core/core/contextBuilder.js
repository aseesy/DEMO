/**
 * Context Builder
 *
 * REFACTORED: This file now delegates to focused context modules.
 * Each module has a single responsibility:
 *
 * - contexts/participantContext.js - Fetch user profiles
 * - contexts/roleContext.js - Role-aware mediation
 * - contexts/profileContext.js - Comprehensive profiles
 * - contexts/situationContext.js - Co-parenting + graph + values
 * - contexts/intelligenceContext.js - User intelligence + patterns
 *
 * @module liaizen/core/contextBuilder
 * @see liaizen/core/contexts/index.js
 */

// Re-export everything from the contexts module
module.exports = require('./contexts');
