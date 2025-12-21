/**
 * localStorage Migration Utility
 *
 * Migrates old snake_case localStorage keys to new camelCase keys
 * Provides backward compatibility during transition period
 */

const MIGRATION_MAP = {
  // Old key → New key
  notification_preferences: 'notificationPreferences',
  pending_invite_code: 'pendingInviteCode',
  liaizen_add_contact: 'liaizenAddContact',
  liaizen_smart_task: 'liaizenSmartTask',
  liaizen_toast_sound: 'liaizenToastSound',
  pending_sent_invitation: 'pendingSentInvitation',
  oauth_processed_code: 'oauthProcessedCode',
  invitation_token: 'invitationToken',
  invitation_code: 'invitationCode',
};

/**
 * Migrate a single localStorage key from old to new format
 * @param {string} oldKey - Old snake_case key
 * @param {string} newKey - New camelCase key
 * @returns {boolean} - True if migration occurred
 */
function migrateKey(oldKey, newKey) {
  if (typeof window === 'undefined') return false;

  const oldValue = localStorage.getItem(oldKey);
  if (oldValue !== null) {
    // Set new key with old value
    localStorage.setItem(newKey, oldValue);
    // Remove old key
    localStorage.removeItem(oldKey);
    return true;
  }
  return false;
}

/**
 * Run all migrations
 * @returns {number} - Number of keys migrated
 */
export function runMigrations() {
  if (typeof window === 'undefined') return 0;

  let migratedCount = 0;

  for (const [oldKey, newKey] of Object.entries(MIGRATION_MAP)) {
    if (migrateKey(oldKey, newKey)) {
      migratedCount++;
    }
  }

  if (migratedCount > 0) {
    console.log(`[Storage Migration] Migrated ${migratedCount} localStorage keys to camelCase`);
  }

  return migratedCount;
}

/**
 * Get value from localStorage with backward compatibility
 * Tries new key first, then falls back to old key and migrates
 * @param {string} newKey - New camelCase key
 * @param {string} oldKey - Old snake_case key (optional, will be looked up)
 * @returns {string|null} - Value or null
 */
export function getWithMigration(newKey, oldKey = null) {
  if (typeof window === 'undefined') return null;

  // Try new key first
  const newValue = localStorage.getItem(newKey);
  if (newValue !== null) return newValue;

  // Find old key if not provided
  if (!oldKey) {
    for (const [old, newK] of Object.entries(MIGRATION_MAP)) {
      if (newK === newKey) {
        oldKey = old;
        break;
      }
    }
  }

  // Try old key and migrate if found
  if (oldKey) {
    const oldValue = localStorage.getItem(oldKey);
    if (oldValue !== null) {
      migrateKey(oldKey, newKey);
      return oldValue;
    }
  }

  return null;
}

/**
 * Set value in localStorage using new key format
 * Also removes old key if it exists
 * @param {string} newKey - New camelCase key
 * @param {string} value - Value to set
 */
export function setWithMigration(newKey, value) {
  if (typeof window === 'undefined') return;

  // Set new key
  localStorage.setItem(newKey, value);

  // Remove old key if it exists
  for (const [oldKey, newK] of Object.entries(MIGRATION_MAP)) {
    if (newK === newKey) {
      localStorage.removeItem(oldKey);
      break;
    }
  }
}

/**
 * Remove value from localStorage using new key format
 * Also removes old key if it exists
 * @param {string} newKey - New camelCase key
 */
export function removeWithMigration(newKey) {
  if (typeof window === 'undefined') return;

  // Remove new key
  localStorage.removeItem(newKey);

  // Remove old key if it exists
  for (const [oldKey, newK] of Object.entries(MIGRATION_MAP)) {
    if (newK === newKey) {
      localStorage.removeItem(oldKey);
      break;
    }
  }
}

export default {
  runMigrations,
  getWithMigration,
  setWithMigration,
  removeWithMigration,
  MIGRATION_MAP,
};
