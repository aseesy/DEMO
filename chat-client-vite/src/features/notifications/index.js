/**
 * Notifications Feature - Notifications domain
 *
 * Package-by-feature: Everything related to Notifications lives here.
 * Delete this folder to remove the Notifications feature entirely.
 *
 * Usage:
 *   import { useNotifications, NotificationsPanel, NotificationBell } from '@features/notifications';
 */

// Model (The Logic)
export { useNotifications } from './model/useNotifications.js';
export { useInAppNotifications } from './model/useInAppNotifications.js';
export { useNotificationData } from './model/useNotificationData.js';
export { useNotificationActions } from './model/useNotificationActions.js';
export { useNotificationPreferences } from './model/useNotificationPreferences.js';

// Components (The UI Details)
export { NotificationsPanel } from './components/NotificationsPanel.jsx';
export { NotificationItem } from './components/NotificationItem.jsx';
export { NotificationSettingsCard } from './components/NotificationSettingsCard.jsx';
export { NotificationIcon } from './components/NotificationIcon.jsx';
export { NotificationBell } from './components/NotificationBell.jsx';
