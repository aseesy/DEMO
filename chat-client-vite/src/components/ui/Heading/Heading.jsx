import React from 'react';

/**
 * Heading Component - Professional serif headings matching the mediation design
 *
 * Features:
 * - Elegant serif typography for impactful statements
 * - Multiple variants (hero, large, medium, small)
 * - Italicized emphasis support
 * - Responsive sizing
 * - Teal color scheme integration
 *
 * @example
 * <Heading variant="hero">
 *   Moving forward, <em>together apart.</em>
 * </Heading>
 */
export const Heading = ({
  children,
  variant = 'hero',
  as: Component = 'h1',
  className = '',
  color = 'dark',
  ...props
}) => {
  // Variant classes with serif font and appropriate sizing
  const variants = {
    hero: 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal leading-tight',
    large: 'text-4xl sm:text-5xl md:text-6xl font-normal leading-tight',
    medium: 'text-3xl sm:text-4xl md:text-5xl font-normal leading-snug',
    small: 'text-2xl sm:text-3xl md:text-4xl font-normal leading-snug',
  };

  // Color options using teal palette
  const colors = {
    dark: 'text-gray-900',
    teal: 'text-teal-dark',
    'teal-medium': 'text-teal-medium',
    light: 'text-gray-700',
  };

  const variantClasses = variants[variant] || variants.hero;
  const colorClasses = colors[color] || colors.dark;

  return (
    <Component className={`font-serif ${variantClasses} ${colorClasses} ${className}`} {...props}>
      {children}
    </Component>
  );
};

export default Heading;
