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

  // Auto-request permission on mount if not already requested
  React.useEffect(() => {
    if (enabled && isSupported && permission === 'default' && !hasRequestedPermission) {
      // Don't auto-request immediately - let user interact first
      // This will be called manually from UI
    }
  }, [enabled, isSupported, permission, hasRequestedPermission]);

  // Show notification for a new message
  const showNotification = React.useCallback((message) => {
    // Don't show notification if:
    // - Not enabled
    // - Not supported
    // - Permission not granted
    // - Message is from current user
    if (!enabled || !isSupported || permission !== 'granted') {
      return;
    }

    if (message.username === username) {
      return; // Don't notify for own messages
    }

    try {
      const notification = new Notification('New message from ' + message.username, {
        body: message.text.length > 100
          ? message.text.substring(0, 100) + '...'
          : message.text,
        icon: '/flower-icon.svg', // Your app icon
        badge: '/flower-icon.svg',
        tag: 'chat-message-' + message.id, // Prevent duplicate notifications
        requireInteraction: false,
        silent: false,
      });

      // Click notification to focus window
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Play notification sound (optional)
      playNotificationSound();

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [enabled, isSupported, permission, username]);

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
