/**
 * Auth Model - Authentication business logic hooks
 * @module features/auth/model
 */

export { useAuth } from './useAuth.js';
export { useEmailAuth } from './useEmailAuth.js';
export { useGoogleAuth } from './useGoogleAuth.js';
export { useSessionVerification, calculateUserProperties } from './useSessionVerification.js';
export { useAuthRedirect } from './useAuthRedirect.js';
