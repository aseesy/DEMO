/**
 * SettingsCard - Reusable settings card wrapper with icon header
 *
 * A presentational component that provides consistent styling for settings sections.
 */

import React from 'react';

/**
 * SettingsCard component
 * @param {Object} props
 * @param {React.ReactNode} props.icon - SVG icon to display
 * @param {string} props.title - Card title
 * @param {string} props.description - Card description
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.variant - 'default' | 'success' - Card color variant
 * @param {string} props.className - Additional CSS classes
 */
export function SettingsCard({
  icon,
  title,
  description,
  children,
  variant = 'default',
  className = '',
}) {
  const variantStyles = {
    default: {
      card: 'border-teal-light bg-white',
      iconBg: 'bg-teal-medium',
      title: 'text-teal-dark',
      description: 'text-gray-600',
    },
    success: {
      card: 'border-emerald-300 bg-emerald-50',
      iconBg: 'bg-emerald-600',
      title: 'text-emerald-800',
      description: 'text-emerald-700',
    },
  };

  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`border-2 ${styles.card} rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl ${styles.iconBg} flex items-center justify-center shrink-0 shadow-md`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className={`text-xl font-semibold ${styles.title} mb-2`}>{title}</h3>
          {description && (
            <p className={`text-base ${styles.description} mb-4 leading-relaxed`}>
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Common icons used in settings cards
 */
export const SettingsIcons = {
  notification: (
    <svg
      className="w-6 h-6 text-white"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  ),

  lock: (
    <svg
      className="w-6 h-6 text-white"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  ),

  mail: (
    <svg
      className="w-6 h-6 text-white"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),

  userPlus: (
    <svg
      className="w-6 h-6 text-white"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    </svg>
  ),

  link: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  ),

  plus: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),

  checkCircle: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

export default SettingsCard;
