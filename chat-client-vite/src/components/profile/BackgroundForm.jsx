import React from 'react';

/**
 * BackgroundForm - Background and education section of profile wizard
 * Feature 010: Comprehensive User Profile System
 */

const EDUCATION_LEVEL_OPTIONS = [
  { value: '', label: 'Select education level' },
  { value: 'high_school', label: 'High School / GED' },
  { value: 'some_college', label: 'Some College' },
  { value: 'associates', label: 'Associate\'s Degree' },
  { value: 'bachelors', label: 'Bachelor\'s Degree' },
  { value: 'masters', label: 'Master\'s Degree' },
  { value: 'doctorate', label: 'Doctorate / PhD' },
  { value: 'trade', label: 'Trade / Vocational' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_say', label: 'Prefer not to say' }
];

const MILITARY_BRANCH_OPTIONS = [
  { value: '', label: 'Select branch' },
  { value: 'army', label: 'Army' },
  { value: 'navy', label: 'Navy' },
  { value: 'air_force', label: 'Air Force' },
  { value: 'marines', label: 'Marine Corps' },
  { value: 'coast_guard', label: 'Coast Guard' },
  { value: 'space_force', label: 'Space Force' },
  { value: 'national_guard', label: 'National Guard' },
  { value: 'reserves', label: 'Reserves' },
  { value: 'other', label: 'Other' }
];

const MILITARY_STATUS_OPTIONS = [
  { value: '', label: 'Select status' },
  { value: 'active_duty', label: 'Active Duty' },
  { value: 'veteran', label: 'Veteran' },
  { value: 'retired', label: 'Retired' },
  { value: 'reserves', label: 'Reserves / National Guard' },
  { value: 'discharged', label: 'Discharged' }
];

// Form field component
const FormField = ({ label, children, optional = false, tooltip }) => (
  <div className="space-y-1.5">
    <label className="flex items-center text-sm font-medium text-gray-700">
      {label}
      {optional && <span className="ml-1 text-gray-400 font-normal">(optional)</span>}
    </label>
    {children}
  </div>
);

export default function BackgroundForm({ profileData, updateField }) {
  const inputClasses = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DA8B0] focus:border-transparent transition-all text-gray-800 placeholder-gray-400";
  const selectClasses = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DA8B0] focus:border-transparent transition-all text-gray-800 bg-white";
  const textareaClasses = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DA8B0] focus:border-transparent transition-all text-gray-800 placeholder-gray-400 resize-none";

  return (
    <div className="space-y-6">
      {/* Where You're From Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4DA8B0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Where You're From
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Birthplace" optional>
            <input
              type="text"
              value={profileData.background_birthplace || ''}
              onChange={(e) => updateField('background_birthplace', e.target.value)}
              placeholder="City, State/Country"
              className={inputClasses}
            />
          </FormField>

          <FormField label="Where you were raised" optional>
            <input
              type="text"
              value={profileData.background_raised || ''}
              onChange={(e) => updateField('background_raised', e.target.value)}
              placeholder="City, State/Country"
              className={inputClasses}
            />
          </FormField>
        </div>

        <FormField label="Family of origin" optional>
          <textarea
            value={profileData.background_family_origin || ''}
            onChange={(e) => updateField('background_family_origin', e.target.value)}
            placeholder="Share a bit about your family background if you'd like - e.g., 'Grew up in a large family with 4 siblings' or 'Raised by grandparents'"
            rows={2}
            className={textareaClasses}
          />
        </FormField>
      </div>

      {/* Culture & Identity Section */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-medium text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4DA8B0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Culture & Identity
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Cultural background" optional>
            <input
              type="text"
              value={profileData.background_culture || ''}
              onChange={(e) => updateField('background_culture', e.target.value)}
              placeholder="e.g., Hispanic, Asian-American, European"
              className={inputClasses}
            />
          </FormField>

          <FormField label="Religion/Spirituality" optional>
            <input
              type="text"
              value={profileData.background_religion || ''}
              onChange={(e) => updateField('background_religion', e.target.value)}
              placeholder="e.g., Christian, Muslim, Buddhist, Agnostic"
              className={inputClasses}
            />
          </FormField>
        </div>
      </div>

      {/* Military Service Section */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-medium text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4DA8B0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Military Service
        </h4>

        <FormField label="Have you served in the military?" optional>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="military"
                checked={profileData.background_military === 'yes'}
                onChange={() => updateField('background_military', 'yes')}
                className="w-4 h-4 text-[#4DA8B0] border-gray-300 focus:ring-[#4DA8B0]"
              />
              <span className="text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="military"
                checked={profileData.background_military === 'no'}
                onChange={() => updateField('background_military', 'no')}
                className="w-4 h-4 text-[#4DA8B0] border-gray-300 focus:ring-[#4DA8B0]"
              />
              <span className="text-sm text-gray-700">No</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="military"
                checked={profileData.background_military === 'family'}
                onChange={() => updateField('background_military', 'family')}
                className="w-4 h-4 text-[#4DA8B0] border-gray-300 focus:ring-[#4DA8B0]"
              />
              <span className="text-sm text-gray-700">Military family</span>
            </label>
          </div>
        </FormField>

        {profileData.background_military === 'yes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-[#4DA8B0]/30">
            <FormField label="Branch" optional>
              <select
                value={profileData.background_military_branch || ''}
                onChange={(e) => updateField('background_military_branch', e.target.value)}
                className={selectClasses}
              >
                {MILITARY_BRANCH_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Status" optional>
              <select
                value={profileData.background_military_status || ''}
                onChange={(e) => updateField('background_military_status', e.target.value)}
                className={selectClasses}
              >
                {MILITARY_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>
          </div>
        )}
      </div>

      {/* Education Section */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-medium text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4DA8B0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Education
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Highest education level" optional>
            <select
              value={profileData.education_level || ''}
              onChange={(e) => updateField('education_level', e.target.value)}
              className={selectClasses}
            >
              {EDUCATION_LEVEL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Field of study" optional>
            <input
              type="text"
              value={profileData.education_field || ''}
              onChange={(e) => updateField('education_field', e.target.value)}
              placeholder="e.g., Business, Engineering, Education"
              className={inputClasses}
            />
          </FormField>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[#4DA8B0]/10 border border-[#4DA8B0]/20 rounded-lg p-4 text-sm text-[#275559]">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-[#4DA8B0] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium">Why we ask</p>
            <p className="mt-1 opacity-90">
              Understanding your background helps LiaiZen provide more culturally aware support
              and recognize important values that may influence your parenting approach.
              This information can be shared with your co-parent if you choose.
            </p>
          </div>
        </div>
      </div>

      {/* Completion Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium">Almost done!</p>
            <p className="mt-1 text-green-700">
              This is the final section. After completing, you'll be able to review your
              privacy settings and see how your profile appears to your co-parent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
