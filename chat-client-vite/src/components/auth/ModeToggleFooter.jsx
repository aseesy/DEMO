/**
 * ModeToggleFooter - Toggle between login and signup modes
 */

import React from 'react';

/**
 * @param {Object} props
 * @param {boolean} props.isLoginMode - Whether currently in login mode
 * @param {Function} props.onToggle - Called to toggle mode
 */
export function ModeToggleFooter({ isLoginMode, onToggle }) {
  return (
    <div className="mt-6 text-center">
      <p className="text-sm text-gray-600">
        {isLoginMode ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="text-teal-medium font-semibold hover:text-teal-dark transition-colors"
              onClick={onToggle}
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              className="text-teal-medium font-semibold hover:text-teal-dark transition-colors"
              onClick={onToggle}
            >
              Log in
            </button>
          </>
        )}
      </p>
    </div>
  );
}

export default ModeToggleFooter;
