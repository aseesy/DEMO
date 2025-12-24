import React from 'react';
import { Modal } from '../../components/ui/Modal/Modal.jsx';

/**
 * IOSInstallGuide - Visual step-by-step guide for iOS PWA installation
 * Shows where to tap Share and Add to Home Screen
 */
export function IOSInstallGuide({ isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Install LiaiZen"
      subtitle="Add to your home screen for quick access"
      size="small"
    >
      <div className="space-y-6">
        {/* Step 1 */}
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-teal-medium text-white flex items-center justify-center font-bold text-lg shrink-0">
            1
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 mb-2">
              Tap the Share button
            </p>
            <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
              {/* Share icon */}
              <div className="flex flex-col items-center">
                <svg
                  className="w-12 h-12 text-blue-500"
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
                <span className="text-sm text-gray-600 mt-2">
                  At the bottom of Safari
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-teal-medium text-white flex items-center justify-center font-bold text-lg shrink-0">
            2
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 mb-2">
              Scroll down and tap "Add to Home Screen"
            </p>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <span className="font-medium text-gray-900">
                  Add to Home Screen
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-teal-medium text-white flex items-center justify-center font-bold text-lg shrink-0">
            3
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 mb-2">
              Tap "Add" in the top right
            </p>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <span className="text-blue-500 font-medium">Cancel</span>
                <span className="font-semibold text-gray-900">Add to Home Screen</span>
                <span className="text-blue-500 font-semibold">Add</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-green-600 shrink-0"
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
            <p className="text-green-800 text-sm">
              LiaiZen will appear on your home screen like a regular app!
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default IOSInstallGuide;
