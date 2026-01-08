/**
 * Invitations Feature
 *
 * Package-by-feature: Everything related to Invitations lives here.
 * Delete this folder to remove the Invitations feature entirely.
 *
 * Usage:
 *   import { useInvitations, AcceptInvitationPage, InviteCoParentPage } from '@features/invitations';
 */

// Pages (The View)
export { AcceptInvitationPage } from './AcceptInvitationPage.jsx';
export { InviteCoParentPage } from './InviteCoParentPage.jsx';

// Model (The Logic)
export { useAcceptInvitation } from './model/useAcceptInvitation.js';
export { useInviteCoParent } from './model/useInviteCoParent.js';
export { useInvitations } from './model/useInvitations.js';
export { useInviteDetection } from './model/useInviteDetection.js';
export { useInviteManagement } from './model/useInviteManagement.js';
export { usePairing } from './model/usePairing.js';

// Components (The UI Details)
export { InviteTaskModal } from './components/InviteTaskModal.jsx';
export { InviteCodeForm } from './components/InviteCodeForm.jsx';
export { InvitationManager } from './components/InvitationManager.jsx';

// Shared hooks
export { useInviteCode } from './model/useInviteCode.js';

// Constants
export { INVITE_COPY_MESSAGE_TEMPLATE } from './constants.js';
