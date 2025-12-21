import React from 'react';
import { TaskFormModal } from './modals/TaskFormModal.jsx';
import { WelcomeModal } from './modals/WelcomeModal.jsx';
import { ProfileTaskModal } from './modals/ProfileTaskModal.jsx';
import { ContactSuggestionModal } from './modals/ContactSuggestionModal.jsx';
import { InviteTaskModal } from './InviteTaskModal.jsx';

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
