import React from 'react';

const variants = {
  primary: 'bg-teal-dark text-white hover:bg-teal-darkest disabled:bg-gray-400',
  secondary: 'bg-teal-medium text-white hover:bg-teal-dark disabled:bg-gray-400',
  tertiary: 'border-2 border-teal-dark text-teal-dark hover:bg-teal-lightest disabled:border-gray-400 disabled:text-gray-400',
  ghost: 'text-teal-dark hover:bg-teal-lightest disabled:text-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400',
};

const sizes = {
  small: 'px-3 py-2 text-sm',
  medium: 'px-4 py-3 text-base',
  large: 'px-6 py-4 text-lg',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-medium focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2';

  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.medium;
  const widthClass = fullWidth ? 'w-full' : '';

  const combinedClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${className}`.trim();

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
