import React from 'react';

/**
 * ConnectCoparentBanner - A reusable banner component to prompt users to connect with their co-parent.
 *
 * @param {Object} props
 * @param {Function} props.onClick - Handler when the banner is clicked
 * @param {string} props.className - Optional additional classes
 */
export function ConnectCoparentBanner({ onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border-2 border-teal-400 bg-linear-to-r from-teal-50 to-emerald-50 px-5 py-4 shadow-sm hover:shadow-md transition-all text-left group ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-teal-800">Connect with Your Co-Parent</h3>
            <p className="text-sm text-teal-600">
              Send an invite or enter a code to start communicating
            </p>
          </div>
        </div>
        <svg
          className="w-5 h-5 text-teal-500 group-hover:translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

export default ConnectCoparentBanner;
