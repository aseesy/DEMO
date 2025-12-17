import React from 'react';

/**
 * PersonalInfoForm - Personal information section of profile wizard
 * Feature 010: Comprehensive User Profile System
 */

const PRONOUNS_OPTIONS = [
  { value: '', label: 'Select pronouns (optional)' },
  { value: 'he/him', label: 'He/Him' },
  { value: 'she/her', label: 'She/Her' },
  { value: 'they/them', label: 'They/Them' },
  { value: 'other', label: 'Other/Prefer to self-describe' }
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'other', label: 'Other' }
];

const US_STATES = [
  { value: '', label: 'Select state' },
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' }
];

// Common timezones
const TIMEZONE_OPTIONS = [
  { value: '', label: 'Select timezone' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'America/Phoenix', label: 'Arizona (no DST)' },
  { value: 'other', label: 'Other' }
];

// Tooltip component
const Tooltip = ({ text }) => (
  <div className="group relative inline-block ml-1">
    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10">
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

export default function PersonalInfoForm({ profileData, updateField }) {
  // Auto-detect timezone on mount
  React.useEffect(() => {
    if (!profileData.timezone) {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Check if detected timezone is in our list
      const matchingOption = TIMEZONE_OPTIONS.find(tz => tz.value === detectedTimezone);
      if (matchingOption) {
        updateField('timezone', detectedTimezone);
      }
    }
  }, []);

  const inputClasses = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DA8B0] focus:border-transparent transition-all text-gray-800 placeholder-gray-400";
  const selectClasses = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DA8B0] focus:border-transparent transition-all text-gray-800 bg-white";

  return (
    <div className="space-y-6">
      {/* Name Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="First Name">
          <input
            type="text"
            value={profileData.first_name || ''}
            onChange={(e) => updateField('first_name', e.target.value)}
            placeholder="Your first name"
            className={inputClasses}
          />
        </FormField>

        <FormField label="Last Name">
          <input
            type="text"
            value={profileData.last_name || ''}
            onChange={(e) => updateField('last_name', e.target.value)}
            placeholder="Your last name"
            className={inputClasses}
          />
        </FormField>
      </div>

      {/* Preferred Name & Pronouns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Preferred Name"
          optional
          tooltip="What you'd like to be called in messages"
        >
          <input
            type="text"
            value={profileData.preferred_name || ''}
            onChange={(e) => updateField('preferred_name', e.target.value)}
            placeholder="Nickname or preferred name"
            className={inputClasses}
          />
        </FormField>

        <FormField label="Pronouns" optional>
          <select
            value={profileData.pronouns || ''}
            onChange={(e) => updateField('pronouns', e.target.value)}
            className={selectClasses}
          >
            {PRONOUNS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Birthdate */}
      <FormField
        label="Date of Birth"
        tooltip="Used to personalize your experience. Must be 18+"
      >
        <input
          type="date"
          value={profileData.birthdate || ''}
          onChange={(e) => updateField('birthdate', e.target.value)}
          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
          className={inputClasses}
        />
      </FormField>

      {/* Language & Timezone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Primary Language"
          tooltip="Your preferred language for communication"
        >
          <select
            value={profileData.language || 'en'}
            onChange={(e) => updateField('language', e.target.value)}
            className={selectClasses}
          >
            {LANGUAGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Timezone"
          tooltip="Helps coordinate scheduling with your co-parent"
        >
          <select
            value={profileData.timezone || ''}
            onChange={(e) => updateField('timezone', e.target.value)}
            className={selectClasses}
          >
            {TIMEZONE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Phone */}
      <FormField
        label="Phone Number"
        optional
        tooltip="For important notifications only"
      >
        <input
          type="tel"
          value={profileData.phone || ''}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="(555) 555-5555"
          className={inputClasses}
        />
      </FormField>

      {/* Location */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="col-span-2">
          <FormField label="City" optional>
            <input
              type="text"
              value={profileData.city || ''}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="City"
              className={inputClasses}
            />
          </FormField>
        </div>

        <FormField label="State" optional>
          <select
            value={profileData.state || ''}
            onChange={(e) => updateField('state', e.target.value)}
            className={selectClasses}
          >
            {US_STATES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="ZIP Code" optional>
          <input
            type="text"
            value={profileData.zip || ''}
            onChange={(e) => updateField('zip', e.target.value)}
            placeholder="12345"
            maxLength={10}
            className={inputClasses}
          />
        </FormField>
      </div>

      {/* Schedule Section */}
      <div className="pt-4 border-t border-gray-100">
        <h4 className="text-sm font-semibold text-[#275559] mb-4">Your Schedule</h4>

        <div className="space-y-4">
          <FormField
            label="Typical Schedule"
            optional
            tooltip="Describe your regular weekly schedule"
          >
            <textarea
              value={profileData.work_schedule || ''}
              onChange={(e) => updateField('work_schedule', e.target.value)}
              placeholder="e.g., Monday-Friday 9am-5pm, weekends off. Or describe your typical week."
              rows={3}
              className={`${inputClasses} resize-none`}
            />
          </FormField>

          <div className="space-y-3">
            <label className="flex items-center text-sm font-medium text-gray-700">
              Schedule Flexibility
              <Tooltip text="How easily can you adjust your schedule for child-related needs?" />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'high', label: 'High Flexibility', description: 'Can adjust schedule easily' },
                { value: 'medium', label: 'Some Flexibility', description: 'Can adjust with notice' },
                { value: 'low', label: 'Limited Flexibility', description: 'Strict schedule' }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField('schedule_flexibility', option.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    profileData.schedule_flexibility === option.value
                      ? 'border-[#4DA8B0] bg-[#4DA8B0]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`font-medium text-sm ${
                    profileData.schedule_flexibility === option.value ? 'text-[#275559]' : 'text-gray-700'
                  }`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium">Why we ask</p>
            <p className="mt-1 text-blue-700">
              Your location, timezone, and schedule help LiaiZen suggest realistic scheduling options
              and coordinate effectively with your co-parent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
