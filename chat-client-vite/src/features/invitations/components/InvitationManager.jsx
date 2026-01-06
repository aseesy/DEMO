/**
 * InvitationManager - Manage sent invitations
 *
 * Displays list of sent invitations with status and actions (resend, cancel).
 * Uses useInvitations hook for data fetching and mutations.
 */

import React from 'react';
import { useInvitations } from '../model/useInvitations.js';
import { Button } from '../../../components/ui';
import { formatRelativeTime } from '../../../utils/dateHelpers.js';

/**
 * InvitationManager component
 */
export function InvitationManager() {
  const {
    invitations,
    isLoading,
    error,
    resendInvitation,
    cancelInvitation,
    fetchInvitations,
    clearError,
  } = useInvitations();

  const [processingId, setProcessingId] = React.useState(null);

  // Fetch invitations on mount
  React.useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleResend = async invitationId => {
    setProcessingId(invitationId);
    clearError();
    try {
      await resendInvitation(invitationId);
      // fetchInvitations will be called automatically by the hook
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async invitationId => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }
    setProcessingId(invitationId);
    clearError();
    try {
      await cancelInvitation(invitationId);
      // fetchInvitations will be called automatically by the hook
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = status => {
    const statusConfig = {
      pending: {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Pending',
      },
      accepted: {
        className: 'bg-green-100 text-green-800 border-green-200',
        label: 'Accepted',
      },
      declined: {
        className: 'bg-red-100 text-red-800 border-red-200',
        label: 'Declined',
      },
      expired: {
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        label: 'Expired',
      },
      cancelled: {
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        label: 'Cancelled',
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-teal-light shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-teal-dark">Your Invitations</h3>
          <Button
            variant="secondary"
            size="small"
            onClick={() => fetchInvitations()}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
            <button
              type="button"
              onClick={clearError}
              className="ml-2 text-red-600 hover:text-red-800 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {isLoading && invitations.length === 0 ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-teal-medium" />
            <p className="mt-2 text-gray-500 text-sm">Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No invitations sent</p>
            <p className="text-gray-400 text-sm mt-1">You haven't sent any invitations yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map(invitation => {
              const isProcessing = processingId === invitation.id;
              const canResend = invitation.status === 'pending' || invitation.status === 'expired';
              const canCancel = invitation.status === 'pending';

              return (
                <div
                  key={invitation.id}
                  className="border-2 border-gray-200 rounded-xl p-4 hover:border-teal-light transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {invitation.inviteeEmail || invitation.invitee_email || 'Unknown email'}
                        </p>
                        {getStatusBadge(invitation.status)}
                      </div>
                      <p className="text-xs text-gray-500">
                        Sent {formatRelativeTime(invitation.createdAt || invitation.created_at)}
                      </p>
                      {invitation.expiresAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Expires{' '}
                          {formatRelativeTime(invitation.expiresAt || invitation.expires_at)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {canResend && (
                        <Button
                          variant="tertiary"
                          size="small"
                          onClick={() => handleResend(invitation.id)}
                          disabled={isProcessing}
                          loading={isProcessing}
                        >
                          Resend
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          variant="tertiary"
                          size="small"
                          onClick={() => handleCancel(invitation.id)}
                          disabled={isProcessing}
                          loading={isProcessing}
                          className="text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default InvitationManager;
