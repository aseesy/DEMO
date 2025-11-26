import React from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../apiClient.js';

/**
 * InviteCoParentPage - Post-signup screen for inviting co-parent
 *
 * Shows after user creates account (email/password or Google OAuth)
 * User generates a shareable link/code to send to their co-parent
 */
export function InviteCoParentPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [inviteData, setInviteData] = React.useState(null);
  const [copied, setCopied] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedMessage, setCopiedMessage] = React.useState(false);
  const [inviteeEmail, setInviteeEmail] = React.useState('');

  /**
   * Generate a new invitation
   */
  const handleGenerateInvite = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiPost('/api/invitations/create', { inviteeEmail });

      if (response.ok) {
        const data = await response.json();
        setInviteData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate invitation');
      }
    } catch (err) {
      console.error('Generate invite error:', err);
      setError('Failed to generate invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Copy invite link to clipboard
   */
  const handleCopyLink = async () => {
    if (!inviteData?.inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteData.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  /**
   * Copy short code to clipboard
   */
  const handleCopyCode = async () => {
    if (!inviteData?.shortCode) return;

    try {
      await navigator.clipboard.writeText(inviteData.shortCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  /**
   * Copy full shareable message
   */
  const handleCopyMessage = async () => {
    if (!inviteData?.shareableMessage) return;

    try {
      await navigator.clipboard.writeText(inviteData.shareableMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  /**
   * Share via native share API (mobile)
   */
  const handleShare = async () => {
    if (!inviteData?.shareableMessage) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on LiaiZen',
          text: inviteData.shareableMessage,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback to copy
      handleCopyMessage();
    }
  };

  /**
   * Skip for now - go to main app
   */
  const handleSkip = () => {
    navigate('/');
  };

  /**
   * Continue after generating invite
   */
  const handleContinue = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F5F5] to-white flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src="/assets/Logo.svg"
            alt="LiaiZen Logo"
            className="h-8 sm:h-10 w-auto"
          />
          <img
            src="/assets/wordmark.svg"
            alt="LiaiZen"
            className="h-9 sm:h-11 w-auto"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8">
            {!inviteData ? (
              <>
                {/* Pre-generation state */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-[#E8F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#275559]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-[#275559] mb-2">
                    Invite Your Co-Parent
                  </h1>
                  <p className="text-gray-600">
                    Generate a personal invite link to share with your co-parent.
                    You can send it via text, email, or any messaging app.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Email Input (Optional) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Co-Parent's Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email to send invite directly"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#275559] focus:border-transparent outline-none transition-all"
                    value={inviteeEmail}
                    onChange={(e) => setInviteeEmail(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll send them an email with the invite link
                  </p>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateInvite}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#275559] text-white font-medium rounded-lg hover:bg-[#1e4245] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{inviteeEmail ? 'Send Invite' : 'Generate Link'}</span>
                    </>
                  )}
                </button>

                {/* Skip link */}
                <button
                  onClick={handleSkip}
                  className="w-full mt-4 py-2 text-[#275559] hover:text-[#4DA8B0] font-medium transition-colors"
                >
                  Skip for now
                </button>
              </>
            ) : (
              <>
                {/* Post-generation state */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#E8F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#46BD92]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-[#275559] mb-2">
                    Invite Ready!
                  </h1>
                  <p className="text-gray-600">
                    Share this with your co-parent
                  </p>
                </div>

                {/* Short Code */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invite Code
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#E8F5F5] border-2 border-[#4DA8B0] rounded-lg p-3 text-center">
                      <span className="text-2xl font-mono font-bold text-[#275559] tracking-wider">
                        {inviteData.shortCode}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="p-3 bg-[#275559] text-white rounded-lg hover:bg-[#1e4245] transition-colors"
                      title="Copy code"
                    >
                      {copiedCode ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    For existing LiaiZen users
                  </p>
                </div>

                {/* Invite Link */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invite Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteData.inviteUrl}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600 truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-3 bg-[#275559] text-white rounded-lg hover:bg-[#1e4245] transition-colors"
                      title="Copy link"
                    >
                      {copied ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    For new users - they'll create an account
                  </p>
                </div>

                {/* Share Buttons */}
                <div className="space-y-3">
                  {/* Native Share (Mobile) */}
                  {navigator.share && (
                    <button
                      onClick={handleShare}
                      className="w-full py-3 px-4 bg-[#46BD92] text-white font-medium rounded-lg hover:bg-[#3da87f] transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>Share Invite</span>
                    </button>
                  )}

                  {/* Copy Message - For messaging coparent */}
                  <button
                    onClick={handleCopyMessage}
                    className="w-full py-3 px-4 bg-[#275559] text-white font-medium rounded-lg hover:bg-[#1e4245] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {copiedMessage ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy Invite to Message</span>
                      </>
                    )}
                  </button>

                  {/* Continue */}
                  <button
                    onClick={handleContinue}
                    className="w-full py-3 px-4 border-2 border-[#275559] text-[#275559] font-medium rounded-lg hover:bg-[#E8F5F5] transition-all duration-200"
                  >
                    Continue to App
                  </button>
                </div>

                {/* Expiration notice */}
                <p className="text-xs text-center text-gray-500 mt-4">
                  This invite expires in 7 days
                </p>
              </>
            )}
          </div>

          {/* Help text */}
          <p className="text-center text-sm text-gray-500 mt-4">
            You can always invite your co-parent later from Settings
          </p>
        </div>
      </div>
    </div>
  );
}

export default InviteCoParentPage;
