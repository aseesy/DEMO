import React from 'react';

/**
 * Heading Component - Simple heading for marketing site
 */
export function Heading({ children, level = 2, className = '', ...props }) {
  const baseClasses = 'font-bold text-gray-900';

  const sizeClasses = {
    1: 'text-4xl sm:text-5xl lg:text-6xl',
    2: 'text-3xl sm:text-4xl lg:text-5xl',
    3: 'text-2xl sm:text-3xl lg:text-4xl',
    4: 'text-xl sm:text-2xl',
    5: 'text-lg sm:text-xl',
    6: 'text-base sm:text-lg',
  };

  const sizeClass = sizeClasses[level] || sizeClasses[2];
  const Tag = `h${level}`;

  return React.createElement(
    Tag,
    {
      className: `${baseClasses} ${sizeClass} ${className}`,
      ...props,
    },
    children
  );
}

export default Heading;
