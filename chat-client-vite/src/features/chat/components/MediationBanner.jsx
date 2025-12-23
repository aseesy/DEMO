import React from 'react';
import { useMediator } from '../../../context/MediatorContext.jsx';

export default function MediationBanner() {
  const { needsMediation, setNeedsMediation } = useMediator();

  if (!needsMediation) return null;

  return (
    <div className="fixed top-0 inset-x-0 bg-yellow-50 border-b border-yellow-200 p-4 z-50 shadow-md animate-slide-down">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-yellow-800">Mediation Suggestion</p>
            <p className="text-sm text-yellow-700">
              The latest message might benefit from a review. Consider rephrasing to keep
              communication constructive.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setNeedsMediation(false)}
            className="px-4 py-2 text-sm font-medium text-yellow-800 hover:bg-yellow-100 rounded-lg transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              // In a real app, this would open a more detailed mediation view or AI suggestions
              alert(
                'Here the AI would offer specific rephrasing suggestions based on the context.'
              );
            }}
            className="px-4 py-2 text-sm font-medium bg-yellow-600 text-white hover:bg-yellow-700 rounded-lg shadow-sm transition-colors"
          >
            Get Suggestions
          </button>
        </div>
      </div>
    </div>
  );
}
