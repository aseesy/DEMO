/**
 * Notification Manager Library
 *
 * Standalone library for managing in-app notifications.
 * Used for co-parent invitation notifications to existing users
 * (per user decision: in-app only, no email for existing users).
 *
 * Feature: 003-account-creation-coparent-invitation
 * Constitutional Compliance:
 *   - Principle I (Library-First): Standalone module with clear API
 *   - Principle III (Contract-First): Defined interfaces before implementation
 */

const notificationService = require('./notificationService');

module.exports = {
  // Notification Creation
  createNotification: notificationService.createNotification,
  createInvitationNotification: notificationService.createInvitationNotification,
  createInvitationAcceptedNotification: notificationService.createInvitationAcceptedNotification,
  createInvitationDeclinedNotification: notificationService.createInvitationDeclinedNotification,

  // Notification Queries
  getNotifications: notificationService.getNotifications,
  getUnreadCount: notificationService.getUnreadCount,

  // Notification Actions
  markAsRead: notificationService.markAsRead,
  markAllAsRead: notificationService.markAllAsRead,
  recordAction: notificationService.recordAction,

  // Maintenance
  deleteOldNotifications: notificationService.deleteOldNotifications,

  // Constants
  NOTIFICATION_TYPES: notificationService.NOTIFICATION_TYPES,
  NOTIFICATION_ACTIONS: notificationService.NOTIFICATION_ACTIONS,
};
