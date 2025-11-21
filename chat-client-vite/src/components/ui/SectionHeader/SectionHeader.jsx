import React from 'react';

/**
 * SectionHeader Component - Small caps section labels
 *
 * Features:
 * - Professional small caps typography
 * - Teal color scheme
 * - Letter spacing for readability
 * - Used for section labels and category headers
 *
 * @example
 * <SectionHeader>Professional Mediation & Support</SectionHeader>
 */
export const SectionHeader = ({
  children,
  color = 'medium',
  size = 'base',
  className = '',
  ...props
}) => {
  // Color variants using teal palette
  const colors = {
    light: 'text-teal-light',
    medium: 'text-teal-medium',
    dark: 'text-teal-dark',
  };

  // Size variants
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
