/**
 * Profile Feature - User profile domain
 *
 * Package-by-feature: Everything related to Profile lives here.
 * Delete this folder to remove the Profile feature entirely.
 *
 * Usage:
 *   import { useProfile, ProfilePanel, ProfileWizard } from '@features/profile';
 */

// Model (The Logic)
export { useProfile } from './model/useProfile.js';

// Components (The UI Details)
export { ProfilePanel } from './components/ProfilePanel.jsx';
export { default as ProfileWizard } from './components/ProfileWizard.jsx';
export { default as PersonalInfoForm } from './components/PersonalInfoForm.jsx';
export { default as MotivationsForm } from './components/MotivationsForm.jsx';
export { default as BackgroundForm } from './components/BackgroundForm.jsx';
export { default as PrivacySettings } from './components/PrivacySettings.jsx';
export { PrivacySettingsWrapper } from './components/PrivacySettingsWrapper.jsx';
export { default as AccountView } from './components/AccountView.jsx';

// Form components
export {
  FormInput,
  FormTextarea,
  FormSelect,
  FormSection,
  FormInfoBox,
  FormGrid,
} from './components/FormField.jsx';
export { MultiSelectButtons } from './components/MultiSelectButtons.jsx';
export {
  PersonalInfoSection,
  MotivationsSection,
  BackgroundSection,
} from './components/ProfileSections.jsx';
