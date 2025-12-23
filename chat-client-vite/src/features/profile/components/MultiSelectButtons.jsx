/**
 * MultiSelectButtons - Toggle button group for multi-select values
 *
 * Pure presentational component - receives all data and handlers as props.
 */

import React from 'react';
import { parseMultiSelectValues } from '../../../config/profileConfig.js';

/**
 * MultiSelectButtons component
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {Array} props.options - Array of { value, label } objects
 * @param {string} props.value - Comma-separated selected values
 * @param {Function} props.onChange - Called with (value, isNowSelected)
 * @param {string} props.className - Additional CSS classes
 */
export function MultiSelectButtons({ label, options = [], value = '', onChange, className = '' }) {
  const selectedValues = parseMultiSelectValues(value);

  const handleToggle = optionValue => {
    const isCurrentlySelected = selectedValues.includes(optionValue);
    const newValues = isCurrentlySelected
      ? selectedValues.filter(v => v !== optionValue)
      : [...selectedValues, optionValue];

    onChange?.(newValues.join(','), !isCurrentlySelected);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && <label className="block text-sm font-medium text-teal-medium mb-2">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-teal-medium text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MultiSelectButtons;
