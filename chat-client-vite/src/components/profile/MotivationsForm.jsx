import React from 'react';

/**
 * MotivationsForm - Values, motivations, and personal insights section
 * Feature 010: Comprehensive User Profile System
 */

// Predefined value options for multi-select
const VALUE_OPTIONS = [
  { value: 'honesty', label: 'Honesty & Transparency' },
  { value: 'respect', label: 'Mutual Respect' },
  { value: 'stability', label: 'Stability & Routine' },
  { value: 'flexibility', label: 'Flexibility & Adaptability' },
  { value: 'communication', label: 'Open Communication' },
  { value: 'independence', label: 'Independence' },
  { value: 'family', label: 'Family Unity' },
  { value: 'education', label: 'Education & Growth' },
  { value: 'faith', label: 'Faith & Spirituality' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'creativity', label: 'Creativity & Expression' },
  { value: 'adventure', label: 'Adventure & New Experiences' }
];

// Tooltip component
const Tooltip = ({ text }) => (
  <div className="group relative inline-block ml-1">
    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10 max-w-xs">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
    </div>
  </div>
);

// Form field component
const FormField = ({ label, tooltip, children, optional = false }) => (
  <div className="space-y-1.5">
    <label className="flex items-center text-sm font-medium text-gray-700">
      {label}
      {optional && <span className="ml-1 text-gray-400 font-normal">(optional)</span>}
      {tooltip && <Tooltip text={tooltip} />}
    </label>
    {children}
  </div>
);

// Multi-select chip component
const ValueChip = ({ value, label, isSelected, onToggle }) => (
  <button
    type="button"
    onClick={() => onToggle(value)}
    className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
      isSelected
        ? 'bg-[#4DA8B0] text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {label}
  </button>
);

export default function MotivationsForm({ profileData, updateField }) {
  const textareaClasses = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DA8B0] focus:border-transparent transition-all text-gray-800 placeholder-gray-400 resize-none";

  // Parse selected values from comma-separated string
  const selectedValues = (profileData.motivation_values || '').split(',').filter(Boolean);

  // Toggle a value in the multi-select
  const toggleValue = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    updateField('motivation_values', newValues.join(','));
  };

  return (
    <div className="space-y-6">
      {/* Core Values - Multi-select */}
      <div className="space-y-3">
        <label className="flex items-center text-sm font-medium text-gray-700">
          What values are most important to you?
          <Tooltip text="Select all that apply - these help LiaiZen understand what matters to you" />
        </label>
        <p className="text-sm text-gray-500">Select up to 5 values that guide your decisions</p>
        <div className="flex flex-wrap gap-2">
          {VALUE_OPTIONS.map(option => (
            <ValueChip
              key={option.value}
              value={option.value}
              label={option.label}
              isSelected={selectedValues.includes(option.value)}
              onToggle={toggleValue}
            />
          ))}
        </div>
      </div>

      {/* Parenting Goals */}
      <FormField
        label="What are your main goals as a parent?"
        optional
        tooltip="What do you hope to achieve for your child?"
      >
        <textarea
          value={profileData.motivation_goals || ''}
          onChange={(e) => updateField('motivation_goals', e.target.value)}
          placeholder="e.g., Raise a confident, kind child. Maintain a stable routine. Build strong communication skills..."
          rows={3}
          className={textareaClasses}
        />
      </FormField>

      {/* Strengths */}
      <FormField
        label="What are your strengths as a parent?"
        optional
        tooltip="Recognizing your strengths helps build confidence"
      >
        <textarea
          value={profileData.motivation_strengths || ''}
          onChange={(e) => updateField('motivation_strengths', e.target.value)}
          placeholder="e.g., I'm patient, I'm good at explaining things, I make time for fun activities..."
          rows={3}
          className={textareaClasses}
        />
      </FormField>

      {/* Areas to Improve */}
      <FormField
        label="What would you like to improve?"
        optional
        tooltip="We all have room to grow - LiaiZen can help"
      >
        <textarea
          value={profileData.motivation_improvements || ''}
          onChange={(e) => updateField('motivation_improvements', e.target.value)}
          placeholder="e.g., Being more patient during stressful moments, better time management, staying calm during disagreements..."
          rows={3}
          className={textareaClasses}
        />
      </FormField>

      {/* Info Box */}
      <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-sm text-purple-800">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <div>
            <p className="font-medium">Why we ask</p>
            <p className="mt-1 text-purple-700">
              Understanding your values and motivations helps LiaiZen provide more personalized support.
              This information is <strong>completely private</strong> and never shared with your co-parent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
