import React from 'react';
import { Modal, Button } from '../ui';

export function ContactSuggestionModal({ pendingContactSuggestion, onAddContact, onDismiss, setDismissedSuggestions }) {
  if (!pendingContactSuggestion) return null;

  const handleDismiss = () => {
    if (pendingContactSuggestion?.id) {
      setDismissedSuggestions((prev) => new Set(prev).add(pendingContactSuggestion.id));
    }
    onDismiss();
  };

  return (
    <Modal
      isOpen={!!pendingContactSuggestion}
      onClose={handleDismiss}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal to-teal-medium flex items-center justify-center text-white font-bold text-sm">
            💡
          </div>
          <span>Add Contact?</span>
        </div>
      }
      size="small"
      footer={
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="secondary"
            onClick={onAddContact}
            className="flex-1"
          >
            Yes, Add Contact
          </Button>
          <Button
            variant="tertiary"
            onClick={handleDismiss}
            className="whitespace-nowrap"
          >
            Not Now
          </Button>
        </div>
      }
    >
      <p className="text-sm text-teal-medium mb-4">
        {pendingContactSuggestion.text || `Would you like to add ${pendingContactSuggestion.detectedName} to your contacts?`}
      </p>
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4">
        <p className="text-xs font-semibold text-teal-900 mb-1">
          Detected name:
        </p>
        <p className="text-sm text-teal-800 font-medium">
          {pendingContactSuggestion.detectedName}
        </p>
      </div>
    </Modal>
  );
}
