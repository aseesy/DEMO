import React from 'react';

/**
 * DemoCard - Reusable component demo wrapper
 * Provides header with gradient, content area, and optional code snippet
 */
export function DemoCard({ title, description, children, code }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden mb-12">
      <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        {description && <p className="text-teal-lightest mt-1">{description}</p>}
      </div>
      <div className="p-6 space-y-8">
        {children}
        {code && (
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto mt-6">
            <pre>{code}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default DemoCard;
