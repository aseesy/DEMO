import React from 'react';
import { Modal } from '../../../components/ui/Modal/Modal';
import { useInviteCode } from '../model/useInviteCode.js';
import { InviteCodeForm } from './InviteCodeForm.jsx';

/**
 * InviteTaskModal - Modal for inviting/accepting co-parent codes
 *
 * Uses shared useInviteCode hook and InviteCodeForm component.
 * Handles modal-specific behavior (closing, callbacks).
 */
export function InviteTaskModal({ isOpen, onClose, onSuccess }) {
  const inviteCode = useInviteCode({ resetOnClose: true, isOpen });

  const handleCodeAccepted = React.useCallback(
    result => {
      onSuccess?.(result);
      onClose();
    },
    [onSuccess, onClose]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Co-Parent" size="small">
      <div className="space-y-6">
        <InviteCodeForm
          inviteState={inviteCode}
          inviteHandlers={inviteCode}
          onCodeAccepted={handleCodeAccepted}
          renderSuccessButton={() =>
            inviteCode.generatedCode ? (
              <button
                onClick={onClose}
                className="w-full py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
              >
                Done
              </button>
            ) : null
          }
        />
      </div>
    </Modal>
  );
}

export default InviteTaskModal;
