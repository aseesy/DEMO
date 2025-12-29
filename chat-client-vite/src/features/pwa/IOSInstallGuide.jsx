import React from 'react';
import { Modal } from '../../components/ui/Modal/Modal.jsx';
import { Button } from '../../components/ui';

/**
 * IOSInstallGuide - Visual step-by-step guide for iOS/Safari PWA installation
 * Shows where to tap Share and Add to Home Screen
 */
export function IOSInstallGuide({ isOpen, onClose, onOpenSettings }) {
  // Detect iOS vs other browsers
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Install LiaiZen" size="small">
      <div className="space-y-4">
        {/* Header description */}
        <p className="text-sm text-gray-600 -mt-2">
          Add to your home screen for quick access and notifications
        </p>

        {/* Platform-specific instructions */}
        {isIOS || isSafari ? (
          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-teal-medium text-white flex items-center justify-center font-semibold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1.5">
                  Tap the <span className="text-blue-500">Share</span> button
                </p>
                <div className="bg-gray-50 rounded-md p-2 flex items-center justify-center border border-gray-200">
                  <svg
                    className="w-7 h-7 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25"
                    />
                  </svg>
                  <span className="text-xs text-gray-500 ml-2">(bottom of Safari)</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-teal-medium text-white flex items-center justify-center font-semibold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1.5">Tap "Add to Home Screen"</p>
                <div className="bg-gray-50 rounded-md p-2 border border-gray-200">
                  <div className="flex items-center gap-2 bg-white rounded px-2 py-1.5 border border-gray-200">
                    <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Add to Home Screen</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-teal-medium text-white flex items-center justify-center font-semibold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1.5">
                  Tap <span className="text-blue-500 font-semibold">Add</span>
                </p>
                <div className="bg-gray-50 rounded-md p-2 border border-gray-200">
                  <div className="flex items-center justify-between bg-white rounded px-2 py-1.5 border border-gray-200">
                    <span className="text-xs text-blue-500">Cancel</span>
                    <span className="text-xs font-medium text-gray-700">Add to Home</span>
                    <span className="text-xs text-blue-500 font-semibold">Add</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Android/Desktop Chrome instructions */
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-teal-medium text-white flex items-center justify-center font-semibold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1.5">
                  Look for the install option
                </p>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-200 space-y-2">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Android:</span> Menu (⋮) → "Install app"
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Desktop:</span> Click ⊕ in address bar
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success message */}
        <div className="bg-green-50 border border-green-100 rounded-md p-2.5 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-green-600 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-green-700 text-xs">LiaiZen will appear on your home screen!</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {onOpenSettings && (
            <Button
              variant="secondary"
              size="small"
              onClick={e => {
                e.stopPropagation();
                onOpenSettings();
              }}
              className="flex-1"
            >
              Settings
            </Button>
          )}
          <Button
            variant="primary"
            size="small"
            onClick={e => {
              e.stopPropagation();
              onClose();
            }}
            className="flex-1"
          >
            Complete
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default IOSInstallGuide;
