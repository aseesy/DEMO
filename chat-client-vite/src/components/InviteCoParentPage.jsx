import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePairing } from '../hooks/usePairing.js';
import { API_BASE_URL } from '../config.js';

/**
 * InviteCoParentPage - Post-signup screen for inviting co-parent
 * Feature: 004-account-pairing-refactor
 *
 * Shows after user creates account (email/password or Google OAuth)
 * User can:
 * 1. Send invitation via email (7-day expiration)
 * 2. Generate a shareable link (7-day expiration)
 * 3. Generate a quick code for existing users (15-minute expiration)
 */
export function InviteCoParentPage() {
  const navigate = useNavigate();
  const {
    createPairing,
    buildInviteUrl,
    buildShareableMessage,
    isCreating,
    error: pairingError,
    clearError,
  } = usePairing();

  // Form state
  const [inviteeEmail, setInviteeEmail] = React.useState('');
  const [inviteMethod, setInviteMethod] = React.useState('link'); // 'email', 'link', or 'code'
  const [error, setError] = React.useState('');

  // Result state
  const [inviteData, setInviteData] = React.useState(null);

  // Copy states
  const [copied, setCopied] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedMessage, setCopiedMessage] = React.useState(false);

  // Get username from localStorage
  const username = localStorage.getItem('username') || 'Your co-parent';

  /**
   * Generate a new invitation based on selected method
   */
  const handleGenerateInvite = async () => {
    setError('');
    clearError();

    // Validate email if email method selected
    if (inviteMethod === 'email') {
      if (!inviteeEmail.trim()) {
        setError('Please enter your co-parent\'s email address');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inviteeEmail.trim())) {
        setError('Please enter a valid email address');
        return;
      }
    }

    const result = await createPairing(inviteMethod, inviteeEmail.trim() || null);

    if (!result.success) {
      setError(result.error || 'Failed to create invitation');
      return;
    }

    // Check if mutual invitation was detected (instant pairing!)
    if (result.mutual) {
      // Redirect to main app - they're now paired
      navigate('/', {
        state: {
          message: 'You are now connected with your co-parent!',
          roomId: result.sharedRoomId
        }
      });
      return;
    }

    // Build the invite URL
    const inviteUrl = result.token ? buildInviteUrl(result.token) : null;
    const shareableMessage = buildShareableMessage(username, result.pairingCode, inviteUrl);

    setInviteData({
      pairingCode: result.pairingCode,
      token: result.token,
      inviteUrl,
      shareableMessage,
      expiresAt: result.expiresAt,
      inviteType: result.inviteType,
    });
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
    if (!inviteData?.pairingCode) return;

    try {
      await navigator.clipboard.writeText(inviteData.pairingCode);
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

  /**
   * Generate a new invite (reset state)
   */
  const handleGenerateNew = () => {
    setInviteData(null);
    setError('');
    clearError();
  };

  // Calculate expiration display
  const getExpirationText = () => {
    if (!inviteData?.inviteType) return 'This invite expires in 7 days';

    switch (inviteData.inviteType) {
      case 'code':
        return 'This code expires in 15 minutes';
      case 'email':
      case 'link':
      default:
        return 'This invite expires in 7 days';
    }
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
                    Connect with your co-parent to start communicating on LiaiZen.
                  </p>
                </div>

                {(error || pairingError) && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error || pairingError}
                  </div>
                )}

                {/* Invitation Method Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    How would you like to invite them?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setInviteMethod('email')}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        inviteMethod === 'email'
                          ? 'border-[#275559] bg-[#E8F5F5] text-[#275559]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-medium">Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteMethod('link')}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        inviteMethod === 'link'
                          ? 'border-[#275559] bg-[#E8F5F5] text-[#275559]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="text-xs font-medium">Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteMethod('code')}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        inviteMethod === 'code'
                          ? 'border-[#275559] bg-[#E8F5F5] text-[#275559]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <span className="text-xs font-medium">Code</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {inviteMethod === 'email' && 'Send invitation directly to their email (7 days)'}
                    {inviteMethod === 'link' && 'Share a link via text or any app (7 days)'}
                    {inviteMethod === 'code' && 'Quick code for existing users (15 minutes)'}
                  </p>
                </div>

                {/* Email Input (for email method) */}
                {inviteMethod === 'email' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Co-Parent's Email
                    </label>
                    <input
                      type="email"
                      placeholder="Enter their email address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#275559] focus:border-transparent outline-none transition-all"
                      value={inviteeEmail}
                      onChange={(e) => setInviteeEmail(e.target.value)}
                    />
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerateInvite}
                  disabled={isCreating}
                  className="w-full py-3 px-4 bg-[#275559] text-white font-medium rounded-lg hover:bg-[#1e4245] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      {inviteMethod === 'email' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      ) : inviteMethod === 'code' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      )}
                      <span>
                        {inviteMethod === 'email' ? 'Send Invite' : inviteMethod === 'code' ? 'Generate Code' : 'Generate Link'}
                      </span>
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
                    {inviteData.inviteType === 'email' ? 'Invite Sent!' : 'Invite Ready!'}
                  </h1>
                  <p className="text-gray-600">
                    {inviteData.inviteType === 'email'
                      ? 'An email has been sent to your co-parent'
                      : 'Share this with your co-parent'}
                  </p>
                </div>

                {/* Pairing Code */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pairing Code
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#E8F5F5] border-2 border-[#4DA8B0] rounded-lg p-3 text-center">
                      <span className="text-2xl font-mono font-bold text-[#275559] tracking-wider">
                        {inviteData.pairingCode}
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
                    {inviteData.inviteType === 'code'
                      ? 'For existing LiaiZen users (expires in 15 min)'
                      : 'For existing LiaiZen users'}
                  </p>
                </div>

                {/* Invite Link (only for email/link types) */}
                {inviteData.inviteUrl && (
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
                )}

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

                  {/* Copy Message - For messaging co-parent */}
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

                  {/* Generate New */}
                  <button
                    onClick={handleGenerateNew}
                    className="w-full py-3 px-4 border-2 border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Generate New Invite
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
                  {getExpirationText()}
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
