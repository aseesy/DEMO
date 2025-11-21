import React from 'react';

/**
 * Input Component - Standardized form input with validation, states, and accessibility
 *
 * Features:
 * - Multiple input types (text, email, password, search, tel, url)
 * - Error and success states with visual feedback
 * - Character counter with color-coded limits
 * - Prefix/suffix icon support
 * - Helper text and error messages
 * - iOS-safe 16px font size (prevents zoom)
 * - 44px minimum touch target
 * - Full WCAG 2.1 AA accessibility
 *
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChange={setEmail}
 *   error="Please enter a valid email"
 * />
 */
export const Input = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  readOnly = false,
  fullWidth = true,
  icon,
  iconPosition = 'left',
  maxLength,
  showCharCount = false,
  prefix,
  suffix,
  autoComplete,
  name,
  className = '',
  ...props
}) => {
  const inputId = props.id || `input-${label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).substr(2, 9)}`;

  // Character count logic
  const charCount = value?.length || 0;
  const isNearLimit = maxLength && charCount >= maxLength * 0.9;
  const isAtLimit = maxLength && charCount >= maxLength;

  // Base input classes with iOS-safe 16px font
  const baseInputClasses = 'px-4 py-3 border-2 rounded-lg transition-all text-base text-gray-900 placeholder-gray-400 min-h-[44px] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed read-only:bg-gray-50 read-only:cursor-default';

  // Border colors based on state
  const borderClasses = error
    ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/20'
    : disabled
    ? 'border-gray-300'
    : 'border-gray-300 focus:border-teal-medium focus:ring-2 focus:ring-teal-medium/20';

  const widthClass = fullWidth ? 'w-full' : '';

  // Calculate padding based on icons/prefix/suffix
  const leftPadding = (icon && iconPosition === 'left') || prefix ? 'pl-10' : '';
  const rightPadding = (icon && iconPosition === 'right') || suffix ? 'pr-10' : '';

  const inputClasses = `${baseInputClasses} ${borderClasses} ${widthClass} ${leftPadding} ${rightPadding} ${className}`.trim();

  // Determine which icon to show on the right
  const showSuccessIcon = !error && !disabled && !readOnly && value && !suffix && !(icon && iconPosition === 'right');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-gray-700 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Left icon/prefix */}
        {((icon && iconPosition === 'left') || prefix) && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {prefix || icon}
          </div>
        )}

        {/* Input field */}
        <input
          id={inputId}
          name={name || inputId}
          type={type}
          value={value}
          onChange={(e) => onChange ? onChange(e.target.value) : null}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          autoComplete={autoComplete}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          aria-required={required}
          {...props}
        />

        {/* Right icon/suffix */}
        {((icon && iconPosition === 'right') || suffix) && !showSuccessIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {suffix || icon}
          </div>
        )}

        {/* Success checkmark */}
        {showSuccessIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Error message / Helper text / Character count */}
      <div className="mt-1.5 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Error message with icon */}
          {error && (
            <p id={`${inputId}-error`} className="text-sm text-red-600 flex items-start gap-1.5" role="alert">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </p>
          )}

          {/* Helper text */}
          {helperText && !error && (
            <p id={`${inputId}-helper`} className="text-sm text-gray-600">
              {helperText}
            </p>
          )}
        </div>

        {/* Character counter */}
        {showCharCount && maxLength && (
          <p className={`text-xs font-medium flex-shrink-0 ${
            isAtLimit ? 'text-red-600' :
            isNearLimit ? 'text-yellow-600' :
            'text-gray-500'
          }`}>
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default Input;
