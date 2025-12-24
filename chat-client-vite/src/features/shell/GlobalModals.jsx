import React from 'react';
import { TaskFormModal } from '../tasks';
import { WelcomeModal } from '../dashboard/components/WelcomeModal.jsx';
import { ProfileTaskModal } from '../tasks/components/ProfileTaskModal.jsx';
import { ContactSuggestionModal } from '../contacts';
import { InviteTaskModal } from '../invitations';

/**
 * GlobalModals - Consolidates all application-level modals
 *
 * Renders modals based on state from useModalController hook.
 * Keeps modal JSX out of the main ChatRoom component.
 */
export function GlobalModals({
  // Task Form Modal
  showTaskForm,
  editingTask,
  taskFormMode,
  setTaskFormMode,
  aiTaskDetails,
  setAiTaskDetails,
  isGeneratingTask,
  setIsGeneratingTask,
  taskFormData,
  setTaskFormData,
  contacts,
  username,
  onCloseTaskForm,
  onSaveTask,
  onDeleteTask,

  // Welcome Modal
  showWelcomeModal,
  onCloseWelcome,
  onCompleteWelcome,

  // Profile Task Modal
  showProfileTaskModal,
  onCloseProfileTask,
  onNavigateToProfile,

  // Invite Task Modal
  showInviteModal,
  onCloseInvite,
  onInviteSuccess,

  // Contact Suggestion Modal
  pendingContactSuggestion,
  onAddContact,
  onDismissContactSuggestion,
  setDismissedSuggestions,
}) {
  return (
    <>
      <TaskFormModal
        showTaskForm={showTaskForm}
        editingTask={editingTask}
        taskFormMode={taskFormMode}
        setTaskFormMode={setTaskFormMode}
        aiTaskDetails={aiTaskDetails}
        setAiTaskDetails={setAiTaskDetails}
        isGeneratingTask={isGeneratingTask}
        setIsGeneratingTask={setIsGeneratingTask}
        taskFormData={taskFormData}
        setTaskFormData={setTaskFormData}
        contacts={contacts}
        username={username}
        onClose={onCloseTaskForm}
        onSave={onSaveTask}
        onDelete={onDeleteTask}
      />

      {showWelcomeModal && (
        <WelcomeModal
          editingTask={editingTask}
          onClose={onCloseWelcome}
          onComplete={onCompleteWelcome}
        />
      )}

      {showProfileTaskModal && (
        <ProfileTaskModal
          editingTask={editingTask}
          onClose={onCloseProfileTask}
          onNavigateToProfile={onNavigateToProfile}
          isOpen={showProfileTaskModal}
        />
      )}

      <InviteTaskModal
        isOpen={showInviteModal}
        onClose={onCloseInvite}
        onSuccess={onInviteSuccess}
      />

      <ContactSuggestionModal
        pendingContactSuggestion={pendingContactSuggestion}
        onAddContact={onAddContact}
        onDismiss={onDismissContactSuggestion}
        setDismissedSuggestions={setDismissedSuggestions}
      />
    </>
  );
}

export default GlobalModals;
