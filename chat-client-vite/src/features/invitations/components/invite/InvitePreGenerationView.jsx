/**
 * InvitePreGenerationView - Pre-generation state with method selection and form
 */

import React from 'react';
import {
  AddUserIcon,
  EmailIcon,
  LinkIcon,
  CodeIcon,
  CheckIcon,
  CheckCircleIcon,
  SpinnerIcon,
} from './InviteIcons.jsx';
import { InviteMethodSelector } from './InviteMethodSelector.jsx';
import { EmailInput, CodeInput } from './InviteFormInputs.jsx';

/**
 * Get button config based on method and validation state
 */
function getButtonConfig(inviteMethod, codeValidation) {
  if (inviteMethod === 'have-code') {
    if (codeValidation?.valid) {
      return { icon: CheckIcon, label: 'Connect with Co-Parent' };
    }
    return { icon: CheckCircleIcon, label: 'Validate Code' };
  }

  switch (inviteMethod) {
    case 'email':
      return { icon: EmailIcon, label: 'Send Invite' };
    case 'code':
      return { icon: CodeIcon, label: 'Generate Code' };
    case 'link':
    default:
      return { icon: LinkIcon, label: 'Generate Link' };
  }
}

/**
 * @param {Object} props
 */
export function InvitePreGenerationView({
  error,
  inviteMethod,
  inviteeEmail,
  enteredCode,
  codeValidation,
  isLoading,
  isCreating,
  isAccepting,
  isValidating,
  onMethodChange,
  onEmailChange,
  onCodeChange,
  onValidateCode,
  onAcceptCode,
  onGenerateInvite,
  onSkip,
}) {
  const buttonConfig = getButtonConfig(inviteMethod, codeValidation);
  const ButtonIcon = buttonConfig.icon;

  const handleSubmit = () => {
    if (inviteMethod === 'have-code') {
      if (codeValidation?.valid) {
        onAcceptCode();
      } else {
        onValidateCode();
      }
    } else {
      onGenerateInvite();
    }
  };

  const handleCodeKeyDown = e => {
    if (e.key === 'Enter') {
      if (codeValidation?.valid) {
        onAcceptCode();
      } else {
        onValidateCode();
      }
    }
  };

  const isButtonDisabled = isLoading || (inviteMethod === 'have-code' && !enteredCode.trim());

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#E8F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
          <AddUserIcon className="w-8 h-8 text-[#275559]" />
        </div>
        <h1 className="text-2xl font-bold text-[#275559] mb-2">Invite Your Co-Parent</h1>
        <p className="text-gray-600">
          Connect with your co-parent to start communicating on LiaiZen.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Method Selector */}
      <InviteMethodSelector selectedMethod={inviteMethod} onMethodChange={onMethodChange} />

      {/* Email Input */}
      {inviteMethod === 'email' && <EmailInput value={inviteeEmail} onChange={onEmailChange} />}

      {/* Code Input */}
      {inviteMethod === 'have-code' && (
        <CodeInput
          value={enteredCode}
          onChange={onCodeChange}
          codeValidation={codeValidation}
          onKeyDown={handleCodeKeyDown}
        />
      )}

      {/* Action Button */}
      <button
        onClick={handleSubmit}
        disabled={isButtonDisabled}
        className="w-full py-3 px-4 bg-[#275559] text-white font-medium rounded-lg hover:bg-[#1e4245] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <SpinnerIcon className="w-5 h-5" />
            <span>
              {isValidating ? 'Validating...' : isAccepting ? 'Connecting...' : 'Creating...'}
            </span>
          </>
        ) : (
          <>
            <ButtonIcon className="w-5 h-5" />
            <span>{buttonConfig.label}</span>
          </>
        )}
      </button>

      {/* Skip link */}
      <button
        onClick={onSkip}
        className="w-full mt-4 py-2 text-[#275559] hover:text-[#4DA8B0] font-medium transition-colors"
      >
        Skip for now
      </button>
    </>
  );
}

export default InvitePreGenerationView;
