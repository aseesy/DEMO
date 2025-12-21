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
        <Button variant="secondary" onClick={onNavigateToProfile}>
          Complete Profile
        </Button>
      }
    >
      <div className="prose prose-slate max-w-none">
        <p className="text-base text-gray-900 whitespace-pre-wrap leading-relaxed mb-4">
          {editingTask.description ||
            `Help LiaiZen understand the dynamics of your co-parenting situation.

The more context you provide—your details, your children, your schedule—the better LiaiZen can guide your communication and tailor support to your needs.



Update your profile to get the most accurate, personalized mediation.`}
        </p>
      </div>
    </Modal>
  );
}
