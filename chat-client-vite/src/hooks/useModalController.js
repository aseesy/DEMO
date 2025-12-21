import React from 'react';
import { trackContactAdded } from '../utils/analytics.js';
import { setWithMigration } from '../utils/storageMigration.js';

/**
 * useModalController Hook
 *
 * Manages all modal-related state for the ChatRoom:
 * - Welcome modal
 * - Profile task modal
 * - Invite modal
 * - Task form modal state
 * - Contact suggestion modal
 * - Message flagging modal
 */
export function useModalController({ messages = [], setCurrentView }) {
  // Welcome and profile task modals
  const [showWelcomeModal, setShowWelcomeModal] = React.useState(false);
  const [showProfileTaskModal, setShowProfileTaskModal] = React.useState(false);
  const [showInviteModal, setShowInviteModal] = React.useState(false);

  // Task form modal state
  const [taskFormMode, setTaskFormMode] = React.useState('manual'); // 'manual' or 'ai'
  const [aiTaskDetails, setAiTaskDetails] = React.useState('');
  const [isGeneratingTask, setIsGeneratingTask] = React.useState(false);

  // Contact suggestion modal state
  const [pendingContactSuggestion, setPendingContactSuggestion] = React.useState(null);
  const [dismissedSuggestions, setDismissedSuggestions] = React.useState(new Set());

  // Message flagging modal state
  const [flaggingMessage, setFlaggingMessage] = React.useState(null);
  const [flagReason, setFlagReason] = React.useState('');

  // Handler for adding contact from suggestion modal
  const handleAddContactFromSuggestion = React.useCallback(() => {
    if (!pendingContactSuggestion) return;
    trackContactAdded('suggestion');
    setCurrentView('contacts');
    setWithMigration(
      'liaizenAddContact',
      JSON.stringify({
        name: pendingContactSuggestion.detectedName,
        context: pendingContactSuggestion.text,
      })
    );
    if (pendingContactSuggestion.id) {
      setDismissedSuggestions(prev => new Set(prev).add(pendingContactSuggestion.id));
    }
    setPendingContactSuggestion(null);
  }, [pendingContactSuggestion, setCurrentView]);

  // Detect contact suggestions in messages and show modal
  React.useEffect(() => {
    const latestSuggestion = messages
      .filter(msg => msg.type === 'contact_suggestion' && msg.detectedName)
      .slice(-1)[0]; // Get the most recent suggestion

    if (
      latestSuggestion &&
      !pendingContactSuggestion && // Don't show if one is already showing
      !dismissedSuggestions.has(latestSuggestion.id) // Don't show if already dismissed
    ) {
      setPendingContactSuggestion(latestSuggestion);
    }
  }, [messages, pendingContactSuggestion, dismissedSuggestions]);

  return {
    // Welcome/Profile/Invite modals
    showWelcomeModal,
    setShowWelcomeModal,
    showProfileTaskModal,
    setShowProfileTaskModal,
    showInviteModal,
    setShowInviteModal,

    // Task form modal
    taskFormMode,
    setTaskFormMode,
    aiTaskDetails,
    setAiTaskDetails,
    isGeneratingTask,
    setIsGeneratingTask,

    // Contact suggestion modal
    pendingContactSuggestion,
    setPendingContactSuggestion,
    dismissedSuggestions,
    setDismissedSuggestions,
    handleAddContactFromSuggestion,

    // Flagging modal
    flaggingMessage,
    setFlaggingMessage,
    flagReason,
    setFlagReason,
  };
}
