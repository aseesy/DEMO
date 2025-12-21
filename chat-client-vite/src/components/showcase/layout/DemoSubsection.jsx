import React from 'react';

/**
 * DemoSubsection - Subsection within a demo card
 * Provides consistent heading style with teal accent bar
 */
export function DemoSubsection({ title, children }) {
  return (
    <div>
      <h4 className="text-lg font-semibold text-teal-dark mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-teal-medium rounded"></span>
        {title}
      </h4>
      {children}
    </div>
  );
}

export default DemoSubsection;
