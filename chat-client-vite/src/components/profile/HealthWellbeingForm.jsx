import React from 'react';

/**
 * HealthWellbeingForm - Health and wellbeing section of profile wizard
 * Feature 010: Comprehensive User Profile System
 *
 * IMPORTANT: This section is ALWAYS PRIVATE. Data is encrypted and never
 * shared with co-parent. Only used by AI to provide empathetic support.
 */

const PHYSICAL_CONDITIONS_OPTIONS = [
  { value: 'chronic_pain', label: 'Chronic Pain' },
  { value: 'mobility_limitations', label: 'Mobility Limitations' },
  { value: 'chronic_fatigue', label: 'Chronic Fatigue' },
  { value: 'autoimmune', label: 'Autoimmune Condition' },
  { value: 'heart_condition', label: 'Heart Condition' },
  { value: 'respiratory', label: 'Respiratory Issues' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'None' },
  { value: 'prefer_not_say', label: 'Prefer not to say' }
];

const MENTAL_CONDITIONS_OPTIONS = [
  { value: 'anxiety', label: 'Anxiety' },
  { value: 'depression', label: 'Depression' },
  { value: 'ptsd', label: 'PTSD' },
  { value: 'adhd', label: 'ADHD' },
  { value: 'bipolar', label: 'Bipolar Disorder' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'None' },
  { value: 'prefer_not_say', label: 'Prefer not to say' }
];

const TREATMENT_STATUS_OPTIONS = [
  { value: '', label: 'Select status' },
  { value: 'active_treatment', label: 'Currently in treatment' },
  { value: 'managed', label: 'Well-managed without active treatment' },
  { value: 'seeking', label: 'Seeking treatment' },
  { value: 'past', label: 'Previously treated, currently stable' },
  { value: 'none', label: 'Not applicable' },
  { value: 'prefer_not_say', label: 'Prefer not to say' }
];

const SUBSTANCE_HISTORY_OPTIONS = [
  { value: '', label: 'Select if applicable' },
  { value: 'none', label: 'No history' },
  { value: 'past', label: 'Past history, now resolved' },
  { value: 'recovery', label: 'In active recovery' },
  { value: 'current', label: 'Currently managing' },
  { value: 'prefer_not_say', label: 'Prefer not to say' }
];

// Multi-select checkbox group
const CheckboxGroup = ({ options, selected, onChange }) => {
  const selectedArray = selected ? selected.split(',').map(s => s.trim()) : [];

  const handleToggle = (value) => {
    let newSelected;
    if (selectedArray.includes(value)) {
      newSelected = selectedArray.filter(v => v !== value);
    } else {
      // If selecting a specific condition, remove 'none' and 'prefer_not_say'
      if (value !== 'none' && value !== 'prefer_not_say') {
        newSelected = [...selectedArray.filter(v => v !== 'none' && v !== 'prefer_not_say'), value];
      } else {
        // If selecting 'none' or 'prefer_not_say', clear other selections
        newSelected = [value];
      }
    }
    onChange(newSelected.join(', '));
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {options.map(opt => (
        <label
          key={opt.value}
          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
            selectedArray.includes(opt.value)
              ? 'border-[#4DA8B0] bg-[#4DA8B0]/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="checkbox"
            checked={selectedArray.includes(opt.value)}
            onChange={() => handleToggle(opt.value)}
            className="w-4 h-4 text-[#4DA8B0] border-gray-300 rounded focus:ring-[#4DA8B0]"
          />
          <span className="text-sm text-gray-700">{opt.label}</span>
        </label>
      ))}
    </div>
  );
};

// Form field component
const FormField = ({ label, tooltip: _tooltip, children, optional = false }) => (
  <div className="space-y-2">
    <label className="flex items-center text-sm font-medium text-gray-700">
      {label}
      {optional && <span className="ml-1 text-gray-400 font-normal">(optional)</span>}
    </label>
    {children}
  </div>
);

