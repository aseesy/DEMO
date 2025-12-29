import React from 'react';

/**
 * useNewMessageHandler Hook
 *
 * Handles new message notifications and unread count tracking:
 * - Filters out own messages and AI/system messages
 * - Tracks unread message count
 * - Shows in-app toast notifications
 * - Shows native browser notifications
 */
export function useNewMessageHandler({ username, currentView, notifications, toast }) {
  // Track unread message count for navigation badge
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Reset unread count when navigating to chat view
  React.useEffect(() => {
    if (currentView === 'chat') {
      setUnreadCount(0);
    }
  }, [currentView]);

  // Callback for new messages - shows both browser notification and in-app toast
  const handleNewMessage = React.useCallback(
    message => {
      // Get sender email from new structure (sender.email) or legacy fields
      const senderEmail = message.sender?.email || message.user_email || message.email || message.username;
      
      // Only process notifications for messages from other users (case-insensitive)
      if (senderEmail?.toLowerCase() === username?.toLowerCase()) {
        return; // Don't notify for own messages
      }

      // Don't show notifications for AI/system messages
      // These are coaching messages meant for the sender, not notifications for the receiver
      const aiMessageTypes = [
        'ai_intervention',
        'ai_comment',
        'pending_original',
        'ai_error',
        'system',
      ];
      const aiUsernames = ['liaizen', 'alex', 'system'];

      if (aiMessageTypes.includes(message.type)) {
        return; // Don't notify for AI intervention/coaching messages
      }

      if (aiUsernames.includes(senderEmail?.toLowerCase())) {
        return; // Don't notify for messages from AI users
      }

      // Increment unread count if not on chat screen or page is hidden
      if (currentView !== 'chat' || document.hidden) {
        setUnreadCount(prev => prev + 1);
      }

      // Get sender name from new structure (sender object), fallback to legacy fields
      const getSenderDisplayName = (msg) => {
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

      // Show in-app toast notification (visual popup like Google Calendar)
      // Works without any browser permissions
      toast.show({
        sender: senderName,
        message: message.text || message.content || '',
        timestamp: message.timestamp
          ? new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : undefined,
        username: username, // Current user to filter own messages
      });

      // Show native browser notification like SMS - always show if permission granted
      // This provides immediate notification on computer/phone, similar to text messages
      if (notifications.permission === 'granted') {
        notifications.showNotification(message);
      }
    },
    [username, currentView, notifications, toast]
  );

  return {
    unreadCount,
    setUnreadCount,
    handleNewMessage,
  };
}
