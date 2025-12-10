/**
 * Centralized localStorage key constants
 * Use these constants instead of magic strings throughout the codebase
 * All keys use camelCase for consistency with JavaScript conventions
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authTokenBackup',
  USERNAME: 'username',
  IS_AUTHENTICATED: 'isAuthenticated',
  USER_EMAIL: 'userEmail',
  CHAT_USER: 'chatUser',
  PENDING_INVITE_CODE: 'pendingInviteCode',
  OAUTH_PROCESSED_CODE: 'oauthProcessedCode',
  INVITATION_TOKEN: 'invitationToken',
  INVITATION_CODE: 'invitationCode',
  SMART_TASK: 'liaizenSmartTask',
  ADD_CONTACT: 'liaizenAddContact',
  NOTIFICATION_PREFERENCES: 'notificationPreferences',
  TOAST_SOUND: 'liaizenToastSound',
  PENDING_SENT_INVITATION: 'pendingSentInvitation',
  CURRENT_VIEW: 'currentView',
};

// Note: storageHelpers removed - unused
// Use storageMigration utilities (getWithMigration, setWithMigration, removeWithMigration) instead

