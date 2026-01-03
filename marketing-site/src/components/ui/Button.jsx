import React from 'react';

/**
 * Button Component - Simple button for marketing site
 * 
 * Simplified version - only includes variants needed for landing page
 */
export function Button({
  children,
  variant = 'teal-solid',
  size = 'medium',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    'teal-solid': 'bg-teal-medium text-white hover:bg-teal-dark focus:ring-teal-medium',
    'teal-outline': 'border-2 border-teal-medium text-teal-medium hover:bg-teal-lightest focus:ring-teal-medium',
    'white': 'bg-white text-teal-medium hover:bg-gray-50 focus:ring-teal-medium',
  };

  const sizes = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
  };

  const variantClasses = variants[variant] || variants['teal-solid'];
  const sizeClasses = sizes[size] || sizes.medium;

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;

