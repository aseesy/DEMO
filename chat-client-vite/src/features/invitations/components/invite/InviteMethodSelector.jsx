/**
 * InviteMethodSelector - Method selection buttons for invite flow
 */

import React from 'react';
import { EmailIcon, LinkIcon, CodeIcon, KeyIcon } from './InviteIcons.jsx';

const METHOD_CONFIG = {
  email: {
    icon: EmailIcon,
    label: 'Email',
    description: 'Send invitation directly to their email (7 days)',
  },
  link: {
    icon: LinkIcon,
    label: 'Link',
    description: 'Share a link via text or any app (7 days)',
  },
  code: {
    icon: CodeIcon,
    label: 'Code',
    description: 'Quick code for existing users (15 minutes)',
  },
  'have-code': {
    icon: KeyIcon,
    label: 'I have a code',
    description: 'Enter the code your co-parent shared with you',
  },
};

/**
 * @param {Object} props
 * @param {string} props.selectedMethod - Currently selected method
 * @param {Function} props.onMethodChange - Called when method changes
 */
export function InviteMethodSelector({ selectedMethod, onMethodChange }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        How would you like to invite them?
      </label>
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(METHOD_CONFIG).map(([method, config]) => {
          const Icon = config.icon;
          const isSelected = selectedMethod === method;

          return (
            <button
              key={method}
              type="button"
              onClick={() => onMethodChange(method)}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                isSelected
                  ? 'border-teal-medium bg-[#E8F5F5] text-teal-medium'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <Icon className="w-6 h-6 mx-auto mb-1" />
              <span className="text-xs font-medium">{config.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        {METHOD_CONFIG[selectedMethod]?.description}
      </p>
    </div>
  );
}

export default InviteMethodSelector;
