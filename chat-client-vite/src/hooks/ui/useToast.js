import React from 'react';

/**
 * Toast Notification Hook
 * Manages in-app toast notifications (like WhatsApp/Messenger)
 *
 * Features:
 * - No browser permissions required
 * - Sound alerts
 * - Auto-dismiss after 5 seconds
 * - Multiple toasts stack
 * - Click to navigate to chat
 *
 * Usage:
 *   const toast = useToast();
 *   toast.show({ sender: 'John', message: 'Hello!', timestamp: '2:30 PM' });
 */
export function useToast() {
  const [toasts, setToasts] = React.useState([]);
  const [soundEnabled, setSoundEnabled] = React.useState(() => {
    const saved = localStorage.getItem('liaizen_toast_sound');
    return saved !== null ? saved === 'true' : true; // Default to enabled
  });

  // Play notification sound (works without browser permissions)
  const playSound = React.useCallback(() => {
    if (!soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Pleasant notification sound (higher pitch than useNotifications)
      oscillator.frequency.value = 1000; // 1000 Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.debug('[useToast] Sound playback failed:', error);
    }
  }, [soundEnabled]);

  // Show a new toast notification
  const show = React.useCallback(
    messageData => {
      const { sender, message, timestamp, username } = messageData;

      // Don't show toast for own messages (case-insensitive comparison)
      if (sender?.toLowerCase() === username?.toLowerCase()) {
        return;
      }

      // Create toast object
      const newToast = {
        id: `toast-${Date.now()}-${Math.random()}`,
        sender: sender || 'Co-parent',
        message: message && message.length > 80 ? message.substring(0, 80) + '...' : message || '',
        timestamp:
          timestamp ||
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        createdAt: Date.now(),
      };

      // Add toast to queue
      setToasts(prev => {
        // Limit to 3 toasts max to avoid clutter
        const updated = [newToast, ...prev];
        return updated.slice(0, 3);
      });

      // Play sound
      playSound();
    },
    [playSound]
  );

  // Dismiss a specific toast
  const dismiss = React.useCallback(toastId => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  // Clear all toasts
  const clearAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  // Toggle sound on/off
  const toggleSound = React.useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('liaizen_toast_sound', String(newValue));
      return newValue;
    });
  }, []);

  return {
    toasts,
    show,
    dismiss,
    clearAll,
    soundEnabled,
    toggleSound,
  };
}

export default useToast;
