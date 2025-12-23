/**
 * Auth Feature - Authentication domain
 *
 * Package-by-feature: Everything related to Authentication lives here.
 * Delete this folder to remove the Auth feature entirely.
 *
 * Usage:
 *   import { useAuth, LoginSignup, GoogleOAuthCallback } from '@features/auth';
 */

// Model (The Logic)
export { useAuth } from './model/useAuth.js';
export { useEmailAuth } from './model/useEmailAuth.js';
export { useGoogleAuth } from './model/useGoogleAuth.js';
export { useSessionVerification, calculateUserProperties } from './model/useSessionVerification.js';
export { useAuthRedirect } from './model/useAuthRedirect.js';

// Components (The UI Details)
export { AuthHeader } from './components/AuthHeader.jsx';
export { InviteNotificationBanner } from './components/InviteNotificationBanner.jsx';
export { ErrorAlertBox } from './components/ErrorAlertBox.jsx';
export { GoogleSignInButton } from './components/GoogleSignInButton.jsx';
export { ModeToggleFooter } from './components/ModeToggleFooter.jsx';
export { InviteLinkFooter } from './components/InviteLinkFooter.jsx';

// Pages
export { LoginSignup } from './components/LoginSignup.jsx';
export { GoogleOAuthCallback } from './components/GoogleOAuthCallback.jsx';
export { ForgotPassword } from './components/ForgotPassword.jsx';
export { ResetPassword } from './components/ResetPassword.jsx';
