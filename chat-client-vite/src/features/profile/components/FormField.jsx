/**
 * Profile Form Field Components
 *
 * Reusable form inputs with consistent styling for profile forms.
 * Pure presentational components.
 */

import React from 'react';

const baseInputClasses =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium';

const labelClasses = 'block text-sm font-medium text-teal-medium mb-1';

/**
 * Text input field
 */
export function FormInput({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  className = '',
  inputRef,
  children,
  ...props
}) {
  return (
    <div className={className}>
      {label && <label className={labelClasses}>{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className={baseInputClasses}
          {...props}
        />
        {children}
      </div>
    </div>
  );
}

/**
 * Textarea field
 */
export function FormTextarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
  showCount = false,
  className = '',
  ...props
}) {
  const currentLength = (value || '').length;

  return (
    <div className={className}>
      {label && <label className={labelClasses}>{label}</label>}
      <textarea
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={baseInputClasses}
        {...props}
      />
      {showCount && maxLength && (
        <p className="text-xs text-gray-400 mt-1">
          {currentLength}/{maxLength}
        </p>
      )}
    </div>
  );
}

/**
 * Select dropdown field
 */
export function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      {label && <label className={labelClasses}>{label}</label>}
      <select
        name={name}
        value={value || ''}
        onChange={onChange}
        className={baseInputClasses}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Section divider with optional description
 */
export function FormSection({ description, className = '' }) {
  return (
    <div className={`pt-4 mt-4 border-t border-gray-200 ${className}`}>
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
    </div>
  );
}

/**
 * Info box for privacy notices, tips, etc.
 */
export function FormInfoBox({ title, children, variant = 'purple', className = '' }) {
  const variants = {
    purple: {
      container: 'bg-purple-50 border-purple-200 text-purple-800',
      icon: 'text-purple-500',
      title: 'text-purple-800',
      body: 'text-purple-700',
    },
    teal: {
      container: 'bg-teal-50 border-teal-200 text-teal-800',
      icon: 'text-teal-500',
      title: 'text-teal-800',
      body: 'text-teal-700',
    },
    gray: {
      container: 'bg-gray-50 border-gray-200 text-gray-800',
      icon: 'text-gray-500',
      title: 'text-gray-800',
      body: 'text-gray-700',
    },
  };

  const colors = variants[variant] || variants.purple;

  return (
    <div className={`border rounded-lg p-4 text-sm ${colors.container} ${className}`}>
      <div className="flex gap-3">
        <svg
          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colors.icon}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <div>
          {title && <p className={`font-medium ${colors.title}`}>{title}</p>}
          <div className={`mt-1 ${colors.body}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Two-column grid for form fields
 */
export function FormGrid({ children, className = '' }) {
  return <div className={`grid grid-cols-2 gap-4 ${className}`}>{children}</div>;
}
