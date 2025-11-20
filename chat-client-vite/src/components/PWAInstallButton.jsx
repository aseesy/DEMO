import React from 'react';

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
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-gray-700">Install App</h3>
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
    <div className="bg-[#E6F7F5] border-2 border-[#4DA8B0] rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="bg-[#4DA8B0] rounded-full p-2 mt-0.5">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#275559] text-lg mb-1">Install LiaiZen App</h3>
            <p className="text-[#275559] text-sm mb-3">
              Install LiaiZen on your device for:
            </p>
            <ul className="text-sm text-[#275559] space-y-1 mb-4">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Notifications even when browser is closed</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Faster access from your home screen</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Works offline when you need it</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>App-like experience on mobile and desktop</span>
              </li>
            </ul>
          </div>
        </div>
        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className="bg-[#275559] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1e4145] transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isInstalling ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Installing...
            </span>
          ) : (
            'Install Now'
          )}
        </button>
      </div>
    </div>
  );
}
