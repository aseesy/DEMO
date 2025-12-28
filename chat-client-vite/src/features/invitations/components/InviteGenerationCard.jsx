/**
 * InviteGenerationCard - Invite link generation UI
 *
 * Presentational component for generating and sharing invite links.
 * All state management is handled by parent via props.
 */

import React from 'react';
import { SettingsCard, SettingsIcons } from '../../../components/ui/SettingsCard.jsx';

/**
 * InviteGenerationCard component
 * @param {Object} props
 * @param {Object} props.inviteState - Invite state from useInviteManagement
 * @param {string} props.inviteState.inviteLink - Generated invite link
 * @param {string} props.inviteState.inviteCode - Generated invite code
 * @param {string} props.inviteState.inviteError - Error message
 * @param {boolean} props.inviteState.isLoadingInvite - Loading state
 * @param {boolean} props.inviteState.inviteCopied - Copied state
 * @param {Function} props.onGenerateInvite - Callback to generate invite
 * @param {Function} props.onCopyLink - Callback to copy link
 * @param {Function} props.onCopyCode - Callback to copy code
 * @param {Function} props.onClose - Callback to close invite display
 */
export function InviteGenerationCard({
  inviteState,
  onGenerateInvite,
  onCopyLink,
  onCopyCode,
  onClose,
}) {
  const { inviteLink, inviteCode, inviteError, isLoadingInvite, inviteCopied } = inviteState;

  return (
    <SettingsCard
      icon={SettingsIcons.mail}
      title="Invite Someone to Chat"
      description="Generate a link or code to share so they can join your private chat room."
      variant="success"
    >
      {inviteLink ? (
        <InviteDisplay
          inviteLink={inviteLink}
          inviteCode={inviteCode}
          inviteCopied={inviteCopied}
          onCopyLink={onCopyLink}
          onCopyCode={onCopyCode}
          onClose={onClose}
        />
      ) : (
        <GenerateButton isLoading={isLoadingInvite} onClick={onGenerateInvite} />
      )}
      {inviteError && <ErrorMessage message={inviteError} />}
    </SettingsCard>
  );
}

/**
 * Display generated invite link and code
 */
function InviteDisplay({ inviteLink, inviteCode, inviteCopied, onCopyLink, onCopyCode, onClose }) {
  return (
    <div className="space-y-3">
      {inviteCode && (
        <div>
          <label className="block text-xs font-medium text-emerald-800 mb-1">Invite Code</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 bg-white border-2 border-emerald-200 rounded-lg p-2 sm:p-3 text-center">
              <span className="text-lg sm:text-xl font-mono font-bold text-emerald-800 tracking-wider break-all">
                {inviteCode}
              </span>
            </div>
            <button
              type="button"
              onClick={onCopyCode}
              className="p-2 sm:p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {inviteCopied ? '✓' : 'Copy'}
            </button>
          </div>
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-emerald-800 mb-1">Invite Link</label>
        <div className="p-2 sm:p-3 bg-white rounded-lg border-2 border-emerald-200 break-all text-emerald-800 font-mono text-[10px] sm:text-xs overflow-hidden">
          {inviteLink}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={onCopyLink}
          className="flex-1 px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all min-h-[44px]"
        >
          {inviteCopied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-3 rounded-lg border-2 border-emerald-300 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors min-h-[44px]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/**
 * Generate invite button
 */
function GenerateButton({ isLoading, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="w-full px-5 py-3 rounded-lg bg-emerald-600 text-white text-base font-semibold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[44px] shadow-sm hover:shadow-md"
    >
      {isLoading ? (
        <>
          <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          {SettingsIcons.plus}
          <span>Generate Invite Link</span>
        </>
      )}
    </button>
  );
}

/**
 * Error message display
 */
function ErrorMessage({ message }) {
  return <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{message}</div>;
}

export default InviteGenerationCard;
