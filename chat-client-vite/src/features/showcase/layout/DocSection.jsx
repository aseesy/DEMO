import React from 'react';

/**
 * DocSection - Reusable documentation section wrapper
 * Provides consistent heading and description styling for major sections
 */
export function DocSection({ title, description, children, id }) {
  return (
    <section id={id} className="mb-16 scroll-mt-24">
      <div className="mb-8">
        <h2 className="text-4xl font-serif text-teal-dark mb-2">{title}</h2>
        {description && <p className="text-lg text-gray-600">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default DocSection;
