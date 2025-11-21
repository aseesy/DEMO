import React, { useEffect, useRef } from 'react';

/**
 * Textarea Component - Multiline text input with auto-resize and character counting
 *
 * Features:
 * - Auto-resize based on content (optional)
 * - Character counter with color-coded limits
 * - Min/max rows constraints
 * - Error and helper text support
 * - iOS-safe 16px font size (prevents zoom)
 * - Full WCAG 2.1 AA accessibility
 *
 * @example
 * <Textarea
 *   label="Description"
 *   value={description}
 *   onChange={setDescription}
 *   maxLength={500}
 *   showCharCount
 *   autoResize
 * />
 */
export const Textarea = ({
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
  maxLength,
  showCharCount = false,
  autoResize = false,
  rows = 3,
  minRows = 2,
  maxRows = 10,
  name,
  className = '',
  ...props
}) => {
  const textareaRef = useRef(null);
  const inputId = props.id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).substr(2, 9)}`;

  // Character count logic
  const charCount = value?.length || 0;
  const isNearLimit = maxLength && charCount >= maxLength * 0.9;
  const isAtLimit = maxLength && charCount >= maxLength;

  // Auto-resize logic
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;

      // Reset height to get correct scrollHeight
      textarea.style.height = 'auto';

      // Calculate new height
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24;
      const minHeight = minRows * lineHeight;
      const maxHeight = maxRows * lineHeight;

      // Set height within constraints
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value, autoResize, minRows, maxRows]);

  // Base textarea classes with iOS-safe 16px font
  const baseTextareaClasses = 'px-4 py-3 border-2 rounded-lg transition-all text-base text-gray-900 placeholder-gray-400 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed read-only:bg-gray-50 read-only:cursor-default resize-none';

  // Border colors based on state
  const borderClasses = error
    ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/20'
    : disabled
    ? 'border-gray-300'
    : 'border-gray-300 focus:border-teal-medium focus:ring-2 focus:ring-teal-medium/20';

  const widthClass = fullWidth ? 'w-full' : '';

  const textareaClasses = `${baseTextareaClasses} ${borderClasses} ${widthClass} ${className}`.trim();

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

      {/* Textarea field */}
      <textarea
        ref={textareaRef}
        id={inputId}
        name={name || inputId}
        value={value}
        onChange={(e) => onChange ? onChange(e.target.value) : null}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        rows={autoResize ? minRows : rows}
        className={textareaClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        aria-required={required}
        {...props}
      />

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

export default Textarea;
