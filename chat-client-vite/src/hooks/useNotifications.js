import React from 'react';

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
      console.warn('Browser notifications are not supported');
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setHasRequestedPermission(true);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, permission]);

  // Auto-request notification permission when user first enters chat view
  // Only request once, and only if permission hasn't been set yet
  React.useEffect(() => {
    if (enabled && isSupported && permission === 'default' && !hasRequestedPermission && username) {
      // Wait a moment for the user to see the chat interface first
      const timer = setTimeout(() => {
        console.log('[useNotifications] Auto-requesting notification permission for new user...');
        requestPermission();
      }, 3000); // 3 second delay - gives user time to see the chat interface
      return () => clearTimeout(timer);
    }
  }, [enabled, isSupported, permission, hasRequestedPermission, username, requestPermission]);

  // Show notification for a new message
  const showNotification = React.useCallback((message) => {
    // Don't show notification if:
    // - Not enabled
    // - Not supported
    // - Permission not granted
    // - Message is from current user
    if (!enabled || !isSupported) {
      console.debug('[useNotifications] Notifications disabled or not supported');
      return;
    }

    if (permission !== 'granted') {
      console.debug('[useNotifications] Permission not granted:', permission);
      return;
    }

    if (message.username === username) {
      return; // Don't notify for own messages
    }

    // Show native browser notification like SMS - always show, regardless of page visibility
    // This provides immediate notification on computer/phone, similar to text messages
    try {
      const messageText = (message.text || message.content || '').trim();
      const truncatedText = messageText.length > 100
        ? messageText.substring(0, 100) + '...'
        : messageText;

      // Ensure we have permission before creating notification
      if (Notification.permission !== 'granted') {
        console.warn('[useNotifications] Permission not granted, cannot show notification');
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
          username: message.username,
        },
      };

      console.log('[useNotifications] Creating notification:', {
        title: 'New message from ' + message.username,
        body: truncatedText,
        permission: Notification.permission,
      });

      const notification = new Notification('New message from ' + message.username, notificationOptions);

      // Verify notification was created
      if (!notification) {
        console.error('[useNotifications] Notification object is null');
        return;
      }

      console.log('[useNotifications] Notification created successfully');

      // Click notification to focus window
      notification.onclick = () => {
        console.log('[useNotifications] Notification clicked');
        window.focus();
        notification.close();
        // Optionally navigate to chat view
        if (window.location.hash !== '#chat') {
          window.location.hash = 'chat';
        }
      };

      // Handle notification close
      notification.onclose = () => {
        console.log('[useNotifications] Notification closed');
      };

      // Handle notification error
      notification.onerror = (error) => {
        console.error('[useNotifications] Notification error:', error);
      };

      // Handle notification show - verify it's actually visible
      notification.onshow = () => {
        console.log('[useNotifications] Notification shown - should be visible on screen');
        // If notification is shown but user can't see it, it might be:
        // 1. In Notification Center (macOS) - check System Preferences > Notifications
        // 2. Do Not Disturb is enabled
        // 3. Browser is suppressing notifications when window is focused
        // 4. Notification banner style is set to "None" in system settings
      };

      // Don't auto-close if requireInteraction is true - let user dismiss manually
      // Only auto-close after 30 seconds as a fallback
      setTimeout(() => {
        if (notification) {
          try {
            notification.close();
          } catch (e) {
            // Notification may already be closed
          }
        }
      }, 30000);

      // Play notification sound
      playNotificationSound();

    } catch (error) {
      console.error('[useNotifications] Error showing notification:', error);
      // Fallback: try to show a simpler notification
      try {
        console.log('[useNotifications] Attempting fallback notification');
        const fallbackNotification = new Notification('LiaiZen', {
          body: 'You have a new message',
          icon: '/flower-icon.svg',
          silent: false,
        });
        setTimeout(() => fallbackNotification.close(), 5000);
        playNotificationSound();
      } catch (fallbackError) {
        console.error('[useNotifications] Fallback notification also failed:', fallbackError);
      }
    }
  }, [enabled, isSupported, permission, username]);

  // Auto-subscribe to push notifications when PWA is ready
  React.useEffect(() => {
    if (permission === 'granted' && window.liaizenPWA?.subscribeToPush) {
      console.log('[useNotifications] Permission granted, subscribing to push notifications...');
      window.liaizenPWA.subscribeToPush().catch((error) => {
        console.warn('[useNotifications] Could not subscribe to push:', error);
      });
    }
  }, [permission]);

  // Play a subtle notification sound
  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Silently fail if audio doesn't work
      console.debug('Could not play notification sound:', error);
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
