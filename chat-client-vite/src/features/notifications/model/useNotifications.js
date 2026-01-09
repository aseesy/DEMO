import React from 'react';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('[useNotifications]');

/**
 * Custom hook to manage browser notifications for new messages
 *
 * Features:
 * - Requests notification permission
 * - Shows desktop notifications for ALL new messages from other users
 * - Works like SMS - notifies regardless of window visibility
 * - Plays sound for notifications
 * - Only filters out user's own messages
 */
export function useNotifications({ username, enabled = true }) {
  const [permission, setPermission] = React.useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [hasRequestedPermission, setHasRequestedPermission] = React.useState(false);

  // Check if notifications are supported
  const isSupported = typeof Notification !== 'undefined';

  // Request notification permission
  const requestPermission = React.useCallback(async () => {
    if (!isSupported) {
      logger.warn('Browser notifications are not supported');
      return false;
    }

    if (permission === 'granted') {
      // Permission already granted - push notifications handled by usePWA hook
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setHasRequestedPermission(true);

      // If permission granted, push notifications are handled by usePWA hook
      // which automatically subscribes to Web Push API

      return result === 'granted';
    } catch (error) {
      logger.error('Error requesting notification permission', error);
      return false;
    }
  }, [isSupported, permission]);

  // NOTE: Safari requires notification permission requests to be triggered by user gesture
  // We cannot auto-request - user must click the "Enable Notifications" button
  // Removed auto-request to comply with Safari's security requirements

  // Show notification for a new message
  const showNotification = React.useCallback(
    message => {
      // Don't show notification if:
      // - Not enabled
      // - Not supported
      // - Message is from current user
      if (!enabled || !isSupported) {
        logger.debug('Notifications disabled or not supported');
        return;
      }

      // Case-insensitive comparison to ensure own messages don't trigger notifications
      // Check new structure first (sender.email), fallback to legacy (username)
      const senderEmail =
        message.sender?.email || message.user_email || message.email || message.username;
      if (senderEmail?.toLowerCase() === username?.toLowerCase()) {
        return; // Don't notify for own messages
      }

      // ALWAYS play sound for new messages - this works even if notifications are suppressed
      playNotificationSound();

      if (permission !== 'granted') {
        logger.debug('Permission not granted', { permission });
        return;
      }

      // Show native browser notification like SMS - always show, regardless of page visibility
      // This provides immediate notification on computer/phone, similar to text messages
      try {
        const messageText = (message.text || message.content || '').trim();
        const truncatedText =
          messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText;

        // Ensure we have permission before creating notification
        if (Notification.permission !== 'granted') {
          logger.warn('Permission not granted, cannot show notification', {
            permission: Notification.permission,
          });
          return;
        }

        // Create the notification with all options to ensure it shows visually
        // CRITICAL: requireInteraction: true makes notification stay visible until user interacts
        const notificationOptions = {
          body: truncatedText || 'You have a new message',
          icon: '/flower-icon.svg', // Your app icon
          badge: '/flower-icon.svg',
          tag: 'chat-message-' + (message.id || Date.now()), // Prevent duplicate notifications
          requireInteraction: true, // CRITICAL: Keep notification visible until user clicks/dismisses
          silent: false, // Ensure sound plays AND visual notification shows
          timestamp: Date.now(),
          // Add vibrate pattern for mobile devices (if supported)
          vibrate: [200, 100, 200],
          // Add data for notification click handling
          data: {
            url: window.location.href,
            messageId: message.id,
            username: senderEmail, // Use sender email for backward compatibility
            senderEmail: senderEmail,
          },
        };

        // Get sender name from new structure (sender object), fallback to legacy fields
        const getSenderDisplayName = msg => {
          if (msg.sender) {
            // Use new structure: first_name + last_name > first_name > email
            if (msg.sender.first_name && msg.sender.last_name) {
              return `${msg.sender.first_name} ${msg.sender.last_name}`;
            }
            return msg.sender.first_name || msg.sender.email || 'Co-parent';
          }
          // Fallback to legacy structure
          return msg.displayName || msg.username || 'Co-parent';
        };
        const senderName = getSenderDisplayName(message);

        logger.debug('Creating notification', {
          senderName,
          messagePreview: truncatedText.substring(0, 50),
          permission: Notification.permission,
        });

        const notification = new Notification(
          'New message from ' + senderName,
          notificationOptions
        );

        // Verify notification was created
        if (!notification) {
          logger.error('Notification object is null');
          return;
        }

        logger.debug('Notification created successfully', { messageId: message.id });

        // Click notification to focus window
        notification.onclick = () => {
          logger.debug('Notification clicked');
          window.focus();
          notification.close();
          // Optionally navigate to chat view
          if (window.location.hash !== '#chat') {
            window.location.hash = 'chat';
          }
        };

        // Handle notification close
        notification.onclose = () => {
          logger.debug('Notification closed');
        };

        // Handle notification error
        notification.onerror = error => {
          logger.error('Notification error', error);
        };

        // Handle notification show - verify it's actually visible
        notification.onshow = () => {
          logger.debug('Notification shown - should be visible on screen');
          // If notification is shown but user can't see it, it might be:
          // 1. In Notification Center (macOS) - check System Preferences > Notifications
          // 2. Do Not Disturb is enabled
          // 3. Browser is suppressing notifications when window is focused
          // 4. Notification banner style is set to "None" in system settings
        };

        // Notification stays visible until user manually closes it
        // No auto-close timeout - user must dismiss manually

        // Play notification sound
        playNotificationSound();
      } catch (error) {
        logger.error('Error showing notification', error);
        // Fallback: try to show a simpler notification
        try {
          logger.debug('Attempting fallback notification');
          const fallbackNotification = new Notification('LiaiZen', {
            body: 'You have a new message',
            icon: '/flower-icon.svg',
            silent: false,
            requireInteraction: true, // Stay visible until user closes
          });
          // No auto-close - user must dismiss manually
          playNotificationSound();
        } catch (fallbackError) {
          logger.error('Fallback notification also failed', fallbackError);
        }
      }
    },
    [enabled, isSupported, permission, username]
  );

  // Auto-subscribe to push notifications when permission is granted
  // NOTE: This only runs if permission is already granted (not requesting permission)
  React.useEffect(() => {
    if (permission === 'granted' && window.liaizenPWA?.subscribeToPush) {
      logger.debug('Permission granted, subscribing to push notifications');
      // Safe to call - permission already granted, no requestPermission() call needed
      window.liaizenPWA
        .subscribeToPush()
        .then(subscription => {
          if (subscription) {
            logger.info('Successfully subscribed to push notifications');
          } else {
            logger.warn('subscribeToPush returned null - subscription may have failed');
          }
        })
        .catch(error => {
          logger.error('Could not subscribe to push', error);
        });
    }
  }, [permission]);

  // Play a noticeable notification sound - two-tone chime like Google Calendar
  const playNotificationSound = () => {
    try {
      // Create a pleasant two-tone chime sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // First tone (higher)
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      oscillator1.frequency.value = 880; // A5 note
      oscillator1.type = 'sine';
      gainNode1.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.3);

      // Second tone (lower, slight delay) - creates pleasant chime effect
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      oscillator2.frequency.value = 660; // E5 note
      oscillator2.type = 'sine';
      gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode2.gain.setValueAtTime(0.4, audioContext.currentTime + 0.15);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator2.start(audioContext.currentTime + 0.15);
      oscillator2.stop(audioContext.currentTime + 0.5);

      logger.debug('Playing notification sound');
    } catch (error) {
      // Silently fail if audio doesn't work
      logger.debug('Could not play notification sound', error);
    }
  };

  return {
    permission,
    isSupported,
    hasRequestedPermission,
    requestPermission,
    showNotification,
  };
}
