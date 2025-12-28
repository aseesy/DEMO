/**
 * Context Builder
 *
 * REFACTORED: This file now delegates to focused context builder modules.
 * Each module has a single responsibility:
 *
 * - contextBuilders/participantContext.js - Fetch user profiles
 * - contextBuilders/roleContext.js - Role-aware mediation
 * - contextBuilders/profileContext.js - Comprehensive profiles
 * - contextBuilders/situationContext.js - Co-parenting + graph + values
 * - contextBuilders/intelligenceContext.js - User intelligence + patterns
 *
 * @module liaizen/core/contextBuilder
 * @see liaizen/core/contextBuilders/index.js
 */

// Re-export everything from the context builders module
module.exports = require('./contextBuilders');
