import React from 'react';
import { Modal, Button } from '../ui';

export function FlaggingModal({ flaggingMessage, flagReason, setFlagReason, onFlag, onClose }) {
  if (!flaggingMessage) return null;

  return (
    <Modal
      isOpen={!!flaggingMessage}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <span>Flag Message</span>
        </div>
      }
      size="small"
      footer={
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="danger"
            onClick={() => onFlag(flagReason.trim() || null)}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            Flag Message
          </Button>
          <Button variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <p className="text-sm text-teal-medium mb-4">
        Help us understand why this message is problematic. This feedback will help the AI mediator
        learn and adapt.
      </p>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
        <p className="text-xs font-semibold text-gray-600 mb-1">Message:</p>
        <p className="text-sm text-gray-800">"{flaggingMessage.text}"</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-teal-medium mb-2">
          Why is this problematic? (Optional)
        </label>
        <textarea
          value={flagReason}
          onChange={e => setFlagReason(e.target.value)}
          placeholder="e.g., Contains personal attacks, inappropriate language, or violates boundaries..."
          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-medium text-sm min-h-[100px] resize-none"
          rows={4}
        />
        <p className="mt-1 text-xs text-gray-500">
          Your feedback helps the AI mediator learn what types of messages need intervention.
        </p>
      </div>
    </Modal>
  );
}
