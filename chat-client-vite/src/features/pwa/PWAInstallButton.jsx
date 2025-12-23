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
      console.warn('[PWAInstallButton] Install prompt not available');
      return;
    }

    setIsInstalling(true);
    try {
      const result = await showInstallPrompt();
      if (result) {
        console.log('[PWAInstallButton] App installed successfully');
      } else {
        console.log('[PWAInstallButton] Install cancelled by user');
      }
    } catch (error) {
      console.error('[PWAInstallButton] Install error:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-green-600"
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
          <div>
            <h3 className="font-semibold text-green-900">App Installed</h3>
            <p className="text-sm text-green-700">LiaiZen is installed on your device</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't show if not installable
  if (!isInstallable) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-gray-400"
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
          <div>
            <h3 className="font-semibold text-teal-medium">Install App</h3>
            <p className="text-sm text-gray-600">
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
    <div className="bg-teal-lightest border-2 border-teal-medium rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="bg-teal-medium rounded-full p-2 mt-0.5">
            <svg
              className="w-6 h-6 text-white"
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
          <div className="flex-1">
            <h3 className="font-bold text-teal-medium text-lg mb-1">Install LiaiZen App</h3>
            <p className="text-teal-medium text-sm mb-3">Install LiaiZen on your device for:</p>
            <ul className="text-sm text-teal-medium space-y-1 mb-4">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Notifications even when browser is closed</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Faster access from your home screen</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Works offline when you need it</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
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
          className="whitespace-nowrap"
        >
          Install Now
        </Button>
      </div>
    </div>
  );
}
