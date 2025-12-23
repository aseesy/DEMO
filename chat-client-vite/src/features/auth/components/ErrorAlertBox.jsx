/**
 * ErrorAlertBox - Error display with contextual action buttons
 */

import React from 'react';
import {
  getErrorAction,
  getErrorActionLabel,
  ErrorActionType,
} from '../../../config/authHelpers.js';

/**
 * @param {Object} props
 * @param {string} props.error - Error message to display
 * @param {Function} props.onSignIn - Called when user clicks "Sign in instead"
 * @param {Function} props.onCreateAccount - Called when user clicks "Create account"
 * @param {Function} props.onGoogleSignIn - Called when user clicks "Sign in with Google"
 */
export function ErrorAlertBox({ error, onSignIn, onCreateAccount, onGoogleSignIn }) {
  if (!error) {
    return null;
  }

  const actionType = getErrorAction(error);
  const actionLabel = getErrorActionLabel(actionType);

  const handleAction = () => {
    switch (actionType) {
      case ErrorActionType.SIGN_IN:
        onSignIn?.();
        break;
      case ErrorActionType.CREATE_ACCOUNT:
        onCreateAccount?.();
        break;
      case ErrorActionType.GOOGLE_SIGNIN:
        onGoogleSignIn?.();
        break;
      default:
        break;
    }
  };

  return (
    <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3 text-sm text-red-700 transition-all duration-300">
      <div className="font-semibold mb-1">Error</div>
      <div>{error}</div>
      {actionType !== ErrorActionType.NONE && (
        <button
          type="button"
          onClick={handleAction}
          className="mt-2 text-teal-medium font-semibold hover:text-teal-dark transition-colors underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default ErrorAlertBox;
