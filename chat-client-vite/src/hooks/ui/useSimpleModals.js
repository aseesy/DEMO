import React from 'react';

/**
 * useSimpleModals - Manages simple boolean modals
 * 
 * Wraps simple boolean state in objects to maintain consistency with complex modals.
 * This hides the wiring (useState) and treats all modals as concepts, not details.
 * 
 * @returns {Object} Simple modal state objects, each with show/setShow
 */
export function useSimpleModals() {
  const [showWelcomeModal, setShowWelcomeModal] = React.useState(false);
  const [showProfileTaskModal, setShowProfileTaskModal] = React.useState(false);
  const [showInviteModal, setShowInviteModal] = React.useState(false);

  // Return as objects to match the pattern of complex modals
  // This hides the wiring and treats all modals consistently
  return {
    welcomeModal: {
      show: showWelcomeModal,
      setShow: setShowWelcomeModal,
    },
    profileTaskModal: {
      show: showProfileTaskModal,
      setShow: setShowProfileTaskModal,
    },
    inviteModal: {
      show: showInviteModal,
      setShow: setShowInviteModal,
    },
  };
}

