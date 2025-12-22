/**
 * InviteFormInputs - Email and code input fields for invite flow
 */

import React from 'react';

/**
 * Email input for email invitation method
 */
export function EmailInput({ value, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Co-Parent's Email</label>
      <input
        type="email"
        placeholder="Enter their email address"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#275559] focus:border-transparent outline-none transition-all"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

/**
 * Code input for "have-code" method
 */
export function CodeInput({ value, onChange, codeValidation, onKeyDown }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Enter the code from your co-parent
      </label>
      <input
        type="text"
        placeholder="LZ-XXXXXX"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#275559] focus:border-transparent outline-none transition-all font-mono text-lg text-center tracking-wider"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <p className="text-xs text-gray-500 mt-1 text-center">
        Format: LZ-XXXXXX (6 characters after LZ-)
      </p>
      {codeValidation && codeValidation.valid && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            ✓ Valid code from {codeValidation.inviterUsername}
          </p>
        </div>
      )}
    </div>
  );
}
