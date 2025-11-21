import React from 'react';

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
  fullWidth = true,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const inputId = props.id || `input-${label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).substr(2, 9)}`;

  const baseInputClasses = 'px-4 py-3 border-2 rounded-lg transition-all text-base text-gray-900 placeholder-gray-400 min-h-[44px] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed';

  const borderClasses = error
    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
    : 'border-gray-200 focus:border-teal-dark focus:ring-2 focus:ring-teal-medium/20';

  const widthClass = fullWidth ? 'w-full' : '';

  const inputClasses = `${baseInputClasses} ${borderClasses} ${widthClass} ${className}`.trim();

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-900 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={inputClasses}
          style={icon && iconPosition === 'left' ? { paddingLeft: '2.5rem' } : icon && iconPosition === 'right' ? { paddingRight: '2.5rem' } : {}}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          aria-required={required}
          {...props}
        />

        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {icon}
          </div>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-2 text-sm text-gray-600">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
