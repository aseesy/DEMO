import React from 'react';
import { Modal } from './ui/Modal/Modal';
import { usePairing } from '../hooks/usePairing';

/**
 * InviteTaskModal - Combined invite/accept modal for co-parent pairing
 * Feature: 005-tasks-feature-improvement
 *
 * Contains two tabs:
 * 1. Send Invite - Generate invites via Email, Link, or Code
 * 2. Have a Code? - Enter and accept a pairing code
 */
export function InviteTaskModal({ isOpen, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = React.useState('send'); // 'send' | 'receive'
  const [inviteMethod, setInviteMethod] = React.useState('link'); // 'email' | 'link' | 'code'
  const [email, setEmail] = React.useState('');
  const [manualCode, setManualCode] = React.useState('');
  const [generatedResult, setGeneratedResult] = React.useState(null);
  const [validationResult, setValidationResult] = React.useState(null);
  const [copySuccess, setCopySuccess] = React.useState('');
  const [localError, setLocalError] = React.useState('');

  const {
    createPairing,
    acceptPairing,
    validateCode,
    isCreating,
    isAccepting,
    isValidating,
    error: pairingError,
    clearError,
    buildInviteUrl,
  } = usePairing();

  const error = localError || pairingError;

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setActiveTab('send');
      setInviteMethod('link');
      setEmail('');
      setManualCode('');
      setGeneratedResult(null);
      setValidationResult(null);
      setCopySuccess('');
      setLocalError('');
      clearError();
    }
  }, [isOpen, clearError]);

  // Handle generating an invite
  const handleGenerateInvite = async () => {
    setLocalError('');
    setCopySuccess('');

    if (inviteMethod === 'email' && !email.trim()) {
      setLocalError('Please enter an email address');
      return;
    }

    const result = await createPairing(inviteMethod, inviteMethod === 'email' ? email : null);

    if (result.success) {
      if (result.mutual) {
        // Mutual detection - already paired!
        onSuccess?.();
        onClose();
      } else {
        setGeneratedResult({
          code: result.pairingCode,
          token: result.token,
          expiresAt: result.expiresAt,
          inviteUrl: result.token ? buildInviteUrl(result.token) : null,
        });
      }
    }
  };

  // Handle validating a code
  const handleValidateCode = async () => {
    setLocalError('');
    setValidationResult(null);

    if (!manualCode.trim()) {
      setLocalError('Please enter a pairing code');
      return;
    }

    const result = await validateCode(manualCode.trim().toUpperCase());

    if (result.valid) {
      setValidationResult(result);
    } else {
      setLocalError(result.error || 'Invalid or expired code');
    }
  };

  // Handle accepting a code
  const handleAcceptCode = async () => {
    setLocalError('');

    const result = await acceptPairing({ code: manualCode.trim().toUpperCase() });

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setLocalError(result.error || 'Failed to accept invitation');
    }
  };

  // Copy to clipboard helper
  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Share via native share API (mobile)
  const handleShare = async () => {
    if (!generatedResult) return;

    const shareData = {
      title: 'Join me on LiaiZen',
      text: `I've invited you to connect on LiaiZen for co-parenting communication.\n\nPairing code: ${generatedResult.code}`,
      url: generatedResult.inviteUrl || undefined,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      }
    } catch (err) {
      // User cancelled or share failed - that's okay
      console.log('Share cancelled or failed:', err);
    }
  };

  // Format expiration time
  const formatExpiration = expiresAt => {
    if (!expiresAt) return '';
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires - now;
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 1) return 'Expires soon';
    if (diffMins < 60) return `Expires in ${diffMins} minutes`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `Expires in ${diffHours} hours`;
    const diffDays = Math.round(diffHours / 24);
    return `Expires in ${diffDays} days`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Your Co-Parent"
      subtitle="Connect with your co-parent to start communicating"
      size="small"
      className="max-h-[90vh] flex flex-col"
    >
      {/* Tab Selector */}
      <div className="flex border-b border-gray-200 mb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 flex-shrink-0">
        <button
          onClick={() => {
            setActiveTab('send');
            setLocalError('');
          }}
          className={`px-4 py-2.5 font-medium text-sm transition-colors ${
            activeTab === 'send'
              ? 'border-b-2 border-teal-500 text-teal-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Send Invite
        </button>
        <button
          onClick={() => {
            setActiveTab('receive');
            setLocalError('');
            setValidationResult(null);
          }}
          className={`px-4 py-2.5 font-medium text-sm transition-colors ${
            activeTab === 'receive'
              ? 'border-b-2 border-teal-500 text-teal-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Have a Code?
        </button>
      </div>

      <div className="flex-1 overflow-y-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Send Invite Tab */}
        {activeTab === 'send' && (
          <div className="space-y-4 pb-4">
            {!generatedResult ? (
              <>
                {/* Method Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How would you like to invite them?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'email', label: 'Email', icon: '✉️', desc: '7 days' },
                      { id: 'link', label: 'Link', icon: '🔗', desc: '7 days' },
                      { id: 'code', label: 'Code', icon: '#️⃣', desc: '15 min' },
                    ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => setInviteMethod(method.id)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          inviteMethod === method.id
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{method.icon}</span>
                        <span className="font-medium text-sm block">{method.label}</span>
                        <span className="text-xs text-gray-500">{method.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Input (for email method) */}
                {inviteMethod === 'email' && (
                  <div>
                    <label
                      htmlFor="invite-email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Co-parent's email
                    </label>
                    <input
                      id="invite-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="coparent@email.com"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerateInvite}
                  disabled={isCreating}
                  className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    `Generate ${inviteMethod === 'email' ? 'Email' : inviteMethod === 'link' ? 'Link' : 'Code'}`
                  )}
                </button>
              </>
            ) : (
              /* Generated Result Display */
              <div className="space-y-4">
                <div className="text-center text-green-600 font-medium">Invite created!</div>

                {/* Pairing Code */}
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">Pairing Code</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono font-bold text-2xl text-teal-700">
                      {generatedResult.code}
                    </span>
                    <button
                      onClick={() => handleCopy(generatedResult.code, 'code')}
                      className="p-2 text-gray-500 hover:text-teal-600 transition-colors"
                      title="Copy code"
                    >
                      {copySuccess === 'code' ? '✓' : '📋'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatExpiration(generatedResult.expiresAt)}
                  </div>
                </div>

                {/* Invite Link (for link/email methods) */}
                {generatedResult.inviteUrl && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2">Invite Link</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedResult.inviteUrl}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-700 truncate"
                      />
                      <button
                        onClick={() => handleCopy(generatedResult.inviteUrl, 'link')}
                        className="px-3 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors text-sm"
                      >
                        {copySuccess === 'link' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Share Button (mobile) */}
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button
                    onClick={handleShare}
                    className="w-full px-4 py-2.5 border-2 border-teal-600 text-teal-700 rounded-lg font-medium hover:bg-teal-50 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    Share
                  </button>
                )}

                {/* Generate New */}
                <button
                  onClick={() => setGeneratedResult(null)}
                  className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Generate a new invite
                </button>
              </div>
            )}
          </div>
        )}

        {/* Have a Code Tab */}
        {activeTab === 'receive' && (
          <div className="space-y-4 pb-4">
            <div>
              <label
                htmlFor="pairing-code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Enter the code from your co-parent
              </label>
              <input
                id="pairing-code"
                type="text"
                value={manualCode}
                onChange={e => {
                  setManualCode(e.target.value.toUpperCase());
                  setValidationResult(null);
                  setLocalError('');
                }}
                placeholder="LZ-XXXXXX"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-lg"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (validationResult) {
                      handleAcceptCode();
                    } else {
                      handleValidateCode();
                    }
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: LZ-XXXXXX (6 characters after LZ-)
              </p>
            </div>

            {/* Validation Result */}
            {validationResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-medium">Valid code!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Invitation from <strong>{validationResult.inviterUsername}</strong>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {!validationResult ? (
              <button
                onClick={handleValidateCode}
                disabled={isValidating || !manualCode.trim()}
                className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {isValidating ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Validate Code'
                )}
              </button>
            ) : (
              <button
                onClick={handleAcceptCode}
                disabled={isAccepting}
                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {isAccepting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect with Co-Parent'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default InviteTaskModal;
