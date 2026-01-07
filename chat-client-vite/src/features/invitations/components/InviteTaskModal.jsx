import React from 'react';
import { Modal } from '../../../components/ui/Modal/Modal';
import { apiPost } from '../../../apiClient.js';

/**
 * InviteTaskModal - Simple invite/accept modal for co-parent pairing
 *
 * Two simple options:
 * 1. Generate a code to share
 * 2. Enter a code you received
 */
export function InviteTaskModal({ isOpen, onClose, onSuccess }) {
  const [generatedCode, setGeneratedCode] = React.useState('');
  const [enteredCode, setEnteredCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setGeneratedCode('');
      setEnteredCode('');
      setError('');
      setIsLoading(false);
      setCopied(false);
    }
  }, [isOpen]);

  const handleGenerateCode = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiPost('/api/invitations/generate-code');
      const data = await response.json();
      if (response.ok && data.shortCode) {
        setGeneratedCode(data.shortCode);
      } else {
        setError(data.error || 'Failed to generate code');
      }
    } catch {
      setError('Failed to generate code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      const inviteLink = `https://app.coparentliaizen.com/signup?code=${generatedCode}`;
      const message = `I'd like us to use LiaiZen to communicate better as co-parents. Click here to sign up and connect with me: ${inviteLink}`;
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy');
    }
  };

  const handleDone = () => {
    onClose();
  };

  const handleAcceptCode = async () => {
    if (!enteredCode.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await apiPost('/api/invitations/accept-code', {
        code: enteredCode.trim().toUpperCase(),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(data.error || 'Invalid or expired code');
      }
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Co-Parent" size="small">
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {generatedCode ? (
          /* After code is generated - show code, copy, and done */
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

            <button
              onClick={handleDone}
              className="w-full py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Done
            </button>

            <p className="text-xs text-gray-500 text-center">
              You'll be notified when your co-parent joins
            </p>
          </div>
        ) : (
          /* Initial state - generate or enter code */
          <>
            {/* Generate Code Section */}
            <div>
              <p className="text-sm text-gray-600 mb-3">Generate a code to share:</p>
              <button
                onClick={handleGenerateCode}
                disabled={isLoading}
                className="w-full py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Generating...' : 'Generate Code'}
              </button>
            </div>

            <div className="relative">
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
                  onChange={e => setEnteredCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleAcceptCode()}
                  placeholder="Enter code"
                  maxLength={10}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-center font-mono uppercase focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  onClick={handleAcceptCode}
                  disabled={isLoading || !enteredCode.trim()}
                  className="px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? '...' : 'Join'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default InviteTaskModal;
