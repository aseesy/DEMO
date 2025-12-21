import React from 'react';
import { trackContactAdded } from '../utils/analytics.js';
import { setWithMigration } from '../utils/storageMigration.js';
import {
  detectContactSuggestion,
  createContactData,
  shouldTrackDismissal,
} from './useContactSuggestionModal.logic.js';

/**
 * useContactSuggestionModal - Manages contact suggestion detection and handling
 * 
 * Encapsulates the business logic for:
 * - Detecting contact suggestions in messages
 * - Tracking dismissed suggestions
 * - Handling contact addition from suggestions
 * 
 * This hook owns the contact suggestion detection logic, following SRP.
 * 
 * @param {Object} options
 * @param {Array} options.messages - Messages array to scan for contact suggestions
 * @param {Function} options.setCurrentView - Navigation handler to switch to contacts view
 * @returns {Object} Contact suggestion modal state and handlers
 * @returns {Object|null} returns.pendingContactSuggestion - Current suggestion to show
 * @returns {Function} returns.setPendingContactSuggestion - Set pending suggestion
 * @returns {Set} returns.dismissedSuggestions - Set of dismissed suggestion IDs
 * @returns {Function} returns.setDismissedSuggestions - Update dismissed suggestions
 * @returns {Function} returns.handleAddContactFromSuggestion - Handle adding contact from suggestion
 */
export function useContactSuggestionModal({ messages = [], setCurrentView }) {
  const [pendingContactSuggestion, setPendingContactSuggestion] = React.useState(null);
  const [dismissedSuggestions, setDismissedSuggestions] = React.useState(new Set());

  // Handler for adding contact from suggestion modal
  // Uses pure business logic functions (decoupled from React)
  const handleAddContactFromSuggestion = React.useCallback(() => {
    if (!pendingContactSuggestion) return;
    
    // Business logic: create contact data (pure function)
    const contactData = createContactData(pendingContactSuggestion);
    
    // Side effects (framework/infrastructure concerns)
    trackContactAdded('suggestion');
    setCurrentView('contacts');
    setWithMigration('liaizenAddContact', JSON.stringify(contactData));
    
    // Business logic: determine if we should track dismissal (pure function)
    if (shouldTrackDismissal(pendingContactSuggestion)) {
      setDismissedSuggestions(prev => new Set(prev).add(pendingContactSuggestion.id));
    }
    
    setPendingContactSuggestion(null);
  }, [pendingContactSuggestion, setCurrentView]);

  // Detect contact suggestions in messages and show modal
  // Uses pure business logic function (decoupled from React)
  React.useEffect(() => {
    const latestSuggestion = detectContactSuggestion(
      messages,
      pendingContactSuggestion,
      dismissedSuggestions
    );

    if (latestSuggestion) {
      setPendingContactSuggestion(latestSuggestion);
    }
  }, [messages, pendingContactSuggestion, dismissedSuggestions]);

  return {
    pendingContactSuggestion,
    setPendingContactSuggestion,
    dismissedSuggestions,
    setDismissedSuggestions,
    handleAddContactFromSuggestion,
  };
}

