import React from 'react';

/**
 * WorkScheduleForm - Work and schedule section of profile wizard
 * Feature 010: Comprehensive User Profile System
 */

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: '', label: 'Select employment status' },
  { value: 'employed', label: 'Employed Full-Time' },
  { value: 'part_time', label: 'Employed Part-Time' },
  { value: 'self_employed', label: 'Self-Employed / Freelance' },
  { value: 'unemployed', label: 'Currently Unemployed' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
  { value: 'disability', label: 'On Disability' },
  { value: 'homemaker', label: 'Stay-at-Home Parent' }
];

const SCHEDULE_FLEXIBILITY_OPTIONS = [
  { value: '', label: 'Select flexibility level' },
  { value: 'high', label: 'High - Very flexible schedule', description: 'Can adjust schedule easily for child-related needs' },
  { value: 'medium', label: 'Medium - Some flexibility', description: 'Can make occasional adjustments with advance notice' },
  { value: 'low', label: 'Low - Limited flexibility', description: 'Strict schedule with little room for changes' }
];

const TRAVEL_FREQUENCY_OPTIONS = [
  { value: '', label: 'Select frequency' },
  { value: 'never', label: 'Never' },
  { value: 'rarely', label: 'Rarely (few times a year)' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'frequent', label: 'Frequently (multiple times per week)' }
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

// Flexibility card component
const FlexibilityCard = ({ value, currentValue, onChange }) => {
  const option = SCHEDULE_FLEXIBILITY_OPTIONS.find(opt => opt.value === value);
  if (!option || !option.description) return null;

  const isSelected = currentValue === value;

  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`p-4 rounded-lg border-2 text-left transition-all ${
        isSelected
          ? 'border-[#4DA8B0] bg-[#4DA8B0]/5'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className={`font-medium ${isSelected ? 'text-[#275559]' : 'text-gray-700'}`}>
        {option.label.split(' - ')[1] || option.label}
      </div>
      <div className="text-sm text-gray-500 mt-1">{option.description}</div>
    </button>
  );
};

export default function WorkScheduleForm({ profileData, updateField }) {
  const inputClasses = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DA8B0] focus:border-transparent transition-all text-gray-800 placeholder-gray-400";
  const selectClasses = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DA8B0] focus:border-transparent transition-all text-gray-800 bg-white";
  const textareaClasses = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DA8B0] focus:border-transparent transition-all text-gray-800 placeholder-gray-400 resize-none";

  return (
    <div className="space-y-6">
      {/* Employment Status */}
      <FormField
        label="Employment Status"
        tooltip="Helps LiaiZen understand your schedule constraints"
      >
        <select
          value={profileData.employment_status || ''}
          onChange={(e) => updateField('employment_status', e.target.value)}
          className={selectClasses}
        >
          {EMPLOYMENT_STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </FormField>

      {/* Occupation & Employer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Occupation" optional>
          <input
            type="text"
            value={profileData.occupation || ''}
            onChange={(e) => updateField('occupation', e.target.value)}
            placeholder="e.g., Software Engineer, Teacher"
            className={inputClasses}
          />
        </FormField>

        <FormField label="Employer" optional>
          <input
            type="text"
            value={profileData.employer || ''}
            onChange={(e) => updateField('employer', e.target.value)}
            placeholder="Company or organization name"
            className={inputClasses}
          />
        </FormField>
      </div>

      {/* Work Schedule */}
      <FormField
        label="Typical Work Schedule"
        tooltip="Describe your regular working hours"
      >
        <textarea
          value={profileData.work_schedule || ''}
          onChange={(e) => updateField('work_schedule', e.target.value)}
          placeholder="e.g., Monday-Friday 9am-5pm, or shift work Tues/Thurs/Sat 7am-3pm"
          rows={3}
          className={textareaClasses}
        />
      </FormField>

      {/* Schedule Flexibility */}
      <div className="space-y-3">
        <label className="flex items-center text-sm font-medium text-gray-700">
          Schedule Flexibility
          <Tooltip text="How easily can you adjust your schedule for child-related needs?" />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['high', 'medium', 'low'].map(level => (
            <FlexibilityCard
              key={level}
              value={level}
              currentValue={profileData.schedule_flexibility || ''}
              onChange={(val) => updateField('schedule_flexibility', val)}
            />
          ))}
        </div>
      </div>

      {/* Commute Time */}
      <FormField
        label="Commute Time"
        optional
        tooltip="Average time to get to/from work"
      >
        <input
          type="text"
          value={profileData.commute_time || ''}
          onChange={(e) => updateField('commute_time', e.target.value)}
          placeholder="e.g., 30 minutes, 1 hour, work from home"
          className={inputClasses}
        />
      </FormField>

      {/* Travel Required */}
      <FormField
        label="Work Travel"
        optional
        tooltip="Does your job require travel away from home?"
      >
        <select
          value={profileData.travel_required || ''}
          onChange={(e) => updateField('travel_required', e.target.value)}
          className={selectClasses}
        >
          {TRAVEL_FREQUENCY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </FormField>

      {/* Info Box */}
      <div className="bg-[#4DA8B0]/10 border border-[#4DA8B0]/20 rounded-lg p-4 text-sm text-[#275559]">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-[#4DA8B0] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium">Why we ask</p>
            <p className="mt-1 opacity-90">
              Understanding your work schedule helps LiaiZen suggest realistic pickup/dropoff times
              and anticipate scheduling conflicts. This information is <strong>private by default</strong> and
              only shared with your co-parent if you choose.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
