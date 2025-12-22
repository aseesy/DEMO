/**
 * InviteGeneratedView - Display after invite is generated
 */

import React from 'react';
import { CheckIcon, CopyIcon, ShareIcon } from './InviteIcons.jsx';

/**
 * @param {Object} props
 * @param {Object} props.inviteData - Generated invite data
 * @param {boolean} props.copied - Whether link was copied
 * @param {boolean} props.copiedCode - Whether code was copied
 * @param {boolean} props.copiedMessage - Whether message was copied
 * @param {Function} props.onCopyLink - Copy link handler
 * @param {Function} props.onCopyCode - Copy code handler
 * @param {Function} props.onCopyMessage - Copy message handler
 * @param {Function} props.onShare - Native share handler
 * @param {Function} props.onGenerateNew - Generate new invite handler
 * @param {Function} props.onContinue - Continue to app handler
 * @param {string} props.expirationText - Expiration text to display
 */
export function InviteGeneratedView({
  inviteData,
  copied,
  copiedCode,
  copiedMessage,
  onCopyLink,
  onCopyCode,
  onCopyMessage,
  onShare,
  onGenerateNew,
  onContinue,
  expirationText,
}) {
  const canShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <>
      {/* Success Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#E8F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckIcon className="w-8 h-8 text-[#46BD92]" />
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
      <PairingCodeDisplay
        code={inviteData.pairingCode}
        inviteType={inviteData.inviteType}
        copied={copiedCode}
        onCopy={onCopyCode}
      />

      {/* Invite Link (only for email/link types) */}
      {inviteData.inviteUrl && (
        <InviteLinkDisplay url={inviteData.inviteUrl} copied={copied} onCopy={onCopyLink} />
      )}

      {/* Share Buttons */}
      <div className="space-y-3">
        {canShare && (
          <button
            onClick={onShare}
            className="w-full py-3 px-4 bg-[#46BD92] text-white font-medium rounded-lg hover:bg-[#3da87f] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ShareIcon className="w-5 h-5" />
            <span>Share Invite</span>
          </button>
        )}

        <button
          onClick={onCopyMessage}
          className="w-full py-3 px-4 bg-[#275559] text-white font-medium rounded-lg hover:bg-[#1e4245] transition-all duration-200 flex items-center justify-center gap-2"
        >
          {copiedMessage ? (
            <>
              <CheckIcon className="w-5 h-5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon className="w-5 h-5" />
              <span>Copy Invite to Message</span>
            </>
          )}
        </button>

        <button
          onClick={onGenerateNew}
          className="w-full py-3 px-4 border-2 border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
        >
          Generate New Invite
        </button>

        <button
          onClick={onContinue}
          className="w-full py-3 px-4 border-2 border-[#275559] text-[#275559] font-medium rounded-lg hover:bg-[#E8F5F5] transition-all duration-200"
        >
          Continue to App
        </button>
      </div>

      {/* Expiration notice */}
      <p className="text-xs text-center text-gray-500 mt-4">{expirationText}</p>
    </>
  );
}

/**
 * Pairing code display with copy button
 */
function PairingCodeDisplay({ code, inviteType, copied, onCopy }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Pairing Code</label>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-[#E8F5F5] border-2 border-[#4DA8B0] rounded-lg p-3 text-center">
          <span className="text-2xl font-mono font-bold text-[#275559] tracking-wider">{code}</span>
        </div>
        <button
          onClick={onCopy}
          className="p-3 bg-[#275559] text-white rounded-lg hover:bg-[#1e4245] transition-colors"
          title="Copy code"
        >
          {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {inviteType === 'code'
          ? 'For existing LiaiZen users (expires in 15 min)'
          : 'For existing LiaiZen users'}
      </p>
    </div>
  );
}

/**
 * Invite link display with copy button
 */
function InviteLinkDisplay({ url, copied, onCopy }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">Invite Link</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={url}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600 truncate"
        />
        <button
          onClick={onCopy}
          className="p-3 bg-[#275559] text-white rounded-lg hover:bg-[#1e4245] transition-colors"
          title="Copy link"
        >
          {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">For new users - they'll create an account</p>
    </div>
  );
}

export default InviteGeneratedView;
