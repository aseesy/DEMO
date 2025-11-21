import React from 'react';
import { Modal, Button } from '../ui';

export function ProfileTaskModal({ editingTask, onClose, onNavigateToProfile }) {
  if (!editingTask) return null;

  return (
    <Modal
      isOpen={!!editingTask}
      onClose={onClose}
      title={editingTask.title}
      size="large"
      footer={
        <Button
          variant="secondary"
          onClick={onNavigateToProfile}
        >
          Complete Profile
        </Button>
      }
    >
      <div className="prose prose-slate max-w-none">
        <p className="text-base text-teal-medium whitespace-pre-wrap leading-relaxed">
          {editingTask.description || 'Complete your profile to help us personalize your LiaiZen experience.'}
        </p>
      </div>
    </Modal>
  );
}
