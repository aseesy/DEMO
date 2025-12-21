/**
 * Update Icon Registry
 *
 * Registry for update type icons implementing Strategy Pattern.
 * Enables extensibility without modifying existing code (Open-Closed Principle).
 *
 * @module components/updates/UpdateIconRegistry
 */

import React from 'react';

/**
 * Expense Icon Component
 */
const ExpenseIcon = ({ className = 'w-4 h-4 text-amber-500' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/**
 * Agreement Icon Component
 */
const AgreementIcon = ({ className = 'w-4 h-4 text-teal-medium' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/**
 * Invite Icon Component
 */
const InviteIcon = ({ className = 'w-4 h-4 text-teal-medium' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

/**
 * Message Icon Component (Default)
 */
const MessageIcon = ({ className = 'w-4 h-4 text-teal-medium' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

/**
 * Icon registry mapping update types to icon components
 * Adding new types only requires adding entries here, no code modification needed
 */
const updateIcons = {
  expense: ExpenseIcon,
  agreement: AgreementIcon,
  invite: InviteIcon,
  message: MessageIcon,
};

/**
 * Default icon component
 */
const DefaultIcon = MessageIcon;

/**
 * Get icon component for an update type
 *
 * @param {string} type - Update type (e.g., 'expense', 'agreement', 'invite', 'message')
 * @returns {React.Component} Icon component
 */
export function getUpdateIcon(type) {
  return updateIcons[type] || DefaultIcon;
}

/**
 * Register a new icon for an update type
 *
 * @param {string} type - Update type
 * @param {React.Component} IconComponent - Icon component
 */
export function registerUpdateIcon(type, IconComponent) {
  if (!type) {
    throw new Error('Update type is required');
  }
  if (!IconComponent) {
    throw new Error('Icon component is required');
  }
  updateIcons[type] = IconComponent;
  console.log(`✅ UpdateIconRegistry: Registered icon for type "${type}"`);
}

/**
 * Get all registered update types
 *
 * @returns {string[]} Array of registered update types
 */
export function getRegisteredTypes() {
  return Object.keys(updateIcons);
}

