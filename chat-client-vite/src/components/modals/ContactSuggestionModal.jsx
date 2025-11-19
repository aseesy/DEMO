import React from 'react';

export function ContactSuggestionModal({ pendingContactSuggestion, onAddContact, onDismiss, setDismissedSuggestions }) {
  if (!pendingContactSuggestion) return null;

  const handleDismiss = () => {
    if (pendingContactSuggestion?.id) {
      setDismissedSuggestions((prev) => new Set(prev).add(pendingContactSuggestion.id));
    }
    onDismiss();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal to-[#275559] flex items-center justify-center text-white font-bold text-sm">
              💡
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Add Contact?
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-2xl leading-none text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 mb-4">
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
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onAddContact}
            className="flex-1 bg-[#4DA8B0] text-white py-2.5 px-4 rounded-xl font-semibold hover:bg-[#3d8a92] transition-colors shadow-sm"
          >
            Yes, Add Contact
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-xl border-2 border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}

