/**
 * InviteCodeForm - Shared form component for invite code generation and acceptance
 *
 * This component provides the common UI for both:
 * - InviteCoParentPage (full page route)
 * - InviteTaskModal (modal overlay)
 *
 * It handles the generate/enter code interface. The parent component handles
 * navigation/close actions and renders the success button when code is generated.
 *
 * @param {Object} props
 * @param {Object} props.inviteState - State from useInviteCode hook
 * @param {Object} props.inviteHandlers - Handlers from useInviteCode hook
 * @param {Function} props.onCodeAccepted - Callback when code is successfully accepted
 */
import React from 'react';

export function InviteCodeForm({ inviteState, inviteHandlers, onCodeAccepted, renderSuccessButton }) {
  const { generatedCode, enteredCode, error, isLoading, copied } = inviteState;
  const { setEnteredCode, handleGenerateCode, handleCopyCode, handleAcceptCode } = inviteHandlers;

  // Handle code acceptance
  const handleAccept = React.useCallback(async () => {
    const result = await handleAcceptCode();
    if (result?.success) {
      onCodeAccepted?.(result);
    }
  }, [handleAcceptCode, onCodeAccepted]);

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {generatedCode ? (
        /* After code is generated - show code and copy */
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Send this code to your co-parent:</p>

          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-gray-50 rounded-lg text-center">
              <span className="text-xl font-mono font-bold text-teal-700">{generatedCode}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Copy button includes a message to send to your co-parent
          </p>

          {/* Parent renders success button here - see InviteCoParentPage and InviteTaskModal */}
          {renderSuccessButton?.()}

          <p className="text-xs text-gray-500 text-center">
            You'll be notified when your co-parent joins
          </p>
        </div>
      ) : (
        /* Initial state - generate or enter code */
        <>
          {/* Generate Code Section */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">Generate a code to share:</p>
            <button
              onClick={handleGenerateCode}
              disabled={isLoading}
              className="w-full py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Generating...' : 'Generate Code'}
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white text-gray-400 text-sm">or</span>
            </div>
          </div>

          {/* Enter Code Section */}
          <div>
            <p className="text-sm text-gray-600 mb-3">Enter a code you received:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={enteredCode}
                onChange={e => setEnteredCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAccept()}
                placeholder="Enter code"
                maxLength={10}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-center font-mono uppercase focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <button
                onClick={handleAccept}
                disabled={isLoading || !enteredCode.trim()}
                className="px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? '...' : 'Join'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default InviteCodeForm;

