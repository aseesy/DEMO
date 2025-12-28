import React from 'react';
import { Modal, Button } from '../../../components/ui';

export function WelcomeModal({ editingTask, onClose, onComplete }) {
  if (!editingTask) return null;

  return (
    <Modal
      isOpen={!!editingTask}
      onClose={onClose}
      title={editingTask.title}
      size="large"
      footer={
        <Button variant="secondary" onClick={onComplete}>
          OK
        </Button>
      }
    >
      <div className="prose prose-slate max-w-none">
        <p className="text-base text-gray-900 whitespace-pre-wrap leading-relaxed mb-4">
          {editingTask.description ||
            "To get the best experience from this app, you can download the app to your phone. If you run into any issues, please submit them by going to settings."}
        </p>
      </div>
    </Modal>
  );
}
