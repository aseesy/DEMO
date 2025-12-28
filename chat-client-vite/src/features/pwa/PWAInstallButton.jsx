import React from 'react';
import { Button } from '../../components/ui';

/**
 * PWAInstallButton - Shows install button for PWA when available
 *
 * Features:
 * - Detects if app is installable
 * - Shows install button when prompt is available
 * - Hides when app is already installed
 * - Handles install flow
 */
export function PWAInstallButton() {
  const pwa = window.liaizenPWA || {};
  const { isInstallable, isInstalled, showInstallPrompt } = pwa;

  const [isInstalling, setIsInstalling] = React.useState(false);

  const handleInstall = async () => {
    if (!showInstallPrompt) {
      return;
    }

    setIsInstalling(true);
    try {
      await showInstallPrompt();
    } catch {
      // Silently ignore install errors
    } finally {
      setIsInstalling(false);
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="min-w-0">
            <h3 className="font-semibold text-green-900 text-sm sm:text-base">App Installed</h3>
            <p className="text-xs sm:text-sm text-green-700">LiaiZen is installed on your device</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't show if not installable
  if (!isInstallable) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="min-w-0">
            <h3 className="font-semibold text-teal-medium text-sm sm:text-base">Install App</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {isInstalled
                ? 'Already installed on this device'
                : 'Install prompt not available. Try using Chrome or Edge browser.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show install button
  return (
    <div className="bg-teal-lightest border-2 border-teal-medium rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="bg-teal-medium rounded-full p-2 mt-0.5 shrink-0">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-teal-medium text-base sm:text-lg mb-1">
              Install LiaiZen App
            </h3>
            <p className="text-teal-medium text-xs sm:text-sm mb-2 sm:mb-3">
              Install LiaiZen on your device for:
            </p>
            <ul className="text-xs sm:text-sm text-teal-medium space-y-1 mb-3 sm:mb-4">
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-teal-medium shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Notifications even when browser is closed</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-teal-medium shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Faster access from your home screen</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-teal-medium shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Works offline when you need it</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-teal-medium shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>App-like experience on mobile and desktop</span>
              </li>
            </ul>
          </div>
        </div>
        <Button
          onClick={handleInstall}
          disabled={isInstalling}
          loading={isInstalling}
          variant="secondary"
          size="medium"
          className="w-full sm:w-auto whitespace-nowrap shrink-0"
        >
          Install Now
        </Button>
      </div>
    </div>
  );
}