export default function HealthWellbeingForm({ profileData, updateField }) {
  const selectClasses = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DA8B0] focus:border-transparent transition-all text-gray-800 bg-white";
  const textareaClasses = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DA8B0] focus:border-transparent transition-all text-gray-800 placeholder-gray-400 resize-none";
  const inputClasses = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DA8B0] focus:border-transparent transition-all text-gray-800 placeholder-gray-400";

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-green-800">Completely Private & Encrypted</h4>
            <p className="text-sm text-green-700 mt-1">
              This information is <strong>never shared</strong> with your co-parent. It's encrypted
              and only used by LiaiZen's AI to provide more empathetic, understanding support.
              All fields are optional.
            </p>
          </div>
        </div>
      </div>

      {/* Physical Health Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4DA8B0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Physical Health
        </h4>

        <FormField label="Any physical health conditions?" optional>
          <CheckboxGroup
            options={PHYSICAL_CONDITIONS_OPTIONS}
            selected={profileData.health_physical_conditions || ''}
            onChange={(val) => updateField('health_physical_conditions', val)}
          />
        </FormField>

        <FormField label="Any limitations we should be aware of?" optional>
          <textarea
            value={profileData.health_physical_limitations || ''}
            onChange={(e) => updateField('health_physical_limitations', e.target.value)}
            placeholder="e.g., difficulty with long drives, need regular breaks, specific dietary needs..."
            rows={2}
            className={textareaClasses}
          />
        </FormField>
      </div>

      {/* Mental Health Section */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-medium text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4DA8B0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Mental & Emotional Wellbeing
        </h4>

        <FormField label="Any mental health considerations?" optional>
          <CheckboxGroup
            options={MENTAL_CONDITIONS_OPTIONS}
            selected={profileData.health_mental_conditions || ''}
            onChange={(val) => updateField('health_mental_conditions', val)}
          />
        </FormField>

        <FormField label="Current treatment status" optional>
          <select
            value={profileData.health_mental_treatment || ''}
            onChange={(e) => updateField('health_mental_treatment', e.target.value)}
            className={selectClasses}
          >
            {TREATMENT_STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Anything else about your mental health journey?" optional>
          <textarea
            value={profileData.health_mental_history || ''}
            onChange={(e) => updateField('health_mental_history', e.target.value)}
            placeholder="Share whatever feels comfortable - this helps LiaiZen be more understanding in its support..."
            rows={3}
            className={textareaClasses}
          />
        </FormField>
      </div>

      {/* Substance History Section */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-medium text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4DA8B0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Recovery Journey
        </h4>

        <FormField label="Substance use history" optional>
          <select
            value={profileData.health_substance_history || ''}
            onChange={(e) => updateField('health_substance_history', e.target.value)}
            className={selectClasses}
          >
            {SUBSTANCE_HISTORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        {(profileData.health_substance_history === 'recovery' ||
          profileData.health_substance_history === 'past') && (
          <>
            <FormField label="In active recovery program?" optional>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="in_recovery"
                    checked={profileData.health_in_recovery === 'yes'}
                    onChange={() => updateField('health_in_recovery', 'yes')}
                    className="w-4 h-4 text-[#4DA8B0] border-gray-300 focus:ring-[#4DA8B0]"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="in_recovery"
                    checked={profileData.health_in_recovery === 'no'}
                    onChange={() => updateField('health_in_recovery', 'no')}
                    className="w-4 h-4 text-[#4DA8B0] border-gray-300 focus:ring-[#4DA8B0]"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="in_recovery"
                    checked={profileData.health_in_recovery === 'prefer_not_say'}
                    onChange={() => updateField('health_in_recovery', 'prefer_not_say')}
                    className="w-4 h-4 text-[#4DA8B0] border-gray-300 focus:ring-[#4DA8B0]"
                  />
                  <span className="text-sm text-gray-700">Prefer not to say</span>
                </label>
              </div>
            </FormField>

            <FormField label="How long in recovery?" optional>
              <input
                type="text"
                value={profileData.health_recovery_duration || ''}
                onChange={(e) => updateField('health_recovery_duration', e.target.value)}
                placeholder="e.g., 2 years, 6 months"
                className={inputClasses}
              />
            </FormField>
          </>
        )}
      </div>

      {/* Supportive Message */}
      <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-sm text-purple-800">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <div>
            <p className="font-medium">Your wellbeing matters</p>
            <p className="mt-1 text-purple-700">
              Sharing this information helps LiaiZen understand when you might need extra support
              or patience. There's no judgment here - only a desire to help you communicate more
              effectively during challenging times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
