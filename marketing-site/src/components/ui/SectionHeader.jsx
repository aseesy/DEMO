import React from 'react';

/**
 * SectionHeader Component - Small caps section labels
 */
export const SectionHeader = ({
  children,
  color = 'medium',
  size = 'base',
  className = '',
  ...props
}) => {
  const colors = {
    light: 'text-teal-light',
    medium: 'text-teal-medium',
    dark: 'text-teal-dark',
  };

  const sizes = {
    sm: 'text-xs sm:text-sm',
    base: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
  };

  const colorClasses = colors[color] || colors.medium;
  const sizeClasses = sizes[size] || sizes.base;

  return (
    <div
      className={`${sizeClasses} ${colorClasses} font-semibold uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default SectionHeader;

