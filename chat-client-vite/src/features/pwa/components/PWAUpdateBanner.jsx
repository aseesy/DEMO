import React from 'react';
import { Button } from '../../../components/ui/Button/Button.jsx';

/**
 * PWA Update Banner Component
 *
 * Displays a banner notification when a new version of the PWA is available.
 * Allows users to update the app with a single click without reinstalling.
 *
 * @param {Object} props - Component props
 * @param {Function} props.onUpdate - Callback when user clicks "Update Now"
 * @param {Function} props.onDismiss - Callback when user dismisses the banner
 * @returns {JSX.Element} Update banner component
 */
export function PWAUpdateBanner({ onUpdate, onDismiss }) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-teal-dark text-white px-4 py-3 shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <div>
            <p className="font-semibold text-sm sm:text-base">New version available</p>
            <p className="text-xs sm:text-sm text-teal-light opacity-90">
              Update now to get the latest features and improvements
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={onUpdate}
            className="bg-white text-teal-dark hover:bg-teal-lightest whitespace-nowrap"
          >
            Update Now
          </Button>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss update notification"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
