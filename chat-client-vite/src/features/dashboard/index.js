/**
 * Dashboard Feature
 *
 * Package-by-feature: Everything related to the Dashboard lives here.
 * Delete this folder to remove the Dashboard feature entirely.
 *
 * Usage:
 *   import { DashboardView, useDashboard, ActivityCard } from '@features/dashboard';
 */

// Page (The View)
export { DashboardView, DashboardViewLegacy } from './DashboardView.jsx';

// Model (The Logic)
export { useDashboard } from './useDashboard.js';

// Components (The UI Details)
export { ActivityCard } from './components/ActivityCard.jsx';
export { ConnectCoparentBanner } from './components/ConnectCoparentBanner.jsx';
export { CommunicationStatsWidget } from './components/CommunicationStatsWidget.jsx';
export { WelcomeModal } from './components/WelcomeModal.jsx';
export { ObserverCard } from './components/ObserverCard.jsx';
