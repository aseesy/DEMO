/**
 * PWA Feature - Progressive Web App functionality
 *
 * Exports:
 * - Components: PWAInstallButton, IOSInstallGuide, PWAUpdateBanner
 * - Hooks: usePWA
 * - Utils: notificationNavigation functions
 *
 * @module features/pwa
 */

// Components
export { PWAInstallButton } from './PWAInstallButton.jsx';
export { IOSInstallGuide } from './IOSInstallGuide.jsx';
export { PWAUpdateBanner } from './components/PWAUpdateBanner.jsx';

// Hooks (from model layer)
export { usePWA } from './model/usePWA.js';

// Utils (notification navigation for push notifications)
export {
  extractViewFromUrl,
  buildViewUrl,
  navigateToView,
  handleServiceWorkerNavigation,
} from './utils/notificationNavigation.js';
