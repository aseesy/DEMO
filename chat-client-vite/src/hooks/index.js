/**
 * Hooks - Infrastructure and utility hooks
 *
 * Domain-specific hooks have moved to features/:
 * - Auth hooks → features/auth/
 * - Notification hooks → features/notifications/
 * - Profile hooks → features/profile/
 * - Invitation hooks → features/invitations/model/
 * - Contact hooks → features/contacts/model/
 * - Chat hooks → features/chat/model/
 * - PWA hooks → features/pwa/
 *
 * @module hooks
 */

// UI Infrastructure
export * from './ui/index.js';

// Async Utilities - REMOVED: Migrated to TanStack Query (@tanstack/react-query)
// useAsyncOperation and useMultipleAsyncOperations were never used in production code
// All data fetching now uses TanStack Query for better caching, deduplication, and state management

// Network Status
export * from './network/index.js';

// Third-party Integrations
export * from './integrations/index.js';

// File Handling
export * from './files/index.js';

// Navigation
export * from './navigation/index.js';

// PWA (re-exported from features/pwa for backward compatibility)
export * from '../features/pwa/index.js';
